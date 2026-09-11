"use client";
import { useEffect, useRef, useState } from "react";
import Avatar from "./Avatar";
import MessageBubble from "./MessageBubble";
import { chatDisplayName, chatDisplayAvatar } from "@/lib/chatHelpers";
import { formatLastSeen } from "@/lib/time";

export default function ChatWindow({
  chat,
  currentUser,
  messages,
  onSendMessage,
  onTyping,
  typingUser,
  onStartCall,
  isOnline,
  lastSeen,
  onOpenMenu,
}) {
  const [text, setText] = useState("");
  const [file, setFile] = useState(null);
  const bottomRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingUser]);

  if (!chat) {
    return (
      <div className="flex-1 hidden md:flex items-center justify-center chat-bg">
        <div className="text-center text-muted">
          <div className="w-20 h-20 rounded-full bg-surface mx-auto mb-4 flex items-center justify-center text-3xl">
            💬
          </div>
          <p>Pick a chat, or start a new one.</p>
        </div>
      </div>
    );
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!text.trim() && !file) return;
    onSendMessage(text.trim(), file);
    setText("");
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  return (
    <div className="flex-1 flex flex-col h-full min-w-0">
      <div className="flex items-center justify-between px-4 py-3 bg-panelLight border-b border-line">
        <button onClick={onOpenMenu} className="flex items-center gap-3 min-w-0">
          <Avatar src={chatDisplayAvatar(chat, currentUser._id)} name={chatDisplayName(chat, currentUser._id)} size={40} online={isOnline} />
          <div className="min-w-0 text-left">
            <p className="text-white font-medium truncate">{chatDisplayName(chat, currentUser._id)}</p>
            <p className="text-xs text-muted truncate">
              {chat.isGroup
                ? `${chat.participants.length} members`
                : isOnline
                ? "online"
                : lastSeen
                ? `last seen ${formatLastSeen(lastSeen)}`
                : ""}
            </p>
          </div>
        </button>
        <div className="flex items-center gap-4 text-lg text-muted">
          <button title="Voice call" onClick={() => onStartCall("voice")} className="hover:text-white">📞</button>
          <button title="Video call" onClick={() => onStartCall("video")} className="hover:text-white">🎥</button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto chat-bg px-4 py-4">
        {messages.map((m) => (
          <MessageBubble
            key={m._id}
            message={m}
            isOwn={m.sender._id === currentUser._id}
            senderName={chat.isGroup && m.sender._id !== currentUser._id ? m.sender.name : null}
          />
        ))}
        {typingUser && (
          <p className="text-xs text-muted italic">{typingUser} is typing...</p>
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSubmit} className="flex items-center gap-2 px-4 py-3 bg-panelLight border-t border-line">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="text-muted hover:text-white text-xl"
          title="Attach"
        >
          📎
        </button>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />
        <input
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            onTyping();
          }}
          placeholder={file ? `${file.name} attached` : "Type a message"}
          className="flex-1 rounded-full bg-surface border border-line px-4 py-2 text-white text-sm outline-none focus:border-accent"
        />
        <button
          type="submit"
          className="bg-accent hover:bg-accentDeep transition text-panel w-10 h-10 rounded-full flex items-center justify-center"
        >
          ➤
        </button>
      </form>
    </div>
  );
}
