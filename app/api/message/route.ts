import { NextRequest, NextResponse } from "next/server";
import { checkForbiddenPairs } from "@/lib/moderation";
import { checkRateLimit } from "@/lib/rateLimit";
import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function aiModeration(input: string) {
  try {
    const res = await client.moderations.create({
      model: 'omni-moderation-latest',
      input,
    });

    const r = res.results[0];
    const blockedCategories: string[] = [];

    if (r.categories['violence']) blockedCategories.push('gore');
    if (r.categories['sexual/minors']) blockedCategories.push('csam');
    if (r.categories['sexual']) blockedCategories.push('copro');

    return { blocked: blockedCategories.length > 0, categories: blockedCategories };
  } catch (err: any) {
    console.error("AI moderation error:", err);
    return { blocked: true, categories: ['ai_error'] };
  }
}

function logModeration(data: { input: string; source: 'rule' | 'ai'; categories: string[] }) {
  console.log('[MODERATION]', { time: new Date().toISOString(), ...data });
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") || "anon";

  if (checkRateLimit(ip)) {
    return NextResponse.json({ ok: false, error: "Rate limit exceeded" }, { status: 429 });
  }

  const { message } = await req.json();

  const violations = checkForbiddenPairs(message);
  if (violations.length) {
    logModeration({ input: message, source: 'rule', categories: violations.map(v => `${v.w1}-${v.w2}`) });
    return NextResponse.json({ ok: false, error: "Message blocked due to prohibited content. Please rephrase." }, { status: 400 });
  }

  const aiCheck = await aiModeration(message);
  if (aiCheck.blocked) {
    logModeration({ input: message, source: 'ai', categories: aiCheck.categories });

    if (aiCheck.categories.includes('ai_error')) {
      return NextResponse.json({
        ok: false,
        error: "Unable to check message safety right now. Please try again later."
      }, { status: 503 });
    }

    return NextResponse.json({
      ok: false,
      error: "Message blocked due to unsafe content. Please rephrase."
    }, { status: 400 });
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
          if (chunk) controller.enqueue(new TextEncoder().encode(chunk));
        }
        controller.close();
      },
    });

    return new Response(readable, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
  } catch (err) {
    console.error("LLM request error:", err);
    return NextResponse.json({ ok: false, error: "Assistant temporarily unavailable" }, { status: 500 });
  }
}