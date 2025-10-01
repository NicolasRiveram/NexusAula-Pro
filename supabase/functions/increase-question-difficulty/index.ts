import { serve } from "https://deno.land/std@0.190.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function cleanAndParseJson(text: string): any {
  const jsonMatch = text.match(/```json([\s\S]*?)```/);
  const jsonString = jsonMatch ? jsonMatch[1].trim() : text;
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    console.error("Failed to parse JSON from AI response:", jsonString);
    throw new Error("La respuesta de la IA no tenía un formato JSON válido.");
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) {
      throw new Error("La clave de API de Gemini no está configurada.");
    }

    const { item } = await req.json();

    const API_URL = `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${apiKey}`;

    const prompt = `
      Eres un asistente experto en diseño de evaluaciones.
      Tu tarea es aumentar la dificultad de una pregunta de selección múltiple.
      Aplica las siguientes técnicas:
      1. Reformula el enunciado para que requiera un mayor nivel de inferencia o análisis.
      2. Haz los distractores (alternativas incorrectas) más plausibles y sutilmente incorrectos.
      
      Devuelve un objeto JSON con la siguiente estructura, manteniendo el mismo número de alternativas:
      \`\`\`json
      {
        "enunciado": "string",
        "alternativas": [
          {"texto": "string", "es_correcta": boolean, "orden": number},
          {"texto": "string", "es_correcta": boolean, "orden": number},
          {"texto": "string", "es_correcta": boolean, "orden": number},
          {"texto": "string", "es_correcta": boolean, "orden": number}
        ]
      }
      \`\`\`
      - La alternativa correcta debe seguir siendo la misma.
      - Mantén el campo 'orden' para cada alternativa.
      - Tu respuesta DEBE ser únicamente el objeto JSON dentro de un bloque de código.

      Pregunta original:
      ${JSON.stringify(item)}
    `;

    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    });

    if (!res.ok) {
      const errorBody = await res.json();
      throw new Error(`[GoogleGenerativeAI Error]: ${res.status} ${res.statusText} - ${JSON.stringify(errorBody)}`);
    }

    const data = await res.json();
    const aiText = data.candidates[0].content.parts[0].text;
    const aiResponseJson = cleanAndParseJson(aiText);

    return new Response(JSON.stringify(aiResponseJson), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error("Error in increase-question-difficulty:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})