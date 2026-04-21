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
      "bg-[#2E86AB] text-white hover:bg-[#246d8c] active:bg-[#1a5570] focus:ring-[#2E86AB] shadow-sm hover:shadow",
    secondary:
      "bg-white text-[#1E3A5F] border border-[#D3D1C7] hover:bg-[#F0F4F8] active:bg-[#E4EBF1] focus:ring-[#2E86AB] shadow-sm",
    danger:
      "bg-[#E74C3C] text-white hover:bg-[#c0392b] active:bg-[#a93226] focus:ring-[#E74C3C] shadow-sm hover:shadow",
    ghost:
      "bg-transparent text-[#2E86AB] hover:bg-[#EBF5FB] active:bg-[#D6EEF5] focus:ring-[#2E86AB]",
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
