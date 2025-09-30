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
    // En un escenario real, usarías las sugerencias para generar la secuencia.
    // const { suggestions } = await req.json();
    // const prompt = `Basado en estos objetivos: ${suggestions.objetivos.join(', ')}, genera una secuencia de 3 clases detalladas.`;
    // const aiResponse = await callToOpenAI(prompt);

    // Por ahora, devolvemos una secuencia simulada de alta calidad sin fechas.
    const simulatedSequence = [
      {
        titulo: 'Clase 1: Introducción a los Ecosistemas',
        objetivos_clase: 'Identificar los componentes bióticos y abióticos de un ecosistema local y comprender su interdependencia.',
        objetivo_estudiante: '¡Hoy nos convertiremos en exploradores para descubrir los seres vivos y no vivos que componen nuestro entorno y cómo se necesitan mutuamente!',
        aporte_proyecto: 'Esta clase nos ayuda a comprender qué es un ecosistema para poder identificar problemas medioambientales en él para nuestro proyecto "Guardianes de Nuestro Planeta".',
        actividades_inicio: 'Lluvia de ideas: "¿Qué encontramos en un parque o en el patio?". Discusión guiada para clasificar los elementos en "vivos" y "no vivos".',
        actividades_desarrollo: 'Presentación de los conceptos "biótico" y "abiótico". Salida al patio del colegio con lupas y cuadernos para registrar y dibujar 5 ejemplos de cada uno. En grupos, discuten cómo un elemento abiótico (ej. sol) afecta a uno biótico (ej. planta).',
        actividades_cierre: 'Puesta en común de los hallazgos. Ticket de salida: "Nombra un componente biótico y uno abiótico que viste hoy y explica cómo se relacionan".',
        recursos: 'Pizarra, proyector, lupas, cuadernos de campo, patio escolar.',
        objetivo_aprendizaje_texto: 'OA-8: Analizar y describir las características de los ecosistemas, considerando la interacción entre los factores bióticos y abióticos.',
        habilidades: 'Observar, clasificar, registrar, comunicar, analizar.',
        vinculo_interdisciplinario: 'Artes Visuales: Dibujo científico de los componentes observados.',
        aspectos_valoricos_actitudinales: 'Fomentar la curiosidad, el asombro por el entorno natural y el trabajo en equipo.',
      },
      {
        titulo: 'Clase 2: Cadenas y Redes Tróficas',
        objetivos_clase: 'Construir modelos de cadenas y redes tróficas para representar las relaciones alimentarias en un ecosistema.',
        objetivo_estudiante: '¡Hoy descubriremos quién se come a quién en la naturaleza y construiremos una gran telaraña de la vida para ver cómo todos estamos conectados!',
        aporte_proyecto: 'Entender las relaciones entre especies es clave para analizar cómo un problema (como la contaminación) puede afectar a todo el ecosistema en nuestro proyecto.',
        actividades_inicio: 'Pregunta desafiante: "¿Las plantas comen? ¿De dónde sacan su energía?". Breve discusión.',
        actividades_desarrollo: 'Explicación de los roles: productores, consumidores (herbívoros, carnívoros, omnívoros) y descomponedores. Actividad práctica: cada estudiante recibe una tarjeta con un ser vivo. Con un ovillo de lana, se conectan formando una red trófica, explicando cada conexión ("Yo, el conejo, me como la zanahoria").',
        actividades_cierre: 'Reflexión grupal: "¿Qué pasaría si quitamos a los productores (plantas)?". Dibujar en el cuaderno la red trófica que formaron.',
        recursos: 'Tarjetas con nombres/imágenes de seres vivos, ovillo de lana, pizarra.',
        objetivo_aprendizaje_texto: 'OA-8: Analizar y describir las características de los ecosistemas, incluyendo las interacciones alimentarias (cadenas y redes tróficas).',
        habilidades: 'Modelar, analizar, predecir, argumentar.',
        vinculo_interdisciplinario: 'Educación Física: Se puede hacer una versión activa del juego de la red trófica.',
        aspectos_valoricos_actitudinales: 'Promover la comprensión de la interdependencia y el equilibrio en la naturaleza.',
      },
      {
        titulo: 'Clase 3: El Motor del Planeta - Tectónica de Placas',
        objetivos_clase: 'Explicar el movimiento de las placas tectónicas y su relación con sismos y volcanes utilizando modelos simples.',
        objetivo_estudiante: '¡Hoy vamos a descubrir por qué tiembla la tierra y cómo se forman las montañas, moviendo las piezas del rompecabezas de nuestro planeta!',
        aporte_proyecto: 'Comprender los procesos naturales a gran escala nos da un contexto sobre la fragilidad de los ecosistemas que investigaremos.',
        actividades_inicio: 'Mostrar un mapa de sismos y volcanes del mundo. Preguntar: "¿Notan algún patrón? ¿Por qué creen que ocurre esto?".',
        actividades_desarrollo: 'Explicación de la teoría de la tectónica de placas. Actividad práctica en grupos: usar galletas o trozos de cartón sobre una superficie semilíquida (miel o crema) para simular los movimientos convergente, divergente y transformante, y observar los efectos (montañas, fallas).',
        actividades_cierre: 'Cada grupo explica uno de los movimientos con su modelo. Relacionar con la geografía de Chile.',
        recursos: 'Mapa de actividad sísmica, proyector, galletas, crema o miel, bandejas.',
        objetivo_aprendizaje_texto: 'OA-6: Explicar, con el modelo de la tectónica de placas, los patrones de distribución de la actividad geológica (volcanes y sismos) y los tipos de interacción entre las placas.',
        habilidades: 'Modelar, explicar, relacionar causa y efecto.',
        vinculo_interdisciplinario: 'Historia y Geografía: Relación con la formación de continentes y cordilleras.',
        aspectos_valoricos_actitudinales: 'Valorar el conocimiento científico para explicar fenómenos naturales.',
      },
    ]

    return new Response(JSON.stringify(simulatedSequence), {
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