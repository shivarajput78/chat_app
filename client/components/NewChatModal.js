"use client";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import Avatar from "./Avatar";

export default function NewChatModal({ onClose, onChatCreated }) {
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState([]);
  const [mode, setMode] = useState("single"); // "single" | "group"
  const [selected, setSelected] = useState([]);
  const [groupName, setGroupName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const t = setTimeout(async () => {
      const { data } = await api.get(`/api/users?search=${encodeURIComponent(search)}`);
      setUsers(data);
    }, 250);
    return () => clearTimeout(t);
  }, [search]);

  function toggleSelect(u) {
    setSelected((prev) =>
      prev.find((p) => p._id === u._id) ? prev.filter((p) => p._id !== u._id) : [...prev, u]
    );
  }

  async function startSingleChat(u) {
    setBusy(true);
    try {
      const { data } = await api.post("/api/chats", { userId: u._id });
      onChatCreated(data);
      onClose();
    } finally {
      setBusy(false);
    }
  }

  async function createGroup() {
    if (!groupName || selected.length < 1) return;
    setBusy(true);
    try {
      const { data } = await api.post("/api/chats/group", {
        name: groupName,
        userIds: JSON.stringify(selected.map((u) => u._id)),
      });
      onChatCreated(data);
      onClose();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-panelLight rounded-2xl w-full max-w-md max-h-[80vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-line">
          <h2 className="text-white font-medium">{mode === "single" ? "New chat" : "New group"}</h2>
          <button onClick={onClose} className="text-muted hover:text-white">✕</button>
        </div>

        <div className="flex gap-2 px-5 pt-3">
          <button
            onClick={() => setMode("single")}
            className={`px-3 py-1 rounded-full text-sm ${mode === "single" ? "bg-accent text-panel" : "bg-surface text-muted"}`}
          >
            Direct message
          </button>
          <button
            onClick={() => setMode("group")}
            className={`px-3 py-1 rounded-full text-sm ${mode === "group" ? "bg-accent text-panel" : "bg-surface text-muted"}`}
          >
            Group
          </button>
        </div>

        {mode === "group" && (
          <div className="px-5 pt-3">
            <input
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Group name"
              className="w-full rounded-lg bg-surface border border-line px-3 py-2 text-sm text-white outline-none focus:border-accent"
            />
            {selected.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {selected.map((u) => (
                  <span key={u._id} className="text-xs bg-surface text-white rounded-full px-2 py-1">
                    {u.name}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="px-5 pt-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email"
            className="w-full rounded-lg bg-surface border border-line px-3 py-2 text-sm text-white outline-none focus:border-accent"
          />
        </div>

        <div className="flex-1 overflow-y-auto px-2 py-2">
          {users.map((u) => {
            const isSelected = !!selected.find((p) => p._id === u._id);
            return (
              <button
                key={u._id}
                disabled={busy}
                onClick={() => (mode === "single" ? startSingleChat(u) : toggleSelect(u))}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-surface transition ${
                  isSelected ? "bg-surface" : ""
                }`}
              >
                <Avatar src={u.avatar} name={u.name} size={40} />
                <div className="text-left">
                  <p className="text-white text-sm">{u.name}</p>
                  <p className="text-muted text-xs">{u.email}</p>
                </div>
              </button>
            );
          })}
          {users.length === 0 && <p className="text-center text-muted text-sm mt-6">No users found</p>}
        </div>

        {mode === "group" && (
          <div className="px-5 py-3 border-t border-line">
            <button
              onClick={createGroup}
              disabled={busy || !groupName || selected.length < 1}
              className="w-full bg-accent hover:bg-accentDeep transition text-panel font-medium rounded-lg py-2 disabled:opacity-50"
            >
              Create group
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
