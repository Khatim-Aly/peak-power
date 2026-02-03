import { motion } from "framer-motion";
import { Mountain, Leaf, Award, Heart, Users, Globe } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import CTASection from "@/components/CTASection";

const About = () => {
  const values = [
    {
      icon: Leaf,
      title: "Purity First",
      description: "We never compromise on quality. Every batch of Shilajit is 100% pure with no additives or fillers.",
    },
    {
      icon: Mountain,
      title: "Authentic Source",
      description: "Sourced directly from pristine Himalayan altitudes above 5000 meters.",
    },
    {
      icon: Award,
      title: "Lab Tested",
      description: "Every batch undergoes rigorous third-party testing for purity and potency.",
    },
    {
      icon: Heart,
      title: "Customer Wellness",
      description: "Your health and satisfaction are at the heart of everything we do.",
    },
  ];

  const stats = [
    { value: "5+", label: "Years of Excellence" },
    { value: "50K+", label: "Happy Customers" },
    { value: "100%", label: "Natural & Pure" },
    { value: "30+", label: "Countries Served" },
  ];

  return (
    <div className="min-h-screen">
      <Navigation />
      
      {/* Hero Section */}
      <section className="pt-32 pb-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-muted" />
        <motion.div
          className="absolute top-1/3 right-1/4 w-96 h-96 rounded-full bg-gradient-radial-gold opacity-30 blur-3xl"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 8, repeat: Infinity }}
        />

        <div className="container mx-auto px-4 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-4xl mx-auto text-center"
          >
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-block text-gold text-sm font-semibold tracking-wider uppercase mb-4"
            >
              Our Story
            </motion.span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold mb-6">
              From the <span className="text-gradient-gold">Himalayas</span> to You
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              We are passionate about bringing the ancient wisdom of Himalayan wellness 
              to modern lives. Our journey began with a simple mission: to share the 
              purest, most authentic Shilajit with the world.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="glass-card p-8 rounded-3xl">
                <div className="aspect-video rounded-2xl bg-gradient-to-br from-secondary/50 to-secondary flex items-center justify-center overflow-hidden">
                  <div className="relative w-full h-full flex items-center justify-center">
                    <motion.div
                      className="w-48 h-48 rounded-full bg-gradient-to-br from-gold/20 via-gold/30 to-earth/20 flex items-center justify-center"
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ duration: 4, repeat: Infinity }}
                    >
                      <Mountain className="w-20 h-20 text-gold" />
                    </motion.div>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <h2 className="text-3xl md:text-4xl font-serif font-bold mb-6">
                Ancient Wisdom, <span className="text-gradient-gold">Modern Science</span>
              </h2>
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <p>
                  For thousands of years, Shilajit has been revered in Ayurvedic medicine 
                  as the "Destroyer of Weakness" and "Conqueror of Mountains." This powerful 
                  mineral-rich resin forms over centuries from the decomposition of plant 
                  matter in the Himalayan mountains.
                </p>
                <p>
                  Our founders spent years traveling through remote Himalayan regions, 
                  building relationships with local harvesters who have passed down their 
                  knowledge for generations. We worked with scientists to understand and 
                  preserve the full potency of this remarkable substance.
                </p>
                <p>
                  Today, we bring you Shilajit that is harvested sustainably, purified 
                  using traditional methods, and tested rigorously to ensure you receive 
                  only the purest, most potent product.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="inline-block text-gold text-sm font-semibold tracking-wider uppercase mb-4">
              What Drives Us
            </span>
            <h2 className="text-3xl md:text-4xl font-serif font-bold">
              Our <span className="text-gradient-gold">Values</span>
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, index) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -5 }}
                className="glass-card p-8 rounded-2xl text-center hover:shadow-gold transition-all duration-300"
              >
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  className="w-16 h-16 rounded-2xl bg-gradient-gold flex items-center justify-center mx-auto mb-6"
                >
                  <value.icon className="w-8 h-8 text-secondary" />
                </motion.div>
                <h3 className="text-xl font-semibold mb-3">{value.title}</h3>
                <p className="text-muted-foreground text-sm">{value.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-secondary">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className="text-4xl md:text-5xl font-bold text-gold mb-2">
                  {stat.value}
                </div>
                <div className="text-secondary-foreground/70 text-sm">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="inline-block text-gold text-sm font-semibold tracking-wider uppercase mb-4">
              Our Mission
            </span>
            <h2 className="text-3xl md:text-4xl font-serif font-bold mb-6">
              Making <span className="text-gradient-gold">Wellness</span> Accessible
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              We believe everyone deserves access to nature's most powerful wellness 
              supplements. Our mission is to bring authentic Himalayan wellness 
              products to health-conscious individuals worldwide.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              {
                icon: Users,
                title: "Community",
                description: "Building a global community of wellness enthusiasts",
              },
              {
                icon: Globe,
                title: "Sustainability",
                description: "Ethical sourcing that protects Himalayan ecosystems",
              },
              {
                icon: Heart,
                title: "Wellness",
                description: "Empowering people to take control of their health",
              },
            ].map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className="w-16 h-16 rounded-full bg-gold/10 flex items-center justify-center mx-auto mb-4">
                  <item.icon className="w-8 h-8 text-gold" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                <p className="text-muted-foreground text-sm">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <CTASection />
      <Footer />
    </div>
  );
};

export default About;
