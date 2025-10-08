import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { studentId } = await req.json();
    if (!studentId) {
      throw new Error("studentId is required.");
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    // --- Data Gathering ---
    const [
      profileRes,
      statsRes,
      skillsRes,
      historyRes,
      rubricsRes
    ] = await Promise.all([
      supabaseClient.from('perfiles').select('nombre_completo').eq('id', studentId).single(),
      supabaseClient.rpc('get_student_performance_details', { p_student_id: studentId }),
      supabaseClient.rpc('get_student_skill_performance', { p_student_id: studentId }),
      supabaseClient.rpc('get_student_evaluation_history', { p_student_id: studentId }),
      supabaseClient.rpc('get_student_rubric_evaluations', { p_student_id: studentId })
    ]);

    const studentData = {
      profile: profileRes.data,
      stats: statsRes.data?.[0],
      skills: skillsRes.data,
      history: historyRes.data,
      rubrics: rubricsRes.data,
    };

    // --- Data Summarization for AI ---
    let promptDataSummary = `Nombre del Estudiante: ${studentData.profile?.nombre_completo || 'No disponible'}\n\n`;

    if (studentData.stats && studentData.stats.completed_evaluations > 0) {
      promptDataSummary += `**Resumen de Rendimiento General:**\n- Promedio de logro: ${studentData.stats.average_score?.toFixed(1) || 'N/A'}%\n- Evaluaciones completadas: ${studentData.stats.completed_evaluations} de ${studentData.stats.total_evaluations}\n\n`;
    } else {
      promptDataSummary += "**Resumen de Rendimiento General:**\n- No hay suficientes datos de rendimiento para un resumen general.\n\n";
    }

    if (studentData.skills && studentData.skills.length > 0) {
      promptDataSummary += `**Desempeño por Habilidad (Promedio de Logro):**\n${studentData.skills.map((s: any) => `- ${s.habilidad_nombre}: ${s.promedio_logro.toFixed(1)}%`).join('\n')}\n\n`;
    } else {
      promptDataSummary += "**Desempeño por Habilidad:**\n- No hay datos disponibles sobre el rendimiento en habilidades específicas.\n\n";
    }

    if (studentData.history && studentData.history.length > 0) {
      promptDataSummary += `**Historial de Evaluaciones (Pruebas):**\n${studentData.history.map((h: any) => `- "${h.evaluation_title}": Puntaje ${h.score_obtained}/${h.max_score}`).join('\n')}\n\n`;
    } else {
      promptDataSummary += "**Historial de Evaluaciones (Pruebas):**\n- No ha completado evaluaciones de este tipo.\n\n";
    }

    if (studentData.rubrics && studentData.rubrics.length > 0) {
      promptDataSummary += `**Historial de Evaluaciones (Rúbricas):**\n${studentData.rubrics.map((r: any) => `- "${r.rubrica.nombre}": Calificación ${r.calificacion_final.toFixed(1)} (Puntaje ${r.puntaje_obtenido}/${r.puntaje_maximo})`).join('\n')}\n\n`;
    } else {
      promptDataSummary += "**Historial de Evaluaciones (Rúbricas):**\n- No ha completado evaluaciones de este tipo.\n\n";
    }
    
    // --- AI Prompting ---
    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) {
      throw new Error("La clave de API de Gemini no está configurada.");
    }
    const API_URL = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;

    const prompt = `
      Eres un experto psicopedagogo y analista de datos educativos. Tu tarea es analizar el rendimiento de un estudiante y generar dos informes en formato JSON.

      **Datos del Estudiante:**
      ${promptDataSummary}

      **Instrucciones:**
      Analiza los datos proporcionados y genera un objeto JSON que contenga dos claves principales: "informe_docente_html" y "comunicado_apoderado_html".

      1.  **informe_docente_html**:
          -   Debe ser un string que contenga HTML bien formado.
          -   Debe ser un informe profesional y detallado para el docente.
          -   Incluye un resumen general, análisis de fortalezas, identificación de brechas de aprendizaje, y recomendaciones pedagógicas concretas.
          -   Utiliza los datos de rendimiento por habilidad, historial de evaluaciones y rúbricas para fundamentar tu análisis. Si no hay datos, indícalo de forma profesional.
          -   Usa etiquetas HTML como <h2>, <h3>, <p>, <ul>, <li>, <strong>.

      2.  **comunicado_apoderado_html**:
          -   Debe ser un string que contenga HTML bien formado.
          -   Debe ser un comunicado claro, conciso y amigable para los padres o apoderados.
          -   Evita la jerga pedagógica.
          -   Resume el estado general del estudiante, destaca un área de fortaleza y un área de mejora principal.
          -   Proporciona 2-3 recomendaciones sencillas y accionables que los padres puedan implementar en casa para apoyar el aprendizaje.
          -   Usa etiquetas HTML como <h3>, <p>, <ul>, <li>, <strong>.

      **Formato de Salida Esperado (JSON):**
      \`\`\`json
      {
        "informe_docente_html": "<h2>Resumen General</h2><p>...</p><h3>Fortalezas</h3><ul><li>...</li></ul>...",
        "comunicado_apoderado_html": "<h3>Estimados Apoderados de ${studentData.profile?.nombre_completo || 'el/la estudiante'}</h3><p>...</p><h3>Recomendaciones para el Hogar</h3><ul><li>...</li></ul>..."
      }
      \`\`\`

      Asegúrate de que tu respuesta sea únicamente el objeto JSON dentro de un bloque de código.
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

    const allEvalIds = [
        ...(studentData.history || []).map((h: any) => h.evaluation_id),
        ...(studentData.rubrics || []).map((r: any) => r.id)
    ];

    return new Response(JSON.stringify({ ...aiResponseJson, sourceData: studentData, consideredEvaluationIds: allEvalIds }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error("Error in generate-student-report:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})