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

    const lines = text.trim().split('\n').filter((line: string) => line.trim() !== '');
    const objectivesMap = new Map<string, any>();

    for (const line of lines) {
      const match = line.match(/^([^:]+):\s*(.*)$/);
      if (match) {
        const codigo = match[1].trim();
        const descripcion = match[2].trim();
        if (codigo && descripcion) {
          // Use a map to handle duplicates in the input text, keeping the last one.
          objectivesMap.set(codigo, {
            codigo,
            descripcion,
            nivel_id: nivelId,
            asignatura_id: asignaturaId,
            eje_id: ejeId,
          });
        }
      }
    }

    const objectivesFromText = Array.from(objectivesMap.values());

    if (objectivesFromText.length === 0) {
      throw new Error("No se encontraron objetivos válidos en el formato 'CODIGO: Descripción'.");
    }

    // Fetch existing OAs to determine which to insert and which to update
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

    for (const oa of objectivesFromText) {
      const existingId = existingOaMap.get(oa.codigo);
      if (existingId) {
        oasToUpdate.push({ ...oa, id: existingId });
      } else {
        oasToInsert.push(oa);
      }
    }

    let insertedCount = 0;
    let updatedCount = 0;

    // Perform inserts
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

    // Perform updates
    if (oasToUpdate.length > 0) {
      for (const oaToUpdate of oasToUpdate) {
        const { id, ...updateData } = oaToUpdate;
        const { error: updateError } = await supabaseAdmin
          .from('objetivos_aprendizaje')
          .update(updateData)
          .eq('id', id);
        if (updateError) {
          console.error(`Failed to update OA with id ${id}:`, updateError);
          // Continue to next update, but log the error
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