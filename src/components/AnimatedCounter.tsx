import { useState, useEffect, useRef } from "react";
import { motion, useInView } from "framer-motion";

interface AnimatedCounterProps {
  start?: number;
  end: number;
  duration?: number;
  className?: string;
  suffix?: string;
}

const AnimatedCounter = ({ start = 0, end, duration = 2, className, suffix = "" }: AnimatedCounterProps) => {
  const [count, setCount] = useState(start);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (!isInView || hasAnimated.current) return;
    hasAnimated.current = true;

    const startTime = performance.now();
    const animate = (currentTime: number) => {
      const elapsed = (currentTime - startTime) / 1000;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(start + (end - start) * eased);
      setCount(current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        // After reaching end, start random increments
        const randomIncrement = () => {
          setCount(prev => prev + Math.floor(Math.random() * 3) + 1);
          const delay = 3000 + Math.random() * 5000;
          setTimeout(randomIncrement, delay);
        };
        setTimeout(randomIncrement, 2000);
      }
    };

    requestAnimationFrame(animate);
  }, [isInView, start, end, duration]);

  return (
    <motion.span
      ref={ref}
      className={className}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={isInView ? { opacity: 1, scale: 1 } : {}}
      transition={{ duration: 0.5 }}
    >
      {count.toLocaleString()}{suffix}
    </motion.span>
  );
};

export default AnimatedCounter;
