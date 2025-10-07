import { serve } from "https://deno.land/std@0.190.0/http/server.ts"

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
    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) {
      throw new Error("La clave de API de Gemini no está configurada.");
    }

    const { block_content, block_type, questionCount } = await req.json();
    const count = questionCount > 0 && questionCount <= 5 ? questionCount : 3;
    
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.0-pro:generateContent?key=${apiKey}`;

    let contentPrompt;
    if (block_type === 'text') {
      contentPrompt = `el siguiente texto: "${block_content.text}"`;
    } else if (block_type === 'image') {
      contentPrompt = `una imagen (no puedo ver la imagen, pero asume que es relevante para generar preguntas educativas).`;
    } else if (block_type === 'syllabus') {
      contentPrompt = `los siguientes temas o conceptos: "${block_content.text}". Las preguntas deben ser conceptuales sobre estos temas, no preguntas literales sobre el texto proporcionado.`;
    } else {
      contentPrompt = `el siguiente texto: "${block_content.text}"`;
    }

    const prompt = `
      Eres un asistente experto en crear evaluaciones educativas para Chile.
      Basado en ${contentPrompt}, genera un array de exactamente ${count} preguntas de selección múltiple en formato JSON.
      La estructura de cada objeto en el array debe ser:
      \`\`\`json
      {
        "enunciado": "string",
        "tipo_item": "seleccion_multiple",
        "puntaje": 5,
        "habilidad_evaluada": "string",
        "nivel_comprension": "string",
        "alternativas": [
          {"texto": "string", "es_correcta": boolean},
          {"texto": "string", "es_correcta": boolean},
          {"texto": "string", "es_correcta": boolean},
          {"texto": "string", "es_correcta": boolean}
        ]
      }
      \`\`\`
      - **Clasificación Pedagógica Obligatoria:** Para "habilidad_evaluada", identifica una habilidad curricular específica (ej: "Comprensión Lectora", "Análisis de Fuentes", "Resolución de Problemas"). Para "nivel_comprension", usa uno de los niveles de la Taxonomía de Bloom: "Recordar", "Comprender", "Aplicar", "Analizar", "Evaluar", "Crear".
      - **Calidad de Distractores:** Crea alternativas incorrectas (distractores) que sean plausibles y que representen errores conceptuales comunes o interpretaciones erróneas del contenido, en lugar de ser opciones obviamente incorrectas.
      - **Reglas Estrictas:** Asegúrate de que solo UNA alternativa tenga "es_correcta" como true. Distribuye la posición de la alternativa correcta de manera aleatoria y variada. El puntaje debe ser un número entero.
      - **Formato:** Tu respuesta DEBE ser únicamente el array JSON dentro de un bloque de código.
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
    const aiResponseJson = cleanAndParseJson(aiText);

    return new Response(JSON.stringify(aiResponseJson), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error("Error in generate-questions:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})