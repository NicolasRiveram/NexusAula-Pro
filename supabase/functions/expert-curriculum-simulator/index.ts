import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function cleanAndParseJson(text: string): any {
  const markdownMatch = text.match(/```json([\s\S]*?)```/);
  let potentialJson = markdownMatch ? markdownMatch[1].trim() : text;

  const firstBrace = potentialJson.indexOf('{');
  if (firstBrace === -1) {
    throw new Error("La respuesta de la IA no contenía un objeto JSON.");
  }

  const lastBrace = potentialJson.lastIndexOf('}');
  if (lastBrace === -1) {
    throw new Error("El objeto JSON en la respuesta de la IA estaba incompleto.");
  }

  const jsonString = potentialJson.substring(firstBrace, lastBrace + 1);

  try {
    return JSON.parse(jsonString);
  } catch (error) {
    console.error("Failed to parse extracted JSON:", error);
    console.error("Extracted string for parsing:", jsonString);
    throw new Error("La respuesta de la IA no tenía un formato JSON válido.");
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { nivelId, asignaturaId } = await req.json();
    if (!nivelId || !asignaturaId) {
      throw new Error("nivelId y asignaturaId son requeridos.");
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    const { data: nivelData, error: nivelError } = await supabaseClient.from('niveles').select('nombre').eq('id', nivelId).single();
    if (nivelError) throw new Error(`Error fetching nivel: ${nivelError.message}`);

    const { data: asignaturaData, error: asignaturaError } = await supabaseClient.from('asignaturas').select('nombre').eq('id', asignaturaId).single();
    if (asignaturaError) throw new Error(`Error fetching asignatura: ${asignaturaError.message}`);

    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) {
      throw new Error("La clave de API de Gemini no está configurada.");
    }

    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

    const prompt = `
      Eres un experto en el currículum educativo chileno. Basado en el nivel y asignatura, genera un objeto JSON con los siguientes componentes pedagógicos:
      - ejes: Array de strings con los nombres de los ejes.
      - unidades_propuestas: Array de objetos con "nombre" y "descripcion".
      - objetivos_aprendizaje_clave: Array de objetos con "codigo" y "descripcion".
      - habilidades_principales: Array de strings.
      - actitudes_a_fomentar: Array de strings.
      - conocimientos_esenciales: Array de strings.
      - ejemplos_indicadores: Array de strings.
      - orientaciones_didacticas: Un string con un párrafo.
      - sugerencias_evaluacion: Un string con un párrafo.
      - oat_relevantes: Array de strings.

      Nivel: "${nivelData.nombre}"
      Asignatura: "${asignaturaData.nombre}"

      Tu respuesta DEBE ser únicamente un objeto JSON dentro de un bloque de código.
      \`\`\`json
      {
        "ejes": [],
        "unidades_propuestas": [],
        "objetivos_aprendizaje_clave": [],
        "habilidades_principales": [],
        "actitudes_a_fomentar": [],
        "conocimientos_esenciales": [],
        "ejemplos_indicadores": [],
        "orientaciones_didacticas": "",
        "sugerencias_evaluacion": "",
        "oat_relevantes": []
      }
      \`\`\`
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
    console.error("Error in expert-curriculum-simulator:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})