import { motion } from "framer-motion";
import { Shield, Leaf, FlaskConical, Mountain, Award, BadgeCheck } from "lucide-react";

const TrustBadges = () => {
  const badges = [
    {
      icon: Leaf,
      title: "100% Pure & Natural",
      description: "No additives, fillers, or artificial ingredients",
    },
    {
      icon: FlaskConical,
      title: "Lab Tested",
      description: "Verified for purity and potency by third-party labs",
    },
    {
      icon: Shield,
      title: "No Chemicals",
      description: "Free from pesticides, heavy metals, and toxins",
    },
    {
      icon: Mountain,
      title: "Authentic Himalayan",
      description: "Sourced from 5000+ meters altitude in the Himalayas",
    },
    {
      icon: Award,
      title: "Premium Quality",
      description: "Highest grade resin with 80%+ fulvic acid content",
    },
    {
      icon: BadgeCheck,
      title: "Satisfaction Guaranteed",
      description: "30-day money-back guarantee on all orders",
    },
  ];

  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background to-muted/50" />

      <div className="container mx-auto px-4 lg:px-8 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-block text-gold text-sm font-semibold tracking-wider uppercase mb-4">
            Quality Promise
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold mb-6">
            Why Trust <span className="text-gradient-gold">Our Shilajit</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            We are committed to delivering the purest, most authentic Himalayan Shilajit. 
            Every batch is tested and verified for your peace of mind.
          </p>
        </motion.div>

        {/* Badges Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {badges.map((badge, index) => (
            <motion.div
              key={badge.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ y: -5 }}
              className="group"
            >
              <div className="glass-card p-8 h-full rounded-2xl border border-transparent hover:border-gold/20 transition-all duration-300">
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <motion.div
                    whileHover={{ rotate: 5, scale: 1.1 }}
                    className="w-14 h-14 rounded-2xl bg-gold/10 flex items-center justify-center flex-shrink-0 group-hover:bg-gold/20 transition-colors"
                  >
                    <badge.icon className="w-7 h-7 text-gold" />
                  </motion.div>

                  {/* Content */}
                  <div>
                    <h3 className="font-semibold text-lg mb-2 group-hover:text-gold transition-colors">
                      {badge.title}
                    </h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {badge.description}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Certifications */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="mt-16 text-center"
        >
          <p className="text-muted-foreground text-sm mb-6">Certified & Verified By</p>
          <div className="flex flex-wrap justify-center gap-8 items-center opacity-60">
            {["ISO 9001", "GMP Certified", "AYUSH Approved", "FSSAI Licensed"].map((cert) => (
              <div
                key={cert}
                className="px-6 py-3 rounded-lg border border-border bg-card text-sm font-medium"
              >
                {cert}
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default TrustBadges;
