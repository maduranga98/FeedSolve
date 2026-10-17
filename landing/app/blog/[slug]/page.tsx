import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Navbar } from "../../../components/Navbar";
import { Footer } from "../../../components/Footer";
import { blogPosts, getBlogPost, type BlogSection } from "../../../lib/blog-posts";

export const dynamicParams = false;

export function generateStaticParams() {
  return blogPosts.map((post) => ({ slug: post.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const post = getBlogPost(params.slug);
  if (!post) return {};

  return {
    title: `${post.title} — FeedSolve`,
    description: post.metaDescription,
    keywords: post.keywords,
    openGraph: {
      title: post.title,
      description: post.metaDescription,
      type: "article",
      publishedTime: post.publishedAt,
    },
    alternates: {
      canonical: `/blog/${post.slug}`,
    },
  };
}

function Section({ section }: { section: BlogSection }) {
  switch (section.type) {
    case "paragraph":
      return (
        <p style={{ fontSize: 17, lineHeight: 1.75, color: "var(--text-mid)", marginBottom: 24 }}>
          {section.text}
        </p>
      );
    case "heading":
      return (
        <h2
          style={{
            fontSize: 26,
            marginTop: 40,
            marginBottom: 16,
            color: "var(--navy)",
          }}
        >
          {section.text}
        </h2>
      );
    case "list": {
      const Tag = section.ordered ? "ol" : "ul";
      return (
        <Tag style={{ marginBottom: 24, paddingLeft: 24, display: "flex", flexDirection: "column", gap: 10 }}>
          {section.items.map((item, i) => (
            <li key={i} style={{ fontSize: 16, lineHeight: 1.7, color: "var(--text-mid)" }}>
              {item}
            </li>
          ))}
        </Tag>
      );
    }
    case "table":
      return (
        <div style={{ overflowX: "auto", marginBottom: 32, borderRadius: 12, border: "1px solid var(--border)" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead>
              <tr style={{ background: "var(--teal-pale)" }}>
                {section.headers.map((h, i) => (
                  <th
                    key={i}
                    style={{
                      textAlign: "left",
                      padding: "12px 16px",
                      fontWeight: 700,
                      color: "var(--navy)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {section.rows.map((row, i) => (
                <tr key={i} style={{ borderTop: "1px solid var(--border)" }}>
                  {row.map((cell, j) => (
                    <td
                      key={j}
                      style={{
                        padding: "12px 16px",
                        color: j === 0 ? "var(--navy)" : "var(--text-mid)",
                        fontWeight: j === 0 ? 600 : 400,
                        lineHeight: 1.5,
                      }}
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
  }
}

export default function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = getBlogPost(params.slug);
  if (!post) notFound();

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.metaDescription,
    datePublished: post.publishedAt,
    author: { "@type": "Organization", name: "FeedSolve" },
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: post.faq.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };

  return (
    <>
      {/* eslint-disable-next-line @next/next/no-script-component-in-head */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <Navbar />
      <main style={{ paddingTop: 64, background: "var(--bg)" }}>
        <article style={{ padding: "64px 32px 96px" }}>
          <div style={{ maxWidth: 760, margin: "0 auto" }}>
            <Link
              href="/blog"
              className="no-underline inline-flex items-center gap-1.5"
              style={{ fontSize: 14, fontWeight: 600, color: "var(--teal)", marginBottom: 32 }}
            >
              <ArrowLeft size={14} /> Back to blog
            </Link>

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
                marginBottom: 20,
              }}
            >
              {post.category}
            </div>

            <h1 style={{ fontSize: "clamp(32px, 4.5vw, 46px)", marginBottom: 20 }}>{post.title}</h1>

            <div className="flex items-center gap-2.5" style={{ marginBottom: 40 }}>
              <div
                className="flex items-center justify-center flex-shrink-0"
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  background: post.authorBg,
                  color: "white",
                  fontSize: 13,
                  fontWeight: 700,
                }}
              >
                {post.authorInitials}
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "var(--navy)" }}>{post.author}</div>
                <div style={{ fontSize: 12, color: "var(--text-light)" }}>
                  {new Date(post.publishedAt).toLocaleDateString("en-GB", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}{" "}
                  · {post.readTime} read
                </div>
              </div>
            </div>

            <p
              style={{
                fontSize: 19,
                lineHeight: 1.7,
                color: "var(--navy)",
                fontWeight: 600,
                marginBottom: 32,
              }}
            >
              {post.lead}
            </p>

            {post.sections.map((section, i) => (
              <Section key={i} section={section} />
            ))}

            {post.faq.length > 0 && (
              <>
                <h2 style={{ fontSize: 26, marginTop: 40, marginBottom: 20, color: "var(--navy)" }}>FAQ</h2>
                <div style={{ display: "flex", flexDirection: "column", gap: 20, marginBottom: 40 }}>
                  {post.faq.map((item, i) => (
                    <div
                      key={i}
                      style={{
                        background: "white",
                        border: "1px solid var(--border)",
                        borderRadius: 14,
                        padding: "20px 24px",
                      }}
                    >
                      <div style={{ fontWeight: 700, color: "var(--navy)", marginBottom: 8, fontSize: 16 }}>
                        {item.question}
                      </div>
                      <div style={{ fontSize: 15, lineHeight: 1.65, color: "var(--text-mid)" }}>
                        {item.answer}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            <div
              style={{
                background: "var(--navy)",
                borderRadius: 20,
                padding: "32px 36px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: 16,
              }}
            >
              <div style={{ color: "white", fontSize: 17, fontWeight: 600, maxWidth: 420 }}>
                Ready to stop losing complaints in an inbox?
              </div>
              <a
                href="/"
                className="btn-primary teal no-underline"
                style={{ fontSize: 15, padding: "12px 24px", flexShrink: 0 }}
              >
                Start your free trial <ArrowRight size={15} />
              </a>
            </div>
          </div>
        </article>
      </main>
      <Footer />
    </>
  );
}
