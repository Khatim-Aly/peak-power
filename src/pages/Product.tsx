import Navigation from "@/components/Navigation";
import ProductCard from "@/components/ProductCard";
import Benefits from "@/components/Benefits";
import TrustBadges from "@/components/TrustBadges";
import Testimonials from "@/components/Testimonials";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";

const Product = () => {
  return (
    <div className="min-h-screen pt-20">
      <Navigation />
      <ProductCard />
      <Benefits />
      <TrustBadges />
      <Testimonials />
      <CTASection />
      <Footer />
    </div>
  );
};

export default Product;
