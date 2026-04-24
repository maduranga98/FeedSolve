"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { ArrowRight } from "lucide-react";

const navLinks = [
  { label: "Product", href: "#solution" },
  { label: "Pricing", href: "#pricing" },
  { label: "Demo", href: "#demo" },
  { label: "Blog", href: "#blog" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 10);
      if (menuOpen) setMenuOpen(false);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [menuOpen]);

  return (
    <>
      <nav
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
        style={{
          background: scrolled
            ? "rgba(248,247,244,0.98)"
            : "rgba(248,247,244,0.95)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          borderBottom: scrolled ? "1px solid #E2E8ED" : "1px solid transparent",
          boxShadow: scrolled ? "0 2px 20px rgba(30,53,87,0.09)" : "none",
        }}
      >
        <div
          className="flex items-center justify-between mx-auto"
          style={{ maxWidth: 1200, padding: "0 32px", height: 64 }}
        >
          {/* Logo */}
          <a href="#hero" className="flex items-center gap-2 no-underline flex-shrink-0">
            <Image src="/logo.png" alt="FeedSolve" width={34} height={34} className="object-contain" />
            <span
              className="font-bold"
              style={{
                fontFamily: "var(--font-display)",
                fontSize: 20,
                color: "var(--navy)",
                letterSpacing: "-0.3px",
                whiteSpace: "nowrap",
              }}
            >
              FeedSolve
            </span>
          </a>

          {/* Desktop nav links */}
          <ul className="hidden md:flex items-center gap-8 list-none">
            {navLinks.map((l) => (
              <li key={l.label}>
                <a
                  href={l.href}
                  className="no-underline transition-colors"
                  style={{ fontSize: 15, fontWeight: 500, color: "var(--text-mid)" }}
                  onMouseEnter={(e) => ((e.target as HTMLAnchorElement).style.color = "var(--navy)")}
                  onMouseLeave={(e) => ((e.target as HTMLAnchorElement).style.color = "var(--text-mid)")}
                >
                  {l.label}
                </a>
              </li>
            ))}
          </ul>

          {/* Desktop actions */}
          <div className="hidden md:flex items-center gap-2 flex-shrink-0">
            <a href="#" className="btn-ghost">Login</a>
            <a href="#" className="btn-primary teal" style={{ fontSize: 15, padding: "10px 20px" }}>
              Try Now <ArrowRight size={15} />
            </a>
          </div>

          {/* Hamburger */}
          <button
            className="md:hidden flex flex-col gap-1.5 cursor-pointer p-2 border-none bg-transparent"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Menu"
          >
            <span
              className="block w-5.5 h-0.5 rounded-sm transition-all duration-250"
              style={{
                width: 22,
                height: 2,
                background: "var(--navy)",
                borderRadius: 2,
                transform: menuOpen ? "translateY(7px) rotate(45deg)" : "none",
              }}
            />
            <span
              className="block w-5.5 h-0.5 rounded-sm transition-all duration-250"
              style={{
                width: 22,
                height: 2,
                background: "var(--navy)",
                borderRadius: 2,
                opacity: menuOpen ? 0 : 1,
              }}
            />
            <span
              className="block w-5.5 h-0.5 rounded-sm transition-all duration-250"
              style={{
                width: 22,
                height: 2,
                background: "var(--navy)",
                borderRadius: 2,
                transform: menuOpen ? "translateY(-7px) rotate(-45deg)" : "none",
              }}
            />
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <div
          className="md:hidden fixed left-0 right-0 z-40 flex flex-col gap-1"
          style={{
            top: 64,
            background: "white",
            borderBottom: "1px solid var(--border)",
            boxShadow: "0 8px 32px rgba(30,53,87,0.1)",
            padding: "20px 24px",
          }}
        >
          {navLinks.map((l) => (
            <a
              key={l.label}
              href={l.href}
              onClick={() => setMenuOpen(false)}
              className="no-underline"
              style={{
                fontSize: 16,
                fontWeight: 500,
                color: "var(--text)",
                padding: "12px 8px",
                borderBottom: "1px solid var(--border)",
              }}
            >
              {l.label}
            </a>
          ))}
          <a
            href="#"
            onClick={() => setMenuOpen(false)}
            style={{
              fontSize: 16,
              fontWeight: 500,
              color: "var(--text)",
              padding: "12px 8px",
              borderBottom: "1px solid var(--border)",
              textDecoration: "none",
            }}
          >
            Login
          </a>
          <a
            href="#"
            onClick={() => setMenuOpen(false)}
            className="no-underline text-center font-semibold rounded-lg"
            style={{
              background: "var(--teal)",
              color: "white",
              padding: "14px",
              marginTop: 8,
              borderRadius: 8,
            }}
          >
            Try Now — It&apos;s Free
          </a>
        </div>
      )}
    </>
  );
}
