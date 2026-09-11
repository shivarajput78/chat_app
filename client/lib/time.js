export function formatTime(dateString) {
  const d = new Date(dateString);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function formatLastSeen(dateString) {
  if (!dateString) return "";
  const d = new Date(dateString);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) return `today at ${formatTime(dateString)}`;
  return `${d.toLocaleDateString([], { day: "2-digit", month: "short" })} at ${formatTime(dateString)}`;
}
