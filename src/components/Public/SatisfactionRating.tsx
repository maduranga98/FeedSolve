import { useState } from "react";

export type SatisfactionScore = 1 | 2 | 3 | 4 | 5;

interface RatingOption {
  score: SatisfactionScore;
  emoji: string;
  label: string;
  color: string;
  gradientBg: string;
  borderColor: string;
  shadowColor: string;
}

const RATINGS: RatingOption[] = [
  {
    score: 1,
    emoji: "😠",
    label: "Very Unhappy",
    color: "#DC2626",
    gradientBg: "linear-gradient(145deg, #FFF5F5, #FED7D7)",
    borderColor: "#DC2626",
    shadowColor: "rgba(220,38,38,0.28)",
  },
  {
    score: 2,
    emoji: "😕",
    label: "Unhappy",
    color: "#D97706",
    gradientBg: "linear-gradient(145deg, #FFFBEB, #FDE68A)",
    borderColor: "#D97706",
    shadowColor: "rgba(217,119,6,0.28)",
  },
  {
    score: 3,
    emoji: "😐",
    label: "Neutral",
    color: "#6B7280",
    gradientBg: "linear-gradient(145deg, #F9FAFB, #E5E7EB)",
    borderColor: "#9CA3AF",
    shadowColor: "rgba(107,114,128,0.20)",
  },
  {
    score: 4,
    emoji: "😊",
    label: "Happy",
    color: "#0284C7",
    gradientBg: "linear-gradient(145deg, #EFF8FF, #BFDBFE)",
    borderColor: "#0284C7",
    shadowColor: "rgba(2,132,199,0.28)",
  },
  {
    score: 5,
    emoji: "😄",
    label: "Very Happy",
    color: "#16A34A",
    gradientBg: "linear-gradient(145deg, #F0FFF4, #A7F3D0)",
    borderColor: "#16A34A",
    shadowColor: "rgba(22,163,74,0.28)",
  },
];

interface SatisfactionRatingProps {
  value: SatisfactionScore | null;
  onChange: (score: SatisfactionScore, label: string) => void;
  error?: string;
}

export function SatisfactionRating({ value, onChange, error }: SatisfactionRatingProps) {
  const [hovered, setHovered] = useState<SatisfactionScore | null>(null);

  return (
    <div>
      <div
        style={{ display: "flex", gap: 8 }}
        role="group"
        aria-label="Satisfaction rating"
      >
        {RATINGS.map((r) => {
          const isSelected = value === r.score;
          const isHovered = hovered === r.score;
          const highlight = isSelected || isHovered;

          return (
            <button
              key={r.score}
              type="button"
              aria-label={r.label}
              aria-pressed={isSelected}
              onClick={() => onChange(r.score, r.label)}
              onMouseEnter={() => setHovered(r.score)}
              onMouseLeave={() => setHovered(null)}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 6,
                padding: "16px 4px 14px",
                borderRadius: 14,
                border: `2px solid ${highlight ? r.borderColor : "#E5E7EB"}`,
                background: highlight ? r.gradientBg : "#FAFAFA",
                cursor: "pointer",
                transition: "all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)",
                transform: isHovered
                  ? "translateY(-5px) scale(1.07)"
                  : isSelected
                  ? "translateY(-3px) scale(1.04)"
                  : "none",
                boxShadow: isSelected
                  ? `0 0 0 4px ${r.shadowColor}, 0 8px 24px ${r.shadowColor}`
                  : isHovered
                  ? `0 8px 20px ${r.shadowColor}`
                  : "0 1px 3px rgba(0,0,0,0.06)",
                outline: "none",
                position: "relative",
              }}
            >
              {isSelected && (
                <span
                  style={{
                    position: "absolute",
                    top: 7,
                    right: 7,
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: r.color,
                    boxShadow: `0 0 0 2px white, 0 0 0 3px ${r.color}`,
                  }}
                />
              )}
              <span
                style={{
                  fontSize: highlight ? "2.6rem" : "2.1rem",
                  lineHeight: 1,
                  transition: "font-size 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)",
                  display: "block",
                  filter: highlight ? "none" : "grayscale(15%) opacity(0.85)",
                }}
              >
                {r.emoji}
              </span>
              <span
                style={{
                  fontSize: "0.65rem",
                  fontWeight: highlight ? 700 : 500,
                  color: highlight ? r.color : "#9CA3AF",
                  lineHeight: 1.25,
                  textAlign: "center",
                  transition: "color 0.15s, font-weight 0.15s",
                  maxWidth: 52,
                  wordBreak: "break-word",
                }}
              >
                {r.label}
              </span>
            </button>
          );
        })}
      </div>

      {error && (
        <p style={{ fontSize: "0.75rem", color: "#DC2626", marginTop: 8 }}>{error}</p>
      )}
    </div>
  );
}
