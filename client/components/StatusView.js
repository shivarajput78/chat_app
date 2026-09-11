"use client";
import { useEffect, useRef, useState } from "react";
import api from "@/lib/api";
import Avatar from "./Avatar";

const STATUS_DURATION = 5000;

export default function StatusView({ user, onClose }) {
  const [groups, setGroups] = useState([]);
  const [viewing, setViewing] = useState(null); // { group, index }
  const fileInputRef = useRef(null);
  const timerRef = useRef(null);

  async function load() {
    const { data } = await api.get("/api/status");
    setGroups(data);
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!viewing) return;
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(nextStatus, STATUS_DURATION);
    const current = viewing.group.statuses[viewing.index];
    if (current && current.user._id !== user._id) {
      api.put(`/api/status/view/${current._id}`).catch(() => {});
    }
    return () => clearTimeout(timerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewing]);

  function openGroup(group) {
    setViewing({ group, index: 0 });
  }

  function nextStatus() {
    setViewing((v) => {
      if (!v) return v;
      if (v.index + 1 < v.group.statuses.length) return { ...v, index: v.index + 1 };
      return null;
    });
  }

  function prevStatus() {
    setViewing((v) => {
      if (!v) return v;
      if (v.index > 0) return { ...v, index: v.index - 1 };
      return v;
    });
  }

  async function handleUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const form = new FormData();
    form.append("media", file);
    await api.post("/api/status", form, { headers: { "Content-Type": "multipart/form-data" } });
    load();
  }

  const myGroup = groups.find((g) => g.user._id === user._id);
  const otherGroups = groups.filter((g) => g.user._id !== user._id);

  if (viewing) {
    const current = viewing.group.statuses[viewing.index];
    return (
      <div className="fixed inset-0 bg-black z-50 flex flex-col">
        <div className="flex gap-1 px-3 pt-3">
          {viewing.group.statuses.map((s, i) => (
            <div key={s._id} className="flex-1 h-1 bg-white/20 rounded overflow-hidden">
              <div
                className={`h-full bg-white ${i < viewing.index ? "w-full" : i === viewing.index ? "animate-[grow_5s_linear]" : "w-0"}`}
                style={i === viewing.index ? { animation: `grow ${STATUS_DURATION}ms linear forwards` } : {}}
              />
            </div>
          ))}
        </div>
        <style>{`@keyframes grow { from { width: 0% } to { width: 100% } }`}</style>

        <div className="flex items-center gap-2 px-4 py-3">
          <Avatar src={viewing.group.user.avatar} name={viewing.group.user.name} size={36} />
          <span className="text-white text-sm font-medium">{viewing.group.user.name}</span>
          <button onClick={() => setViewing(null)} className="ml-auto text-white text-xl">✕</button>
        </div>

        <div className="flex-1 flex items-center justify-center relative">
          <button onClick={prevStatus} className="absolute left-0 top-0 bottom-0 w-1/3" />
          <button onClick={nextStatus} className="absolute right-0 top-0 bottom-0 w-1/3" />
          {current.mediaType === "video" ? (
            <video src={current.mediaUrl} autoPlay className="max-h-full max-w-full" />
          ) : current.mediaType === "image" ? (
            <img src={current.mediaUrl} alt="" className="max-h-full max-w-full object-contain" />
          ) : (
            <p className="text-white text-2xl text-center px-8">{current.caption}</p>
          )}
        </div>
        {current.mediaType !== "text" && current.caption && (
          <p className="text-white text-center pb-6">{current.caption}</p>
        )}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-panelLight rounded-2xl w-full max-w-md max-h-[80vh] flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-line">
          <h2 className="text-white font-medium">Status</h2>
          <button onClick={onClose} className="text-muted hover:text-white">✕</button>
        </div>

        <div className="px-3 py-3 border-b border-line">
          <input ref={fileInputRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleUpload} />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-surface"
          >
            <div className="relative">
              <Avatar src={user.avatar} name={user.name} size={46} />
              <span className="absolute -bottom-1 -right-1 bg-accent text-panel rounded-full w-5 h-5 flex items-center justify-center text-xs">+</span>
            </div>
            <div className="text-left">
              <p className="text-white text-sm">My status</p>
              <p className="text-muted text-xs">{myGroup ? `${myGroup.statuses.length} update(s)` : "Tap to add a status update"}</p>
            </div>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-2 py-2">
          {otherGroups.length === 0 && (
            <p className="text-center text-muted text-sm mt-6">No updates from others yet</p>
          )}
          {otherGroups.map((g) => (
            <button
              key={g.user._id}
              onClick={() => openGroup(g)}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-surface"
            >
              <Avatar src={g.user.avatar} name={g.user.name} size={46} />
              <div className="text-left">
                <p className="text-white text-sm">{g.user.name}</p>
                <p className="text-muted text-xs">{g.statuses.length} update(s)</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
