"use client";

import Image from "next/image";

const links = [
  { label: "Product", href: "#solution" },
  { label: "Pricing", href: "#pricing" },
  { label: "Contact", href: "#" },
  { label: "Privacy Policy", href: "#" },
  { label: "Terms", href: "#" },
];

export function Footer() {
  return (
    <footer style={{ background: "var(--navy-deep)", padding: "48px 32px" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div
          className="footer-inner flex justify-between items-center flex-wrap gap-6"
          style={{
            paddingBottom: 28,
            borderBottom: "1px solid rgba(255,255,255,0.07)",
            marginBottom: 20,
          }}
        >
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <Image
              src="/logo.png"
              alt="FeedSolve"
              width={28}
              height={28}
              style={{ filter: "brightness(10)", objectFit: "contain" }}
            />
            <span
              style={{
                fontFamily: "var(--font-display)",
                fontSize: 18,
                fontWeight: 700,
                color: "white",
              }}
            >
              FeedSolve
            </span>
          </div>

          {/* Links */}
          <div className="footer-links flex flex-wrap gap-7">
            {links.map((l) => (
              <a
                key={l.label}
                href={l.href}
                className="no-underline transition-colors"
                style={{ color: "rgba(255,255,255,0.45)", fontSize: 14 }}
                onMouseEnter={(e) => ((e.target as HTMLAnchorElement).style.color = "white")}
                onMouseLeave={(e) => ((e.target as HTMLAnchorElement).style.color = "rgba(255,255,255,0.45)")}
              >
                {l.label}
              </a>
            ))}
          </div>
        </div>

        <div style={{ fontSize: 13, color: "rgba(255,255,255,0.25)" }}>
          © 2026 FeedSolve. All rights reserved. &nbsp;·&nbsp;{" "}
          <strong style={{ color: "rgba(255,255,255,0.45)", fontWeight: 600 }}>
            A product of Lumora Ventures Pvt. Ltd.
          </strong>
        </div>
      </div>

      <style jsx>{`
        @media (max-width: 600px) {
          .footer-inner { flex-direction: column; align-items: flex-start; }
          .footer-links { gap: 16px; }
        }
      `}</style>
    </footer>
  );
}
