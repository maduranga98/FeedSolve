import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
}

export function Button({
  variant = "primary",
  size = "md",
  isLoading = false,
  disabled,
  children,
  ...props
}: ButtonProps) {
  const baseClasses =
    "font-medium rounded-lg transition-colors font-inter focus:outline-none focus:ring-2 focus:ring-offset-2";

  const variants = {
    primary: "bg-[#2E86AB] text-white hover:bg-[#1E5A7A] focus:ring-[#2E86AB]",
    secondary:
      "bg-[#F8FAFB] text-[#1E3A5F] border border-[#D3D1C7] hover:bg-gray-100 focus:ring-[#2E86AB]",
    danger: "bg-[#E74C3C] text-white hover:bg-[#C0392B] focus:ring-[#E74C3C]",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-base",
    lg: "px-6 py-3 text-lg",
  };

  const computedClasses = `${baseClasses} ${variants[variant]} ${sizes[size]} ${
    disabled || isLoading ? "opacity-50 cursor-not-allowed" : ""
  }`;

  const { className: propsClassName, ...restProps } = props;

  return (
    <button
      className={`${computedClasses} ${propsClassName || ""}`}
      disabled={disabled || isLoading}
      {...restProps}
    >
      {isLoading ? "Loading..." : children}
    </button>
  );
}
