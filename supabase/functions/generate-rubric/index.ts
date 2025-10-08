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
      throw new Error("La clave de API de Gemini no está configurada en los secretos del proyecto (GEMINI_API_KEY).");
    }

    const { activity, description, nivelNombre, asignaturaNombre, cantidadCategorias, objetivos } = await req.json();
    if (!activity || !description || !nivelNombre || !asignaturaNombre || !cantidadCategorias) {
        throw new Error("Faltan parámetros requeridos en la solicitud.");
    }

    const API_URL = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const prompt = `
      Eres un asistente experto en crear rúbricas de evaluación para Chile.
      Basado en la información proporcionada, genera una rúbrica en formato JSON.
      
      La estructura del objeto JSON debe ser:
      \`\`\`json
      {
        "criterios": [
          {
            "nombre": "string",
            "habilidad": "string",
            "descripcion": "string",
            "niveles": [
              {"puntaje": 5, "nombre": "Logrado", "descripcion": "string"},
              {"puntaje": 4, "nombre": "Suficiente", "descripcion": "string"},
              {"puntaje": 3, "nombre": "Básico", "descripcion": "string"},
              {"puntaje": 2, "nombre": "Inicial", "descripcion": "string"},
              {"puntaje": 1, "nombre": "No logrado", "descripcion": "string"}
            ]
          }
        ]
      }
      \`\`\`
      - **Exhaustividad y Calidad:** Genera exactamente ${cantidadCategorias} criterios de evaluación relevantes y detallados.
      - **Vinculación Curricular:** Basa cada criterio en los Objetivos de Aprendizaje (OAs) proporcionados.
      - **Descriptores Objetivos:** Para cada nivel de logro, escribe un descriptor de desempeño que describa una acción o resultado observable y medible. Los descriptores entre niveles deben ser objetivamente muy diferentes para evidenciar una progresión gradual y clara, evitando términos ambiguos como 'a veces' o 'casi siempre'.
      - **Habilidad:** La 'habilidad' debe ser una habilidad general y relevante asociada al criterio (ej: "Pensamiento Crítico", "Comunicación Efectiva", "Análisis de Datos").
      - **Formato:** Tu respuesta DEBE ser únicamente el objeto JSON dentro de un bloque de código.

      Detalles de la actividad:
      - Nivel Educativo: ${nivelNombre}
      - Asignatura: ${asignaturaNombre}
      - Actividad a evaluar: ${activity}
      - Descripción de la actividad: ${description}
      - Objetivos de Aprendizaje a considerar: ${objetivos || 'No especificados'}
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
    console.error("Error detallado en la función 'generate-rubric':", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})