"use client";

import { useEffect, useRef } from "react";
import { Flame, MessageCircle, Mail, Shuffle, BellOff, Inbox, Table, Mic, XCircle } from "lucide-react";

export function Problem() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.querySelectorAll(".pp-item").forEach((item, i) => {
            setTimeout(() => {
              (item as HTMLElement).style.opacity = "1";
              (item as HTMLElement).style.transform = "translateX(0)";
            }, i * 100);
          });
          const viz = el.querySelector(".problem-viz") as HTMLElement;
          if (viz) {
            setTimeout(() => {
              viz.style.opacity = "1";
              viz.style.transform = "translateX(0)";
            }, 100);
          }
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section style={{ background: "var(--bg-warm)", padding: "96px 32px" }}>
      <div ref={ref} style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div
          className="problem-grid"
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 72, alignItems: "center" }}
        >
          {/* Left */}
          <div>
            <div className="section-label">
              <Flame size={13} /> The problem
            </div>
            <h2>
              Feedback is everywhere.<br />Resolution is nowhere.
            </h2>

            <div style={{ marginTop: 32, display: "flex", flexDirection: "column", gap: 14 }}>
              {[
                { icon: MessageCircle, text: "Complaints lost in WhatsApp chats" },
                { icon: Mail, text: "Feedback buried in emails" },
                { icon: Shuffle, text: "No tracking, no ownership" },
                { icon: BellOff, text: "Customers never get updates" },
              ].map((p) => (
                <div
                  key={p.text}
                  className="pp-item"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 16,
                    background: "white",
                    border: "1px solid var(--border)",
                    borderRadius: 12,
                    padding: "18px 20px",
                    boxShadow: "0 2px 8px rgba(30,53,87,0.04)",
                    opacity: 0,
                    transform: "translateX(-24px)",
                    transition: "opacity 0.5s ease, transform 0.5s ease, box-shadow 0.22s, translateX 0.22s",
                    cursor: "default",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.transform = "translateX(5px)";
                    (e.currentTarget as HTMLElement).style.boxShadow = "var(--shadow)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.transform = "translateX(0)";
                    (e.currentTarget as HTMLElement).style.boxShadow = "0 2px 8px rgba(30,53,87,0.04)";
                  }}
                >
                  <div
                    className="flex items-center justify-center flex-shrink-0"
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 10,
                      background: "#FFF0F0",
                      color: "#C0392B",
                    }}
                  >
                    <p.icon size={17} />
                  </div>
                  <p style={{ fontSize: 15, color: "var(--text)", fontWeight: 500, margin: 0 }}>
                    {p.text}
                  </p>
                </div>
              ))}
            </div>

            <div
              style={{
                marginTop: 28,
                padding: "24px 28px",
                background: "var(--navy)",
                borderRadius: 20,
              }}
            >
              <p style={{ fontSize: 17, color: "rgba(255,255,255,0.75)", lineHeight: 1.65, fontStyle: "italic", margin: 0 }}>
                You&apos;re collecting feedback.{" "}
                <strong style={{ color: "var(--teal-light)", fontStyle: "normal" }}>
                  You&apos;re just not resolving it.
                </strong>
              </p>
            </div>
          </div>

          {/* Right visualization */}
          <div
            className="problem-viz"
            style={{
              background: "white",
              borderRadius: 20,
              border: "1px solid var(--border)",
              padding: 32,
              boxShadow: "var(--shadow)",
              opacity: 0,
              transform: "translateX(32px)",
              transition: "opacity 0.7s ease, transform 0.7s ease",
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "var(--text-light)",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                marginBottom: 20,
              }}
            >
              Where feedback goes today
            </div>

            {[
              { bg: "#E8F5E9", iconBg: "#C8E6C9", iconColor: "#2E7D32", Icon: MessageCircle, text: "WhatsApp group chat" },
              { bg: "#EEF2FF", iconBg: "#C5CAE9", iconColor: "#3730A3", Icon: Inbox, text: "Email inbox (buried under 200 others)" },
              { bg: "#FFF8E1", iconBg: "#FFF176", iconColor: "#F57F17", Icon: Table, text: "Excel sheet (last updated 3 weeks ago)" },
              { bg: "#FCE4EC", iconBg: "#FFCDD2", iconColor: "#C62828", Icon: Mic, text: "Verbal complaint (already forgotten)" },
            ].map((row) => (
              <div
                key={row.text}
                className="flex items-center gap-3 rounded-xl mb-2.5"
                style={{ background: row.bg, borderRadius: 10, padding: "13px 16px" }}
              >
                <div
                  className="flex items-center justify-center flex-shrink-0"
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: row.iconBg,
                    color: row.iconColor,
                  }}
                >
                  <row.Icon size={15} />
                </div>
                <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text)" }}>{row.text}</span>
              </div>
            ))}

            <div
              className="flex items-center gap-2 mt-4"
              style={{
                padding: "12px 16px",
                background: "#FFF5F5",
                borderRadius: 8,
                border: "1px solid #FECACA",
                fontSize: 13,
                fontWeight: 600,
                color: "#DC2626",
              }}
            >
              <XCircle size={15} className="flex-shrink-0" />
              No tracking. No resolution. No visibility.
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @media (max-width: 960px) {
          .problem-grid { grid-template-columns: 1fr !important; }
          .problem-viz { transform: none !important; opacity: 1 !important; }
        }
      `}</style>
    </section>
  );
}
