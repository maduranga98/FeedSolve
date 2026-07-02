import { getStatusColor, getStatusLabel } from "../../lib/utils";

interface BadgeProps {
  status?: string;
  variant?: "primary" | "success" | "warning" | "error";
  children?: string;
  className?: string;
}

const variantColors: Record<string, { bg: string; text: string }> = {
  primary: { bg: "bg-[#D6EEF5]", text: "text-[#1c1917]" },
  success: { bg: "bg-[#D1F2EB]", text: "text-[#0F6E56]" },
  warning: { bg: "bg-[#FEF5E7]", text: "text-[#854F0B]" },
  error: { bg: "bg-[#FADBD8]", text: "text-[#922B21]" },
};

export function Badge({
  status,
  variant,
  children,
  className = "",
}: BadgeProps) {
  let bg = "";
  let text = "";
  let label = "";

  if (variant) {
    const colors = variantColors[variant] || variantColors.primary;
    bg = colors.bg;
    text = colors.text;
    label = children || "";
  } else if (status) {
    const colors = getStatusColor(status) || {
      bg: "bg-[#f1ebe5]",
      text: "text-[#78716c]",
    };
    bg = colors.bg;
    text = colors.text;
    label = getStatusLabel(status);
  }

  return (
    <span
      className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${bg} ${text} ${className}`}
    >
      {label}
    </span>
  );
}
