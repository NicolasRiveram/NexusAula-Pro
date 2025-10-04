import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import * as pdfjs from "https://esm.sh/pdfjs-dist@4.4.168";

// This is required for pdfjs to work in Deno
pdfjs.GlobalWorkerOptions.workerSrc = "https://esm.sh/pdfjs-dist@4.4.168/build/pdf.worker.mjs";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function cleanAndParseJson(text: string): any {
  const jsonMatch = text.match(/```json([\s\S]*?)```/);
  const jsonString = jsonMatch ? jsonMatch[1].trim() : text;
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    console.error("Failed to parse JSON from AI response:", jsonString);
    throw new Error("La respuesta de la IA no tenía un formato JSON válido.");
  }
}

async function extractTextFromPdf(pdfBuffer: ArrayBuffer): Promise<string> {
  const doc = await pdfjs.getDocument(pdfBuffer).promise;
  let text = '';
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    text += content.items.map((item: any) => item.str).join(' ') + '\n';
  }
  return text;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const { jobId } = await req.json();
  if (!jobId) {
    return new Response(JSON.stringify({ error: "jobId is required." }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }

  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  try {
    // 1. Fetch job details
    const { data: job, error: jobError } = await supabaseAdmin
      .from('curriculum_upload_jobs')
      .select('file_path, nivel_id, asignatura_id')
      .eq('id', jobId)
      .single();

    if (jobError) throw new Error(`Error fetching job details: ${jobError.message}`);
    if (!job) throw new Error(`Job with ID ${jobId} not found.`);

    const { file_path: filePath, nivel_id: nivelId, asignatura_id: asignaturaId } = job;

    // 2. Download PDF from Storage
    const { data: fileData, error: downloadError } = await supabaseAdmin.storage
      .from('curriculum-pdfs')
      .download(filePath);
    if (downloadError) throw new Error(`Error downloading PDF: ${downloadError.message}`);
    const pdfBuffer = await fileData.arrayBuffer();

    // 3. Extract text from PDF
    const extractedText = await extractTextFromPdf(pdfBuffer);

    // 4. Call Gemini API
    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) throw new Error("GEMINI_API_KEY is not configured.");
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

    const prompt = `
      Eres un experto en el currículum educativo chileno. Analiza el siguiente texto extraído de un programa de estudio. Identifica y extrae TODOS los Objetivos de Aprendizaje (OAs), Ejes, y Habilidades.

      Devuelve la información en un formato JSON estructurado. La respuesta DEBE ser un único objeto JSON con tres claves principales: "ejes", "habilidades", y "objetivos_aprendizaje".

      1.  **ejes**: Un array de strings con los nombres únicos de los ejes temáticos encontrados.
      2.  **habilidades**: Un array de strings con los nombres únicos de las habilidades encontradas.
      3.  **objetivos_aprendizaje**: Un array de objetos, donde cada objeto representa un OA y tiene la siguiente estructura:
          {
            "codigo": "string",
            "descripcion": "string",
            "eje": "string"
          }

      Ejemplo de la estructura de salida esperada:
      \`\`\`json
      {
        "ejes": ["Lectura", "Escritura", "Comunicación Oral"],
        "habilidades": ["Analizar", "Interpretar", "Crear", "Comunicar"],
        "objetivos_aprendizaje": [
          { "codigo": "OA 1", "descripcion": "Leer y familiarizarse...", "eje": "Lectura" },
          { "codigo": "OA 12", "descripcion": "Escribir frecuentemente...", "eje": "Escritura" }
        ]
      }
      \`\`\`

      Asegúrate de que tu respuesta sea únicamente el objeto JSON dentro de un bloque de código.

      Texto extraído del documento:
      ---
      ${extractedText.substring(0, 100000)}
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
    const aiText = data.candidates[0].content.parts[0].text;
    const curriculumData = cleanAndParseJson(aiText);

    // 5. Upsert data into the database
    const ejeUpserts = (curriculumData.ejes || []).map((nombre: string) => ({ nombre, asignatura_id: asignaturaId }));
    const { data: ejesData, error: ejesError } = await supabaseAdmin.from('ejes').upsert(ejeUpserts, { onConflict: 'nombre, asignatura_id' }).select();
    if (ejesError) throw new Error(`Error upserting ejes: ${ejesError.message}`);
    const ejeMap = new Map(ejesData.map(e => [e.nombre, e.id]));

    const habilidadUpserts = (curriculumData.habilidades || []).map((nombre: string) => ({ nombre }));
    const { error: habilidadesError } = await supabaseAdmin.from('habilidades').upsert(habilidadUpserts, { onConflict: 'nombre' });
    if (habilidadesError) throw new Error(`Error upserting habilidades: ${habilidadesError.message}`);

    const oaInserts = (curriculumData.objetivos_aprendizaje || []).map((oa: any) => ({
      codigo: oa.codigo,
      descripcion: oa.descripcion,
      nivel_id: nivelId,
      asignatura_id: asignaturaId,
      eje_id: ejeMap.get(oa.eje),
    })).filter((oa: any) => oa.eje_id);

    if (oaInserts.length > 0) {
      const { error: oasError } = await supabaseAdmin.from('objetivos_aprendizaje').upsert(oaInserts, { onConflict: 'codigo, nivel_id, asignatura_id' });
      if (oasError) throw new Error(`Error upserting OAs: ${oasError.message}`);
    }

    // 6. Update job status to 'completed'
    await supabaseAdmin.from('curriculum_upload_jobs').update({ status: 'completed' }).eq('id', jobId);

    return new Response(JSON.stringify({ message: "Curriculum processed successfully." }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error("Error in process-curriculum-pdf:", error);
    // Update job status to 'failed'
    await supabaseAdmin.from('curriculum_upload_jobs').update({ status: 'failed', error_message: error.message }).eq('id', jobId);
    
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});