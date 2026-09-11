"use client";
import { useState } from "react";
import Avatar from "./Avatar";
import { chatDisplayName, chatDisplayAvatar, lastMessagePreview, otherParticipant } from "@/lib/chatHelpers";
import { formatTime } from "@/lib/time";

export default function Sidebar({
  user,
  chats,
  selectedChat,
  onSelectChat,
  onOpenNewChat,
  onOpenStatus,
  onOpenProfile,
  onLogout,
  onlineUsers,
}) {
  const [search, setSearch] = useState("");

  const filtered = chats.filter((c) =>
    chatDisplayName(c, user._id).toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="w-full md:w-[380px] shrink-0 h-full flex flex-col bg-panelLight border-r border-line">
      <div className="flex items-center justify-between px-4 py-3 border-b border-line">
        <button onClick={onOpenProfile} className="flex items-center gap-2">
          <Avatar src={user.avatar} name={user.name} size={38} />
          <span className="font-medium text-white">{user.name}</span>
        </button>
        <div className="flex items-center gap-3">
          <button title="Status" onClick={onOpenStatus} className="text-muted hover:text-white text-xl">
            ◎
          </button>
          <button title="New chat" onClick={onOpenNewChat} className="text-muted hover:text-white text-xl">
            ✎
          </button>
          <button title="Log out" onClick={onLogout} className="text-muted hover:text-white text-sm">
            ⎋
          </button>
        </div>
      </div>

      <div className="px-3 py-2">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search chats"
          className="w-full rounded-lg bg-surface border border-line px-3 py-2 text-sm text-white outline-none focus:border-accent"
        />
      </div>

      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 && (
          <p className="text-center text-muted text-sm mt-10 px-6">
            No chats yet. Tap ✎ to message someone.
          </p>
        )}
        {filtered.map((chat) => {
          const other = otherParticipant(chat, user._id);
          const isOnline = other ? onlineUsers.has(other._id) : false;
          const active = selectedChat?._id === chat._id;
          return (
            <button
              key={chat._id}
              onClick={() => onSelectChat(chat)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-surface transition ${
                active ? "bg-surface" : ""
              }`}
            >
              <Avatar src={chatDisplayAvatar(chat, user._id)} name={chatDisplayName(chat, user._id)} size={46} online={isOnline} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-white font-medium truncate">{chatDisplayName(chat, user._id)}</span>
                  {chat.latestMessage && (
                    <span className="text-xs text-muted shrink-0 ml-2">
                      {formatTime(chat.latestMessage.createdAt)}
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted truncate">{lastMessagePreview(chat)}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
