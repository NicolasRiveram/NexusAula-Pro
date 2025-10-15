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
    const { itemId } = await req.json();
    if (!itemId) {
      throw new Error("El ID del ítem (itemId) es requerido.");
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { data: item, error: fetchError } = await supabaseAdmin
      .from('evaluacion_items')
      .select('enunciado, item_alternativas(*)')
      .eq('id', itemId)
      .single();

    if (fetchError) throw new Error(`Error al obtener la pregunta para adaptar: ${fetchError.message}`);
    if (!item) throw new Error('Pregunta no encontrada.');

    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) {
      throw new Error("La clave de API de Gemini no está configurada.");
    }
    
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`;

    const prompt = `
      Eres un experto psicopedagogo y especialista en diseño de evaluaciones para el Programa de Integración Escolar (PIE) de Chile.
      Tu tarea es adaptar una pregunta de selección múltiple para hacerla más accesible, clara y directa para estudiantes con necesidades de apoyo.
      Aplica las siguientes reglas estrictas e inquebrantables:
      1.  **Simplifica el Enunciado:** Reformula la pregunta usando un lenguaje más simple y directo, eliminando ambigüedades.
      2.  **Resalta Palabras Clave:** Identifica y marca en negrita (usando markdown bold, por ejemplo **palabra**) los conceptos o palabras más importantes DENTRO DEL NUEVO ENUNCIADO para enfocar la atención del estudiante.
      3.  **Reduce Alternativas:** Analiza las alternativas originales y elimina la que sea menos plausible o más confusa, dejando solo 3 opciones en total.
      4.  **Mantén la Coherencia:** La alternativa que era correcta originalmente debe seguir siendo la correcta entre las 3 restantes.
      5.  **Simplifica Alternativas:** Reescribe el texto de las 3 alternativas finales para que sean más cortas y fáciles de entender.
      6.  **IMPORTANTE:** NO uses negritas ni ningún otro formato de texto en las alternativas. El resaltado es solo para el enunciado.
      
      Devuelve un objeto JSON con la siguiente estructura:
      \`\`\`json
      {
        "enunciado_adaptado": "string",
        "alternativas_adaptadas": [
          {"texto": "string", "es_correcta": boolean, "orden": 1},
          {"texto": "string", "es_correcta": boolean, "orden": 2},
          {"texto": "string", "es_correcta": boolean, "orden": 3}
        ]
      }
      \`\`\`
      - El campo 'orden' es crucial y debe ser un valor numérico secuencial (1, 2, 3) para las tres alternativas.
      - Tu respuesta DEBE ser únicamente el objeto JSON dentro de un bloque de código.

      Pregunta original:
      ${JSON.stringify(item)}
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
    console.error("Error in adapt-question-pie:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})