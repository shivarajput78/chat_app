"use client";
import { useRef, useState } from "react";
import api from "@/lib/api";
import Avatar from "./Avatar";
import { useAuth } from "@/context/AuthContext";

export default function ProfileModal({ onClose }) {
  const { user, updateUser } = useAuth();
  const [name, setName] = useState(user.name);
  const [about, setAbout] = useState(user.about);
  const [busy, setBusy] = useState(false);
  const fileInputRef = useRef(null);
  const [preview, setPreview] = useState(user.avatar);
  const [file, setFile] = useState(null);

  function handleFile(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }

  async function save() {
    setBusy(true);
    try {
      const form = new FormData();
      form.append("name", name);
      form.append("about", about);
      if (file) form.append("avatar", file);
      const { data } = await api.put("/api/users/me", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      updateUser(data);
      onClose();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-panelLight rounded-2xl w-full max-w-sm p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-white font-medium">Your profile</h2>
          <button onClick={onClose} className="text-muted hover:text-white">✕</button>
        </div>

        <div className="flex justify-center mb-5">
          <button onClick={() => fileInputRef.current?.click()} className="relative">
            <Avatar src={preview} name={name} size={90} />
            <span className="absolute bottom-0 right-0 bg-accent text-panel rounded-full w-7 h-7 flex items-center justify-center text-sm">
              ✎
            </span>
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
        </div>

        <label className="block text-sm text-muted mb-1">Name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full mb-4 rounded-lg bg-surface border border-line px-3 py-2 text-white outline-none focus:border-accent"
        />

        <label className="block text-sm text-muted mb-1">About</label>
        <input
          value={about}
          onChange={(e) => setAbout(e.target.value)}
          className="w-full mb-6 rounded-lg bg-surface border border-line px-3 py-2 text-white outline-none focus:border-accent"
        />

        <button
          onClick={save}
          disabled={busy}
          className="w-full bg-accent hover:bg-accentDeep transition text-panel font-medium rounded-lg py-2 disabled:opacity-60"
        >
          {busy ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  );
}
