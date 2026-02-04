import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingCart } from "lucide-react";
import { Button } from "./ui/button";
import { useNavigate } from "react-router-dom";

interface StickyBuyButtonProps {
  price: number;
  originalPrice: number;
}

const StickyBuyButton = ({ price = 2800, originalPrice = 4000 }: StickyBuyButtonProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      // Show button after scrolling past 400px (hero section)
      const scrollY = window.scrollY;
      setIsVisible(scrollY > 400);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleBuyNow = () => {
    navigate("/checkout");
  };

  // Only show on mobile
  if (!isMobile) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed bottom-0 left-0 right-0 z-40 p-4 bg-background/95 backdrop-blur-xl border-t border-border shadow-lg"
        >
          <div className="flex items-center justify-between gap-4 max-w-lg mx-auto">
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground line-through">
                Rs. {originalPrice.toLocaleString()}
              </span>
              <span className="text-xl font-bold text-gradient-gold">
                Rs. {price.toLocaleString()}
              </span>
            </div>
            <Button 
              variant="hero" 
              size="lg" 
              className="flex-1 max-w-[200px]"
              onClick={handleBuyNow}
            >
              <ShoppingCart className="w-5 h-5 mr-2" />
              Buy Now
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default StickyBuyButton;
