import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";

interface Banner {
  id: string;
  title: string;
  subtitle: string | null;
  image_url: string | null;
  cta_label: string | null;
  cta_url: string | null;
  position: string;
}

export const CmsBannerStrip = ({ position = "strip" }: { position?: string }) => {
  const [banners, setBanners] = useState<Banner[]>([]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("cms_banners")
        .select("*")
        .eq("position", position)
        .eq("is_active", true)
        .order("sort_order");
      setBanners((data as any) || []);
    })();
  }, [position]);

  if (banners.length === 0) return null;

  return (
    <section className="py-8">
      <div className="container mx-auto px-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {banners.map((b, i) => (
          <motion.div
            key={b.id}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.05 }}
            className="relative overflow-hidden rounded-2xl glass-card group"
          >
            {b.image_url && (
              <img src={b.image_url} alt={b.title} className="w-full h-40 object-cover transition-transform group-hover:scale-105" />
            )}
            <div className="p-5">
              <h3 className="font-serif text-xl font-bold text-foreground mb-1">{b.title}</h3>
              {b.subtitle && <p className="text-sm text-muted-foreground mb-3">{b.subtitle}</p>}
              {b.cta_url && (
                <Link to={b.cta_url} className="inline-flex items-center text-gold hover:underline font-medium text-sm">
                  {b.cta_label || "Learn more"} →
                </Link>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

export default CmsBannerStrip;
