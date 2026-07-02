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
    color: "#c0392b",
    gradientBg: "linear-gradient(145deg, #FFF5F5, #FED7D7)",
    borderColor: "#c0392b",
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

  const active = RATINGS.find((r) => r.score === (hovered ?? value)) ?? null;

  return (
    <div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(5, 1fr)",
          gap: 6,
        }}
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
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                aspectRatio: "1 / 1",
                padding: 0,
                borderRadius: 12,
                border: `2px solid ${highlight ? r.borderColor : "#E5E7EB"}`,
                background: highlight ? r.gradientBg : "#FAFAFA",
                cursor: "pointer",
                transition: "all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)",
                transform: isHovered
                  ? "translateY(-3px) scale(1.06)"
                  : isSelected
                  ? "translateY(-2px) scale(1.03)"
                  : "none",
                boxShadow: isSelected
                  ? `0 0 0 3px ${r.shadowColor}, 0 6px 18px ${r.shadowColor}`
                  : isHovered
                  ? `0 6px 16px ${r.shadowColor}`
                  : "0 1px 3px rgba(0,0,0,0.06)",
                outline: "none",
                position: "relative",
              }}
            >
              {isSelected && (
                <span
                  style={{
                    position: "absolute",
                    top: 5,
                    right: 5,
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    background: r.color,
                    boxShadow: `0 0 0 2px white`,
                  }}
                />
              )}
              <span
                style={{
                  fontSize: "clamp(1.6rem, 7vw, 2.2rem)",
                  lineHeight: 1,
                  display: "block",
                  filter: highlight ? "none" : "grayscale(15%) opacity(0.85)",
                  transition: "filter 0.2s",
                }}
              >
                {r.emoji}
              </span>
            </button>
          );
        })}
      </div>

      <div
        style={{
          marginTop: 10,
          minHeight: 22,
          textAlign: "center",
          fontSize: "0.85rem",
          fontWeight: 600,
          color: active ? active.color : "#9CA3AF",
          transition: "color 0.15s",
        }}
        aria-live="polite"
      >
        {active ? active.label : " "}
      </div>

      {error && (
        <p style={{ fontSize: "0.75rem", color: "#c0392b", marginTop: 4, textAlign: "center" }}>
          {error}
        </p>
      )}
    </div>
  );
}
