import "@supabase/functions-js/edge-runtime.d.ts"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { encode } from "https://deno.land/std@0.168.0/encoding/base64.ts"
import { HfInference } from "https://esm.sh/@huggingface/inference"

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

    // 4. 미디어 생성 (Hugging Face 공식 SDK)
    if (type === 'image' || type === 'music') {
      const hf = new HfInference(hfToken);
      let buffer: ArrayBuffer;
      let mimeType = '';

      if (type === 'image') {
        const blob = await hf.textToImage({
          model: 'black-forest-labs/FLUX.1-schnell',
          inputs: prompt,
        });
        buffer = await blob.arrayBuffer();
        mimeType = blob.type || 'image/jpeg';
      } else {
        // 오디오 생성 (Suno Bark 모델로 변경 및 예외 처리 추가)
        try {
          // Bark 모델은 프롬프트 앞에 [music] 태그를 달아주면 음악성 사운드를 생성합니다.
          const audioPrompt = `[music] ${prompt}`; 
          let blob;
          
          if (typeof hf.textToAudio === 'function') {
            blob = await hf.textToAudio({
              model: 'suno/bark-small', // 💡 현재 가장 안정적인 무료 오디오 모델
              inputs: audioPrompt,
            });
          } else {
            blob = await hf.textToSpeech({
              model: 'suno/bark-small',
              inputs: audioPrompt,
            });
          }
          buffer = await blob.arrayBuffer();
          mimeType = blob.type || 'audio/wav';
          
        } catch (audioErr) {
          // 💡 허깅페이스 서버가 닫혀있을 때를 대비한 방어 코드
          console.error("[HF Audio Error]", audioErr);
          throw new Error("현재 Hugging Face 무료 오디오 생성 서버의 자원이 모두 사용 중입니다. 잠시 후 다시 시도해주세요.");
        }
      }

      if (buffer.byteLength < 1000) throw new Error("생성된 데이터가 너무 작습니다. (생성 실패)");

      // 바이너리를 서버에서 바로 Data URL(Base64)로 인코딩
      const base64String = encode(buffer);
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
    console.error("[System Error]", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
})