import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { checkForbiddenPairs } from "@/lib/moderation";
import { checkRateLimit } from "@/lib/rateLimit";

type MessagePayload = {
  message: string;
};

type ApiErrorResponse = {
  ok: false;
  error: string;
};

type ApiSuccessResponse = {
  ok: true;
};

function isValidMessagePayload(data: unknown): data is MessagePayload {
  return (
    typeof data === "object" &&
    data !== null &&
    typeof (data as { message?: unknown }).message === "string" &&
    (data as { message: string }).message.trim().length > 0 &&
    (data as { message: string }).message.length <= 2000
  );
}

const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
  console.error("OPENAI_API_KEY is not defined");
}

const client = new OpenAI({
  apiKey: apiKey ?? "",
});

async function aiModeration(input: string): Promise<{
  blocked: boolean;
  categories: string[];
}> {
  try {
    const res = await client.moderations.create({
      model: "omni-moderation-latest",
      input,
    });

    const r = res.results[0];
    const blockedCategories: string[] = [];

    if (r.categories.violence) blockedCategories.push("violence");
    if (r.categories.sexual) blockedCategories.push("sexual");
    if (r.categories["sexual/minors"]) blockedCategories.push("csam");

    return {
      blocked: blockedCategories.length > 0,
      categories: blockedCategories,
    };
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.error("AI moderation error:", err.message);
    } else {
      console.error("AI moderation error:", err);
    }

    return { blocked: true, categories: ["ai_error"] };
  }
}

function logModeration(data: {
  input: string;
  source: "rule" | "ai";
  categories: string[];
}) {
  console.log("[MODERATION]", {
    time: new Date().toISOString(),
    ...data,
  });
}

export async function POST(req: NextRequest) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json<ApiErrorResponse>(
      { ok: false, error: "Server configuration error" },
      { status: 500 }
    );
  }

  const ip = req.headers.get("x-forwarded-for") ?? "anon";

  if (checkRateLimit(ip)) {
    return NextResponse.json<ApiErrorResponse>(
      { ok: false, error: "Rate limit exceeded" },
      { status: 429 }
    );
  }

  const body = await req.json();

  if (!isValidMessagePayload(body)) {
    return NextResponse.json<ApiErrorResponse>(
      { ok: false, error: "Invalid request payload" },
      { status: 400 }
    );
  }

  const { message } = body;

  const violations = checkForbiddenPairs(message);
  if (violations.length > 0) {
    logModeration({
      input: message,
      source: "rule",
      categories: violations.map((v) => `${v.w1}-${v.w2}`),
    });

    return NextResponse.json<ApiErrorResponse>(
      {
        ok: false,
        error: "Message blocked due to prohibited content. Please rephrase.",
      },
      { status: 400 }
    );
  }

  const aiCheck = await aiModeration(message);
  if (aiCheck.blocked) {
    logModeration({
      input: message,
      source: "ai",
      categories: aiCheck.categories,
    });

    if (aiCheck.categories.includes("ai_error")) {
      return NextResponse.json<ApiErrorResponse>(
        {
          ok: false,
          error: "Unable to check message safety right now.",
        },
        { status: 503 }
      );
    }

    return NextResponse.json<ApiErrorResponse>(
      {
        ok: false,
        error: "Message blocked due to unsafe content.",
      },
      { status: 400 }
    );
  }

  try {
    const stream = await client.chat.completions.create({
      model: "gpt-4o-mini",
      stream: true,
      messages: [
        { role: "system", content: "You are a playful, flirty friend." },
        { role: "user", content: message },
      ],
    });

    const readable = new ReadableStream({
      async start(controller) {
        for await (const event of stream) {
          const chunk = event.choices?.[0]?.delta?.content;
          if (chunk) {
            controller.enqueue(new TextEncoder().encode(chunk));
          }
        }
        controller.close();
      },
    });

    return new Response(readable, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  } catch (err: unknown) {
    if (err instanceof OpenAI.APIError) {
      console.error("OpenAI error:", err.status, err.message);
    } else if (err instanceof Error) {
      console.error("Unexpected error:", err.message);
    } else {
      console.error("Unknown error:", err);
    }

    return NextResponse.json<ApiErrorResponse>(
      { ok: false, error: "Assistant temporarily unavailable" },
      { status: 500 }
    );
  }
}
