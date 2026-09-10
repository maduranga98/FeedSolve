import { getStatusColor, getStatusLabel } from "../../lib/utils";

interface BadgeProps {
  status?: string;
  variant?: "primary" | "success" | "warning" | "error";
  children?: string;
  className?: string;
}

const variantColors: Record<string, { bg: string; text: string }> = {
  primary: { bg: "bg-[var(--c-sd6eef5)]", text: "text-[var(--c-t1c1917)]" },
  success: { bg: "bg-[var(--c-sd1f2eb)]", text: "text-[var(--c-t0f6e56)]" },
  warning: { bg: "bg-[var(--c-sfef5e7)]", text: "text-[var(--c-t854f0b)]" },
  error: { bg: "bg-[var(--c-sfadbd8)]", text: "text-[var(--c-t922b21)]" },
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
      bg: "bg-[var(--c-sf1ebe5)]",
      text: "text-[var(--c-t78716c)]",
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
