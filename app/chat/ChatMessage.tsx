interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  time?: string;
  isIntro?: boolean;
}

export default function ChatMessage({
  role,
  content,
  time,
  isIntro,
}: ChatMessageProps) {
  const isUser = role === "user";

  const messageBg = isIntro
    ? "bg-green-200"
    : isUser
    ? "bg-blue-200"
    : "bg-red-200";

  return (
    <div
      className={`flex mb-1 ${
        isUser ? "justify-end" : "justify-start"
      }`}
    >
      <div
        className={`inline-block max-w-[60%] px-3 py-2 rounded-xl break-words ${messageBg}`}
      >
        <div>{content}</div>

        {time && (
          <div
            className={`mt-0.5 text-[10px] text-gray-500 ${
              isUser ? "text-right" : "text-left"
            }`}
          >
            {time}
          </div>
        )}
      </div>
    </div>
  );
}
