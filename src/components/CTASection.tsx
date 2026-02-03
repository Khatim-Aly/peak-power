import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "./ui/button";

const CTASection = () => {
  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-secondary via-secondary to-earth" />
      
      {/* Animated Orbs */}
      <motion.div
        className="absolute top-1/2 left-1/4 -translate-y-1/2 w-96 h-96 rounded-full bg-gradient-radial-gold opacity-20 blur-3xl"
        animate={{
          scale: [1, 1.2, 1],
          x: [-20, 20, -20],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="absolute bottom-0 right-1/4 w-72 h-72 rounded-full bg-gradient-radial-gold opacity-15 blur-3xl"
        animate={{
          scale: [1.2, 1, 1.2],
          x: [20, -20, 20],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      <div className="container mx-auto px-4 lg:px-8 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gold/10 border border-gold/20 mb-8"
            >
              <span className="w-2 h-2 rounded-full bg-gold animate-pulse" />
              <span className="text-sm font-medium text-gold">Limited Time Offer</span>
            </motion.div>

            {/* Headline */}
            <h2 className="text-3xl md:text-4xl lg:text-6xl font-serif font-bold text-secondary-foreground mb-6 leading-tight">
              Start Your Wellness Journey{" "}
              <span className="text-gradient-gold">Today</span>
            </h2>

            <p className="text-xl text-secondary-foreground/70 mb-10 max-w-2xl mx-auto">
              Experience the transformative power of Pure Himalayan Shilajit. 
              Join thousands of satisfied customers and unlock your natural potential.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="hero" size="xl" asChild>
                <Link to="/product" className="group">
                  Shop Now — Save 30%
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </div>

            {/* Trust Indicators */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              className="mt-10 flex flex-wrap justify-center gap-6 text-secondary-foreground/60 text-sm"
            >
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-gold" />
                Free Shipping
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-gold" />
                30-Day Money Back
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-gold" />
                Secure Checkout
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
