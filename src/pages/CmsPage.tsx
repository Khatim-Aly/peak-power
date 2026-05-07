import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Loader2 } from "lucide-react";

export default function CmsPage() {
  const { slug } = useParams();
  const [page, setPage] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await supabase.from("cms_pages").select("*").eq("slug", slug).eq("is_published", true).maybeSingle();
      setPage(data);
      setLoading(false);
      if (data) document.title = `${data.title} – PeakPower`;
    })();
  }, [slug]);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 py-24 max-w-3xl">
        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-gold" /></div>
        ) : !page ? (
          <div className="text-center py-20">
            <h1 className="text-3xl font-serif font-bold mb-3">Page not found</h1>
            <Link to="/" className="text-gold underline">Back to home</Link>
          </div>
        ) : (
          <article className="prose prose-invert max-w-none">
            <h1 className="text-4xl font-serif font-bold mb-6 text-foreground">{page.title}</h1>
            <div className="text-foreground/90 whitespace-pre-wrap leading-relaxed" dangerouslySetInnerHTML={{ __html: page.body }} />
          </article>
        )}
      </main>
      <Footer />
    </div>
  );
}
