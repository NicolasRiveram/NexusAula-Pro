import { supabase } from '@/integrations/supabase/client';
import { FunctionsHttpError } from '@supabase/supabase-js';

export interface Rubric {
  id: string;
  nombre: string;
  actividad_a_evaluar: string;
  descripcion: string;
  created_at: string;
  contenido_json?: RubricContent;
  categoria?: string | null;
}

export interface RubricContent {
  criterios: {
    nombre: string;
    habilidad: string;
    descripcion: string;
    niveles: {
      puntaje: number;
      nombre: string;
      descripcion: string;
    }[];
  }[];
}

export interface RubricEvaluationResult {
    rubrica_id: string;
    estudiante_perfil_id: string;
    curso_asignatura_id: string;
    puntaje_obtenido: number;
    puntaje_maximo: number;
    calificacion_final: number;
    comentarios?: string;
    resultados_json: any;
    tiempo_lectura_segundos?: number;
    palabras_por_minuto?: number;
}

export interface StudentRubricEvaluation {
  id: string;
  created_at: string;
  puntaje_obtenido: number;
  puntaje_maximo: number;
  calificacion_final: number;
  comentarios: string | null;
  resultados_json: Record<number, number>;
  rubrica: {
    nombre: string;
    actividad_a_evaluar: string;
    contenido_json: RubricContent;
  };
  curso_asignatura: {
    asignaturas: {
      nombre: string;
    };
  };
}

export const fetchRubrics = async (docenteId: string, establecimientoId: string): Promise<Rubric[]> => {
  if (!establecimientoId) return [];

  const { data, error } = await supabase
    .from('rubricas')
    .select('*, categoria')
    .eq('creado_por', docenteId)
    .eq('establecimiento_id', establecimientoId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Error al cargar las rúbricas: ${error.message}`);
  return data;
};

export const fetchRubricById = async (rubricId: string): Promise<Rubric> => {
    const { data, error } = await supabase
        .from('rubricas')
        .select('*, categoria')
        .eq('id', rubricId)
        .single();
    if (error) throw new Error(`Error al obtener la rúbrica: ${error.message}`);
    return data;
};

export const createRubric = async (
  nombre: string,
  actividad: string,
  descripcion: string,
  establecimientoId: string,
  categoria: string
): Promise<string> => {
  const { data, error } = await supabase
    .from('rubricas')
    .insert({
      nombre,
      actividad_a_evaluar: actividad,
      descripcion,
      establecimiento_id: establecimientoId,
      categoria,
    })
    .select('id')
    .single();

  if (error) throw new Error(`Error al crear la rúbrica: ${error.message}`);
  return data.id;
};

export const updateRubric = async (rubricId: string, rubricData: Partial<Omit<Rubric, 'id' | 'created_at'>>) => {
  const { error } = await supabase
    .from('rubricas')
    .update(rubricData)
    .eq('id', rubricId);
  if (error) throw new Error(`Error al actualizar la rúbrica: ${error.message}`);
};

export const deleteRubric = async (rubricId: string) => {
  const { error } = await supabase
    .from('rubricas')
    .delete()
    .eq('id', rubricId);
  if (error) throw new Error(`Error al eliminar la rúbrica: ${error.message}`);
};

export const generateRubricWithAI = async (params: {
  activity: string;
  description: string;
  nivelNombre: string;
  asignaturaNombre: string;
  cantidadCategorias: number;
  objetivos: string;
}): Promise<RubricContent> => {
  const { data, error } = await supabase.functions.invoke('generate-rubric', {
    body: params,
  });

  if (error instanceof FunctionsHttpError) {
    const errorMessage = await error.context.json();
    throw new Error(`Error en la IA al generar la rúbrica: ${errorMessage.error}`);
  } else if (error) {
    throw new Error(`Error en la IA al generar la rúbrica: ${error.message}`);
  }
  return data as RubricContent;
};

export const saveGeneratedRubricContent = async (rubricId: string, content: RubricContent) => {
  const { error } = await supabase
    .from('rubricas')
    .update({ contenido_json: content })
    .eq('id', rubricId);

  if (error) throw new Error(`Error al guardar el contenido de la rúbrica: ${error.message}`);
};

export const saveRubricEvaluation = async (evaluationData: RubricEvaluationResult) => {
    const { error } = await supabase
        .from('rubrica_evaluaciones_estudiantes')
        .insert(evaluationData);
    if (error) throw new Error(`Error al guardar la evaluación de la rúbrica: ${error.message}`);
};

export const fetchEvaluationsForStudent = async (studentId: string): Promise<StudentRubricEvaluation[]> => {
  const { data, error } = await supabase.rpc('get_student_rubric_evaluations', {
    p_student_id: studentId,
  });

  if (error) {
    throw new Error(`Error fetching student evaluations: ${error.message}`);
  }
  
  return data as StudentRubricEvaluation[];
};