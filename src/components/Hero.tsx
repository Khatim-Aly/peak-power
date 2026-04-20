import { motion } from "framer-motion";
import { ArrowRight, Star, Shield, Leaf } from "lucide-react";
import { Button } from "./ui/button";
import { Link } from "react-router-dom";
import heroProduct from "@/assets/hero-product.jpg";
import heroBg from "@/assets/hero-bg.jpg";

const Hero = () => {
  const trustBadges = [
    { icon: Shield, label: "Lab Tested" },
    { icon: Leaf, label: "100% Natural" },
    { icon: Star, label: "Premium Quality" },
  ];

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      <div className="absolute inset-0">
        <img src={heroBg} alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-background/70 dark:bg-background/80" />
        <div className="absolute inset-0 bg-gradient-to-br from-background/60 via-transparent to-muted/40" />
      </div>

      <motion.div
        className="hidden md:block absolute top-1/4 right-1/4 w-96 h-96 rounded-full bg-gradient-radial-gold opacity-50 blur-3xl"
        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="hidden md:block absolute bottom-1/4 left-1/4 w-72 h-72 rounded-full bg-gradient-radial-gold opacity-30 blur-3xl"
        animate={{ scale: [1.2, 1, 1.2], opacity: [0.2, 0.4, 0.2] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="container mx-auto px-4 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-center lg:text-left"
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gold/10 border border-gold/20 mb-6"
            >
              <span className="w-2 h-2 rounded-full bg-gold animate-pulse" />
              <span className="text-sm font-medium text-gold">Ancient Himalayan Secret</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-serif font-bold leading-tight mb-6"
            >
              Unlock Your{" "}
              <span className="text-gradient-gold">Natural</span>
              <br />
              Vitality
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto lg:mx-0 mb-8"
            >
              Experience the power of Pure Himalayan Shilajit — sourced from 
              Gilgit-Baltistan to boost your energy, strength, and wellness naturally.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-10"
            >
              <Button variant="hero" size="xl" asChild>
                <Link to="/product" className="group">
                  Shop Now
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <Button variant="premium" size="xl" asChild>
                <Link to="/about">Learn More</Link>
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="flex flex-wrap justify-center lg:justify-start gap-4"
            >
              {trustBadges.map((badge, index) => (
                <motion.div
                  key={badge.label}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.7 + index * 0.1 }}
                  className="trust-badge"
                >
                  <badge.icon className="w-4 h-4 text-gold" />
                  <span className="text-sm font-medium text-foreground">{badge.label}</span>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

          {/* Product Image */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="relative"
          >
            <motion.div
              animate={{ y: [-10, 10, -10] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              className="relative"
            >
              <div className="absolute inset-0 flex items-center justify-center">
                <motion.div
                  className="w-80 h-80 rounded-full bg-gradient-gold opacity-20 blur-3xl"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 4, repeat: Infinity }}
                />
              </div>
              <div className="relative glass-card p-4 lg:p-6 rounded-3xl shadow-premium">
                <div className="aspect-square rounded-2xl overflow-hidden relative">
                  <img src={heroProduct} alt="Pure Himalayan Shilajit" className="w-full h-full object-cover image-zoom" />
                  <motion.div
                    className="absolute top-4 right-4 badge-discount"
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    Up to 30% OFF
                  </motion.div>
                </div>
                <div className="mt-6 grid grid-cols-3 gap-4">
                  {[
                    { value: "100%", label: "Pure" },
                    { value: "5000m", label: "Altitude" },
                    { value: "85+", label: "Minerals" },
                  ].map((stat, index) => (
                    <motion.div
                      key={stat.label}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.8 + index * 0.1 }}
                      className="text-center"
                    >
                      <div className="text-xl md:text-2xl font-bold text-gold">{stat.value}</div>
                      <div className="text-xs text-muted-foreground">{stat.label}</div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="flex flex-col items-center gap-2 text-muted-foreground"
        >
          <span className="text-xs">Scroll to explore</span>
          <div className="w-6 h-10 rounded-full border-2 border-muted-foreground/30 flex items-start justify-center p-2">
            <motion.div
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-1.5 h-1.5 rounded-full bg-gold"
            />
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
};

export default Hero;
