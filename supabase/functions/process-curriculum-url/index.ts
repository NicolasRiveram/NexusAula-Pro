import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import * as pdfjs from 'https://esm.sh/pdfjs-dist@4.4.168/legacy/build/pdf.mjs';
import { parse } from 'https://esm.sh/node-html-parser';

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

function extractTextFromHtml(html: string): string {
  const root = parse(html);
  return root.structuredText;
}

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
    const { url, nivelId, asignaturaId } = await req.json();
    if (!url || !nivelId || !asignaturaId) {
      throw new Error("url, nivelId, y asignaturaId son requeridos.");
    }

    // 1. Fetch content from URL
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`No se pudo acceder a la URL. Estado: ${response.status}`);
    }
    const contentType = response.headers.get('content-type') || '';
    let documentText = '';

    if (contentType.includes('application/pdf')) {
      const pdfBuffer = await response.arrayBuffer();
      documentText = await extractTextFromPdf(pdfBuffer);
    } else if (contentType.includes('text/html')) {
      const html = await response.text();
      documentText = extractTextFromHtml(html);
    } else {
      documentText = await response.text();
    }

    // 2. Get Nivel and Asignatura names for the prompt
    const { data: nivelData } = await supabaseAdmin.from('niveles').select('nombre').eq('id', nivelId).single();
    const { data: asignaturaData } = await supabaseAdmin.from('asignaturas').select('nombre').eq('id', asignaturaId).single();

    // 3. Call Gemini AI
    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) throw new Error("GEMINI_API_KEY not set.");
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

    const prompt = `
      # ROL Y OBJETIVO
      Eres un sistema automatizado de extracción de datos curriculares. Tu única función es acceder al contenido proporcionado, analizarlo según la asignatura y nivel especificados, y extraer de forma exhaustiva y precisa todos los componentes pedagógicos. El resultado final debe ser un único objeto JSON estructurado.

      # INSTRUCCIONES
      1.  **Analizar:** Lee el contenido completo del documento. Identifica la sección principal que corresponde a la [ASIGNATURA] y al [NIVEL] indicados.
      2.  **Extraer Componentes:** De la sección identificada, extrae la totalidad de los siguientes elementos, manteniendo su texto íntegro:
          *   Ejes Temáticos.
          *   Habilidades (con su código/letra y descripción).
          *   Actitudes (con su código/letra y descripción).
          *   Objetivos de Aprendizaje (con su código "OA X" y descripción completa).
      3.  **Estructurar la Salida:** Organiza toda la información extraída en un solo objeto JSON. La estructura debe ser un objeto con una clave "ejes", que es un array. Cada objeto "eje" debe contener su nombre y tres arrays: "habilidades", "actitudes" y "objetivos_aprendizaje". No agregues comentarios ni texto fuera del formato JSON.

      # DATOS DE ENTRADA
      [ASIGNATURA]: "${asignaturaData?.nombre || 'No especificada'}"
      [NIVEL]: "${nivelData?.nombre || 'No especificado'}"
      [CONTENIDO_DOCUMENTO]: """
      ${documentText.substring(0, 25000)}
      """

      # FORMATO DE SALIDA
      \`\`\`json
      {
        "ejes": [
          {
            "nombre": "Nombre del Eje",
            "habilidades": [
              { "codigo": "A", "descripcion": "Descripción de la habilidad A." }
            ],
            "actitudes": [
              { "codigo": "OA A", "descripcion": "Descripción de la actitud A." }
            ],
            "objetivos_aprendizaje": [
              { "codigo": "OA 1", "descripcion": "Descripción del objetivo 1." }
            ]
          }
        ]
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
    const curriculumData = cleanAndParseJson(aiText);

    // 4. Store data in database
    let counters = { ejes: 0, habilidades: 0, actitudes: 0, oas: 0 };

    for (const eje of curriculumData.ejes || []) {
      const { data: ejeData, error: ejeError } = await supabaseAdmin
        .from('ejes').upsert({ nombre: eje.nombre, asignatura_id: asignaturaId }, { onConflict: 'nombre, asignatura_id' }).select().single();
      if (ejeError) throw new Error(`Error al guardar eje: ${ejeError.message}`);
      counters.ejes++;

      const upsertItems = async (items: any[], table: string, counterKey: keyof typeof counters) => {
        if (!items || items.length === 0) return;
        const itemsToInsert = items.map((item: any) => ({
          ...item,
          nivel_id: nivelId,
          asignatura_id: asignaturaId,
          eje_id: ejeData.id,
        }));
        const { error } = await supabaseAdmin.from(table).upsert(itemsToInsert, { onConflict: 'codigo, nivel_id, asignatura_id' });
        if (error) throw new Error(`Error al guardar en ${table}: ${error.message}`);
        counters[counterKey] += items.length;
      };

      await upsertItems(eje.habilidades, 'habilidades', 'habilidades');
      await upsertItems(eje.actitudes, 'actitudes', 'actitudes');
      await upsertItems(eje.objetivos_aprendizaje, 'objetivos_aprendizaje', 'oas');
    }

    const message = `Proceso completado: ${counters.ejes} ejes, ${counters.habilidades} habilidades, ${counters.actitudes} actitudes y ${counters.oas} OAs guardados.`;

    return new Response(JSON.stringify({ message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error("Error in process-curriculum-url:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});