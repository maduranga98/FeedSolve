"use client";

import { useEffect, useRef } from "react";
import { Settings2, QrCode, Hash, UserCheck, CheckCircle2, Link, Ticket, Users, Check, ArrowRight, Zap, TrendingUp, ShieldCheck, Smile } from "lucide-react";

const steps = [
  {
    num: "Step 01",
    Icon: QrCode,
    title: "Collect",
    desc: "Share a link or QR code. Anyone can submit feedback instantly with no login needed.",
    tag: { Icon: Link, label: "One link or QR code" },
    tagStyle: {},
  },
  {
    num: "Step 02",
    Icon: Hash,
    title: "Track",
    desc: "Every submission gets a unique tracking code. Submitters can follow progress anytime.",
    tag: { Icon: Ticket, label: "Auto-generated code" },
    tagStyle: {},
  },
  {
    num: "Step 03",
    Icon: UserCheck,
    title: "Assign",
    desc: "Route each issue to the right team member with a deadline. One owner. One responsibility.",
    tag: { Icon: Users, label: "Clear ownership" },
    tagStyle: {},
  },
  {
    num: "Step 04",
    Icon: CheckCircle2,
    title: "Resolve",
    desc: "Update status, post notes, and close the loop. The submitter is notified automatically.",
    tag: { Icon: Check, label: "Closed loop" },
    tagStyle: {
      background: "rgba(46,125,50,0.2)",
      borderColor: "rgba(46,125,50,0.3)",
      color: "#81C784",
    },
  },
];

const proofItems = [
  { Icon: Zap, n: "2 min", l: "Average setup time" },
  { Icon: TrendingUp, n: "4x", l: "Faster resolution vs chat" },
  { Icon: ShieldCheck, n: "100%", l: "Issues tracked, none lost" },
  { Icon: Smile, n: "91%", l: "Customer satisfaction lift" },
];

export function Solution() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.querySelectorAll(".sol-step").forEach((card, i) => {
            setTimeout(() => {
              (card as HTMLElement).style.opacity = "1";
              (card as HTMLElement).style.transform = "translateY(0)";
            }, i * 120);
          });
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section id="solution" style={{ background: "var(--navy)", padding: "96px 32px" }}>
      <div ref={ref} style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div className="section-label light">
          <Settings2 size={13} /> The solution
        </div>
        <h2 style={{ color: "white" }}>
          A complete feedback loop.<br />No gaps.
        </h2>
        <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 18, marginTop: 12, marginBottom: 56, maxWidth: 520 }}>
          From the moment someone submits a complaint to the moment it is resolved, FeedSolve handles every step automatically.
        </p>

        {/* Flow grid */}
        <div
          className="sol-flow"
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 32px 1fr 32px 1fr 32px 1fr",
            alignItems: "start",
            marginBottom: 56,
          }}
        >
          {steps.map((s, i) => (
            <>
              <div
                key={s.num}
                className="sol-step"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 20,
                  padding: "28px 22px",
                  opacity: 0,
                  transform: "translateY(36px)",
                  transition: "opacity 0.55s ease, transform 0.55s cubic-bezier(0.22,1,0.36,1), background 0.22s, border-color 0.22s",
                  cursor: "default",
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.background = "rgba(255,255,255,0.1)";
                  el.style.transform = "translateY(-4px)";
                  el.style.borderColor = "rgba(58,143,165,0.4)";
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.background = "rgba(255,255,255,0.06)";
                  el.style.transform = "translateY(0)";
                  el.style.borderColor = "rgba(255,255,255,0.1)";
                }}
              >
                <div style={{ fontSize: 11, fontWeight: 800, color: "var(--teal-light)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 14 }}>
                  {s.num}
                </div>
                <div
                  className="flex items-center justify-center"
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 14,
                    background: "rgba(58,143,165,0.15)",
                    border: "1px solid rgba(58,143,165,0.3)",
                    marginBottom: 18,
                    color: "var(--teal-light)",
                  }}
                >
                  <s.Icon size={22} />
                </div>
                <h3 style={{ color: "white", fontSize: 19, marginBottom: 10 }}>{s.title}</h3>
                <p style={{ fontSize: 14, color: "rgba(255,255,255,0.55)", lineHeight: 1.65, marginBottom: 16 }}>{s.desc}</p>
                <div
                  className="inline-flex items-center gap-1"
                  style={{
                    background: "rgba(58,143,165,0.15)",
                    border: "1px solid rgba(58,143,165,0.25)",
                    color: "var(--teal-light)",
                    fontSize: 11,
                    fontWeight: 700,
                    padding: "4px 10px",
                    borderRadius: "100px",
                    ...s.tagStyle,
                  }}
                >
                  <s.tag.Icon size={11} />
                  {s.tag.label}
                </div>
              </div>

              {/* Arrow between steps */}
              {i < steps.length - 1 && (
                <div
                  key={`arrow-${i}`}
                  className="flex items-center justify-center"
                  style={{ paddingTop: 36, color: "rgba(58,143,165,0.5)" }}
                >
                  <ArrowRight size={20} />
                </div>
              )}
            </>
          ))}
        </div>

        {/* Proof bar */}
        <div
          className="sol-proof"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4,1fr)",
            gap: "1px",
            background: "rgba(255,255,255,0.08)",
            borderRadius: 20,
            overflow: "hidden",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          {proofItems.map((p) => (
            <div
              key={p.n}
              className="flex items-center gap-3"
              style={{
                background: "rgba(255,255,255,0.04)",
                padding: "22px 24px",
              }}
            >
              <div
                className="flex items-center justify-center flex-shrink-0"
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background: "rgba(58,143,165,0.15)",
                  color: "var(--teal-light)",
                }}
              >
                <p.Icon size={18} />
              </div>
              <div>
                <div style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 800, color: "white", lineHeight: 1 }}>
                  {p.n}
                </div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", marginTop: 3 }}>{p.l}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        @media (max-width: 960px) {
          .sol-flow {
            grid-template-columns: 1fr !important;
          }
          .sol-proof {
            grid-template-columns: 1fr 1fr !important;
          }
        }
        @media (max-width: 600px) {
          .sol-proof {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </section>
  );
}
