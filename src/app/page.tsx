import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import FloatingCTA from "@/components/layout/FloatingCTA";
import HeroSection from "@/components/sections/HeroSection";
import GoldPriceSection from "@/components/sections/GoldPriceSection";
import PromoSection from "@/components/sections/PromoSection";
import SimulationSection from "@/components/sections/SimulationSection";
import TestimonialsSection from "@/components/sections/TestimonialsSection";
import FAQSection from "@/components/sections/FAQSection";
import ContactSection from "@/components/sections/ContactSection";

export default function HomePage() {
  return (
    <main className="bg-[#0a0a0a] text-white">
      <Navbar />
      <HeroSection />
      <GoldPriceSection />
      <PromoSection />
      <SimulationSection />
      <TestimonialsSection />
      <FAQSection />
      <ContactSection />
      <Footer />
      <FloatingCTA />
    </main>
  );
}
