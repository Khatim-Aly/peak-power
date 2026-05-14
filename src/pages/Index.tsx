import Navigation from "@/components/Navigation";
import Hero from "@/components/Hero";
import Benefits from "@/components/Benefits";
import ProductCard from "@/components/ProductCard";
import TrustBadges from "@/components/TrustBadges";
import Testimonials from "@/components/Testimonials";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";
import AnimatedBackground from "@/components/AnimatedBackground";
import HomeRails from "@/components/home/HomeRails";
import CmsBannerStrip from "@/components/home/CmsBannerStrip";
import AiRecommendations from "@/components/ai/AiRecommendations";

const Index = () => {
  return (
    <div className="min-h-screen relative">
      <AnimatedBackground />

      <Navigation />
      <Hero />

      <div className="relative z-10 [&>section]:bg-background/80 [&>section]:backdrop-blur-sm">
        <HomeRails />
        <AiRecommendations title="AI Picks for You" />
        <CmsBannerStrip position="strip" />
        <Benefits />
        <ProductCard />
        <TrustBadges />
        <Testimonials />
        <CTASection />
        <Footer />
      </div>
    </div>
  );
};

export default Index;
