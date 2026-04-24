import { ArrowRight, Lock } from "lucide-react";

export function FinalCTA() {
  return (
    <section
      id="cta-final"
      className="text-center relative overflow-hidden"
      style={{
        background: "linear-gradient(140deg, #152843 0%, #1E3557 55%, #1a4a6b 100%)",
        padding: "104px 32px",
      }}
    >
      {/* Glow */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: -100,
          left: "50%",
          transform: "translateX(-50%)",
          width: 700,
          height: 500,
          background: "radial-gradient(ellipse, rgba(58,143,165,0.2) 0%, transparent 65%)",
        }}
      />

      <div className="relative z-10" style={{ maxWidth: 1200, margin: "0 auto" }}>
        <h2
          style={{
            color: "white",
            fontSize: "clamp(34px, 4.5vw, 58px)",
            marginBottom: 18,
          }}
        >
          Your first resolved issue<br />is 2 minutes away.
        </h2>
        <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 20, marginBottom: 40 }}>
          Start collecting and resolving feedback today.
        </p>

        <div className="flex justify-center flex-wrap gap-4">
          <a
            href="#"
            className="btn-primary teal"
            style={{ fontSize: 17, padding: "15px 36px" }}
          >
            Try Now — It&apos;s Free <ArrowRight size={17} />
          </a>
        </div>

        <div
          className="flex items-center justify-center gap-1.5 mt-5"
          style={{ fontSize: 13, color: "rgba(255,255,255,0.35)" }}
        >
          <Lock size={13} />
          No credit card required
        </div>
      </div>
    </section>
  );
}
