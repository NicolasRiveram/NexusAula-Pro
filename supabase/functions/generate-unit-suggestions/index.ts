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
    console.error("Failed to parse JSON:", error);
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
      throw new Error("La clave de API de Gemini no está configurada en los secretos del proyecto.");
    }

    const { title, description, instructions } = await req.json();

    const API_URL = `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${apiKey}`;

    const prompt = `
      Eres un asistente experto en diseño curricular y pedagogía para la educación chilena.
      Tu tarea es generar una propuesta para una unidad de planificación. Basado en el título, descripción y las instrucciones adicionales, debes devolver un objeto JSON con la siguiente estructura:
      \`\`\`json
      {
        "objetivos": ["string", "string", "string"],
        "proposito": "string",
        "proyectoABP": {
          "titulo": "string",
          "descripcion": "string",
          "productoFinal": "string"
        }
      }
      \`\`\`
      - Los 'objetivos' deben ser 3 Objetivos de Aprendizaje (OA) del currículum chileno, relevantes al tema, incluyendo su código si es posible (ej: "OA-6: ...").
      - El 'proposito' debe ser un párrafo conciso que resuma la intención pedagógica de la unidad.
      - El 'proyectoABP' debe ser una idea de proyecto de Aprendizaje Basado en Proyectos, simple y aplicable.
      - NO incluyas nada más en tu respuesta, solo el bloque de código JSON.

      Aquí están los detalles de la unidad:
      - Título: ${title}
      - Descripción de Contenidos: ${description}
      - Instrucciones Adicionales: ${instructions || 'Ninguna'}
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
    console.error("Error in generate-unit-suggestions:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})