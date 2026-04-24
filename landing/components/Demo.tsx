"use client";

import { useState } from "react";
import { PlayCircle, Search, MousePointerClick } from "lucide-react";

const timeline = [
  {
    time: "Apr 18, 2026 · 09:14",
    title: "Issue submitted",
    detail: "Submitted via QR code at warehouse gate",
    done: true,
    active: false,
  },
  {
    time: "Apr 18, 2026 · 10:32",
    title: "Assigned to Quality Team",
    detail: "Owner: Sarah K. · Priority: High",
    done: true,
    active: false,
  },
  {
    time: "Apr 19, 2026 · 14:05",
    title: "Update posted",
    detail: '"Replacement shipment dispatched. ETA 2 days."',
    done: true,
    active: false,
  },
  {
    time: "Apr 21, 2026 · 11:00",
    title: "Issue resolved",
    detail: '"Replacement received and confirmed by customer."',
    done: false,
    active: true,
  },
];

export function Demo() {
  const [open, setOpen] = useState(false);

  return (
    <section id="demo" style={{ background: "var(--navy)", padding: "80px 32px" }}>
      <div style={{ maxWidth: 760, margin: "0 auto", textAlign: "center" }}>
        <div className="section-label light" style={{ justifyContent: "center" }}>
          <PlayCircle size={13} /> Live demo
        </div>
        <h2 style={{ color: "white", marginBottom: 16 }}>See how it works in seconds</h2>
        <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 18, marginBottom: 36 }}>
          Track a real example and see how updates look from the submitter&apos;s side.
        </p>

        <div className="flex flex-col items-center gap-2.5">
          <span
            style={{
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: "0.09em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.4)",
            }}
          >
            Click below to try it live
          </span>

          <button
            onClick={() => setOpen((o) => !o)}
            className="btn-primary teal inline-flex items-center gap-2"
            style={{
              fontSize: 16,
              padding: "14px 28px",
              margin: "0 auto",
              animation: "demoPulse 2.2s infinite",
              border: "none",
              cursor: "pointer",
            }}
          >
            <Search size={16} />
            Track Demo Issue #FSV-1024
          </button>

          <span
            className="flex items-center gap-1"
            style={{ fontSize: 13, color: "rgba(255,255,255,0.35)" }}
          >
            <MousePointerClick size={13} />
            Interactive — see the full resolution timeline
          </span>
        </div>

        {/* Tracker panel */}
        {open && (
          <div
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 20,
              padding: 32,
              marginTop: 28,
              textAlign: "left",
              animation: "slideDown 0.35s cubic-bezier(0.22,1,0.36,1)",
            }}
          >
            <div style={{ marginBottom: 24 }}>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "var(--teal-light)",
                  letterSpacing: "0.09em",
                  textTransform: "uppercase",
                  marginBottom: 6,
                }}
              >
                Issue Tracker
              </div>
              <div style={{ fontFamily: "monospace", fontSize: 18, color: "white", fontWeight: 700 }}>
                #FSV-1024 Damaged product in shipment
              </div>
            </div>

            <div className="flex flex-col">
              {timeline.map((item, i) => (
                <div key={i} className="flex gap-4">
                  {/* Line */}
                  <div className="flex flex-col items-center" style={{ width: 18, flexShrink: 0 }}>
                    <div
                      style={{
                        width: 11,
                        height: 11,
                        borderRadius: "50%",
                        marginTop: 5,
                        flexShrink: 0,
                        background: item.active
                          ? "white"
                          : item.done
                          ? "var(--teal-light)"
                          : "rgba(58,143,165,0.5)",
                        border: "2px solid var(--navy)",
                        boxShadow: item.active ? "0 0 0 4px rgba(255,255,255,0.15)" : "none",
                      }}
                    />
                    {i < timeline.length - 1 && (
                      <div
                        style={{
                          flex: 1,
                          width: 2,
                          background: "rgba(255,255,255,0.08)",
                          margin: "4px 0",
                          minHeight: 28,
                        }}
                      />
                    )}
                  </div>

                  {/* Content */}
                  <div style={{ paddingBottom: 22, flex: 1 }}>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginBottom: 3 }}>
                      {item.time}
                    </div>
                    <div
                      style={{
                        fontSize: 14,
                        color: item.active ? "var(--teal-light)" : "white",
                        fontWeight: item.active ? 700 : 600,
                      }}
                    >
                      {item.title}
                    </div>
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", marginTop: 3, lineHeight: 1.5 }}>
                      {item.detail}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes demoPulse {
          0%, 100% { box-shadow: 0 0 0 4px rgba(58,143,165,0.25), 0 0 0 8px rgba(58,143,165,0.1); }
          50% { box-shadow: 0 0 0 6px rgba(58,143,165,0.35), 0 0 0 14px rgba(58,143,165,0.06); }
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-12px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </section>
  );
}
