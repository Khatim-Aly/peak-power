import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ZoomIn, ZoomOut, X, ChevronLeft, ChevronRight } from "lucide-react";
import heroProduct from "@/assets/hero-product.jpg";

interface ProductImage {
  id: string;
  src: string;
  alt: string;
  label: string;
}

const ProductGallery = () => {
  const [selectedImage, setSelectedImage] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({ x: 50, y: 50 });

  // Using the same image with different labels to simulate multiple angles
  const images: ProductImage[] = [
    { id: "1", src: heroProduct, alt: "Shilajit Front View", label: "Front" },
    { id: "2", src: heroProduct, alt: "Shilajit Side View", label: "Side" },
    { id: "3", src: heroProduct, alt: "Shilajit Close-up", label: "Close-up" },
    { id: "4", src: heroProduct, alt: "Shilajit Texture", label: "Texture" },
  ];

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isZoomed) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPosition({ x, y });
  };

  const nextImage = () => {
    setSelectedImage((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setSelectedImage((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <div className="space-y-4">
      {/* Main Image Container */}
      <div className="relative glass-card p-4 rounded-3xl">
        <div
          className="aspect-square rounded-2xl overflow-hidden relative group cursor-zoom-in"
          onClick={() => setIsZoomed(!isZoomed)}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => isZoomed && setIsZoomed(false)}
        >
          <AnimatePresence mode="wait">
            <motion.img
              key={selectedImage}
              src={images[selectedImage].src}
              alt={images[selectedImage].alt}
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="w-full h-full object-cover transition-transform duration-300"
              style={{
                transform: isZoomed ? `scale(2)` : "scale(1)",
                transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%`,
              }}
            />
          </AnimatePresence>

          {/* Zoom Indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/80 text-secondary-foreground text-sm backdrop-blur-sm"
          >
            {isZoomed ? (
              <>
                <ZoomOut className="w-4 h-4" />
                <span>Click to zoom out</span>
              </>
            ) : (
              <>
                <ZoomIn className="w-4 h-4" />
                <span>Click to zoom</span>
              </>
            )}
          </motion.div>

          {/* Navigation Arrows */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              prevImage();
            }}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-secondary/80 text-secondary-foreground backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-secondary"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              nextImage();
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-secondary/80 text-secondary-foreground backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-secondary"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* Image Label */}
          <div className="absolute bottom-4 left-4 px-3 py-1.5 rounded-full bg-gradient-gold text-secondary text-sm font-semibold">
            {images[selectedImage].label} View
          </div>
        </div>
      </div>

      {/* Thumbnail Strip */}
      <div className="flex gap-3">
        {images.map((image, index) => (
          <motion.button
            key={image.id}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setSelectedImage(index)}
            className={`relative flex-1 aspect-square rounded-xl overflow-hidden border-2 transition-all duration-300 ${
              selectedImage === index
                ? "border-gold shadow-gold"
                : "border-transparent hover:border-gold/50"
            }`}
          >
            <img
              src={image.src}
              alt={image.alt}
              className="w-full h-full object-cover"
            />
            {selectedImage === index && (
              <motion.div
                layoutId="thumbnail-indicator"
                className="absolute inset-0 bg-gold/10"
              />
            )}
            <span className="absolute bottom-1 left-1/2 -translate-x-1/2 text-xs font-medium px-2 py-0.5 rounded bg-secondary/80 text-secondary-foreground backdrop-blur-sm">
              {image.label}
            </span>
          </motion.button>
        ))}
      </div>

      {/* Fullscreen Modal */}
      <AnimatePresence>
        {isZoomed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background/95 backdrop-blur-xl hidden lg:flex items-center justify-center p-8"
            onClick={() => setIsZoomed(false)}
          >
            <button
              onClick={() => setIsZoomed(false)}
              className="absolute top-6 right-6 w-12 h-12 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center hover:bg-secondary/80 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            <motion.img
              src={images[selectedImage].src}
              alt={images[selectedImage].alt}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="max-w-full max-h-full object-contain rounded-2xl"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProductGallery;
