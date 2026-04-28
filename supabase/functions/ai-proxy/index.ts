import "@supabase/functions-js/edge-runtime.d.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";
import { HfInference } from "https://esm.sh/@huggingface/inference";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method Not Allowed" }, 405);

  try {
    const body = await req.json().catch(() => null);
    const type = body?.type;
    const prompt = body?.prompt;

    if (!type) return json({ error: "type 이 누락되었습니다." }, 400);

    // 1) TEXT (Gemini API via OpenAI Compatible Endpoint)
    if (type === "text") {
      const geminiKey = Deno.env.get("GEMINI_API_KEY");
      if (!geminiKey) return json({ error: "GEMINI_API_KEY가 설정되어 있지 않습니다. Supabase Secrets를 확인하세요." }, 500);
      if (!Array.isArray(prompt)) return json({ error: "text 타입은 prompt가 messages 배열이어야 합니다." }, 400);

      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/openai/chat/completions`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${geminiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gemini-2.5-flash",
          messages: prompt,
          temperature: 0.7,
        }),
      });

      const data = await r.json();
      if (!r.ok) {
        return json({ error: "Gemini 호출 실패", details: data }, r.status);
      }

      // OpenAI API 응답 구조를 그대로 반환
      return json(data);
    }

    // 2) IMAGE (HF Inference - FLUX)
    if (type === "image") {
      const hfToken = Deno.env.get("HF_TOKEN");
      if (!hfToken) return json({ error: "HF_TOKEN이 설정되어 있지 않습니다." }, 500);
      if (typeof prompt !== "string" || !prompt.trim()) {
        return json({ error: "image 타입은 prompt 문자열이 필요합니다." }, 400);
      }

      const hf = new HfInference(hfToken);
      const blob = await hf.textToImage({
        model: "black-forest-labs/FLUX.1-schnell",
        inputs: prompt,
      });

      const buffer = await blob.arrayBuffer();
      if (buffer.byteLength < 1000) {
        return json({ error: "이미지 데이터가 너무 작습니다(실패 가능)." }, 502);
      }

      const mimeType = blob.type || "image/jpeg";
      const base64String = encode(new Uint8Array(buffer));
      const dataUrl = `data:${mimeType};base64,${base64String}`;

      return json({ url: dataUrl }, 200);
    }

    // 3) EMAIL (Resend API - 무료 100건/일)
    if (type === "email") {
      const resendKey = Deno.env.get("RESEND_API_KEY");
      if (!resendKey) return json({ error: "RESEND_API_KEY가 설정되지 않았습니다." }, 500);

      const { from_name, from_email, message } = body;
      if (!from_name || !from_email || !message) {
        return json({ error: "from_name, from_email, message 필드가 필요합니다." }, 400);
      }

      const r = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Portfolio Contact <onboarding@resend.dev>",
          to: ["01051188129e@gmail.com"],
          subject: `[Portfolio] New message from ${from_name}`,
          html: `
            <h2>New Contact Message</h2>
            <p><strong>From:</strong> ${from_name} (${from_email})</p>
            <hr/>
            <p><strong>Message:</strong></p>
            <p>${message}</p>
          `,
          reply_to: from_email,
        }),
      });

      const data = await r.json();
      if (!r.ok) {
        return json({ error: "이메일 전송 실패", details: data }, r.status);
      }
      return json({ success: true, id: data.id });
    }

    return json({ error: `지원하지 않는 type: ${type}` }, 400);
  } catch (e) {
    console.error("[ai-proxy] error:", e);
    return json({ error: e?.message ?? String(e) }, 500);
  }
});