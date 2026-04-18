import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import AnimatedCounter from "./AnimatedCounter";
import { Star, ChevronLeft, ChevronRight, Quote } from "lucide-react";

interface Testimonial {
  id: number;
  name: string;
  location: string;
  rating: number;
  text: string;
  avatar: string;
}

const Testimonials = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);

  const testimonials: Testimonial[] = [
    {
      id: 1,
      name: "Ahmed Raza",
      location: "Lahore, Punjab",
      rating: 5,
      text: "After using Pure Himalayan Shilajit for 3 months, my energy levels have skyrocketed! I feel 10 years younger and my stamina during workouts has improved dramatically.",
      avatar: "AR",
    },
    {
      id: 2,
      name: "Fatima Noor",
      location: "Karachi, Sindh",
      rating: 5,
      text: "As a working professional, I was always tired. Shilajit changed everything - my focus is sharper, and I no longer need multiple cups of coffee to get through the day.",
      avatar: "FN",
    },
    {
      id: 3,
      name: "Usman Ali",
      location: "Islamabad, ICT",
      rating: 5,
      text: "The quality is exceptional. You can tell this is authentic Himalayan Shilajit sourced from Gilgit-Baltistan. My immunity has improved significantly and I haven't fallen sick in months!",
      avatar: "UA",
    },
    {
      id: 4,
      name: "Ayesha Malik",
      location: "Peshawar, KPK",
      rating: 5,
      text: "I was skeptical at first, but the results speak for themselves. My hair is healthier, skin is glowing, and I have energy to spare. Highly recommend to everyone!",
      avatar: "AM",
    },
    {
      id: 5,
      name: "Bilal Khan",
      location: "Rawalpindi, Punjab",
      rating: 5,
      text: "Being from the northern areas, I know the real deal when I see it. PeakPower GB delivers genuine Shilajit straight from the mountains. Best product on the market!",
      avatar: "BK",
    },
    {
      id: 6,
      name: "Sana Tariq",
      location: "Faisalabad, Punjab",
      rating: 5,
      text: "My husband and I both use it daily. His joint pain has reduced significantly and I feel more energetic throughout the day. Amazing natural supplement!",
      avatar: "ST",
    },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setDirection(1);
      setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [testimonials.length]);

  const handlePrev = () => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  const handleNext = () => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 300 : -300,
      opacity: 0,
    }),
  };

  return (
    <section className="py-24 bg-secondary dark:bg-secondary relative overflow-hidden [&_.text-secondary-foreground]:text-black dark:[&_.text-secondary-foreground]:text-secondary-foreground [&_.text-secondary-foreground\/70]:text-black/70 dark:[&_.text-secondary-foreground\/70]:text-secondary-foreground/70 [&_.text-secondary-foreground\/60]:text-black/60 dark:[&_.text-secondary-foreground\/60]:text-secondary-foreground/60 [&_.text-secondary-foreground\/30]:text-black/30 dark:[&_.text-secondary-foreground\/30]:text-secondary-foreground/30">
      {/* Background Elements */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-radial-gold opacity-10 blur-3xl" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-radial-gold opacity-10 blur-3xl" />

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
            Customer Stories
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-secondary-foreground mb-6">
            Loved by <span className="text-gradient-gold">Thousands</span>
          </h2>
          <p className="text-secondary-foreground/70 text-lg max-w-2xl mx-auto">
            Join our community of wellness enthusiasts who have transformed their lives 
            with Pure Himalayan Shilajit.
          </p>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="flex justify-center gap-12 mb-16 flex-wrap"
        >
          {[
            { value: "4.9", label: "Average Rating", isCounter: false },
            { value: "1289", label: "Happy Customers", isCounter: true },
            { value: "98%", label: "Would Recommend", isCounter: false },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 + index * 0.1 }}
              className="text-center"
            >
              <div className="text-4xl md:text-5xl font-bold text-gold mb-2">
                {stat.isCounter ? (
                  <AnimatedCounter start={1289} end={2847} duration={2.5} suffix="+" />
                ) : (
                  stat.value
                )}
              </div>
              <div className="text-secondary-foreground/60 text-sm">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>

        {/* Testimonial Carousel */}
        <div className="max-w-4xl mx-auto">
          <div className="relative">
            {/* Quote Icon */}
            <Quote className="absolute -top-4 -left-4 w-12 h-12 text-gold/20" />

            <AnimatePresence initial={false} custom={direction} mode="wait">
              <motion.div
                key={currentIndex}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
                className="glass-card p-8 md:p-12 rounded-3xl text-center"
              >
                {/* Stars */}
                <div className="flex justify-center gap-1 mb-6">
                  {[...Array(testimonials[currentIndex].rating)].map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.1 }}
                    >
                      <Star className="w-6 h-6 star-filled fill-current" />
                    </motion.div>
                  ))}
                </div>

                {/* Quote */}
                <p className="text-xl md:text-2xl text-secondary-foreground leading-relaxed mb-8 font-light italic">
                  "{testimonials[currentIndex].text}"
                </p>

                {/* Author */}
                <div className="flex items-center justify-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-gradient-gold flex items-center justify-center text-secondary font-bold text-lg">
                    {testimonials[currentIndex].avatar}
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-secondary-foreground">
                      {testimonials[currentIndex].name}
                    </div>
                    <div className="text-secondary-foreground/60 text-sm">
                      {testimonials[currentIndex].location}
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Navigation */}
            <div className="flex justify-center gap-4 mt-8">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handlePrev}
                className="w-12 h-12 rounded-full bg-secondary-foreground/10 hover:bg-gold/20 flex items-center justify-center transition-colors"
                aria-label="Previous testimonial"
              >
                <ChevronLeft className="w-6 h-6 text-secondary-foreground" />
              </motion.button>

              {/* Dots */}
              <div className="flex items-center gap-2">
                {testimonials.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setDirection(index > currentIndex ? 1 : -1);
                      setCurrentIndex(index);
                    }}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      index === currentIndex
                        ? "w-8 bg-gold"
                        : "bg-secondary-foreground/30 hover:bg-secondary-foreground/50"
                    }`}
                    aria-label={`Go to testimonial ${index + 1}`}
                  />
                ))}
              </div>

              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleNext}
                className="w-12 h-12 rounded-full bg-secondary-foreground/10 hover:bg-gold/20 flex items-center justify-center transition-colors"
                aria-label="Next testimonial"
              >
                <ChevronRight className="w-6 h-6 text-secondary-foreground" />
              </motion.button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
