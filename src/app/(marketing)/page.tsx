import { Features } from "@/components/landing/Features";
import { Hero } from "@/components/landing/Hero";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { LiveDemo } from "@/components/landing/LiveDemo";
import { Pricing } from "@/components/landing/Pricing";
import { Problem } from "@/components/landing/Problem";
import { ReceiptToPhone } from "@/components/landing/ReceiptToPhone";

export default function LandingPage() {
  return (
    <>
      <Hero />
      <ReceiptToPhone />
      <Problem />
      <HowItWorks />
      <LiveDemo />
      <Features />
      <Pricing />
    </>
  );
}
