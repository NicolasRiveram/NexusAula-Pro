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

  try {
    const { nivelId, asignaturaId, ejeId, text } = await req.json();
    if (!nivelId || !asignaturaId || !ejeId || !text) {
      throw new Error("nivelId, asignaturaId, ejeId, y text son requeridos.");
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const lines = text.trim().split('\n').filter((line: string) => line.trim() !== '');
    const objectivesToUpsert = [];

    for (const line of lines) {
      const match = line.match(/^([^:]+):\s*(.*)$/);
      if (match) {
        const codigo = match[1].trim();
        const descripcion = match[2].trim();
        if (codigo && descripcion) {
          objectivesToUpsert.push({
            codigo,
            descripcion,
            nivel_id: nivelId,
            asignatura_id: asignaturaId,
            eje_id: ejeId,
          });
        }
      }
    }

    if (objectivesToUpsert.length === 0) {
      throw new Error("No se encontraron objetivos válidos en el formato 'CODIGO: Descripción'.");
    }

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