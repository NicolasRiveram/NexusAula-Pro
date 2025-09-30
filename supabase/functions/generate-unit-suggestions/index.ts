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
    // En un escenario real, aquí llamarías a un servicio de IA como OpenAI.
    // const { title, description } = await req.json();
    // const prompt = `Genera objetivos de aprendizaje y un proyecto ABP para una unidad sobre "${title}" que trata de "${description}".`;
    // const aiResponse = await callToOpenAI(prompt);

    // Por ahora, devolvemos una respuesta estructurada y de alta calidad.
    const simulatedResponse = {
      objetivos: [
        "OA-6: Explicar, con el modelo de la tectónica de placas, los patrones de distribución de la actividad geológica (volcanes y sismos), los tipos de interacción entre las placas (convergente, divergente y transformante) y su importancia en la teoría de la deriva continental.",
        "OA-7: Comunicar y explicar los efectos de la actividad humana (contaminación, sobreexplotación de recursos, etc.) en los océanos, y proponer acciones para protegerlos.",
        "OA-8: Analizar y describir las características de los ecosistemas, considerando la interacción entre los factores bióticos (ej., competencia, depredación, comensalismo) y abióticos (ej., luz, temperatura, agua).",
      ],
      proposito: "El propósito de esta unidad es que los estudiantes comprendan la dinámica interna y externa del planeta Tierra, reconociendo cómo los procesos geológicos y las interacciones ecológicas dan forma a nuestro mundo. Además, se busca que desarrollen una conciencia crítica sobre el impacto de la actividad humana en los ecosistemas, especialmente los marinos, y se sientan empoderados para proponer soluciones sostenibles.",
      proyectoABP: {
        titulo: "Guardianes de Nuestro Planeta: Un Desafío Local",
        descripcion: "Los estudiantes investigarán un problema medioambiental relevante para su comunidad local (ej., contaminación de un río, microbasurales, pérdida de biodiversidad local). Deberán analizar sus causas, efectos en el ecosistema y proponer una solución viable a través de una campaña de concienciación.",
        productoFinal: "Campaña de concienciación comunitaria que incluya material gráfico (afiches, folletos), un video corto para redes sociales y una presentación formal de su propuesta de solución a un panel (puede ser el curso, profesores o directivos).",
      },
    }

    return new Response(JSON.stringify(simulatedResponse), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})