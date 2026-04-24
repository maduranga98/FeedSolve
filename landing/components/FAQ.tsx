"use client";

import { useState } from "react";
import { HelpCircle, ChevronDown } from "lucide-react";

const faqs = [
  {
    q: "Do submitters need an account?",
    a: "No. Anyone can submit feedback without logging in. You share a link or QR code, they fill in the form — that's it. Zero friction for your customers.",
  },
  {
    q: "Can feedback be anonymous?",
    a: "Yes. You can enable anonymous submissions per board. Submitters still get a unique tracking code even when submitting anonymously.",
  },
  {
    q: "How long does setup take?",
    a: "Less than 2 minutes. Create an account, name your board, and share the link. No configuration required to get started collecting and tracking.",
  },
  {
    q: "Do I need a demo or sales call?",
    a: 'No. Just click "Try Now" and start immediately. We believe great software should sell itself — no gatekeeping, no onboarding calls required.',
  },
  {
    q: "Can I upgrade later?",
    a: "Yes. Start on the free plan and upgrade anytime as your usage grows. No data lost, no migrations, no downtime.",
  },
];

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number>(0);

  return (
    <section id="faq" style={{ background: "var(--bg-warm)", padding: "96px 32px" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div className="section-label" style={{ display: "block", textAlign: "center" }}>
          <span className="inline-flex items-center gap-2">
            <HelpCircle size={13} /> FAQ
          </span>
        </div>
        <h2 style={{ textAlign: "center" }}>Common questions</h2>

        <div style={{ maxWidth: 700, margin: "48px auto 0" }}>
          {faqs.map((faq, i) => (
            <div
              key={i}
              style={{ borderBottom: "1px solid var(--border)" }}
            >
              <button
                className="w-full flex justify-between items-center gap-4"
                style={{
                  padding: "22px 0",
                  cursor: "pointer",
                  fontSize: 17,
                  fontWeight: 600,
                  color: openIndex === i ? "var(--teal)" : "var(--navy)",
                  background: "none",
                  border: "none",
                  textAlign: "left",
                  userSelect: "none",
                  transition: "color 0.22s",
                  fontFamily: "var(--font-body)",
                }}
                onClick={() => setOpenIndex(openIndex === i ? -1 : i)}
                onMouseEnter={(e) => {
                  if (openIndex !== i) (e.currentTarget as HTMLElement).style.color = "var(--teal)";
                }}
                onMouseLeave={(e) => {
                  if (openIndex !== i) (e.currentTarget as HTMLElement).style.color = "var(--navy)";
                }}
              >
                {faq.q}
                <div
                  className="flex items-center justify-center flex-shrink-0"
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: "50%",
                    background: openIndex === i ? "var(--teal)" : "var(--teal-pale)",
                    color: openIndex === i ? "white" : "var(--teal)",
                    transform: openIndex === i ? "rotate(180deg)" : "none",
                    transition: "transform 0.3s, background 0.22s",
                  }}
                >
                  <ChevronDown size={13} />
                </div>
              </button>

              <div
                style={{
                  maxHeight: openIndex === i ? 200 : 0,
                  overflow: "hidden",
                  transition: "max-height 0.38s cubic-bezier(0.4,0,0.2,1)",
                }}
              >
                <div
                  style={{
                    paddingBottom: 20,
                    fontSize: 15,
                    color: "var(--text-mid)",
                    lineHeight: 1.72,
                  }}
                >
                  {faq.a}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
