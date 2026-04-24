"use client";

import { useEffect, useRef } from "react";
import { Gem, Check, X } from "lucide-react";

export function Diff() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          const left = el.querySelector(".diff-left") as HTMLElement;
          const table = el.querySelector(".diff-table") as HTMLElement;
          if (left) { left.style.opacity = "1"; left.style.transform = "translateX(0)"; }
          setTimeout(() => {
            if (table) { table.style.opacity = "1"; table.style.transform = "translateX(0)"; }
          }, 100);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section id="diff" style={{ background: "var(--bg-warm)", padding: "96px 32px" }}>
      <div ref={ref} style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div
          className="diff-grid"
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 64, alignItems: "center" }}
        >
          {/* Left */}
          <div
            className="diff-left"
            style={{
              opacity: 0,
              transform: "translateX(-32px)",
              transition: "opacity 0.65s ease, transform 0.65s ease",
            }}
          >
            <div className="section-label">
              <Gem size={13} /> Why FeedSolve
            </div>
            <h2>
              Not another<br />form builder
            </h2>
            <p style={{ fontSize: 18, color: "var(--text-mid)", marginTop: 16, marginBottom: 32, lineHeight: 1.7 }}>
              Google Forms and Typeform help you collect feedback.{" "}
              <strong>FeedSolve makes sure it gets resolved.</strong>
            </p>

            <div className="flex flex-col gap-3.5">
              {[
                "Track every issue from start to finish",
                "Assign responsibility to your team",
                "Update status and communicate back",
                "Let submitters follow progress in real time",
              ].map((item) => (
                <div key={item} className="flex items-center gap-3.5" style={{ fontSize: 16, color: "var(--text)", fontWeight: 500 }}>
                  <div
                    className="flex items-center justify-center flex-shrink-0"
                    style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--teal)", color: "white" }}
                  >
                    <Check size={13} />
                  </div>
                  {item}
                </div>
              ))}
            </div>
          </div>

          {/* Right comparison table */}
          <div
            className="diff-table"
            style={{
              background: "var(--navy)",
              borderRadius: 20,
              padding: 36,
              color: "white",
              opacity: 0,
              transform: "translateX(32px)",
              transition: "opacity 0.65s ease, transform 0.65s ease",
            }}
          >
            <div className="grid grid-cols-2 gap-5">
              {/* Others column */}
              <div>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: "rgba(255,255,255,0.4)",
                    marginBottom: 14,
                  }}
                >
                  Others
                </div>
                {["Google Forms", "Typeform", "SurveyMonkey"].map((tool) => (
                  <div
                    key={tool}
                    className="flex items-center gap-2"
                    style={{
                      padding: "10px 14px",
                      borderRadius: 8,
                      fontSize: 14,
                      fontWeight: 500,
                      marginBottom: 8,
                      background: "rgba(255,255,255,0.05)",
                      color: "rgba(255,255,255,0.4)",
                    }}
                  >
                    <X size={13} className="flex-shrink-0" /> {tool}
                  </div>
                ))}
              </div>

              {/* FeedSolve column */}
              <div>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: "rgba(255,255,255,0.4)",
                    marginBottom: 14,
                  }}
                >
                  FeedSolve
                </div>
                {["Collect + Resolve", "Track + Assign", "Communicate back"].map((feat) => (
                  <div
                    key={feat}
                    className="flex items-center gap-2"
                    style={{
                      padding: "10px 14px",
                      borderRadius: 8,
                      fontSize: 14,
                      fontWeight: 500,
                      marginBottom: 8,
                      background: "rgba(58,143,165,0.15)",
                      color: "var(--teal-light)",
                      border: "1px solid rgba(58,143,165,0.2)",
                    }}
                  >
                    <Check size={13} className="flex-shrink-0" /> {feat}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @media (max-width: 960px) {
          .diff-grid { grid-template-columns: 1fr !important; gap: 40px !important; }
          .diff-left, .diff-table { opacity: 1 !important; transform: none !important; }
        }
      `}</style>
    </section>
  );
}
