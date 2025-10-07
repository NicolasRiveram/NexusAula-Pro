import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { nivelId, asignaturaId, tema } = await req.json();
    if (!nivelId || !asignaturaId || !tema) {
      throw new Error("nivelId, asignaturaId, y tema son requeridos.");
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

    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-latest:generateContent?key=${apiKey}`;

    const prompt = `
      Eres un asistente experto en el currículum educativo chileno.
      Basado en el nivel, asignatura y tema proporcionados, sugiere todos los Objetivos de Aprendizaje (OA) que sean directamente aplicables. Si hay muchos, prioriza los más importantes.
      Para cada OA, incluye su código (si aplica) y una breve descripción.
      Formato de salida: Una lista numerada de OAs. No incluyas nada más en tu respuesta.

      - Nivel Educativo: ${nivelData.nombre}
      - Asignatura: ${asignaturaData.nombre}
      - Tema a cubrir: ${tema}
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

    return new Response(JSON.stringify({ suggestions: aiText }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error("Error in suggest-learning-objectives:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})