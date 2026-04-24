import type { Metadata } from "next";
import { Bricolage_Grotesque, DM_Sans } from "next/font/google";
import "./globals.css";

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-display",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "FeedSolve — Stop losing complaints. Start closing them.",
  description:
    "Collect feedback from customers, suppliers, and partners. Track every issue to resolution with a simple link and QR code.",
  keywords: ["feedback", "complaint management", "issue tracking", "customer feedback", "QR code feedback"],
  openGraph: {
    title: "FeedSolve — Stop losing complaints. Start closing them.",
    description:
      "Collect, track, assign and resolve every piece of feedback — in one place.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${bricolage.variable} ${dmSans.variable}`}>
      <body>{children}</body>
    </html>
  );
}
