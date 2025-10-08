import { serve } from "https://deno.land/std@0.190.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) {
      throw new Error("La clave de API de Gemini no está configurada.");
    }

    const { evaluationTitle, questions } = await req.json();
    if (!evaluationTitle || !questions) {
      throw new Error("El título y las preguntas de la evaluación son requeridos.");
    }

    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`;

    const questionsSummary = questions.map((q: any) => 
      `- Pregunta sobre "${q.enunciado.substring(0, 50)}..." (Habilidad: ${q.habilidad_evaluada || 'N/A'}, Nivel Bloom: ${q.nivel_comprension || 'N/A'})`
    ).join('\n');

    const prompt = `
      Eres un asistente pedagógico experto. Basado en el título y el resumen de las preguntas de una evaluación, genera un párrafo conciso y profesional para una sección titulada "Aspectos a Evaluar".
      Este párrafo debe resumir en 2 o 3 frases las habilidades y conocimientos clave que se medirán en la prueba.
      Basa tu resumen en los temas y habilidades inferidos de las preguntas, no menciones los tipos de contenido (texto, imagen).
      La respuesta debe ser únicamente el párrafo de texto, sin títulos, markdown ni formato JSON.

      Título de la evaluación: ${evaluationTitle}
      
      Resumen de las preguntas:
      ${questionsSummary}
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

    return new Response(JSON.stringify({ aspects: aiText.trim() }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error("Error in generate-evaluation-aspects:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})