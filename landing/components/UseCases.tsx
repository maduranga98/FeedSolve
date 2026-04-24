"use client";

import { useEffect, useRef } from "react";
import { Target, Factory, Utensils, Truck, Building2 } from "lucide-react";

const cases = [
  {
    Icon: Factory,
    title: "Manufacturing",
    desc: "Track supplier quality issues, defects, and production problems in one place. Full audit trail included.",
  },
  {
    Icon: Utensils,
    title: "Restaurants & Hotels",
    desc: "Collect table feedback with QR codes and respond to customers quickly. Turn complaints into loyalty.",
  },
  {
    Icon: Truck,
    title: "Logistics",
    desc: "Manage delivery complaints, delays, and driver issues with full visibility across every route.",
  },
  {
    Icon: Building2,
    title: "Real Estate",
    desc: "Handle tenant maintenance requests and track resolution progress. No more lost work orders.",
  },
];

export function UseCases() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.querySelectorAll(".uc-card").forEach((card, i) => {
            setTimeout(() => {
              (card as HTMLElement).style.opacity = "1";
              (card as HTMLElement).style.transform = "translateY(0)";
            }, i * 100);
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
    <section id="usecases" style={{ background: "var(--bg)", padding: "96px 32px" }}>
      <div ref={ref} style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div className="section-label">
          <Target size={13} /> Use cases
        </div>
        <h2>
          Built for real-world<br />operations
        </h2>

        <div
          className="uc-grid"
          style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 20, marginTop: 48 }}
        >
          {cases.map((c) => (
            <div
              key={c.title}
              className="uc-card"
              style={{
                background: "white",
                borderRadius: 20,
                border: "1px solid var(--border)",
                padding: 32,
                opacity: 0,
                transform: "translateY(32px)",
                transition: "opacity 0.55s ease, transform 0.55s cubic-bezier(0.22,1,0.36,1), border-color 0.22s, box-shadow 0.22s",
                cursor: "default",
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.transform = "translateY(-5px)";
                el.style.boxShadow = "var(--shadow-lg)";
                el.style.borderColor = "var(--teal)";
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.transform = "translateY(0)";
                el.style.boxShadow = "none";
                el.style.borderColor = "var(--border)";
              }}
            >
              <div
                className="flex items-center justify-center"
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 12,
                  background: "var(--teal-pale)",
                  color: "var(--teal)",
                  marginBottom: 18,
                }}
              >
                <c.Icon size={24} />
              </div>
              <h3 style={{ color: "var(--navy)", marginBottom: 10 }}>{c.title}</h3>
              <p style={{ color: "var(--text-mid)", fontSize: 15, lineHeight: 1.65, margin: 0 }}>{c.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        @media (max-width: 600px) {
          .uc-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  );
}
