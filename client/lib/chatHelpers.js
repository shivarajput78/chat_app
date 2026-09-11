export function chatDisplayName(chat, currentUserId) {
  if (chat.isGroup) return chat.groupName || "Group";
  const other = chat.participants?.find((p) => p._id !== currentUserId);
  return other?.name || "Unknown";
}

export function chatDisplayAvatar(chat, currentUserId) {
  if (chat.isGroup) return chat.groupAvatar || "";
  const other = chat.participants?.find((p) => p._id !== currentUserId);
  return other?.avatar || "";
}

export function otherParticipant(chat, currentUserId) {
  if (chat.isGroup) return null;
  return chat.participants?.find((p) => p._id !== currentUserId) || null;
}

export function lastMessagePreview(chat) {
  const m = chat.latestMessage;
  if (!m) return "Say hi 👋";
  if (m.mediaType && m.mediaType !== "none") {
    const labels = { image: "📷 Photo", video: "🎥 Video", audio: "🎵 Audio", file: "📎 File" };
    return labels[m.mediaType] || "Attachment";
  }
  return m.content;
}
