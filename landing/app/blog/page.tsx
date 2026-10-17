import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen } from "lucide-react";
import { Navbar } from "../../components/Navbar";
import { Footer } from "../../components/Footer";
import { blogPosts } from "../../lib/blog-posts";

export const metadata: Metadata = {
  title: "Blog — FeedSolve",
  description:
    "Guides and comparisons on complaint management, customer feedback, and replacing ad-hoc inboxes with a real system.",
};

export default function BlogIndexPage() {
  const posts = [...blogPosts].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );

  return (
    <>
      <Navbar />
      <main style={{ paddingTop: 64, background: "var(--bg)", minHeight: "100vh" }}>
        <section style={{ padding: "72px 32px 96px" }}>
          <div style={{ maxWidth: 1200, margin: "0 auto" }}>
            <div className="section-label" style={{ marginBottom: 12 }}>
              <BookOpen size={13} /> From the Blog
            </div>
            <h1 style={{ marginTop: 0, marginBottom: 48 }}>
              Insights on feedback
              <br />
              and operations
            </h1>

            <div
              className="blog-grid"
              style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}
            >
              {posts.map((post) => (
                <Link
                  key={post.slug}
                  href={`/blog/${post.slug}`}
                  className="no-underline flex flex-col"
                  style={{
                    background: "white",
                    border: "1px solid var(--border)",
                    borderRadius: 20,
                    overflow: "hidden",
                    transition: "transform 0.22s, box-shadow 0.22s, border-color 0.22s",
                  }}
                >
                  <div style={{ height: 6, background: post.accent }} />
                  <div className="flex flex-col gap-3 flex-1" style={{ padding: 24 }}>
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
                        fontSize: 18,
                        fontWeight: 700,
                        color: "var(--navy)",
                        lineHeight: 1.3,
                        letterSpacing: "-0.02em",
                        margin: 0,
                      }}
                    >
                      {post.title}
                    </h3>
                    <p
                      className="flex-1"
                      style={{ fontSize: 14, color: "var(--text-mid)", lineHeight: 1.65, margin: 0 }}
                    >
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
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />

      <style>{`
        @media (max-width: 960px) {
          .blog-grid { grid-template-columns: 1fr 1fr !important; }
        }
        @media (max-width: 600px) {
          .blog-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </>
  );
}
