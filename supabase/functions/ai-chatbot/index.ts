import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are PeakPower Assistant, the AI helper for PeakPower GB — a Pakistani marketplace selling Pure Himalayan Shilajit and other premium products.

LANGUAGE RULES:
- Detect the user's language. If they write in Urdu, Roman Urdu, or mix Urdu+English, reply in the SAME mix.
- If they write in English, reply in English.
- Be warm, polite, use desi tone where natural ("Bhai", "Behen", "Ji").

CAPABILITIES:
- Answer product questions (Shilajit benefits, dosage, authenticity, 10g vs 20g jars)
- Help with orders (tracking, returns, delivery times — typical 2-5 days across Pakistan)
- Currency is always PKR. Free shipping over PKR 5000 typically.
- Recommend WhatsApp +92-XXX for urgent help; suggest the Order Tracking page for order lookups.
- For checkout/account issues: guide them to /dashboard or /checkout.

GUARDRAILS:
- Never invent prices or stock — if unsure, say "Let me connect you to support".
- No medical claims beyond traditional usage.
- Keep replies under 120 words unless user asks for detail.
- Use markdown sparingly (bold, lists).`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { messages, conversationId } = await req.json();
    if (!Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: "messages required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
        stream: true,
      }),
    });

    if (!aiResp.ok) {
      if (aiResp.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit. Please try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResp.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits in workspace settings." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await aiResp.text();
      return new Response(JSON.stringify({ error: "AI gateway error", detail: errText }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Persist conversation asynchronously (best-effort)
    const authHeader = req.headers.get("Authorization");
    if (conversationId && authHeader) {
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      );
      const lastUserMsg = messages[messages.length - 1];
      if (lastUserMsg?.role === "user") {
        supabase.from("chatbot_messages").insert({
          conversation_id: conversationId,
          role: "user",
          content: lastUserMsg.content,
        }).then(() => {});
      }
    }

    return new Response(aiResp.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
