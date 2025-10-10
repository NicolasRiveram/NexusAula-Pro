import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { FunctionsHttpError } from 'https://esm.sh/@supabase/supabase-js@2'

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

    const { suggestions, projectContext, classCount, batchNumber, totalBatches } = await req.json();
    if (!classCount || classCount <= 0) {
      throw new Error("El número de clases (classCount) debe ser un entero positivo.");
    }

    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`;

    const prompt = `
      Eres un asistente experto en planificación de clases y didáctica para la educación chilena.
      Basado en las sugerencias de la unidad, genera una secuencia de ${classCount} clases detalladas.
      Tu respuesta DEBE ser un array de objetos JSON, con la siguiente estructura para cada objeto:
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
      - **Exhaustividad Obligatoria:** DEBES rellenar TODOS los campos del JSON con contenido sustancial y detallado. No dejes campos vacíos o con texto genérico.
      - **Objetivo de Aprendizaje:** En 'objetivo_aprendizaje_texto', selecciona el OA más pertinente de la lista proporcionada y escríbelo completo.
      - **Habilidades:** En 'habilidades', lista al menos 2-3 habilidades concretas que se desarrollarán (ej: "Análisis de fuentes, Comparación, Argumentación").
      - **Objetivo Estudiante:** En 'objetivo_estudiante', redacta una meta clara y motivadora desde la perspectiva del alumno (ej: "Hoy aprenderé a identificar las causas de la Revolución Francesa.").
      - **Aporte al Proyecto:** Si el contexto del proyecto es 'Sí', describe en 'aporte_proyecto' cómo esta clase contribuye de forma específica al proyecto ABP. Si es 'No', indica "No aplica".
      - **Actividades:** Para 'actividades_inicio', 'actividades_desarrollo' y 'actividades_cierre', detalla una secuencia de acciones claras y concisas para cada fase de la clase.
      - **Vínculo y Aspectos:** Ofrece sugerencias concretas para 'vinculo_interdisciplinario' y 'aspectos_valoricos_actitudinales'.
      - **Contexto de Lote:** Estás generando el lote ${batchNumber || 1} de ${totalBatches || 1}. Asegúrate de que las clases sean una continuación lógica si el número de lote es mayor que 1.
      - **Formato:** Tu respuesta DEBE ser únicamente el array de objetos JSON. No incluyas markdown.

      Aquí están los detalles de la unidad:
      - Sugerencias de la unidad: ${JSON.stringify(suggestions)}
      - Contexto del proyecto: ${projectContext ? 'Sí, esta unidad es parte de un proyecto ABP.' : 'No, esta unidad no es parte de un proyecto ABP.'}
    `;

    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        contents: [{ parts: [{ text: prompt }] }]
      }),
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
    console.error("Error in generate-class-sequence:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})