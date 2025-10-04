import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  try {
    const { nivelId, asignaturaId, ejeId, text } = await req.json();
    if (!nivelId || !asignaturaId || !ejeId || !text) {
      throw new Error("nivelId, asignaturaId, ejeId, y text son requeridos.");
    }

    const lines = text.trim().split('\n');
    const objectives = [];
    let currentObjective: { codigo: string; descripcion: string } | null = null;

    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine) continue;

      // Heuristic to detect a new objective code line
      const isCodeLine = /^(OA|OI|AE|Objetivo)[\s-]?\d+/.test(trimmedLine) && trimmedLine.length < 20;

      if (isCodeLine) {
        if (currentObjective && currentObjective.descripcion) {
          objectives.push(currentObjective);
        }
        currentObjective = {
          codigo: trimmedLine.replace(/:$/, '').trim(),
          descripcion: '',
        };
      } else {
        if (currentObjective) {
          const descriptionPart = trimmedLine.replace(/^:\s*/, '');
          currentObjective.descripcion += (currentObjective.descripcion ? ' ' : '') + descriptionPart;
        }
      }
    }

    if (currentObjective && currentObjective.descripcion) {
      objectives.push(currentObjective);
    }

    if (objectives.length === 0) {
      throw new Error("No se encontraron objetivos válidos. Asegúrate de que cada objetivo tenga un código (ej: OA 1) en una línea y su descripción debajo.");
    }

    const objectivesToUpsert = objectives.map(obj => ({
      ...obj,
      nivel_id: nivelId,
      asignatura_id: asignaturaId,
      eje_id: ejeId,
    }));

    const { data, error } = await supabaseAdmin
      .from('objetivos_aprendizaje')
      .upsert(objectivesToUpsert, { onConflict: 'codigo, nivel_id, asignatura_id' })
      .select();

    if (error) {
      throw new Error(`Error al guardar los objetivos: ${error.message}`);
    }

    return new Response(JSON.stringify({ message: `${data.length} objetivos guardados correctamente.` }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error("Error in bulk-insert-objectives:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});