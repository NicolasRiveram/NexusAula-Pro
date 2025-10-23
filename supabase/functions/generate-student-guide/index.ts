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
    const { classId } = await req.json();
    if (!classId) {
      throw new Error("El ID de la clase (classId) es requerido.");
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { data: classData, error: classError } = await supabaseAdmin
      .from('planificaciones_clase')
      .select(`
        titulo,
        objetivo_aprendizaje_texto,
        habilidades,
        objetivo_estudiante,
        actividades_inicio,
        actividades_desarrollo,
        actividades_cierre,
        unidades (
          curso_asignaturas (
            asignaturas ( nombre ),
            cursos ( niveles ( nombre ) )
          )
        )
      `)
      .eq('id', classId)
      .single();

    if (classError) throw new Error(`Error al obtener datos de la clase: ${classError.message}`);
    if (!classData) throw new Error('Clase no encontrada.');

    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) {
      throw new Error("La clave de API de Gemini no está configurada.");
    }

    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`;

    const prompt = `
      # ROL Y OBJETIVO
      Eres un experto pedagogo y diseñador de material educativo. Tu tarea es crear una guía de estudio detallada para un estudiante, basándote en la información de una clase planificada. El resultado debe ser un objeto JSON estructurado.

      # INSTRUCCIONES
      1.  **Analizar:** Lee toda la información de la clase proporcionada.
      2.  **Desarrollar Contenido:** Expande los puntos de la planificación en un material de estudio completo y fácil de entender para un estudiante.
      3.  **Estructurar la Salida:** Organiza la información en un solo objeto JSON con las siguientes claves:
          *   \`explicacion_detallada\`: Un desarrollo teórico y en profundidad del tema principal de la clase, usando un lenguaje claro y ejemplos. Debe tener al menos 3 párrafos.
          *   \`ejemplos_practicos\`: Un array con 2 o 3 objetos, cada uno con las claves "ejemplo" (un caso concreto) y "explicacion" (cómo se relaciona con la teoría).
          *   \`actividades_repaso\`: Un array con 2 o 3 objetos, cada uno con las claves "pregunta" (una pregunta abierta o un ejercicio simple) y "tipo" (ej: "pregunta abierta", "ejercicio práctico").
          *   \`conceptos_clave\`: Un array con 3 a 5 objetos, cada uno con las claves "termino" y "definicion".

      # DATOS DE LA CLASE
      - Título: ${classData.titulo}
      - Objetivo de Aprendizaje (OA): ${classData.objetivo_aprendizaje_texto || 'No especificado'}
      - Habilidades: ${classData.habilidades || 'No especificadas'}
      - Objetivo para el Estudiante: ${classData.objetivo_estudiante || 'No especificado'}
      - Actividades de Inicio: ${classData.actividades_inicio}
      - Actividades de Desarrollo: ${classData.actividades_desarrollo}
      - Actividades de Cierre: ${classData.actividades_cierre}
      - Asignatura: ${classData.unidades?.curso_asignaturas?.asignaturas?.nombre || 'No especificada'}
      - Nivel: ${classData.unidades?.curso_asignaturas?.cursos?.niveles?.nombre || 'No especificado'}

      # FORMATO DE SALIDA (OBLIGATORIO)
      Tu respuesta DEBE ser únicamente el objeto JSON dentro de un bloque de código markdown.
      \`\`\`json
      {
        "explicacion_detallada": "...",
        "ejemplos_practicos": [
          { "ejemplo": "...", "explicacion": "..." }
        ],
        "actividades_repaso": [
          { "pregunta": "...", "tipo": "pregunta abierta" }
        ],
        "conceptos_clave": [
          { "termino": "...", "definicion": "..." }
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
    console.error("Error in generate-student-guide:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})