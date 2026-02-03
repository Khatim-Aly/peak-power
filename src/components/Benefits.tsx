import { motion } from "framer-motion";
import { Zap, Shield, Brain, Dumbbell, Heart, Sparkles } from "lucide-react";

const Benefits = () => {
  const benefits = [
    {
      icon: Zap,
      title: "Boosts Energy",
      description: "Natural energy enhancement that lasts throughout the day without crashes",
    },
    {
      icon: Dumbbell,
      title: "Increases Strength",
      description: "Supports muscle recovery and enhances physical performance",
    },
    {
      icon: Brain,
      title: "Mental Clarity",
      description: "Sharpens focus and cognitive function for peak mental performance",
    },
    {
      icon: Shield,
      title: "Immunity Support",
      description: "Strengthens your immune system with 85+ essential minerals",
    },
    {
      icon: Heart,
      title: "Heart Health",
      description: "Supports cardiovascular wellness and healthy blood circulation",
    },
    {
      icon: Sparkles,
      title: "Anti-Aging",
      description: "Rich in fulvic acid to combat oxidative stress and promote vitality",
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
      },
    },
  };

  return (
    <section className="py-24 bg-muted/30 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, hsl(var(--gold)) 1px, transparent 0)`,
          backgroundSize: '40px 40px',
        }} />
      </div>

      <div className="container mx-auto px-4 lg:px-8 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <motion.span
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="inline-block text-gold text-sm font-semibold tracking-wider uppercase mb-4"
          >
            Why Choose Shilajit
          </motion.span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold mb-6">
            Transform Your <span className="text-gradient-gold">Wellness</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            Discover the ancient Himalayan secret that has been used for centuries 
            to enhance vitality, strength, and overall well-being.
          </p>
        </motion.div>

        {/* Benefits Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8"
        >
          {benefits.map((benefit, index) => (
            <motion.div
              key={benefit.title}
              variants={itemVariants}
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
              className="group"
            >
              <div className="glass-card p-8 h-full rounded-2xl hover:shadow-gold transition-all duration-500 border border-transparent hover:border-gold/20">
                {/* Icon */}
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  className="w-14 h-14 rounded-2xl bg-gradient-gold flex items-center justify-center mb-6 shadow-gold"
                >
                  <benefit.icon className="w-7 h-7 text-secondary" />
                </motion.div>

                {/* Content */}
                <h3 className="text-xl font-serif font-semibold mb-3 group-hover:text-gold transition-colors">
                  {benefit.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {benefit.description}
                </p>

                {/* Hover Indicator */}
                <motion.div
                  initial={{ width: 0 }}
                  whileHover={{ width: "100%" }}
                  className="h-0.5 bg-gradient-gold mt-6 rounded-full"
                />
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="text-center mt-16"
        >
          <p className="text-muted-foreground mb-4">
            Backed by science, trusted by thousands
          </p>
          <div className="flex items-center justify-center gap-6 flex-wrap">
            {["85+ Minerals", "Fulvic Acid Rich", "Himalayan Sourced"].map((tag) => (
              <div key={tag} className="flex items-center gap-2 text-sm">
                <div className="w-1.5 h-1.5 rounded-full bg-gold" />
                <span className="text-foreground font-medium">{tag}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Benefits;
