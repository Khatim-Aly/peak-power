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
    <div className="min-h-screen relative">
      {/* 3D jar background - fixed behind content below hero */}
      <Suspense fallback={null}>
        <JarScene />
      </Suspense>

      {/* Hero keeps its own background */}
      <Navigation />
      <Hero />

      {/* Content sections with semi-transparent backgrounds so 3D shows through */}
      <div className="relative z-10 [&>section]:bg-background/80 [&>section]:backdrop-blur-sm">
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
