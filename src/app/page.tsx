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
    <main style={{ background:"radial-gradient(ellipse 130% 85% at 50% 15%, #FFFFFF 0%, #FFFDE7 45%, #FFF8C4 80%, #F5E598 100%)", backgroundAttachment:"fixed", color:"#2D1B00", minHeight:"100vh" }}>
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
