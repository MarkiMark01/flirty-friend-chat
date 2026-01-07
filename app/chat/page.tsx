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
    const now = new Date();
    return now.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  async function handleSend() {
    if (!input.trim()) return;

    const text = input;
    const time = getCurrentTime();

    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: text, time }]);
    setLoading(true);

    try {
      const res = await fetch("/api/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });

      if (!res.body) throw new Error("No stream");

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
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Network error",
          time: getCurrentTime(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full min-h-screen flex justify-center bg-gradient-to-br from-cyan-100 to-lime-100">
      <div className="w-[60%] min-h-screen flex flex-col justify-between bg-white p-3 rounded-2xl shadow-lg">
        <div className="text-xl font-semibold text-center">
          💬 Flirty Friend
        </div>
        <div className="flex-1 overflow-y-auto">
          {messages.map((m, i) => (
            <ChatMessage
              key={i}
              role={m.role}
              content={m.content}
              time={m.time}
              isIntro={i === 0 && m.role === "assistant"}
            />
          ))}

          {loading && (
            <div className="flex justify-center my-2">
              <DotLoader size={10} color="#4f46e5" />
            </div>
          )}

          <div ref={bottomRef} />
        </div>
        <div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={1}
            className="w-full rounded-lg border border-gray-300 p-2 outline-none
                       focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20
                       resize-none"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />

          <button
            onClick={handleSend}
            disabled={loading}
            className="w-full mt-1.5 py-2 rounded-lg bg-indigo-600
                       text-white font-semibold hover:bg-indigo-700
                       disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
