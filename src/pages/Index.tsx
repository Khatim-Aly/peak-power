import Navigation from "@/components/Navigation";
import Hero from "@/components/Hero";
import Benefits from "@/components/Benefits";
import ProductCard from "@/components/ProductCard";
import TrustBadges from "@/components/TrustBadges";
import Testimonials from "@/components/Testimonials";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";
import { lazy, Suspense } from "react";

const JarScene = lazy(() => import("@/components/JarScene"));

const Index = () => {
  return (
    <div className="min-h-screen">
      <Navigation />
      <Hero />
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="w-16 h-16 rounded-full border-2 border-gold border-t-transparent animate-spin" />
        </div>
      }>
        <JarScene />
      </Suspense>
      <Benefits />
      <ProductCard />
      <TrustBadges />
      <Testimonials />
      <CTASection />
      <Footer />
    </div>
  );
};

export default Index;
