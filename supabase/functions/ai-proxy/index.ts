import "@supabase/functions-js/edge-runtime.d.ts"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
// 💡 [추가] Deno 표준 라이브러리에서 Base64 인코더를 가져옵니다.
import { encode } from "https://deno.land/std@0.168.0/encoding/base64.ts"

// 1. 모든 응답(성공/실패/Preflight)에 필요한 CORS 헤더
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  // 2. Preflight (OPTIONS) 요청 즉시 처리
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { type, prompt } = await req.json();
    const hfToken = Deno.env.get('HF_TOKEN');
    const groqKey = Deno.env.get('GROQ_API_KEY');

    // 3. 텍스트 대화 (Groq)
    if (type === 'text') {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${groqKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant",
          messages: prompt,
          temperature: 0.7
        })
      });
      const data = await response.text();
      return new Response(data, { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // 4. 미디어 생성 (Hugging Face - Router API 적용)
    if (type === 'image' || type === 'music') {
      const modelId = type === 'image'
        ? 'black-forest-labs/FLUX.1-schnell'
        : 'facebook/musicgen-small';

      const response = await fetch(`https://router.huggingface.co/hf-inference/models/${modelId}`, {
        headers: {
          Authorization: `Bearer ${hfToken}`,
          "Content-Type": "application/json",
          "x-wait-for-model": "true"
        },
        method: "POST",
        body: JSON.stringify({ inputs: prompt }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[HF Router Error] Status: ${response.status}, Body: ${errorText}`);
        return new Response(JSON.stringify({ error: `Router API Fail`, details: errorText }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      const buffer = await response.arrayBuffer();
      // 데이터가 너무 작으면 에러로 간주
      if (buffer.byteLength < 1000) throw new Error("수신된 데이터가 너무 작습니다.");

      // 💡 [핵심 변경] 바이너리를 서버에서 바로 Data URL(Base64)로 굽습니다!
      const base64String = encode(buffer);
      const mimeType = type === 'image' ? 'image/jpeg' : 'audio/mpeg';
      const dataUrl = `data:${mimeType};base64,${base64String}`;

      // JSON 형태로 안전하게 프론트엔드로 전달
      return new Response(JSON.stringify({ url: dataUrl }), {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    }

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
})