import "@supabase/functions-js/edge-runtime.d.ts"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

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
        ? 'runwayml/stable-diffusion-v1-5' 
        : 'facebook/musicgen-small';

      // 💡 [핵심 변경] 구형 주소 대신 신형 Router 주소를 사용합니다.
      // https://router.huggingface.co/hf-inference/models/ 가 최신 규격입니다.
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
      // 💡 데이터가 너무 작으면 에러로 간주
      if (buffer.byteLength < 1000) throw new Error("수신된 데이터가 너무 작습니다.");

      return new Response(new Uint8Array(buffer), {
        headers: { 
          ...corsHeaders, 
          "Content-Type": type === 'image' ? "image/jpeg" : "audio/mpeg",
          "Content-Length": buffer.byteLength.toString()
        }
      });

      // 💡 [변경] ArrayBuffer를 Uint8Array로 감싸서 응답의 무결성을 보장합니다.
      // const arrayBuffer = await response.arrayBuffer();
      // const uint8Array = new Uint8Array(arrayBuffer);

      // return new Response(uint8Array, {
      //   headers: { 
      //     ...corsHeaders, 
      //     "Content-Type": type === 'image' ? "image/png" : "audio/mpeg", // 💡 png로 명시 권장
      //     "Content-Length": uint8Array.length.toString()
      //   }
      // });
    }

  } catch (error) {
    // 💡 에러 발생 시에도 반드시 CORS 헤더를 포함해야 브라우저가 에러를 읽을 수 있습니다.
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
})