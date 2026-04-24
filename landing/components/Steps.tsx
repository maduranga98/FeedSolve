"use client";

import { useEffect, useRef } from "react";
import { Zap, UserPlus, LayoutDashboard, Share2 } from "lucide-react";

const steps = [
  {
    icon: UserPlus,
    num: "Step 01",
    title: "Create your account",
    desc: "Sign up with email or Google. No credit card, no setup call. You're in immediately.",
  },
  {
    icon: LayoutDashboard,
    num: "Step 02",
    title: "Create your first board",
    desc: 'Name it "Customer Feedback" or anything you like. Your board is live in 30 seconds.',
  },
  {
    icon: Share2,
    num: "Step 03",
    title: "Share your link or QR",
    desc: "Anyone can submit feedback instantly no login required on their end ever.",
  },
];

export function Steps() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.querySelectorAll(".step-card").forEach((card, i) => {
            setTimeout(() => {
              (card as HTMLElement).style.opacity = "1";
              (card as HTMLElement).style.transform = "translateY(0)";
            }, i * 150);
          });
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section id="steps" style={{ background: "var(--navy)", padding: "96px 32px" }}>
      <div ref={ref} style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div className="section-label light">
          <Zap size={13} /> How it works
        </div>
        <h2 style={{ color: "white" }}>
          Go from zero to live<br />in minutes
        </h2>

        <div
          className="steps-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3,1fr)",
            gap: 28,
            marginTop: 56,
          }}
        >
          {steps.map((s) => (
            <div
              key={s.num}
              className="step-card"
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.09)",
                borderRadius: 20,
                padding: 32,
                opacity: 0,
                transform: "translateY(40px)",
                transition: "opacity 0.6s ease, transform 0.6s cubic-bezier(0.22,1,0.36,1)",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.09)";
                (e.currentTarget as HTMLElement).style.transform = "translateY(-4px)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.05)";
                (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
              }}
            >
              <div
                className="flex items-center justify-center"
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 12,
                  background: "rgba(58,143,165,0.15)",
                  border: "1px solid rgba(58,143,165,0.25)",
                  marginBottom: 20,
                  color: "var(--teal-light)",
                }}
              >
                <s.icon size={22} />
              </div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "rgba(255,255,255,0.3)",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  marginBottom: 10,
                }}
              >
                {s.num}
              </div>
              <h3 style={{ color: "white", fontSize: 19, marginBottom: 10 }}>{s.title}</h3>
              <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 15, lineHeight: 1.65 }}>
                {s.desc}
              </p>
            </div>
          ))}
        </div>

        <div
          style={{
            textAlign: "center",
            marginTop: 48,
            fontSize: 15,
            color: "rgba(255,255,255,0.45)",
          }}
        >
          You&apos;ll be collecting real feedback in{" "}
          <strong style={{ color: "var(--teal-light)" }}>under 2 minutes.</strong>
        </div>
      </div>

      <style jsx>{`
        @media (max-width: 768px) {
          .steps-grid { grid-template-columns: 1fr 1fr !important; }
        }
        @media (max-width: 600px) {
          .steps-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  );
}
