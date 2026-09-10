const AVATAR_COLORS = [
  "bg-[var(--c-s2e86ab)]",
  "bg-[var(--c-s1e3a5f)]",
  "bg-[var(--c-s27ae60)]",
  "bg-[var(--c-s6b7b8d)]",
  "bg-[var(--c-s4b7fa3)]",
  "bg-[var(--c-s7a6f9b)]",
  "bg-[var(--c-s3a7d7c)]",
  "bg-[var(--c-sa66a3f)]",
];

export function getAvatarColor(userId: string): string {
  const firstCode = userId.charCodeAt(0) || 0;
  return AVATAR_COLORS[firstCode % AVATAR_COLORS.length];
}

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? "" : "";
  return `${first}${last}`.toUpperCase() || "?";
}
