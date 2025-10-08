import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import * as pdfjs from 'https://esm.sh/pdfjs-dist@4.4.168/legacy/build/pdf.mjs';

// Set the workerSrc to the legacy worker script
pdfjs.GlobalWorkerOptions.workerSrc = `https://esm.sh/pdfjs-dist@4.4.168/legacy/build/pdf.worker.mjs`;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function extractTextFromPdf(pdfBuffer: ArrayBuffer): Promise<string> {
  const loadingTask = pdfjs.getDocument({ data: pdfBuffer });
  const pdf = await loadingTask.promise;
  let text = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const strings = content.items.map((item: any) => item.str);
    text += strings.join(' ') + '\n';
  }
  return text;
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
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { jobId } = await req.json();
  if (!jobId) {
    return new Response(JSON.stringify({ error: 'jobId is required' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }

  try {
    const { data: job, error: jobError } = await supabaseAdmin
      .from('curriculum_upload_jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    if (jobError) throw new Error(`Job not found: ${jobError.message}`);

    const { data: fileData, error: downloadError } = await supabaseAdmin.storage
      .from('curriculum_uploads')
      .download(job.file_path);

    if (downloadError) throw new Error(`Failed to download file: ${downloadError.message}`);

    const pdfBuffer = await fileData.arrayBuffer();
    const pdfText = await extractTextFromPdf(pdfBuffer);

    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) throw new Error("GEMINI_API_KEY not set.");

    const API_URL = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;

    const prompt = `
      Eres un experto en el currículum educativo chileno. Analiza el siguiente texto extraído de un programa de estudio y extrae los Objetivos de Aprendizaje (OAs).
      Devuelve un array de objetos JSON con la siguiente estructura:
      \`\`\`json
      [
        {
          "codigo": "OA 1",
          "descripcion": "Descripción completa del objetivo de aprendizaje.",
          "eje": "Nombre del Eje Temático al que pertenece"
        }
      ]
      \`\`\`
      - Asegúrate de que el 'codigo' sea único para cada objetivo.
      - La 'descripcion' debe ser el texto completo del objetivo.
      - El 'eje' debe ser el nombre del eje curricular al que pertenece el OA. Infiere el eje del texto circundante si no está explícito.
      - Tu respuesta DEBE ser únicamente el array JSON dentro de un bloque de código.

      Texto del programa de estudio:
      ---
      ${pdfText.substring(0, 20000)} 
      ---
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
    const parsedOas = cleanAndParseJson(aiText);

    if (!Array.isArray(parsedOas)) {
        throw new Error("La IA no devolvió un array de objetivos.");
    }

    for (const oa of parsedOas) {
      const { data: ejeData, error: ejeError } = await supabaseAdmin
        .from('ejes')
        .upsert({ nombre: oa.eje, asignatura_id: job.asignatura_id }, { onConflict: 'nombre, asignatura_id' })
        .select()
        .single();
      if (ejeError) throw new Error(`Failed to upsert eje '${oa.eje}': ${ejeError.message}`);

      const oaPayload = {
        codigo: oa.codigo,
        descripcion: oa.descripcion,
        nivel_id: job.nivel_id,
        asignatura_id: job.asignatura_id,
        eje_id: ejeData.id,
      };
      const { error: oaError } = await supabaseAdmin
        .from('objetivos_aprendizaje')
        .upsert(oaPayload, { onConflict: 'codigo, nivel_id, asignatura_id' });
      if (oaError) throw new Error(`Failed to upsert OA '${oa.codigo}': ${oaError.message}`);
    }

    await supabaseAdmin
      .from('curriculum_upload_jobs')
      .update({ status: 'completed', error_message: null })
      .eq('id', jobId);

    return new Response(JSON.stringify({ message: `Successfully processed ${parsedOas.length} objectives.` }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    await supabaseAdmin
      .from('curriculum_upload_jobs')
      .update({ status: 'failed', error_message: error.message })
      .eq('id', jobId);

    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
})