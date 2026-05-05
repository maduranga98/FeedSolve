import { useState } from "react";

export type SatisfactionScore = 1 | 2 | 3 | 4 | 5;

interface RatingOption {
  score: SatisfactionScore;
  emoji: string;
  label: string;
  color: string;
  bg: string;
  border: string;
}

const RATINGS: RatingOption[] = [
  { score: 1, emoji: "😠", label: "Very Unhappy", color: "#E74C3C", bg: "#FDEDEC", border: "#E74C3C" },
  { score: 2, emoji: "😕", label: "Unhappy",      color: "#E67E22", bg: "#FEF5E7", border: "#E67E22" },
  { score: 3, emoji: "😐", label: "Neutral",      color: "#6B7B8D", bg: "#EFF3F6", border: "#6B7B8D" },
  { score: 4, emoji: "😊", label: "Happy",        color: "#2E86AB", bg: "#EBF5FB", border: "#2E86AB" },
  { score: 5, emoji: "😄", label: "Very Happy",   color: "#27AE60", bg: "#EBF9F1", border: "#27AE60" },
];

interface SatisfactionRatingProps {
  value: SatisfactionScore | null;
  onChange: (score: SatisfactionScore, label: string) => void;
  error?: string;
}

export function SatisfactionRating({ value, onChange, error }: SatisfactionRatingProps) {
  const [hovered, setHovered] = useState<SatisfactionScore | null>(null);

  const active = hovered ?? value;
  const activeOption = RATINGS.find(r => r.score === active);

  return (
    <div>
      <div className="flex gap-2" role="group" aria-label="Satisfaction rating">
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
                padding: "10px 4px 8px",
                borderRadius: 8,
                border: `2px solid ${highlight ? r.border : "#D3D1C7"}`,
                backgroundColor: highlight ? r.bg : "#F8FAFB",
                cursor: "pointer",
                transition: "all 0.15s ease",
                transform: isHovered ? "translateY(-2px)" : "none",
                boxShadow: isSelected
                  ? `0 0 0 3px ${r.color}30, 0 2px 8px ${r.color}20`
                  : isHovered
                  ? "0 2px 8px rgba(0,0,0,0.10)"
                  : "none",
                outline: "none",
              }}
            >
              <span
                style={{
                  fontSize: isHovered ? "2rem" : "1.6rem",
                  lineHeight: 1,
                  transition: "font-size 0.15s ease",
                  display: "block",
                  minHeight: "2rem",
                }}
              >
                {r.emoji}
              </span>
              {isSelected && (
                <span
                  style={{
                    display: "block",
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    backgroundColor: r.color,
                    marginTop: 5,
                  }}
                />
              )}
            </button>
          );
        })}
      </div>

      <div style={{ minHeight: 22, marginTop: 6, textAlign: "center" }}>
        {activeOption ? (
          <span
            style={{
              fontSize: "0.8125rem",
              fontWeight: 600,
              color: activeOption.color,
              transition: "color 0.15s",
            }}
          >
            {activeOption.label}
          </span>
        ) : (
          <span style={{ fontSize: "0.8125rem", color: "#9AABBF" }}>
            Select your rating
          </span>
        )}
      </div>

      {error && (
        <p style={{ fontSize: "0.75rem", color: "#E74C3C", marginTop: 4 }}>{error}</p>
      )}
    </div>
  );
}
