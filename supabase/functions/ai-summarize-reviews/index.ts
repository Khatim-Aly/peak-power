import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { productId } = await req.json();
    if (!productId) {
      return new Response(JSON.stringify({ error: "productId required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const cacheKey = `review-summary:${productId}`;
    const { data: cached } = await supabase.from("ai_cache")
      .select("payload, created_at").eq("cache_key", cacheKey).maybeSingle();

    // Reuse cache if <24h old
    if (cached && new Date(cached.created_at).getTime() > Date.now() - 86400000) {
      return new Response(JSON.stringify(cached.payload), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch reviews via product_reviews → orders → user product
    const { data: reviews } = await supabase
      .from("product_reviews")
      .select("rating, comment")
      .eq("product_id", productId)
      .not("comment", "is", null)
      .limit(50);

    if (!reviews || reviews.length < 3) {
      const empty = { pros: [], cons: [], summary: null, reviewCount: reviews?.length || 0 };
      return new Response(JSON.stringify(empty), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const reviewsText = reviews.map((r: any) => `[${r.rating}/5] ${r.comment}`).join("\n");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You analyze product reviews. Return ONLY valid JSON." },
          { role: "user", content: `Summarize these ${reviews.length} customer reviews. Return JSON:
{
  "summary": "1-2 sentence overall summary",
  "pros": ["3-4 most-mentioned positive points"],
  "cons": ["2-3 concerns or downsides if any, else empty array"]
}

Reviews:
${reviewsText}` },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!aiResp.ok) {
      return new Response(JSON.stringify({ error: "AI error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await aiResp.json();
    const content = data.choices?.[0]?.message?.content || "{}";
    let parsed: any = {};
    try { parsed = JSON.parse(content); } catch { /* noop */ }
    parsed.reviewCount = reviews.length;

    await supabase.from("ai_cache").upsert({
      cache_key: cacheKey, kind: "review-summary", payload: parsed,
    }, { onConflict: "cache_key" });

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
