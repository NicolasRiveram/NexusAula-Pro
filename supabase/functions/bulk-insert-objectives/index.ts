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

    // --- PARSING LOGIC ---
    const lines = text.trim().split('\n');
    const objectives = [];
    let currentObjective: { codigo: string; descripcion: string } | null = null;

    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine) continue;

      // Heuristic to detect a new objective code line (e.g., "OA 1", "Objetivo 3")
      const isCodeLine = /^(OA|OI|AE|Objetivo)[\s-]?\d+/.test(trimmedLine) && trimmedLine.length < 20;

      if (isCodeLine) {
        // If we were building a previous objective, save it before starting a new one.
        if (currentObjective && currentObjective.descripcion) {
          objectives.push(currentObjective);
        }
        // Start a new objective.
        currentObjective = {
          codigo: trimmedLine.replace(/:$/, '').trim(),
          descripcion: '',
        };
      } else {
        // If it's not a code line, it's part of the description of the current objective.
        if (currentObjective) {
          const descriptionPart = trimmedLine.replace(/^:\s*/, '');
          currentObjective.descripcion += (currentObjective.descripcion ? ' ' : '') + descriptionPart;
        }
      }
    }

    // Add the last objective being processed
    if (currentObjective && currentObjective.descripcion) {
      objectives.push(currentObjective);
    }

    if (objectives.length === 0) {
      throw new Error("No se encontraron objetivos válidos. Asegúrate de que cada objetivo tenga un código (ej: OA 1) en una línea y su descripción debajo.");
    }

    // --- DATABASE LOGIC ---
    const { data: existingOas, error: fetchError } = await supabaseAdmin
      .from('objetivos_aprendizaje')
      .select('id, codigo')
      .eq('nivel_id', nivelId)
      .eq('asignatura_id', asignaturaId);

    if (fetchError) {
      throw new Error(`Error fetching existing objectives: ${fetchError.message}`);
    }

    const existingOaMap = new Map(existingOas.map((oa: any) => [oa.codigo, oa.id]));
    const oasToInsert = [];
    const oasToUpdate = [];

    for (const oa of objectives) {
      const payload = {
        ...oa,
        nivel_id: nivelId,
        asignatura_id: asignaturaId,
        eje_id: ejeId,
      };
      const existingId = existingOaMap.get(oa.codigo);
      if (existingId) {
        oasToUpdate.push({ ...payload, id: existingId });
      } else {
        oasToInsert.push(payload);
      }
    }

    let insertedCount = 0;
    let updatedCount = 0;

    if (oasToInsert.length > 0) {
      const { data, error: insertError } = await supabaseAdmin
        .from('objetivos_aprendizaje')
        .insert(oasToInsert)
        .select();
      if (insertError) {
        throw new Error(`Error inserting new objectives: ${insertError.message}`);
      }
      insertedCount = data.length;
    }

    if (oasToUpdate.length > 0) {
      for (const oaToUpdate of oasToUpdate) {
        const { id, ...updateData } = oaToUpdate;
        const { error: updateError } = await supabaseAdmin
          .from('objetivos_aprendizaje')
          .update(updateData)
          .eq('id', id);
        if (updateError) {
          console.error(`Failed to update OA with id ${id}:`, updateError);
        } else {
          updatedCount++;
        }
      }
    }

    const message = `Proceso completado. ${insertedCount} objetivos creados, ${updatedCount} objetivos actualizados.`;

    return new Response(JSON.stringify({ message }), {
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