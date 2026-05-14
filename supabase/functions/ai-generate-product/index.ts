const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { keywords, category, currentName } = await req.json();
    if (!keywords || typeof keywords !== "string" || keywords.length < 2) {
      return new Response(JSON.stringify({ error: "keywords required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const prompt = `You write product listings for PeakPower GB, a Pakistani marketplace. Currency is PKR.

Generate a compelling product listing from these inputs:
- Keywords: ${keywords}
- Category: ${category || "general"}
${currentName ? `- Existing name to refine: ${currentName}` : ""}

Return ONLY valid JSON in this exact shape:
{
  "name": "60-char max SEO product name",
  "description": "2-3 paragraph description (markdown ok). Highlight benefits, quality, authenticity.",
  "bullets": ["5 short bullet points of key features/benefits"],
  "tags": ["3-6 lowercase tags"]
}`;

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are an expert ecommerce copywriter. Always return valid JSON only — no markdown fences." },
          { role: "user", content: prompt },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!aiResp.ok) {
      const status = aiResp.status === 429 || aiResp.status === 402 ? aiResp.status : 500;
      const msg = aiResp.status === 429 ? "Rate limit. Try again." :
                  aiResp.status === 402 ? "AI credits exhausted." : "AI error";
      return new Response(JSON.stringify({ error: msg }), {
        status, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await aiResp.json();
    const content = data.choices?.[0]?.message?.content || "{}";
    let parsed;
    try { parsed = JSON.parse(content); } catch { parsed = { raw: content }; }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
