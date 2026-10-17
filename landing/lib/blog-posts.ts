export type BlogSection =
  | { type: "paragraph"; text: string }
  | { type: "heading"; text: string }
  | { type: "list"; items: string[]; ordered?: boolean }
  | { type: "table"; headers: string[]; rows: string[][] };

export interface FaqItem {
  question: string;
  answer: string;
}

export interface BlogPost {
  slug: string;
  title: string;
  metaDescription: string;
  excerpt: string;
  category: string;
  accent: string;
  catBg: string;
  catColor: string;
  author: string;
  authorInitials: string;
  authorBg: string;
  readTime: string;
  publishedAt: string; // ISO date
  keywords: string[];
  lead: string;
  sections: BlogSection[];
  faq: FaqItem[];
}

export const blogPosts: BlogPost[] = [
  {
    slug: "feedsolve-vs-zendesk",
    title: "FeedSolve: The Lightweight Alternative to Zendesk for Complaint Management",
    metaDescription:
      "Comparing FeedSolve and Zendesk for customer complaint management — pricing, setup, and which one actually fits a small or mid-sized team.",
    excerpt:
      "A lighter, cheaper alternative to running complaint handling through a general-purpose helpdesk.",
    category: "Comparison",
    accent: "var(--teal)",
    catBg: "var(--teal-pale)",
    catColor: "var(--teal)",
    author: "Team FeedSolve",
    authorInitials: "FS",
    authorBg: "var(--navy)",
    readTime: "6 min",
    publishedAt: "2026-10-17",
    keywords: [
      "zendesk alternative",
      "complaint management software",
      "free complaint management software",
    ],
    lead:
      "FeedSolve is a dedicated complaint and feedback management platform built for small and mid-sized teams — a lighter, cheaper alternative to running complaint handling through a general-purpose helpdesk like Zendesk.",
    sections: [
      {
        type: "paragraph",
        text: "Zendesk is a genuinely good product, but it's built to be a full customer support suite — tickets, chat, phone, knowledge base, and dozens of integrations most small teams never touch. If what you actually need is a clean way to log a complaint, route it to the right person, track it to resolution, and report on recurring issues, you end up paying for (and configuring around) a lot of machinery you don't need. This is an honest comparison, not a hit piece — Zendesk is the right tool for plenty of teams. Here's how to tell which one you are.",
      },
      { type: "heading", text: "FeedSolve vs. Zendesk at a glance" },
      {
        type: "table",
        headers: ["", "FeedSolve", "Zendesk"],
        rows: [
          [
            "Starting price",
            "$19/mo (Starter: 3 boards, 1,500 submissions, 3 team members)",
            "$19/agent/mo (Support Team — ticketing only, billed yearly)",
          ],
          [
            "Mid tier",
            "$49/mo (Growth: 10 boards, 5,000 submissions, custom branding, advanced analytics)",
            "$55/agent/mo (Suite Team)",
          ],
          [
            "Pricing model",
            "Per feedback board, not per seat — team size doesn't drive cost",
            "Per agent/month — cost scales with team size",
          ],
          [
            "Built for",
            "Complaint & feedback intake, routing, and resolution specifically",
            "Full customer support suite: tickets, chat, phone, help centre",
          ],
          [
            "Setup",
            "Share a link or QR code; submitters don't need an account",
            "Requires configuring ticket forms, routing rules, and channels",
          ],
          [
            "Submission tracking",
            "Unique tracking code (#FSV) so the submitter can follow progress without logging in",
            "Ticket status visible via email/portal, tied to a support account",
          ],
          [
            "Best advanced features",
            "Escalation rules, recurring cycle resets, public resolution feed (Growth+)",
            "AI-assisted replies, omnichannel routing, extensive app marketplace (higher tiers)",
          ],
        ],
      },
      { type: "heading", text: "Where Zendesk still wins" },
      {
        type: "list",
        items: [
          "Multi-channel support. If you need live chat, phone, and email support unified in one inbox, Zendesk's omnichannel setup is more mature than a feedback-board model.",
          "Large support teams with complex routing. Zendesk's automation and app marketplace scale further for teams running dozens of agents across multiple departments.",
          "Existing integrations. If your stack already runs on Zendesk for general support, adding complaint tracking there avoids a second tool entirely — at the cost of per-agent pricing and extra configuration.",
        ],
      },
      { type: "heading", text: "Who should choose which" },
      {
        type: "paragraph",
        text: "Choose FeedSolve if you're a small or mid-sized team (retail, hospitality, property management, local services) that needs a focused way to collect complaints or feedback, route them to an owner, and show the submitter their issue is being tracked — without paying per agent or configuring a full helpdesk.",
      },
      {
        type: "paragraph",
        text: "Stick with Zendesk if complaint handling is one piece of a much larger support operation that also needs live chat, phone, and a public help centre, and you have the team size to justify per-agent pricing.",
      },
    ],
    faq: [
      {
        question: "Is FeedSolve a true alternative to Zendesk, or just for feedback forms?",
        answer:
          "FeedSolve is purpose-built for complaint and feedback intake and resolution — not a general ticketing replacement. If you only need complaint tracking, it covers that fully; for full omnichannel support, Zendesk remains the broader tool.",
      },
      {
        question: "Does FeedSolve charge per agent like Zendesk?",
        answer:
          "No. FeedSolve prices by feedback board, so adding team members doesn't increase your bill.",
      },
      {
        question: "Can customers submit complaints without creating an account?",
        answer:
          "Yes — submitters can use a shared link or QR code and track their complaint with a unique code, no login required.",
      },
      {
        question: "Is there a free way to try FeedSolve before switching from Zendesk?",
        answer:
          "FeedSolve offers a 7-day free trial to explore the core workflow before committing to a paid plan.",
      },
    ],
  },
  {
    slug: "complaint-management-software",
    title: "What Is Complaint Management Software? A Practical Guide for Small Teams",
    metaDescription:
      "What complaint management software actually does, the features that matter for a small team, and how to pick one without over-buying.",
    excerpt:
      "What it does, which features actually matter for a small team, and how to choose without over-buying.",
    category: "Operations",
    accent: "#6366F1",
    catBg: "#EEF2FF",
    catColor: "#3730A3",
    author: "Team FeedSolve",
    authorInitials: "FS",
    authorBg: "var(--teal)",
    readTime: "5 min",
    publishedAt: "2026-10-17",
    keywords: [
      "complaint management software",
      "what is complaint management",
      "how to manage complaints from customers",
      "best complaint management software",
    ],
    lead:
      "Complaint management software is a system for logging, routing, tracking, and resolving customer (or employee, or supplier) complaints — so nothing gets lost in an inbox, a WhatsApp group, or a sticky note.",
    sections: [
      {
        type: "paragraph",
        text: "Most small businesses don't start with a dedicated system. Complaints come in through email, a phone call, a WhatsApp message, or a comment card, and someone tries to remember to follow up. That works until volume grows past a handful a week — then things get missed, the same issue keeps recurring because nobody's tracking patterns, and customers notice when their complaint goes nowhere.",
      },
      { type: "heading", text: "What a complaint management system actually does" },
      {
        type: "list",
        items: [
          "Captures every complaint in one place, regardless of how it came in (link, QR code, email, form).",
          "Assigns each one to a specific owner with a deadline, so accountability is clear.",
          "Tracks status from open to resolved, and notifies the submitter automatically.",
          "Surfaces patterns — the same issue recurring across locations or time periods — that are invisible when complaints live in separate inboxes.",
          "Reports on resolution time and volume, which matters for both operations and, in regulated industries, compliance.",
        ],
      },
      { type: "heading", text: "How to manage complaints from customers without a full helpdesk" },
      {
        type: "list",
        ordered: true,
        items: [
          "Give customers one clear way to submit a complaint — a link or QR code works better than hoping they find the right email address.",
          "Log every submission automatically, with a timestamp and a unique reference so both sides can track it.",
          "Route it to a specific owner immediately, not a shared inbox where it can sit unclaimed.",
          "Set a resolution deadline and escalate automatically if it's missed.",
          "Close the loop — notify the customer when it's resolved, even if the answer isn't what they wanted.",
          "Review resolved complaints periodically for recurring patterns, not just one-off fixes.",
        ],
      },
      { type: "heading", text: "What to look for when choosing a tool" },
      {
        type: "paragraph",
        text: "For a small or mid-sized team, the features that matter most are: a submission method customers can actually use without an account, automatic routing and deadlines, status notifications, and reporting that shows recurring issues — not a sprawling feature set built for a 50-agent support floor. A tool priced per seat punishes you for adding team members; a tool priced by use case (boards, workspaces) scales with your actual workload instead.",
      },
      {
        type: "paragraph",
        text: "FeedSolve is built around exactly that shortlist: shareable links and QR codes for intake, automatic routing with escalation rules, a public resolution feed customers can check without logging in, and reporting that surfaces recurring complaints — without per-agent pricing.",
      },
    ],
    faq: [
      {
        question: "What is complaint management?",
        answer:
          "Complaint management is the process of logging, routing, tracking, and resolving complaints — from customers, employees, or suppliers — so none are lost and recurring issues get surfaced rather than repeated.",
      },
      {
        question: "What is a complaint management system?",
        answer:
          "A complaint management system is software that automates that process: capturing submissions, assigning owners, tracking status to resolution, and reporting on patterns across complaints.",
      },
      {
        question: "What's the best complaint management software for a small business?",
        answer:
          "It depends on volume and complexity, but for most small teams the best fit is a tool priced by usage rather than per seat, with simple, no-login submission for customers and built-in routing and reporting — which is the gap FeedSolve is built to fill.",
      },
      {
        question: "Do I need dedicated software, or can I just use email?",
        answer:
          "Email works at very low volume, but it has no built-in ownership, deadlines, or pattern reporting — so complaints are easy to lose and recurring issues are easy to miss. Once you're handling more than a handful a week, dedicated software pays for itself quickly.",
      },
    ],
  },
  {
    slug: "feedsolve-vs-freshdesk",
    title: "FeedSolve vs. Freshdesk: Which Fits a Complaint-Focused Team Better?",
    metaDescription:
      "FeedSolve vs. Freshdesk for complaint and feedback management — pricing, setup, and an honest look at which tool fits a smaller, complaint-focused team.",
    excerpt:
      "An honest comparison for teams that need focused complaint tracking, not a full support desk.",
    category: "Comparison",
    accent: "var(--teal)",
    catBg: "var(--teal-pale)",
    catColor: "var(--teal)",
    author: "Team FeedSolve",
    authorInitials: "FS",
    authorBg: "var(--navy)",
    readTime: "6 min",
    publishedAt: "2026-10-17",
    keywords: ["freshdesk alternative", "complaint management software"],
    lead:
      "Freshdesk is a well-built, affordable helpdesk — but like most helpdesks, it's designed around support tickets in general, not complaint tracking specifically. FeedSolve takes the opposite approach: built only for complaint and feedback workflows.",
    sections: [
      {
        type: "paragraph",
        text: "If your team's main job is handling customer complaints — not running a full multi-channel support desk — the question isn't which tool has more features. It's which one fits how complaints actually move through your business: in, assigned, tracked, closed, and reported on.",
      },
      { type: "heading", text: "FeedSolve vs. Freshdesk at a glance" },
      {
        type: "table",
        headers: ["", "FeedSolve", "Freshdesk"],
        rows: [
          [
            "Starting price",
            "$19/mo (Starter: 3 boards, 1,500 submissions, 3 team members)",
            "$19/agent/mo (Growth plan, billed yearly)",
          ],
          [
            "Mid tier",
            "$49/mo (Growth: 10 boards, 5,000 submissions, custom branding, advanced analytics)",
            "$55/agent/mo (Pro)",
          ],
          [
            "Pricing model",
            "Per feedback board — adding team members doesn't raise the bill",
            "Per agent/month — cost grows with headcount",
          ],
          [
            "Built for",
            "Complaint and feedback intake, routing, and resolution specifically",
            "General-purpose helpdesk ticketing across channels",
          ],
          [
            "Customer intake",
            "Shareable link or QR code, no account needed, unique tracking code per submission",
            "Email, web form, or portal ticket, typically tied to a support account",
          ],
          [
            "Reporting focus",
            "Recurring-issue analytics, resolution feed, escalation rules built around complaints",
            "Broader ticket analytics (SLA, CSAT, agent performance) across all support types",
          ],
        ],
      },
      { type: "heading", text: "Where Freshdesk still wins" },
      {
        type: "list",
        items: [
          "Multi-channel ticketing. Email, chat, phone, and social in one queue — useful if complaints are only one category of support you handle.",
          "Freddy AI add-ons. Freshdesk's AI copilot (an additional $29/agent/month) suits teams wanting AI-assisted ticket replies at scale.",
          "Broader ecosystem. More third-party integrations if your support stack is already built around a general helpdesk.",
        ],
      },
      { type: "heading", text: "Who should choose which" },
      {
        type: "paragraph",
        text: "Choose FeedSolve if complaint and feedback handling is a distinct, important workflow for your business — not buried inside general support tickets — and you want simple, no-login intake plus reporting built specifically to surface recurring issues.",
      },
      {
        type: "paragraph",
        text: "Choose Freshdesk if you need one tool to run all customer support — complaints included — across multiple channels, and per-agent pricing fits your team size.",
      },
    ],
    faq: [
      {
        question: "Can FeedSolve replace Freshdesk entirely?",
        answer:
          "Only if complaint and feedback handling is most of what you use Freshdesk for. FeedSolve doesn't cover live chat, phone support, or a general ticket inbox — it's focused specifically on complaint and feedback workflows.",
      },
      {
        question: "Is FeedSolve cheaper than Freshdesk?",
        answer:
          "For small teams, usually yes — FeedSolve's $19 Starter plan covers 3 team members at one flat price, while Freshdesk's $19 Growth plan is priced per agent, so the cost rises as you add people.",
      },
      {
        question: "Does FeedSolve offer AI features like Freshdesk's Freddy?",
        answer:
          "FeedSolve's focus is on routing, escalation, and recurring-issue analytics rather than AI-assisted replies. If an AI copilot for ticket responses is a priority, Freshdesk's add-on covers that.",
      },
    ],
  },
];

export function getBlogPost(slug: string): BlogPost | undefined {
  return blogPosts.find((post) => post.slug === slug);
}
