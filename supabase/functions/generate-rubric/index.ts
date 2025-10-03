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
      throw new Error("La clave de API de Gemini no está configurada en los secretos del proyecto (GEMINI_API_KEY).");
    }

    const { activity, description, nivelNombre, asignaturaNombre, cantidadCategorias, objetivos } = await req.json();
    if (!activity || !description || !nivelNombre || !asignaturaNombre || !cantidadCategorias) {
        throw new Error("Faltan parámetros requeridos en la solicitud.");
    }

    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

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
      - Genera exactamente ${cantidadCategorias} criterios de evaluación relevantes.
      - Cada criterio debe tener 5 niveles de logro con puntajes de 5 a 1.
      - Los descriptores de desempeño para cada nivel deben ser objetivamente muy diferentes para evidenciar diferencias graduales.
      - La 'habilidad' debe ser una habilidad general asociada al criterio (ej: "Pensamiento Crítico", "Comunicación Efectiva").
      - Tu respuesta DEBE ser únicamente el objeto JSON dentro de un bloque de código.

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