"use client";

import { useEffect, useRef } from "react";
import { Tag, Check, Info, ArrowRight } from "lucide-react";

const plans = [
  {
    tier: "Free",
    price: 0,
    period: "7-day trial — then pick a plan",
    features: [
      "Full access for 7 days",
      "Unlimited submissions during trial",
      "All features unlocked",
      "QR Code Access",
      "Tracking Codes",
      "Choose a plan when trial ends",
    ],
    cta: "Start Free Trial",
    popular: false,
    teal: false,
    free: true,
  },
  {
    tier: "Starter",
    price: 19,
    period: "Billed monthly",
    features: [
      "3 Feedback Boards",
      "500 Submissions / month",
      "3 Team Members",
      "Full Resolution Workflow",
      "Email Notifications",
    ],
    cta: "Try Now",
    popular: false,
    teal: false,
    free: false,
  },
  {
    tier: "Growth",
    price: 49,
    period: "Billed monthly",
    features: [
      "10 Feedback Boards",
      "5,000 Submissions / month",
      "10 Team Members",
      "Public Replies to Submitters",
      "Advanced Analytics",
      "Custom Branding",
    ],
    cta: "Try Now",
    popular: true,
    teal: true,
    free: false,
  },
  {
    tier: "Business",
    price: 129,
    period: "Billed monthly",
    features: [
      "Unlimited Boards",
      "Unlimited Submissions",
      "Unlimited Team Members",
      "API Access",
      "Integrations / Webhooks",
      "Priority Support",
    ],
    cta: "Try Now",
    popular: false,
    teal: false,
    free: false,
  },
];

export function Pricing() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.querySelectorAll(".pc").forEach((card, i) => {
            setTimeout(() => {
              (card as HTMLElement).style.opacity = "1";
              (card as HTMLElement).style.transform = "translateY(0)";
            }, i * 100);
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
    <section id="pricing" style={{ background: "var(--bg)", padding: "96px 32px 80px" }}>
      <div ref={ref} style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div className="section-label">
          <Tag size={13} /> Pricing
        </div>
        <h2>
          Simple pricing.<br />No surprises.
        </h2>
        <p style={{ fontSize: 18, color: "var(--text-mid)", marginTop: 12, marginBottom: 52 }}>
          Start free. Upgrade as you grow.
        </p>

        <div
          className="pricing-grid"
          style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 18, alignItems: "start", marginBottom: 16 }}
        >
          {plans.map((plan) => (
            <div
              key={plan.tier}
              className="pc"
              style={{
                background: "white",
                borderRadius: 20,
                border: plan.popular ? `1.5px solid var(--teal)` : "1.5px solid var(--border)",
                boxShadow: plan.popular ? "0 0 0 4px rgba(58,143,165,0.08)" : "none",
                padding: 26,
                position: "relative",
                opacity: 0,
                transform: "translateY(36px)",
                transition: "opacity 0.55s ease, transform 0.55s cubic-bezier(0.22,1,0.36,1), box-shadow 0.22s",
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.transform = "translateY(-5px)";
                el.style.boxShadow = plan.popular
                  ? "0 0 0 4px rgba(58,143,165,0.08), var(--shadow-lg)"
                  : "var(--shadow-lg)";
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.transform = "translateY(0)";
                el.style.boxShadow = plan.popular ? "0 0 0 4px rgba(58,143,165,0.08)" : "none";
              }}
            >
              {plan.popular && (
                <div
                  className="absolute"
                  style={{
                    top: -13,
                    left: "50%",
                    transform: "translateX(-50%)",
                    background: "var(--teal)",
                    color: "white",
                    fontSize: 10,
                    fontWeight: 800,
                    padding: "4px 14px",
                    borderRadius: "100px",
                    letterSpacing: "0.07em",
                    textTransform: "uppercase",
                    whiteSpace: "nowrap",
                  }}
                >
                  Most Popular
                </div>
              )}

              <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-light)", marginBottom: 12 }}>
                {plan.tier}
              </div>

              <div style={{ fontFamily: "var(--font-display)", fontSize: 40, fontWeight: 800, color: "var(--navy)", lineHeight: 1 }}>
                {plan.price === 0 ? (
                  "$0"
                ) : (
                  <>
                    <sup style={{ fontSize: 20, verticalAlign: "top", marginTop: 5 }}>$</sup>
                    {plan.price}
                  </>
                )}
                <span style={{ fontSize: 14, fontWeight: 400, color: "var(--text-light)" }}> / mo</span>
              </div>
              <div style={{ fontSize: 12, color: "var(--text-light)", margin: "4px 0 20px" }}>
                {plan.period}
              </div>

              <div style={{ height: 1, background: "var(--border)", marginBottom: 18 }} />

              <div className="flex flex-col gap-2 mb-6">
                {plan.features.map((f) => (
                  <div key={f} className="flex items-start gap-2" style={{ fontSize: 13, color: "var(--text)" }}>
                    <div style={{ color: "var(--teal)", flexShrink: 0, marginTop: 1 }}>
                      <Check size={14} />
                    </div>
                    {f}
                  </div>
                ))}
              </div>

              {plan.free ? (
                <button
                  className="w-full text-center font-semibold cursor-pointer"
                  style={{
                    padding: 11,
                    background: "var(--bg-warm)",
                    color: "var(--navy)",
                    borderRadius: 8,
                    fontSize: 14,
                    border: "none",
                    fontFamily: "var(--font-body)",
                    transition: "background var(--t)",
                  }}
                  onMouseEnter={(e) => ((e.target as HTMLElement).style.background = "var(--border)")}
                  onMouseLeave={(e) => ((e.target as HTMLElement).style.background = "var(--bg-warm)")}
                >
                  {plan.cta}
                </button>
              ) : (
                <a
                  href="#"
                  className={`btn-primary w-full justify-center ${plan.teal ? "teal" : ""}`}
                  style={{ fontSize: 14, padding: 11 }}
                >
                  {plan.cta} <ArrowRight size={14} />
                </a>
              )}
            </div>
          ))}
        </div>

        <div
          className="flex items-center justify-center gap-2 mt-9"
          style={{ fontSize: 14, color: "var(--text-light)", position: "relative", zIndex: 2 }}
        >
          <Info size={14} style={{ color: "var(--teal)" }} />
          Pricing is based on feedback boards, not per user · No hidden fees. Cancel anytime.
        </div>
      </div>

      <style jsx>{`
        @media (max-width: 960px) {
          .pricing-grid { grid-template-columns: 1fr 1fr !important; }
        }
        @media (max-width: 600px) {
          .pricing-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  );
}
