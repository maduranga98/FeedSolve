"use client";

import { useEffect, useRef } from "react";
import {
  BarChart2,
  XCircle,
  CheckCircle2,
  MessageSquare,
  HelpCircle,
  Clock,
  EyeOff,
  ClipboardList,
  UserCheck,
  RefreshCw,
  Eye,
} from "lucide-react";

export function BeforeAfter() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          const before = el.querySelector(".ba-before") as HTMLElement;
          const after = el.querySelector(".ba-after") as HTMLElement;
          if (before) { before.style.opacity = "1"; before.style.transform = "translateX(0)"; }
          setTimeout(() => {
            if (after) { after.style.opacity = "1"; after.style.transform = "translateX(0)"; }
          }, 120);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section id="before-after" style={{ background: "white", padding: "96px 32px" }}>
      <div ref={ref} style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div className="section-label">
          <BarChart2 size={13} /> Results
        </div>
        <h2>From chaos to clarity</h2>

        <div
          className="ba-grid"
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginTop: 48 }}
        >
          {/* Before */}
          <div
            className="ba-before"
            style={{
              background: "#FFF5F5",
              border: "1.5px solid #FECACA",
              borderRadius: 20,
              padding: 36,
              opacity: 0,
              transform: "translateX(-28px)",
              transition: "opacity 0.6s ease, transform 0.6s ease",
            }}
          >
            <div
              className="flex items-center gap-2 font-extrabold uppercase mb-6"
              style={{ fontSize: 12, letterSpacing: "0.07em", color: "#DC2626" }}
            >
              <XCircle size={15} /> Before FeedSolve
            </div>
            {[
              { Icon: MessageSquare, text: "Feedback scattered everywhere" },
              { Icon: HelpCircle, text: "No accountability" },
              { Icon: Clock, text: "Issues forgotten" },
              { Icon: EyeOff, text: "No visibility for anyone" },
            ].map((item) => (
              <div key={item.text} className="flex items-start gap-3 mb-3" style={{ fontSize: 15, color: "#7F1D1D" }}>
                <item.Icon size={16} className="flex-shrink-0 mt-0.5" style={{ color: "#DC2626" }} />
                {item.text}
              </div>
            ))}
          </div>

          {/* After */}
          <div
            className="ba-after"
            style={{
              background: "#F0FDF4",
              border: "1.5px solid #BBF7D0",
              borderRadius: 20,
              padding: 36,
              opacity: 0,
              transform: "translateX(28px)",
              transition: "opacity 0.6s ease, transform 0.6s ease",
            }}
          >
            <div
              className="flex items-center gap-2 font-extrabold uppercase mb-6"
              style={{ fontSize: 12, letterSpacing: "0.07em", color: "#16A34A" }}
            >
              <CheckCircle2 size={15} /> After FeedSolve
            </div>
            {[
              { Icon: ClipboardList, text: "Every issue tracked in one place" },
              { Icon: UserCheck, text: "Clear ownership on every issue" },
              { Icon: RefreshCw, text: "Structured resolution flow" },
              { Icon: Eye, text: "Full transparency end-to-end" },
            ].map((item) => (
              <div key={item.text} className="flex items-start gap-3 mb-3" style={{ fontSize: 15, color: "#14532D" }}>
                <item.Icon size={16} className="flex-shrink-0 mt-0.5" style={{ color: "#16A34A" }} />
                {item.text}
              </div>
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        @media (max-width: 600px) {
          .ba-grid { grid-template-columns: 1fr !important; }
          .ba-before, .ba-after { opacity: 1 !important; transform: none !important; }
        }
      `}</style>
    </section>
  );
}
