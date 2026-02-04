import { motion } from "framer-motion";
import { MessageCircle } from "lucide-react";

const WHATSAPP_NUMBER = "+923554421113";
const WHATSAPP_MESSAGE = "Hi! I'm interested in learning more about your Pure Himalayan Shilajit products.";

const WhatsAppButton = () => {
  const handleClick = () => {
    const encodedMessage = encodeURIComponent(WHATSAPP_MESSAGE);
    const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER.replace(/[^0-9]/g, "")}?text=${encodedMessage}`;
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <motion.button
      onClick={handleClick}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 1, type: "spring", stiffness: 260, damping: 20 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      className="fixed bottom-6 right-6 z-50 w-14 h-14 md:w-16 md:h-16 rounded-full bg-[#25D366] text-white shadow-lg flex items-center justify-center hover:bg-[#128C7E] transition-colors"
      aria-label="Contact us on WhatsApp"
    >
      <motion.div
        animate={{ 
          scale: [1, 1.2, 1],
        }}
        transition={{ 
          duration: 2, 
          repeat: Infinity,
          repeatDelay: 3
        }}
      >
        <MessageCircle className="w-7 h-7 md:w-8 md:h-8" fill="currentColor" />
      </motion.div>
      
      {/* Pulse ring effect */}
      <motion.span
        className="absolute inset-0 rounded-full bg-[#25D366]"
        animate={{
          scale: [1, 1.5],
          opacity: [0.5, 0],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          repeatDelay: 2,
        }}
      />
    </motion.button>
  );
};

export default WhatsAppButton;
