"use client";

import { useEffect, useRef, useState } from "react";
import ChatMessage from "./ChatMessage";
import { DotLoader } from "react-spinners";

interface Message {
  role: "user" | "assistant";
  content: string;
  time?: string;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hey! Ready for a flirty chat?",
      time: getCurrentTime(),
    },
  ]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  function getCurrentTime() {
    return new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  async function handleSend() {
    if (loading || !input.trim()) return;

    const text = input;
    setInput("");
    setLoading(true);

    setMessages((prev) => [
      ...prev,
      { role: "user", content: text, time: getCurrentTime() },
    ]);

    try {
      const res = await fetch("/api/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? "Request failed");
      }

      if (!res.body) {
        throw new Error("No response body");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      let assistantText = "";

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "", time: getCurrentTime() },
      ]);

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        assistantText += decoder.decode(value);

        setMessages((prev) => {
          const copy = [...prev];
          copy[copy.length - 1] = {
            role: "assistant",
            content: assistantText,
            time: getCurrentTime(),
          };
          return copy;
        });
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Network error";

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: message, time: getCurrentTime() },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full min-h-screen flex justify-center bg-gradient-to-br from-cyan-100 to-lime-100">
      <div className="w-[60%] min-h-screen flex flex-col bg-white p-3 rounded-2xl shadow-lg">
        <div className="text-xl font-semibold text-center">
          Flirty Friend
        </div>

        <div className="flex-1 overflow-y-auto">
          {messages.map((m, i) => (
            <ChatMessage key={i} {...m} isIntro={i === 0} />
          ))}

          {loading && (
            <div className="flex justify-center my-2">
              <DotLoader size={10} />
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={1}
          disabled={loading}
          onKeyDown={(e) => {
            if (loading) return;
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          className="w-full rounded-lg border p-2 resize-none"
        />

        <button
          onClick={handleSend}
          disabled={loading}
          className="w-full mt-2 py-2 rounded-lg bg-indigo-600 text-white disabled:opacity-50"
        >
          Send
        </button>
      </div>
    </div>
  );
}

