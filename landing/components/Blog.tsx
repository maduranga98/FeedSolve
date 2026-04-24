"use client";

import { BookOpen, ArrowRight, Star, MessageCircle, Mail, Hash, BellRing } from "lucide-react";

const smallPosts = [
  {
    accent: "var(--teal)",
    catBg: "var(--teal-pale)",
    catColor: "var(--teal)",
    category: "Operations",
    title: "How to build a zero-leakage complaint resolution process",
    excerpt: "A step-by-step guide to making sure every complaint is logged, assigned, and closed.",
    authorBg: "var(--navy)",
    authorInitials: "SR",
    author: "Shreya Rao",
    readTime: "4 min",
  },
  {
    accent: "#6366F1",
    catBg: "#EEF2FF",
    catColor: "#3730A3",
    category: "QR Codes",
    title: "5 places to put your feedback QR code that actually get scanned",
    excerpt: "Placement strategies that drive real, actionable feedback from your customers.",
    authorBg: "var(--teal)",
    authorInitials: "MJ",
    author: "Mehul Joshi",
    readTime: "3 min",
  },
  {
    accent: "#16A34A",
    catBg: "#F0FDF4",
    catColor: "#16A34A",
    category: "Case Study",
    title: "How Zest Foods reduced customer complaints by 68% in 90 days",
    excerpt: "A real story from food manufacturing to quality control transformation.",
    authorBg: "#16A34A",
    authorInitials: "TR",
    author: "Team FeedSolve",
    readTime: "6 min",
  },
];

export function Blog() {
  return (
    <section id="blog" style={{ background: "white", padding: "96px 32px" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        {/* Header */}
        <div
          className="flex items-end justify-between flex-wrap gap-4 mb-14"
        >
          <div>
            <div className="section-label">
              <BookOpen size={13} /> From the Blog
            </div>
            <h2 style={{ margin: 0 }}>
              Insights on feedback<br />and operations
            </h2>
          </div>
          <a href="#" className="btn-outline flex-shrink-0">
            View all posts <ArrowRight size={15} />
          </a>
        </div>

        {/* Featured post */}
        <a
          href="#"
          className="block no-underline mb-7"
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 420px",
            background: "var(--navy)",
            borderRadius: 24,
            overflow: "hidden",
            transition: "transform 0.22s, box-shadow 0.22s",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.transform = "translateY(-4px)";
            (e.currentTarget as HTMLElement).style.boxShadow = "0 24px 64px rgba(30,53,87,0.22)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.transform = "";
            (e.currentTarget as HTMLElement).style.boxShadow = "";
          }}
        >
          {/* Left content */}
          <div
            className="flex flex-col justify-between gap-7"
            style={{ padding: "48px 52px" }}
          >
            <div>
              <div
                className="inline-flex items-center gap-1.5 mb-6"
                style={{
                  background: "rgba(58,143,165,0.2)",
                  color: "var(--teal-light)",
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  padding: "5px 13px",
                  borderRadius: "100px",
                }}
              >
                <Star size={11} /> Featured
              </div>
              <h3
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: 28,
                  fontWeight: 800,
                  color: "white",
                  lineHeight: 1.15,
                  letterSpacing: "-0.03em",
                  marginBottom: 16,
                }}
              >
                Why WhatsApp is killing your<br />customer feedback loop
              </h3>
              <p style={{ color: "rgba(255,255,255,0.58)", fontSize: 16, lineHeight: 1.7, maxWidth: 480, margin: 0 }}>
                Most businesses run their entire complaints process through a WhatsApp group. Here is why that breaks down at scale and what to do instead.
              </p>
            </div>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-2.5">
                <div
                  className="flex items-center justify-center flex-shrink-0"
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    background: "var(--teal)",
                    color: "white",
                    fontSize: 13,
                    fontWeight: 700,
                  }}
                >
                  AK
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "white" }}>Aryan Kumar</div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>Apr 18, 2026 · 5 min read</div>
                </div>
              </div>
              <span
                className="inline-flex items-center gap-1.5"
                style={{
                  background: "var(--teal)",
                  color: "white",
                  fontSize: 14,
                  fontWeight: 600,
                  padding: "10px 20px",
                  borderRadius: 8,
                }}
              >
                Read post <ArrowRight size={14} />
              </span>
            </div>
          </div>

          {/* Right visual panel */}
          <div
            className="flex flex-col justify-center gap-3"
            style={{
              background: "rgba(0,0,0,0.2)",
              padding: 36,
              borderLeft: "1px solid rgba(255,255,255,0.07)",
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.09em", marginBottom: 4 }}>
              The difference
            </div>

            {/* Without */}
            <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: 12, padding: "16px 18px" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 10 }}>
                Without FeedSolve
              </div>
              <div className="flex items-center gap-2 mb-1.5">
                <div style={{ width: 28, height: 28, borderRadius: 7, background: "#25D366", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <MessageCircle size={13} style={{ color: "white" }} />
                </div>
                <div style={{ fontSize: 13, color: "rgba(255,255,255,0.55)" }}>3 complaints via WhatsApp</div>
                <div style={{ marginLeft: "auto", fontSize: 10, background: "rgba(220,38,38,0.25)", color: "#FCA5A5", padding: "3px 8px", borderRadius: 5, fontWeight: 700, whiteSpace: "nowrap" }}>Lost</div>
              </div>
              <div className="flex items-center gap-2">
                <div style={{ width: 28, height: 28, borderRadius: 7, background: "#6366F1", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Mail size={13} style={{ color: "white" }} />
                </div>
                <div style={{ fontSize: 13, color: "rgba(255,255,255,0.55)" }}>2 complaints via email</div>
                <div style={{ marginLeft: "auto", fontSize: 10, background: "rgba(220,38,38,0.25)", color: "#FCA5A5", padding: "3px 8px", borderRadius: 5, fontWeight: 700, whiteSpace: "nowrap" }}>Buried</div>
              </div>
            </div>

            {/* With */}
            <div style={{ background: "rgba(58,143,165,0.12)", borderRadius: 12, padding: "16px 18px", border: "1px solid rgba(58,143,165,0.25)" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--teal-light)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 10 }}>
                With FeedSolve
              </div>
              <div className="flex items-center gap-2 mb-1.5">
                <div style={{ width: 28, height: 28, borderRadius: 7, background: "var(--teal)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Hash size={13} style={{ color: "white" }} />
                </div>
                <div style={{ fontSize: 13, color: "rgba(255,255,255,0.7)" }}>5 complaints, all tracked</div>
                <div style={{ marginLeft: "auto", fontSize: 10, background: "rgba(34,197,94,0.2)", color: "#86EFAC", padding: "3px 8px", borderRadius: 5, fontWeight: 700, whiteSpace: "nowrap" }}>Resolved</div>
              </div>
              <div className="flex items-center gap-2">
                <div style={{ width: 28, height: 28, borderRadius: 7, background: "rgba(58,143,165,0.4)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <BellRing size={13} style={{ color: "white" }} />
                </div>
                <div style={{ fontSize: 13, color: "rgba(255,255,255,0.7)" }}>Customers notified</div>
                <div style={{ marginLeft: "auto", fontSize: 10, background: "rgba(34,197,94,0.2)", color: "#86EFAC", padding: "3px 8px", borderRadius: 5, fontWeight: 700, whiteSpace: "nowrap" }}>Done</div>
              </div>
            </div>
          </div>
        </a>

        {/* 3 smaller cards */}
        <div
          className="blog-cards"
          style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20 }}
        >
          {smallPosts.map((post) => (
            <a
              key={post.title}
              href="#"
              className="no-underline flex flex-col"
              style={{
                background: "var(--bg)",
                border: "1px solid var(--border)",
                borderRadius: 20,
                overflow: "hidden",
                transition: "transform 0.22s, box-shadow 0.22s, border-color 0.22s",
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.transform = "translateY(-5px)";
                el.style.boxShadow = "0 16px 48px rgba(30,53,87,0.13)";
                el.style.borderColor = "var(--teal)";
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.transform = "";
                el.style.boxShadow = "";
                el.style.borderColor = "var(--border)";
              }}
            >
              <div style={{ height: 6, background: post.accent }} />
              <div className="flex flex-col gap-3 flex-1 p-6">
                <div
                  className="inline-flex items-center self-start"
                  style={{
                    background: post.catBg,
                    color: post.catColor,
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    padding: "4px 10px",
                    borderRadius: "100px",
                  }}
                >
                  {post.category}
                </div>
                <h3
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: 17,
                    fontWeight: 700,
                    color: "var(--navy)",
                    lineHeight: 1.3,
                    letterSpacing: "-0.02em",
                  }}
                >
                  {post.title}
                </h3>
                <p className="flex-1" style={{ fontSize: 14, color: "var(--text-mid)", lineHeight: 1.65, margin: 0 }}>
                  {post.excerpt}
                </p>
                <div
                  className="flex items-center gap-2"
                  style={{ paddingTop: 12, borderTop: "1px solid var(--border)" }}
                >
                  <div
                    className="flex items-center justify-center flex-shrink-0"
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: "50%",
                      background: post.authorBg,
                      color: "white",
                      fontSize: 10,
                      fontWeight: 700,
                    }}
                  >
                    {post.authorInitials}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-light)" }}>
                    {post.author} · {post.readTime}
                  </div>
                  <span
                    className="ml-auto flex items-center gap-1"
                    style={{ fontSize: 13, fontWeight: 600, color: "var(--teal)" }}
                  >
                    Read <ArrowRight size={13} />
                  </span>
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>

      <style jsx>{`
        @media (max-width: 960px) {
          .blog-cards { grid-template-columns: 1fr 1fr !important; }
        }
        @media (max-width: 600px) {
          .blog-cards { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 768px) {
          a[style*="grid-template-columns: 1fr 420px"] {
            grid-template-columns: 1fr !important;
          }
          a[style*="grid-template-columns: 1fr 420px"] > div:last-child {
            display: none;
          }
        }
      `}</style>
    </section>
  );
}
