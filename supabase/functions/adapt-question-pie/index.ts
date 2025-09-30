import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai";

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

    const { item } = await req.json(); // The item object will be passed from the frontend

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
      Eres un asistente experto en adaptaciones curriculares para el Programa de Integración Escolar (PIE) de Chile.
      Tu tarea es adaptar una pregunta de selección múltiple para hacerla más accesible.
      Aplica las siguientes reglas:
      1. Simplifica el lenguaje del enunciado.
      2. Resalta palabras clave en el enunciado usando markdown bold (**palabra**).
      3. Reduce el número de alternativas de 4 a 3, eliminando el distractor menos plausible.
      4. Simplifica el texto de las alternativas restantes.
      
      Devuelve un objeto JSON con la siguiente estructura:
      \`\`\`json
      {
        "enunciado_adaptado": "string",
        "alternativas_adaptadas": [
          {"texto": "string", "es_correcta": boolean},
          {"texto": "string", "es_correcta": boolean},
          {"texto": "string", "es_correcta": boolean}
        ]
      }
      \`\`\`
      - Asegúrate de que la alternativa correcta original siga siendo la correcta.
      - Tu respuesta DEBE ser únicamente el objeto JSON dentro de un bloque de código.

      Pregunta original:
      ${JSON.stringify(item)}
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const aiText = response.text();
    
    const aiResponseJson = cleanAndParseJson(aiText);

    return new Response(JSON.stringify(aiResponseJson), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error("Error in adapt-question-pie:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})