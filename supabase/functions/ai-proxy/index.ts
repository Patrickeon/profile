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

    // 1) TEXT (Groq)
    if (type === "text") {
      const groqKey = Deno.env.get("GROQ_API_KEY");
      if (!groqKey) return json({ error: "GROQ_API_KEY가 설정되어 있지 않습니다." }, 500);
      if (!Array.isArray(prompt)) return json({ error: "text 타입은 prompt가 messages 배열이어야 합니다." }, 400);

      const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${groqKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant",
          messages: prompt,
          temperature: 0.7,
        }),
      });

      const text = await r.text();
      if (!r.ok) {
        return json({ error: "Groq 호출 실패", details: text }, r.status);
      }

      // Groq 원문 그대로 반환
      return new Response(text, {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
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

    // 3) MUSIC은 프론트에서 HF Spaces(Gradio)로 처리 (무료 데모용)
    if (type === "music") {
      return json(
        {
          error: "music은 현재 무료 데모 모드로 프론트에서 HF Spaces를 직접 호출합니다.",
          hint: "프론트 generateMusicFree() 사용",
        },
        400
      );
    }

    return json({ error: `지원하지 않는 type: ${type}` }, 400);
  } catch (e) {
    console.error("[ai-proxy] error:", e);
    return json({ error: e?.message ?? String(e) }, 500);
  }
});