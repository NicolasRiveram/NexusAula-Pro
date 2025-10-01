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

    const { suggestions, projectContext } = await req.json();

    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const prompt = `
      Eres un asistente experto en planificación de clases y didáctica para la educación chilena.
      Basado en las sugerencias de la unidad (objetivos, propósito, proyecto), genera una secuencia de 3 clases detalladas.
      Tu respuesta DEBE ser un array de objetos JSON, con la siguiente estructura para cada objeto:
      \`\`\`json
      {
        "titulo": "string",
        "objetivos_clase": "string",
        "objetivo_estudiante": "string",
        "aporte_proyecto": "string",
        "actividades_inicio": "string",
        "actividades_desarrollo": "string",
        "actividades_cierre": "string",
        "recursos": "string",
        "objetivo_aprendizaje_texto": "string",
        "habilidades": "string",
        "vinculo_interdisciplinario": "string",
        "aspectos_valoricos_actitudinales": "string"
      }
      \`\`\`
      - Asegúrate de que el 'objetivo_aprendizaje_texto' se relacione con los OAs proporcionados.
      - Si se proporciona un contexto de proyecto, asegúrate de que el campo 'aporte_proyecto' sea coherente con él.
      - NO incluyas nada más en tu respuesta, solo el array de objetos JSON en un bloque de código.

      Aquí están los detalles de la unidad:
      - Sugerencias de la unidad: ${JSON.stringify(suggestions)}
      - Contexto del proyecto: ${projectContext ? 'Sí, esta unidad es parte de un proyecto ABP.' : 'No, esta unidad no es parte de un proyecto ABP.'}
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
    console.error("Error in generate-class-sequence:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})