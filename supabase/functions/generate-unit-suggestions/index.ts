import { serve } from "https://deno.land/std@0.190.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function cleanAndParseJson(text: string): any {
  // Attempt to find JSON within markdown code blocks
  const markdownMatch = text.match(/```json([\s\S]*?)```/);
  let potentialJson = markdownMatch ? markdownMatch[1].trim() : text;

  // Find the start of a JSON object or array
  const firstBracket = potentialJson.indexOf('[');
  const firstBrace = potentialJson.indexOf('{');
  
  let startIndex = -1;
  if (firstBracket === -1) {
    startIndex = firstBrace;
  } else if (firstBrace === -1) {
    startIndex = firstBracket;
  } else {
    startIndex = Math.min(firstBracket, firstBrace);
  }

  if (startIndex === -1) {
    console.error("No JSON start character ([ or {) found in AI response:", potentialJson);
    throw new Error("La respuesta de la IA no contenía un objeto o array JSON.");
  }

  // Find the end of the JSON object or array
  const lastBracket = potentialJson.lastIndexOf(']');
  const lastBrace = potentialJson.lastIndexOf('}');
  const endIndex = Math.max(lastBracket, lastBrace);

  if (endIndex === -1) {
    console.error("No JSON end character (] or }) found in AI response:", potentialJson);
    throw new Error("El objeto o array JSON en la respuesta de la IA estaba incompleto.");
  }

  const jsonString = potentialJson.substring(startIndex, endIndex + 1);

  try {
    return JSON.parse(jsonString);
  } catch (error) {
    console.error("Failed to parse extracted JSON:", error);
    console.error("Extracted string for parsing:", jsonString);
    throw new Error("La respuesta de la IA no tenía un formato JSON válido, incluso después de intentar extraerlo.");
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

    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`;

    const prompt = `
      Eres un asistente experto en diseño curricular y pedagogía para la educación chilena.
      Tu tarea es generar una propuesta para una unidad de planificación. Basado en el título, descripción y las instrucciones adicionales, debes devolver un objeto JSON con la siguiente estructura:
      \`\`\`json
      {
        "objetivos": ["string", "string", ...],
        "proposito": "string",
        "proyectoABP": {
          "titulo": "string",
          "descripcion": "string",
          "productoFinal": "string"
        }
      }
      \`\`\`
      - Los 'objetivos' deben ser todos los Objetivos de Aprendizaje (OA) del currículum chileno que sean relevantes y coherentes con el tema, incluyendo su código si es posible (ej: "OA-6: ..."). Si hay muchos, prioriza los más importantes.
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
    const candidate = data.candidates?.[0];
    if (!candidate || !candidate.content?.parts?.[0]?.text) {
      console.error("Invalid AI response structure:", JSON.stringify(data, null, 2));
      throw new Error("La IA devolvió una respuesta con una estructura inesperada.");
    }
    const aiText = candidate.content.parts[0].text;
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