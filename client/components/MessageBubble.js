"use client";
import { formatTime } from "@/lib/time";

export default function MessageBubble({ message, isOwn, senderName }) {
  const readByOthers = isOwn && message.readBy && message.readBy.length > 1;
  const delivered = isOwn && message.deliveredTo && message.deliveredTo.length > 1;

  return (
    <div className={`flex ${isOwn ? "justify-end" : "justify-start"} mb-2`}>
      <div
        className={`max-w-[70%] rounded-xl px-3 py-2 ${
          isOwn ? "bg-bubbleOut text-white rounded-tr-sm" : "bg-bubbleIn text-white rounded-tl-sm"
        }`}
      >
        {!isOwn && senderName && (
          <p className="text-xs text-accent font-medium mb-0.5">{senderName}</p>
        )}

        {message.mediaType === "image" && (
          <img src={message.mediaUrl} alt="" className="rounded-lg mb-1 max-h-72 object-cover" />
        )}
        {message.mediaType === "video" && (
          <video src={message.mediaUrl} controls className="rounded-lg mb-1 max-h-72" />
        )}
        {message.mediaType === "file" && (
          <a
            href={message.mediaUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 bg-black/20 rounded-lg px-3 py-2 mb-1 text-sm underline"
          >
            📎 Attachment
          </a>
        )}

        {message.content && <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>}

        <div className="flex items-center justify-end gap-1 mt-1">
          <span className="text-[10px] text-white/60">{formatTime(message.createdAt)}</span>
          {isOwn && (
            <span className={`text-[11px] ${readByOthers ? "text-sky-300" : "text-white/60"}`}>
              {readByOthers ? "✓✓" : delivered ? "✓✓" : "✓"}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
