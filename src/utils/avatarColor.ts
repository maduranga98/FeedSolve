const AVATAR_COLORS = [
  "bg-[#2E86AB]",
  "bg-[#1E3A5F]",
  "bg-[#27AE60]",
  "bg-[#6B7B8D]",
  "bg-[#4B7FA3]",
  "bg-[#7A6F9B]",
  "bg-[#3A7D7C]",
  "bg-[#A66A3F]",
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
