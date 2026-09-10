import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  fullWidth?: boolean;
}

export function Button({
  variant = "primary",
  size = "md",
  isLoading = false,
  disabled,
  fullWidth = false,
  children,
  className = "",
  ...props
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 select-none";

  const variants = {
    primary:
      "bg-[var(--c-sc0694a)] text-white hover:bg-[var(--c-s246d8c)] active:bg-[var(--c-s1a5570)] focus:ring-[var(--c-bc0694a)] shadow-sm hover:shadow",
    secondary:
      "bg-[var(--c-sffffff)] text-[var(--c-t1c1917)] border border-[var(--c-bd6cabf)] hover:bg-[var(--c-sf2ece6)] active:bg-[var(--c-se4ebf1)] focus:ring-[var(--c-bc0694a)] shadow-sm",
    danger:
      "bg-[var(--c-sc0392b)] text-white hover:bg-[var(--c-sc0392b)] active:bg-[var(--c-sa93226)] focus:ring-[var(--c-bc0392b)] shadow-sm hover:shadow",
    ghost:
      "bg-transparent text-[var(--c-tc0694a)] hover:bg-[var(--c-sf5e6df)] active:bg-[var(--c-sd6eef5)] focus:ring-[var(--c-bc0694a)]",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-sm",
    lg: "px-5 py-2.5 text-base",
  };

  const isDisabled = disabled || isLoading;

  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${
        fullWidth ? "w-full" : ""
      } ${isDisabled ? "opacity-50 cursor-not-allowed pointer-events-none" : ""} ${className}`}
      disabled={isDisabled}
      {...props}
    >
      {isLoading ? (
        <>
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
          {children}
        </>
      ) : (
        children
      )}
    </button>
  );
}
