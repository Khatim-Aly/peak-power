import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { supabase } from "@/integrations/supabase/client";

const FAQ = () => {
  const [dbFaqs, setDbFaqs] = useState<{ question: string; answer: string }[] | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("cms_faqs")
        .select("question, answer")
        .eq("is_published", true)
        .order("sort_order");
      if (data && data.length) setDbFaqs(data);
    })();
  }, []);

  const faqs = [
    {
      question: "What is Shilajit and where does it come from?",
      answer:
        "Shilajit is a natural mineral resin that oozes from rocks in the Himalayan mountains, particularly from the Gilgit-Baltistan region. It forms over centuries from the decomposition of plant matter and contains over 85 minerals in ionic form, along with fulvic acid and humic acid.",
    },
    {
      question: "How do I take Shilajit?",
      answer:
        "Take a pea-sized amount (300-500mg) and dissolve it in warm water, milk, or tea. Consume once or twice daily, preferably in the morning on an empty stomach or before bedtime. The resin should dissolve completely within 1-2 minutes.",
    },
    {
      question: "Is your Shilajit lab-tested and safe?",
      answer:
        "Yes! Our Shilajit undergoes rigorous third-party lab testing for purity, heavy metals, and contaminants. We provide a Certificate of Analysis (COA) with every batch. Our product is 100% pure with no additives, fillers, or artificial ingredients.",
    },
    {
      question: "How long before I see results?",
      answer:
        "Most customers report feeling increased energy and mental clarity within the first 1-2 weeks. For full benefits like improved stamina, strength, and overall vitality, consistent use for 4-8 weeks is recommended. Results may vary based on individual health conditions.",
    },
    {
      question: "What are the main benefits of Shilajit?",
      answer:
        "Shilajit offers numerous benefits including: increased energy and stamina, enhanced cognitive function, improved testosterone levels, better nutrient absorption, immune system support, anti-aging properties, and overall vitality enhancement.",
    },
    {
      question: "Can women take Shilajit?",
      answer:
        "Absolutely! Shilajit is beneficial for both men and women. Women can experience benefits like increased energy, improved iron absorption, hormonal balance support, enhanced skin health, and overall wellness improvement.",
    },
    {
      question: "Are there any side effects?",
      answer:
        "Pure, authentic Shilajit is generally safe when taken as directed. However, we recommend starting with a smaller dose and consulting your healthcare provider if you're pregnant, nursing, have underlying health conditions, or are taking medications.",
    },
    {
      question: "How should I store Shilajit?",
      answer:
        "Store your Shilajit in a cool, dry place away from direct sunlight. Keep the jar tightly sealed after each use. When stored properly, Shilajit has a very long shelf life and doesn't expire in the traditional sense.",
    },
    {
      question: "Do you offer international shipping?",
      answer:
        "Currently, we ship within Pakistan with free delivery on all orders. International shipping is coming soon! Join our mailing list to be notified when we expand our shipping options.",
    },
    {
      question: "What is your return policy?",
      answer:
        "We offer a 30-day money-back guarantee. If you're not completely satisfied with your purchase, contact us within 30 days for a full refund. We believe in the quality of our product and want you to experience it risk-free.",
    },
  ];

  const list = dbFaqs && dbFaqs.length > 0 ? dbFaqs : faqs;

  return (
    <section className="py-24 relative" id="faq">
      <div className="container mx-auto px-4 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gold/10 border border-gold/20 mb-4">
            <span className="w-2 h-2 rounded-full bg-gold animate-pulse" />
            <span className="text-sm font-medium text-gold">Got Questions?</span>
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold mb-4">
            Frequently Asked <span className="text-gradient-gold">Questions</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Find answers to common questions about our Pure Himalayan Shilajit
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="max-w-3xl mx-auto"
        >
          <Accordion type="single" collapsible className="space-y-4">
            {list.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
              >
                <AccordionItem
                  value={`item-${index}`}
                  className="glass-card rounded-2xl px-6 border-none"
                >
                  <AccordionTrigger className="text-left font-semibold text-foreground hover:text-gold hover:no-underline py-5">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground pb-5 leading-relaxed">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              </motion.div>
            ))}
          </Accordion>
        </motion.div>

        {/* Contact CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="text-center mt-12"
        >
          <p className="text-muted-foreground mb-4">
            Still have questions? We're here to help!
          </p>
          <a
            href="https://wa.me/923554421113?text=Hi! I have a question about your Shilajit product."
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-gold hover:underline font-medium"
          >
            Chat with us on WhatsApp →
          </a>
        </motion.div>
      </div>
    </section>
  );
};

export default FAQ;
