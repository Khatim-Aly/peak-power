import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { productId, userId } = await req.json();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const cacheKey = productId ? `recs:product:${productId}` : `recs:user:${userId || "anon"}`;
    const { data: cached } = await supabase.from("ai_cache")
      .select("payload, created_at").eq("cache_key", cacheKey).maybeSingle();
    if (cached && new Date(cached.created_at).getTime() > Date.now() - 21600000) {
      return new Response(JSON.stringify(cached.payload), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Pull candidate products
    const { data: products } = await supabase.from("products")
      .select("id,name,description,category,price,sales_count,rating_avg")
      .eq("is_active", true)
      .order("sales_count", { ascending: false })
      .limit(40);

    if (!products || products.length === 0) {
      return new Response(JSON.stringify({ productIds: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let context = "";
    if (productId) {
      const current = products.find((p: any) => p.id === productId);
      if (current) {
        context = `User is viewing: "${current.name}" (category: ${current.category || "n/a"}, PKR ${current.price}). Recommend 4 complementary or similar products.`;
      }
    } else if (userId) {
      const { data: orders } = await supabase
        .from("order_items")
        .select("product_name")
        .in("order_id",
          (await supabase.from("orders").select("id").eq("user_id", userId).limit(10)).data?.map((o: any) => o.id) || []
        )
        .limit(20);
      const past = orders?.map((o: any) => o.product_name).join(", ") || "no history";
      context = `User has previously ordered: ${past}. Recommend 4 products they would likely buy next.`;
    } else {
      context = "Recommend 4 best-selling, highly-rated products for a new visitor.";
    }

    const catalog = products.map((p: any, i: number) =>
      `${i + 1}. id=${p.id} | ${p.name} | cat:${p.category || "-"} | PKR ${p.price} | sales:${p.sales_count} | rating:${p.rating_avg}`
    ).join("\n");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are a recommendation engine. Return ONLY valid JSON." },
          { role: "user", content: `${context}

Available products:
${catalog}

Return JSON: { "productIds": ["uuid1","uuid2","uuid3","uuid4"], "reason": "1-sentence why these" }
Pick from the available product IDs only. ${productId ? "Do NOT include the currently-viewed product." : ""}` },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!aiResp.ok) {
      // Fallback: top-selling
      const fallback = { productIds: products.slice(0, 4).map((p: any) => p.id), reason: "top sellers" };
      return new Response(JSON.stringify(fallback), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await aiResp.json();
    const content = data.choices?.[0]?.message?.content || "{}";
    let parsed: any = { productIds: [] };
    try { parsed = JSON.parse(content); } catch { /* noop */ }
    if (productId) parsed.productIds = (parsed.productIds || []).filter((id: string) => id !== productId);
    parsed.productIds = (parsed.productIds || []).slice(0, 4);

    await supabase.from("ai_cache").upsert({
      cache_key: cacheKey, kind: "recommendations", payload: parsed,
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
