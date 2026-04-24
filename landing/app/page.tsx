import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { Steps } from "@/components/Steps";
import { Problem } from "@/components/Problem";
import { Solution } from "@/components/Solution";
import { Demo } from "@/components/Demo";
import { UseCases } from "@/components/UseCases";
import { Diff } from "@/components/Diff";
import { BeforeAfter } from "@/components/BeforeAfter";
import { Pricing } from "@/components/Pricing";
import { FAQ } from "@/components/FAQ";
import { Blog } from "@/components/Blog";
import { FinalCTA } from "@/components/FinalCTA";
import { Footer } from "@/components/Footer";

export default function LandingPage() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Steps />
        <Problem />
        <Solution />
        <Demo />
        <UseCases />
        <Diff />
        <BeforeAfter />
        <Pricing />
        <FAQ />
        <Blog />
        <FinalCTA />
      </main>
      <Footer />
    </>
  );
}
