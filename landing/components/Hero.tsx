"use client";

import { ArrowRight, Play, ShieldCheck, BellRing } from "lucide-react";

const QRPattern = () => (
  <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" width={80} height={80}>
    <rect width="80" height="80" rx="8" fill="#F8F7F4" />
    <rect x="8" y="8" width="28" height="28" rx="3" fill="#1E3557" />
    <rect x="12" y="12" width="20" height="20" rx="2" fill="#F8F7F4" />
    <rect x="16" y="16" width="12" height="12" rx="1" fill="#1E3557" />
    <rect x="44" y="8" width="28" height="28" rx="3" fill="#1E3557" />
    <rect x="48" y="12" width="20" height="20" rx="2" fill="#F8F7F4" />
    <rect x="52" y="16" width="12" height="12" rx="1" fill="#1E3557" />
    <rect x="8" y="44" width="28" height="28" rx="3" fill="#1E3557" />
    <rect x="12" y="48" width="20" height="20" rx="2" fill="#F8F7F4" />
    <rect x="16" y="52" width="12" height="12" rx="1" fill="#1E3557" />
    <rect x="44" y="44" width="7" height="7" rx="1" fill="#3A8FA5" />
    <rect x="54" y="44" width="7" height="7" rx="1" fill="#1E3557" />
    <rect x="64" y="44" width="7" height="7" rx="1" fill="#3A8FA5" />
    <rect x="44" y="54" width="7" height="7" rx="1" fill="#1E3557" />
    <rect x="54" y="54" width="7" height="7" rx="1" fill="#3A8FA5" />
    <rect x="64" y="54" width="7" height="7" rx="1" fill="#1E3557" />
    <rect x="44" y="64" width="7" height="7" rx="1" fill="#3A8FA5" />
    <rect x="54" y="64" width="7" height="7" rx="1" fill="#1E3557" />
    <rect x="64" y="64" width="7" height="7" rx="1" fill="#1E3557" />
  </svg>
);

const issues = [
  { code: "FSV-1089", title: "Wrong item in order #4421", badge: "Resolved", color: "#E8F5E9", textColor: "#2E7D32" },
  { code: "FSV-1090", title: "Delivery delayed: 3 days", badge: "In Progress", color: "#E8F4F8", textColor: "#3A8FA5" },
  { code: "FSV-1091", title: "Quality defect in batch B-22", badge: "Open", color: "#FFF3E0", textColor: "#E65100" },
  { code: "FSV-1092", title: "Incorrect invoice amount", badge: "Resolved", color: "#E8F5E9", textColor: "#2E7D32" },
];

export function Hero() {
  return (
    <section
      id="hero"
      className="relative overflow-hidden"
      style={{ paddingTop: 128, paddingBottom: 80, background: "var(--bg)", padding: "128px 32px 80px" }}
    >
      {/* Dot grid background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(30,53,87,0.06) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
          maskImage: "radial-gradient(ellipse 80% 80% at 50% 50%, black 30%, transparent 100%)",
          WebkitMaskImage: "radial-gradient(ellipse 80% 80% at 50% 50%, black 30%, transparent 100%)",
        }}
      />
      {/* Glow */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: -200,
          right: -100,
          width: 700,
          height: 700,
          background: "radial-gradient(circle, rgba(58,143,165,0.12) 0%, transparent 65%)",
          borderRadius: "50%",
        }}
      />

      <div
        className="relative z-10 grid gap-18 items-center mx-auto"
        style={{
          maxWidth: 1200,
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 72,
          alignItems: "center",
        }}
      >
        {/* Left */}
        <div>
          {/* Live badge */}
          <div
            className="inline-flex items-center gap-2 mb-7"
            style={{
              background: "white",
              border: "1px solid var(--border)",
              padding: "6px 14px",
              borderRadius: "100px",
              fontSize: 13,
              fontWeight: 500,
              color: "var(--text-mid)",
              boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
              animation: "fadeUp 0.5s ease both",
              animationDelay: "0.1s",
            }}
          >
            <span
              className="flex-shrink-0"
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: "var(--teal)",
                animation: "pulseDot 2s infinite",
                display: "inline-block",
              }}
            />
            Live tracking for every issue
          </div>

          <h1
            style={{
              color: "var(--navy)",
              marginBottom: 24,
              animation: "fadeUp 0.6s cubic-bezier(0.22,1,0.36,1) both",
              animationDelay: "0.22s",
            }}
          >
            Stop losing<br />
            <span style={{ color: "var(--teal)" }}>complaints.</span>
            <br />Start closing them.
          </h1>

          <p
            style={{
              fontSize: 19,
              color: "var(--text-mid)",
              lineHeight: 1.65,
              marginBottom: 36,
              maxWidth: 460,
              animation: "fadeUp 0.55s ease both",
              animationDelay: "0.38s",
            }}
          >
            Collect feedback from customers, suppliers, and partners. Track every issue to resolution with a simple link and QR code.
          </p>

          <div
            className="flex flex-wrap gap-3 items-center mb-6"
            style={{
              animation: "fadeUp 0.5s ease both",
              animationDelay: "0.52s",
            }}
          >
            <a href="#" className="btn-primary teal" style={{ fontSize: 16, padding: "14px 28px" }}>
              Try Now <ArrowRight size={16} />
            </a>
            <a href="#demo" className="btn-outline" style={{ fontSize: 16, padding: "13px 24px" }}>
              See How It Works <Play size={15} />
            </a>
          </div>

          <div
            className="flex items-center gap-2"
            style={{
              fontSize: 13,
              color: "var(--text-light)",
              animation: "fadeUp 0.45s ease both",
              animationDelay: "0.64s",
            }}
          >
            <ShieldCheck size={15} style={{ color: "var(--teal)" }} />
            No credit card required · Setup in under 2 minutes
          </div>
        </div>

        {/* Right visual */}
        <div
          className="relative hidden md:block"
          style={{
            animation: "fadeRight 0.7s cubic-bezier(0.22,1,0.36,1) both",
            animationDelay: "0.3s",
          }}
        >
          {/* Floating notification */}
          <div
            className="absolute"
            style={{
              top: 24,
              right: -32,
              width: 220,
              background: "white",
              borderRadius: 12,
              boxShadow: "0 8px 32px rgba(30,53,87,0.14)",
              border: "1px solid var(--border)",
              padding: "14px 16px",
              zIndex: 10,
              display: "flex",
              alignItems: "flex-start",
              gap: 10,
              animation: "popIn 0.55s cubic-bezier(0.34,1.56,0.64,1) both, floatUp 2.8s ease-in-out 0.75s infinite",
              animationDelay: "0.75s, 1.2s",
            }}
          >
            <div
              className="flex items-center justify-center flex-shrink-0"
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: "var(--teal-pale)",
                color: "var(--teal)",
              }}
            >
              <BellRing size={15} />
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--navy)", marginBottom: 2 }}>
                Issue resolved
              </div>
              <div style={{ fontSize: 11, color: "var(--text-light)" }}>
                #FSV-1089 · 2 min ago
              </div>
            </div>
          </div>

          {/* Board mockup */}
          <div
            style={{
              background: "white",
              borderRadius: 20,
              boxShadow: "var(--shadow-lg)",
              border: "1px solid var(--border)",
              overflow: "hidden",
            }}
          >
            {/* Topbar */}
            <div
              className="flex items-center gap-2"
              style={{ background: "var(--navy)", padding: "12px 18px" }}
            >
              <div className="flex gap-1">
                <span style={{ width: 9, height: 9, borderRadius: "50%", background: "#FF5F57", display: "inline-block" }} />
                <span style={{ width: 9, height: 9, borderRadius: "50%", background: "#FFBD2E", display: "inline-block" }} />
                <span style={{ width: 9, height: 9, borderRadius: "50%", background: "#28C840", display: "inline-block" }} />
              </div>
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", marginLeft: 4, fontWeight: 500 }}>
                Customer Feedback Board
              </span>
            </div>

            {/* Body */}
            <div style={{ padding: 20 }}>
              {/* Stats */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                {[
                  { n: "48", l: "Total Issues", color: "var(--navy)" },
                  { n: "41", l: "Resolved", color: "var(--teal)" },
                  { n: "7", l: "Open", color: "#E65100" },
                ].map((s) => (
                  <div
                    key={s.l}
                    className="text-center"
                    style={{
                      background: "var(--bg)",
                      borderRadius: 8,
                      padding: "12px",
                      border: "1px solid var(--border)",
                    }}
                  >
                    <div
                      style={{
                        fontFamily: "var(--font-display)",
                        fontSize: 24,
                        fontWeight: 800,
                        color: s.color,
                      }}
                    >
                      {s.n}
                    </div>
                    <div style={{ fontSize: 10, color: "var(--text-light)", marginTop: 2 }}>{s.l}</div>
                  </div>
                ))}
              </div>

              {/* Issue rows */}
              <div className="flex flex-col gap-1.5">
                {issues.map((i) => (
                  <div
                    key={i.code}
                    className="flex items-center gap-2"
                    style={{
                      background: "var(--bg)",
                      borderRadius: 8,
                      padding: "10px 12px",
                      border: "1px solid var(--border)",
                    }}
                  >
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        color: "var(--teal)",
                        fontFamily: "monospace",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {i.code}
                    </span>
                    <span
                      className="flex-1 min-w-0 overflow-hidden text-ellipsis whitespace-nowrap"
                      style={{ fontSize: 12, color: "var(--text)" }}
                    >
                      {i.title}
                    </span>
                    <span
                      style={{
                        fontSize: 9,
                        fontWeight: 700,
                        padding: "3px 8px",
                        borderRadius: "100px",
                        whiteSpace: "nowrap",
                        background: i.color,
                        color: i.textColor,
                      }}
                    >
                      {i.badge}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Floating QR */}
          <div
            className="absolute"
            style={{
              bottom: -20,
              left: -40,
              width: 120,
              background: "white",
              borderRadius: 12,
              boxShadow: "0 8px 32px rgba(30,53,87,0.14)",
              border: "1px solid var(--border)",
              padding: "14px 16px",
              zIndex: 10,
              animation: "popIn 0.55s cubic-bezier(0.34,1.56,0.64,1) both, floatDown 3.2s ease-in-out 0.9s infinite",
              animationDelay: "0.9s, 1.5s",
            }}
          >
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: "var(--text-light)",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                marginBottom: 8,
              }}
            >
              Share &amp; collect
            </div>
            <div className="flex justify-center">
              <QRPattern />
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes pulseDot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.4); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeRight {
          from { opacity: 0; transform: translateX(36px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes popIn {
          from { opacity: 0; transform: scale(0.85) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes floatUp {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        @keyframes floatDown {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(6px); }
        }
        @media (max-width: 768px) {
          section#hero {
            padding-top: 100px !important;
          }
        }
      `}</style>
    </section>
  );
}
