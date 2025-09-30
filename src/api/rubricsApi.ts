import { supabase } from '@/integrations/supabase/client';

export interface Rubric {
  id: string;
  nombre: string;
  actividad_a_evaluar: string;
  descripcion: string;
  created_at: string;
  contenido_json?: RubricContent;
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
    .select('*')
    .eq('creado_por', docenteId)
    .eq('establecimiento_id', establecimientoId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Error al cargar las rúbricas: ${error.message}`);
  return data;
};

export const fetchRubricById = async (rubricId: string): Promise<Rubric> => {
    const { data, error } = await supabase
        .from('rubricas')
        .select('*')
        .eq('id', rubricId)
        .single();
    if (error) throw new Error(`Error al obtener la rúbrica: ${error.message}`);
    return data;
};

export const createRubric = async (
  nombre: string,
  actividad: string,
  descripcion: string,
  establecimientoId: string
): Promise<string> => {
  const { data, error } = await supabase
    .from('rubricas')
    .insert({
      nombre,
      actividad_a_evaluar: actividad,
      descripcion,
      establecimiento_id: establecimientoId,
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

export const generateRubricWithAI = async (activity: string, description: string): Promise<RubricContent> => {
  const { data, error } = await supabase.rpc('generar_rubrica_ia', {
    p_nombre_actividad: activity,
    p_descripcion: description,
  });

  if (error) throw new Error(`Error en la IA al generar la rúbrica: ${error.message}`);
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