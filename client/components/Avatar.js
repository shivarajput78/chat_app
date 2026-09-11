"use client";
export default function Avatar({ src, name = "", size = 40, online = false }) {
  const initial = name?.charAt(0)?.toUpperCase() || "?";
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      {src ? (
        <img
          src={src}
          alt={name}
          className="rounded-full object-cover w-full h-full"
          style={{ width: size, height: size }}
        />
      ) : (
        <div
          className="rounded-full bg-surface flex items-center justify-center text-muted font-medium w-full h-full"
          style={{ fontSize: size * 0.4 }}
        >
          {initial}
        </div>
      )}
      {online && (
        <span
          className="absolute bottom-0 right-0 rounded-full bg-accent border-2 border-panelLight"
          style={{ width: size * 0.28, height: size * 0.28 }}
        />
      )}
    </div>
  );
}
