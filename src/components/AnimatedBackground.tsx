import { motion } from "framer-motion";
import { useMemo, useEffect, useState } from "react";

function FloatingOrb({ delay, duration, x, y, size, color }: {
  delay: number; duration: number; x: string; y: string; size: string; color: string;
}) {
  return (
    <motion.div
      className={`absolute rounded-full blur-3xl opacity-20 ${size} ${color}`}
      style={{ left: x, top: y, willChange: "transform, opacity" }}
      animate={{
        y: [0, -40, 20, -30, 0],
        x: [0, 20, -15, 10, 0],
        scale: [1, 1.15, 0.95, 1.1, 1],
        opacity: [0.15, 0.25, 0.12, 0.22, 0.15],
      }}
      transition={{ duration, delay, repeat: Infinity, ease: "easeInOut" }}
    />
  );
}

function SparkleParticle({ delay, x, duration }: { delay: number; x: string; duration: number }) {
  return (
    <motion.div
      className="absolute w-1 h-1 rounded-full bg-gold"
      style={{ left: x, bottom: "-5%", willChange: "transform, opacity" }}
      animate={{
        y: [0, -800],
        opacity: [0, 0.8, 0.6, 0],
        scale: [0.5, 1, 0.8, 0],
      }}
      transition={{ duration, delay, repeat: Infinity, ease: "easeOut" }}
    />
  );
}

export default function AnimatedBackground() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const orbs = useMemo(() => {
    const all = [
      { delay: 0, duration: 12, x: "10%", y: "20%", size: "w-72 h-72", color: "bg-gold" },
      { delay: 2, duration: 15, x: "60%", y: "10%", size: "w-96 h-96", color: "bg-accent" },
      { delay: 4, duration: 18, x: "30%", y: "60%", size: "w-64 h-64", color: "bg-gold-light" },
      { delay: 1, duration: 14, x: "75%", y: "50%", size: "w-80 h-80", color: "bg-primary" },
      { delay: 3, duration: 16, x: "50%", y: "80%", size: "w-56 h-56", color: "bg-accent" },
      { delay: 5, duration: 20, x: "85%", y: "30%", size: "w-48 h-48", color: "bg-gold-dark" },
    ];
    // Fewer + smaller orbs on mobile to prevent jank/glitching
    return isMobile
      ? [
          { delay: 0, duration: 14, x: "10%", y: "20%", size: "w-40 h-40", color: "bg-gold" },
          { delay: 2, duration: 18, x: "60%", y: "60%", size: "w-48 h-48", color: "bg-accent" },
          { delay: 4, duration: 20, x: "30%", y: "85%", size: "w-36 h-36", color: "bg-gold-light" },
        ]
      : all;
  }, [isMobile]);

  const sparkles = useMemo(() => {
    const count = isMobile ? 5 : 15;
    return Array.from({ length: count }, (_, i) => ({
      delay: i * 1.2,
      x: `${5 + Math.random() * 90}%`,
      duration: 6 + Math.random() * 4,
    }));
  }, [isMobile]);

  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
      {/* Base gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-muted/30" />

      {/* Floating orbs */}
      {orbs.map((orb, i) => (
        <FloatingOrb key={i} {...orb} />
      ))}

      {/* Rising sparkles */}
      {sparkles.map((s, i) => (
        <SparkleParticle key={i} {...s} />
      ))}

      {/* Subtle mesh gradient overlay - desktop only */}
      {!isMobile && (
        <motion.div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(at 20% 30%, hsl(var(--gold)) 0%, transparent 50%),
                             radial-gradient(at 80% 70%, hsl(var(--accent)) 0%, transparent 50%),
                             radial-gradient(at 50% 50%, hsl(var(--primary)) 0%, transparent 50%)`,
          }}
          animate={{ opacity: [0.03, 0.06, 0.03] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
      )}
    </div>
  );
}
