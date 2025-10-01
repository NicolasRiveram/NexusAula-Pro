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

    const { block_content, block_type } = await req.json();
    
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

    const contentPrompt = block_type === 'text' 
      ? `el siguiente texto: "${block_content.text}"`
      : `una imagen (no puedo ver la imagen, pero asume que es relevante para generar preguntas educativas).`;

    const prompt = `
      Eres un asistente experto en crear evaluaciones educativas para Chile.
      Basado en ${contentPrompt}, genera un array de 2 a 3 preguntas de selección múltiple en formato JSON.
      La estructura de cada objeto en el array debe ser:
      \`\`\`json
      {
        "enunciado": "string",
        "tipo_item": "seleccion_multiple",
        "puntaje": 5,
        "habilidad_evaluada": "string",
        "nivel_comprension": "string",
        "alternativas": [
          {"texto": "string", "es_correcta": boolean},
          {"texto": "string", "es_correcta": boolean},
          {"texto": "string", "es_correcta": boolean},
          {"texto": "string", "es_correcta": boolean}
        ]
      }
      \`\`\`
      - Asegúrate de que solo UNA alternativa tenga "es_correcta" como true.
      - El puntaje debe ser un número entero.
      - El enunciado y las alternativas deben ser claros y concisos.
      - Para "habilidad_evaluada", identifica una habilidad curricular específica (ej: "Comprensión Lectora", "Análisis de Fuentes", "Resolución de Problemas").
      - Para "nivel_comprension", usa uno de los niveles de la Taxonomía de Bloom: "Recordar", "Comprender", "Aplicar", "Analizar", "Evaluar", "Crear".
      - Tu respuesta DEBE ser únicamente el array JSON dentro de un bloque de código.
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
    console.error("Error in generate-questions:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})