import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { FunctionsHttpError } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    const { suggestions, projectContext, classCount } = await req.json();
    if (!classCount || classCount <= 0) {
      throw new Error("El número de clases (classCount) debe ser un entero positivo.");
    }

    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;

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
      - **Actividades:** Para 'actividades_inicio', 'actividades_desarrollo' y 'actividades_cierre', detalla una secuencia de acciones, incluyendo ejemplos, posibles preguntas para guiar la discusión y una estimación de tiempo para cada fase.
      - **Vínculo y Aspectos:** Ofrece sugerencias concretas para 'vinculo_interdisciplinario' y 'aspectos_valoricos_actitudinales'.
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
    const aiText = data.candidates[0].content.parts[0].text;
    const aiResponseJson = JSON.parse(aiText);

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