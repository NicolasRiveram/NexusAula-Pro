import { supabase } from '@/integrations/supabase/client';
import { FunctionsHttpError } from '@supabase/supabase-js';

export interface ObjetivoAprendizaje {
  id: string;
  codigo: string;
  descripcion: string;
}

export interface Evaluation {
  id: string;
  titulo: string;
  tipo: string;
  momento_evaluativo: string;
  fecha_aplicacion: string | null;
  randomizar_preguntas: boolean;
  randomizar_alternativas: boolean;
  curso_asignaturas: {
    id: string; // This is the curso_asignatura_id
    curso: {
      nombre: string;
      nivel: {
        id: string;
        nombre: string;
      };
    };
    asignatura: {
      id: string;
      nombre: string;
    };
  }[];
}

export interface StudentEvaluation extends Omit<Evaluation, 'curso_asignaturas'> {
  status: 'Pendiente' | 'Completado';
  curso_nombre: string;
  asignatura_nombre: string;
}

export interface EvaluationContentBlock {
  id: string;
  evaluation_id: string;
  block_type: 'text' | 'image' | 'syllabus';
  content: any;
  orden: number;
  title: string | null;
  visible_en_evaluacion: boolean;
}

export interface ItemAlternative {
  id: string;
  texto: string;
  es_correcta: boolean;
  orden: number;
}

export interface PIEAdaptation {
  id: string;
  enunciado_adaptado: string;
  alternativas_adaptadas: { texto: string; es_correcta: boolean }[];
}

export interface EvaluationItem {
  id: string;
  enunciado: string;
  tipo_item: 'seleccion_multiple' | 'desarrollo' | 'verdadero_falso';
  puntaje: number;
  orden: number;
  content_block_id: string;
  habilidad_evaluada: string | null;
  nivel_comprension: string | null;
  item_alternativas: ItemAlternative[];
  tiene_adaptacion_pie: boolean;
  adaptaciones_pie: PIEAdaptation[]; // Supabase returns this as an array
}

export interface EvaluationDetail extends Evaluation {
  descripcion: string;
  puntaje_maximo: number | null;
  estandar_esperado: string | null;
  aspectos_a_evaluar_ia: string | null;
  creado_por: string;
  evaluation_content_blocks: (EvaluationContentBlock & {
    evaluacion_items: EvaluationItem[];
  })[];
  evaluacion_objetivos: { oa_id: string }[];
  evaluacion_habilidades: { habilidades: { id: string; nombre: string } }[];
}

export interface EvaluationResultSummary {
  student_id: string;
  student_name: string;
  response_id: string | null;
  score: number | null;
  status: 'Completado' | 'Pendiente';
}

export interface EvaluationStatistics {
  total_students: number;
  completed_students: number;
  completion_rate: number;
  average_score: number;
  puntaje_maximo: number;
  score_distribution: { range: string; count: number }[];
}

export interface StudentResponseItem {
  id: string;
  evaluacion_item_id: string;
  alternativa_seleccionada_id: string | null;
  es_correcto: boolean;
  puntaje_item_obtenido: number;
}

export interface StudentResponseHeader {
  student_name: string;
  evaluation_title: string;
}

export interface ItemAnalysisResult {
  item_id: string;
  item_enunciado: string;
  correct_answers_count: number;
  total_answers_count: number;
  correct_percentage: number;
}

export interface SkillAnalysisResult {
  habilidad: string;
  correct_answers: number;
  total_answers: number;
  achievement_percentage: number;
}

export interface StudentAnswer {
  itemId: string;
  selectedAlternativeId: string;
}

export interface ManualQuestionData {
  enunciado: string;
  tipo_item: 'seleccion_multiple' | 'desarrollo' | 'verdadero_falso';
  puntaje: number;
  habilidad_evaluada?: string;
  nivel_comprension?: string;
  alternativas?: Omit<ItemAlternative, 'id' | 'evaluacion_item_id'>[];
}

export interface Skill {
  id: string;
  nombre: string;
}

export interface CreateEvaluationData {
  titulo: string;
  tipo: string;
  descripcion?: string;
  fecha_aplicacion: string | null;
  cursoAsignaturaIds: string[];
  randomizar_preguntas?: boolean;
  randomizar_alternativas?: boolean;
  momento_evaluativo: string;
  estandar_esperado?: string;
  habilidades?: string[];
}

export const updateEvaluationItemDetails = async (itemId: string, updates: { puntaje: number }) => {
  const { error } = await supabase
    .from('evaluacion_items')
    .update(updates)
    .eq('id', itemId);
  if (error) throw new Error(`Error al actualizar el puntaje: ${error.message}`);
};

export const fetchObjetivosAprendizaje = async (nivelIds: string[], asignaturaIds: string[]): Promise<ObjetivoAprendizaje[]> => {
  if (nivelIds.length === 0 || asignaturaIds.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from('objetivos_aprendizaje')
    .select('id, codigo, descripcion')
    .in('nivel_id', nivelIds)
    .in('asignatura_id', asignaturaIds)
    .order('codigo');

  if (error) throw new Error(`Error fetching learning objectives: ${error.message}`);
  return data;
};

export const fetchStudentsForEvaluation = async (evaluationId: string): Promise<{ id: string; nombre_completo: string; curso_nombre: string; apoyo_pie: boolean }[]> => {
  const { data: links, error: linkError } = await supabase
    .from('evaluacion_curso_asignaturas')
    .select('curso_asignaturas(curso_id, cursos(nombre, niveles(nombre)))')
    .eq('evaluacion_id', evaluationId);

  if (linkError) throw new Error(`Error fetching course links: ${linkError.message}`);
  const cursoIds = [...new Set(links.map((l: any) => l.curso_asignaturas.curso_id))];
  const cursoInfoMap = new Map(links.map((l: any) => [l.curso_asignaturas.curso_id, `${l.curso_asignaturas.cursos.niveles.nombre} ${l.curso_asignaturas.cursos.nombre}`]));

  if (cursoIds.length === 0) return [];

  const { data: students, error: studentError } = await supabase
    .from('curso_estudiantes')
    .select('curso_id, perfiles!inner(id, nombre_completo, apoyo_pie)')
    .in('curso_id', cursoIds);

  if (studentError) throw new Error(`Error fetching students: ${studentError.message}`);

  const studentMap = new Map<string, { id: string; nombre_completo: string; curso_nombre: string; apoyo_pie: boolean }>();
  students.forEach((s: any) => {
    if (s.perfiles && !studentMap.has(s.perfiles.id)) {
      studentMap.set(s.perfiles.id, {
        id: s.perfiles.id,
        nombre_completo: s.perfiles.nombre_completo,
        curso_nombre: cursoInfoMap.get(s.curso_id) || 'Curso Desconocido',
        apoyo_pie: s.perfiles.apoyo_pie,
      });
    }
  });

  return Array.from(studentMap.values());
};

export const fetchSkills = async (): Promise<Skill[]> => {
  const { data, error } = await supabase
    .from('habilidades')
    .select('id, nombre')
    .order('nombre');
  if (error) throw new Error(`Error fetching skills: ${error.message}`);
  return data;
};

export const saveManualQuestion = async (evaluationId: string, blockId: string, questionData: ManualQuestionData) => {
  const { alternativas, ...itemData } = questionData;

  const { data: lastItem, error: lastItemError } = await supabase
    .from('evaluacion_items')
    .select('orden')
    .eq('evaluacion_id', evaluationId)
    .order('orden', { ascending: false })
    .limit(1)
    .single();

  if (lastItemError && lastItemError.code !== 'PGRST116') { // Ignore "no rows found" error
    throw new Error(`Error fetching current question count: ${lastItemError.message}`);
  }

  const currentItemCount = lastItem ? lastItem.orden : 0;

  const { data: newItem, error: itemError } = await supabase
    .from('evaluacion_items')
    .insert({
      ...itemData,
      orden: currentItemCount + 1,
      evaluacion_id: evaluationId,
      content_block_id: blockId,
    })
    .select('id')
    .single();

  if (itemError) {
    throw new Error(`Error al guardar la pregunta: ${itemError.message}`);
  }

  if (alternativas && alternativas.length > 0) {
    const alternativesToInsert = alternativas.map(alt => ({
      ...alt,
      evaluacion_item_id: newItem.id,
    }));

    const { error: altError } = await supabase
      .from('item_alternativas')
      .insert(alternativesToInsert);

    if (altError) {
      await supabase.from('evaluacion_items').delete().eq('id', newItem.id);
      throw new Error(`Error al guardar las alternativas: ${altError.message}`);
    }
  }

  return newItem;
};

export const reorderContentBlocks = async (blockIds: string[]) => {
  const { error } = await supabase.rpc('reorder_content_blocks', {
    p_block_ids: blockIds,
  });
  if (error) throw new Error(`Error al reordenar los bloques: ${error.message}`);
};

export const fetchItemAnalysis = async (evaluationId: string): Promise<ItemAnalysisResult[]> => {
  const { data, error } = await supabase.rpc('get_item_analysis', {
    p_evaluation_id: evaluationId,
  });

  if (error) {
    throw new Error(`Error fetching item analysis: ${error.message}`);
  }
  return data || [];
};

export const fetchSkillAnalysisForEvaluation = async (evaluationId: string): Promise<SkillAnalysisResult[]> => {
  const { data, error } = await supabase.rpc('get_skill_analysis_for_evaluation', {
    p_evaluation_id: evaluationId,
  });

  if (error) {
    throw new Error(`Error fetching skill analysis: ${error.message}`);
  }
  return data || [];
};

export const fetchEvaluations = async (docenteId: string, establecimientoId: string): Promise<Evaluation[]> => {
  if (!establecimientoId) return [];

  const { data, error } = await supabase
    .from('evaluaciones')
    .select(`
      id,
      titulo,
      tipo,
      momento_evaluativo,
      fecha_aplicacion,
      randomizar_preguntas,
      randomizar_alternativas,
      evaluacion_curso_asignaturas!left (
        curso_asignatura_id,
        curso_asignaturas (
          cursos ( establecimiento_id, nombre, niveles ( id, nombre ) ),
          asignaturas ( id, nombre )
        )
      )
    `)
    .eq('creado_por', docenteId)
    .order('fecha_aplicacion', { ascending: false });

  if (error) throw new Error(`Error al cargar las evaluaciones: ${error.message}`);

  const filteredData = (data || []).filter((evaluation: any) => {
    if (evaluation.evaluacion_curso_asignaturas.length === 0) {
      return true; // Keep unassigned evaluations (templates)
    }
    return evaluation.evaluacion_curso_asignaturas.some((link: any) => 
      link.curso_asignaturas?.cursos?.establecimiento_id === establecimientoId
    );
  });

  return filteredData.map((e: any) => ({
    id: e.id,
    titulo: e.titulo,
    tipo: e.tipo,
    momento_evaluativo: e.momento_evaluativo,
    fecha_aplicacion: e.fecha_aplicacion,
    randomizar_preguntas: e.randomizar_preguntas,
    randomizar_alternativas: e.randomizar_alternativas,
    curso_asignaturas: (e.evaluacion_curso_asignaturas || [])
      .filter((link: any) => link.curso_asignaturas?.cursos?.establecimiento_id === establecimientoId)
      .map((link: any) => ({
        id: link.curso_asignatura_id,
        curso: {
          nombre: link.curso_asignaturas.cursos.nombre,
          nivel: { 
            id: link.curso_asignaturas.cursos.niveles.id,
            nombre: link.curso_asignaturas.cursos.niveles.nombre 
          },
        },
        asignatura: { 
          id: link.curso_asignaturas.asignaturas.id,
          nombre: link.curso_asignaturas.asignaturas.nombre 
        },
      }))
  }));
};

export const fetchStudentEvaluations = async (studentId: string, establecimientoId: string): Promise<StudentEvaluation[]> => {
  if (!establecimientoId) return [];

  const { data, error } = await supabase
    .from('evaluaciones')
    .select(`
      id, titulo, tipo, fecha_aplicacion, randomizar_preguntas, randomizar_alternativas, momento_evaluativo,
      evaluacion_curso_asignaturas!inner(
        curso_asignaturas!inner(
          cursos!inner(
            nombre, establecimiento_id, niveles(nombre),
            curso_estudiantes!inner(estudiante_perfil_id)
          ),
          asignaturas(nombre)
        )
      ),
      respuestas_estudiante(id)
    `)
    .eq('evaluacion_curso_asignaturas.curso_asignaturas.cursos.establecimiento_id', establecimientoId)
    .eq('evaluacion_curso_asignaturas.curso_asignaturas.cursos.curso_estudiantes.estudiante_perfil_id', studentId)
    .order('fecha_aplicacion', { ascending: false });

  if (error) throw new Error(`Error fetching student evaluations: ${error.message}`);

  return (data || []).map((e: any) => {
    const cursoAsignatura = e.evaluacion_curso_asignaturas[0]?.curso_asignaturas;
    return {
      id: e.id,
      titulo: e.titulo,
      tipo: e.tipo,
      fecha_aplicacion: e.fecha_aplicacion,
      randomizar_preguntas: e.randomizar_preguntas,
      randomizar_alternativas: e.randomizar_alternativas,
      momento_evaluativo: e.momento_evaluativo,
      status: e.respuestas_estudiante.some((r: any) => r.id) ? 'Completado' : 'Pendiente',
      curso_nombre: `${cursoAsignatura?.cursos?.niveles?.nombre} ${cursoAsignatura?.cursos?.nombre}`,
      asignatura_nombre: cursoAsignatura?.asignaturas?.nombre,
    };
  });
};

export const createEvaluation = async (evalData: CreateEvaluationData & { objetivos_aprendizaje_ids: string[] }) => {
  const { cursoAsignaturaIds, objetivos_aprendizaje_ids, habilidades, ...rest } = evalData;
  const { data, error } = await supabase
    .from('evaluaciones')
    .insert({ ...rest })
    .select('id')
    .single();

  if (error) throw new Error(`Error al crear la evaluación: ${error.message}`);
  const newEvaluationId = data.id;

  if (cursoAsignaturaIds && cursoAsignaturaIds.length > 0) {
    const links = cursoAsignaturaIds.map(id => ({
      evaluacion_id: newEvaluationId,
      curso_asignatura_id: id,
    }));

    const { error: linkError } = await supabase
      .from('evaluacion_curso_asignaturas')
      .insert(links);

    if (linkError) {
      await supabase.from('evaluaciones').delete().eq('id', newEvaluationId);
      throw new Error(`Error al vincular la evaluación a los cursos: ${linkError.message}`);
    }
  }
  
  if (objetivos_aprendizaje_ids && objetivos_aprendizaje_ids.length > 0) {
    const oaLinks = objetivos_aprendizaje_ids.map(id => ({
      evaluacion_id: newEvaluationId,
      oa_id: id,
    }));
    const { error: oaLinkError } = await supabase
      .from('evaluacion_objetivos')
      .insert(oaLinks);
    if (oaLinkError) {
      await supabase.from('evaluaciones').delete().eq('id', newEvaluationId); // Rollback
      throw new Error(`Error al vincular los Objetivos de Aprendizaje: ${oaLinkError.message}`);
    }
  }

  if (habilidades && habilidades.length > 0) {
    const { error: skillsError } = await supabase.rpc('upsert_and_link_skills', {
      p_evaluacion_id: newEvaluationId,
      p_habilidades: habilidades,
    });
    if (skillsError) {
      await supabase.from('evaluaciones').delete().eq('id', newEvaluationId);
      throw new Error(`Error al vincular las habilidades: ${skillsError.message}`);
    }
  }

  return newEvaluationId;
};

export const updateEvaluation = async (evaluationId: string, evalData: CreateEvaluationData & { objetivos_aprendizaje_ids: string[] }) => {
  const { cursoAsignaturaIds, objetivos_aprendizaje_ids, habilidades, ...updateData } = evalData;
  const { error: updateError } = await supabase
    .from('evaluaciones')
    .update({ ...updateData })
    .eq('id', evaluationId);

  if (updateError) throw new Error(`Error updating evaluation: ${updateError.message}`);

  const { data: existingLinks, error: fetchError } = await supabase
    .from('evaluacion_curso_asignaturas')
    .select('curso_asignatura_id')
    .eq('evaluacion_id', evaluationId);

  if (fetchError) throw new Error(`Error fetching existing links: ${fetchError.message}`);

  const existingIds = existingLinks.map(l => l.curso_asignatura_id);
  const newIds = evalData.cursoAsignaturaIds || [];

  const idsToRemove = existingIds.filter(id => !newIds.includes(id));
  const idsToAdd = newIds.filter(id => !existingIds.includes(id));

  if (idsToRemove.length > 0) {
    const { error: deleteError } = await supabase
      .from('evaluacion_curso_asignaturas')
      .delete()
      .eq('evaluacion_id', evaluationId)
      .in('curso_asignatura_id', idsToRemove);
    if (deleteError) throw new Error(`Error removing old links: ${deleteError.message}`);
  }

  if (idsToAdd.length > 0) {
    const linksToInsert = idsToAdd.map(id => ({
      evaluacion_id: evaluationId,
      curso_asignatura_id: id,
    }));
    const { error: insertError } = await supabase
      .from('evaluacion_curso_asignaturas')
      .insert(linksToInsert);
    if (insertError) throw new Error(`Error adding new links: ${insertError.message}`);
  }

  // Handle OA links
  const { data: existingOaLinks, error: fetchOaError } = await supabase
    .from('evaluacion_objetivos')
    .select('oa_id')
    .eq('evaluacion_id', evaluationId);
  if (fetchOaError) throw new Error(`Error fetching existing OA links: ${fetchOaError.message}`);
  
  const existingOaIds = existingOaLinks.map(l => l.oa_id);
  const newOaIds = objetivos_aprendizaje_ids || [];

  const oaIdsToRemove = existingOaIds.filter(id => !newOaIds.includes(id));
  const oaIdsToAdd = newOaIds.filter(id => !existingOaIds.includes(id));

  if (oaIdsToRemove.length > 0) {
    const { error: deleteError } = await supabase
      .from('evaluacion_objetivos')
      .delete()
      .eq('evaluacion_id', evaluationId)
      .in('oa_id', oaIdsToRemove);
    if (deleteError) throw new Error(`Error removing old OA links: ${deleteError.message}`);
  }

  if (oaIdsToAdd.length > 0) {
    const linksToInsert = oaIdsToAdd.map(id => ({
      evaluacion_id: evaluationId,
      oa_id: id,
    }));
    const { error: insertError } = await supabase
      .from('evaluacion_objetivos')
      .insert(linksToInsert);
    if (insertError) throw new Error(`Error adding new OA links: ${insertError.message}`);
  }

  if (habilidades) {
    const { error: skillsError } = await supabase.rpc('upsert_and_link_skills', {
      p_evaluacion_id: evaluationId,
      p_habilidades: habilidades,
    });
    if (skillsError) {
      throw new Error(`Error al actualizar las habilidades: ${skillsError.message}`);
    }
  }
};

export const deleteEvaluation = async (evaluationId: string) => {
  const { error } = await supabase
    .from('evaluaciones')
    .delete()
    .eq('id', evaluationId);

  if (error) {
    throw new Error(`Error al eliminar la evaluación: ${error.message}`);
  }
};

export const deleteMultipleEvaluations = async (evaluationIds: string[]) => {
  const { error } = await supabase
    .from('evaluaciones')
    .delete()
    .in('id', evaluationIds);

  if (error) {
    throw new Error(`Error al eliminar las evaluaciones: ${error.message}`);
  }
};

export const fetchEvaluationDetails = async (evaluationId: string): Promise<EvaluationDetail> => {
  const { data, error } = await supabase
    .from('evaluaciones')
    .select(`
      id,
      titulo,
      tipo,
      descripcion,
      fecha_aplicacion,
      puntaje_maximo,
      estandar_esperado,
      aspectos_a_evaluar_ia,
      randomizar_preguntas,
      randomizar_alternativas,
      momento_evaluativo,
      creado_por,
      evaluacion_curso_asignaturas (
        curso_asignatura_id,
        curso_asignaturas (
          cursos ( nombre, niveles ( id, nombre ) ),
          asignaturas ( id, nombre )
        )
      ),
      evaluation_content_blocks (
        *,
        evaluacion_items (
          *,
          item_alternativas ( * ),
          adaptaciones_pie ( * )
        )
      ),
      evaluacion_objetivos ( oa_id ),
      evaluacion_habilidades ( habilidades ( id, nombre ) )
    `)
    .eq('id', evaluationId)
    .order('orden', { referencedTable: 'evaluation_content_blocks' })
    .order('orden', { referencedTable: 'evaluation_content_blocks.evaluacion_items' })
    .single();

  if (error) throw new Error(`Error fetching evaluation details: ${error.message}`);
  if (!data) throw new Error('Evaluation not found.');

  const formattedData = {
    ...data,
    curso_asignaturas: data.evaluacion_curso_asignaturas.map((link: any) => ({
      id: link.curso_asignatura_id,
      curso: {
        nombre: link.curso_asignaturas.cursos.nombre,
        nivel: { 
          id: link.curso_asignaturas.cursos.niveles.id,
          nombre: link.curso_asignaturas.cursos.niveles.nombre 
        }
      },
      asignatura: { 
        id: link.curso_asignaturas.asignaturas.id,
        nombre: link.curso_asignaturas.asignaturas.nombre 
      }
    }))
  };

  return formattedData as EvaluationDetail;
};

export const fetchEvaluationResultsSummary = async (evaluationId: string): Promise<EvaluationResultSummary[]> => {
  const { data, error } = await supabase.rpc('get_evaluation_results_summary', {
    p_evaluation_id: evaluationId,
  });

  if (error) {
    throw new Error(`Error fetching evaluation results: ${error.message}`);
  }
  return data;
};

export const fetchEvaluationStatistics = async (evaluationId: string): Promise<EvaluationStatistics> => {
  const { data, error } = await supabase.rpc('get_evaluation_statistics', {
    p_evaluation_id: evaluationId,
  });

  if (error) {
    throw new Error(`Error fetching evaluation statistics: ${error.message}`);
  }
  return data;
};

export const fetchContentBlocks = async (evaluationId: string): Promise<EvaluationContentBlock[]> => {
  const { data, error } = await supabase
    .from('evaluation_content_blocks')
    .select('*')
    .eq('evaluation_id', evaluationId)
    .order('orden');
  if (error) throw new Error(`Error al cargar los bloques de contenido: ${error.message}`);
  return data;
};

export const fetchEvaluationContentForImport = async (resourceId: string): Promise<Pick<EvaluationContentBlock, 'block_type' | 'content' | 'title'>[]> => {
    const { data, error } = await supabase
        .from('evaluation_content_blocks')
        .select('block_type, content, title')
        .eq('evaluation_id', resourceId)
        .order('orden');
    if (error) throw new Error(`Error al importar contenido: ${error.message}`);
    return data as any;
};

export const createContentBlock = async (evaluationId: string, blockType: string, content: any, order: number, title?: string) => {
  const { data, error } = await supabase
    .from('evaluation_content_blocks')
    .insert({
      evaluation_id: evaluationId,
      block_type: blockType,
      content: content,
      orden: order,
      title: title || `Bloque ${order}`,
    })
    .select()
    .single();
  if (error) throw new Error(`Error al crear el bloque de contenido: ${error.message}`);
  return data;
};

export const updateContentBlock = async (blockId: string, updates: Partial<Pick<EvaluationContentBlock, 'title' | 'content' | 'visible_en_evaluacion'>>) => {
  const { error } = await supabase
    .from('evaluation_content_blocks')
    .update(updates)
    .eq('id', blockId);
  if (error) throw new Error(`Error al actualizar el bloque de contenido: ${error.message}`);
};

export const deleteContentBlock = async (blockId: string) => {
  const { error } = await supabase.from('evaluation_content_blocks').delete().eq('id', blockId);
  if (error) throw new Error(`Error al eliminar el bloque de contenido: ${error.message}`);
};

export const uploadEvaluationImage = async (evaluationId: string, file: File): Promise<string> => {
    const fileExtension = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExtension}`;
    // Corregido: Se eliminó el prefijo 'public/'
    const filePath = `${evaluationId}/${fileName}`;

    const { error } = await supabase.storage
        .from('evaluation_images')
        .upload(filePath, file);

    if (error) {
        throw new Error(`Error al subir la imagen: ${error.message}`);
    }

    return filePath;
};

export const getPublicImageUrl = (path: string): string => {
    if (!path) return '';
    const { data } = supabase.storage.from('evaluation_images').getPublicUrl(path);
    return data.publicUrl;
};

export const generateQuestionsFromBlock = async (block: EvaluationContentBlock, questionCount: number, evaluationContext?: string) => {
  const { data, error } = await supabase.functions.invoke('generate-questions', {
    body: {
      block_content: block.content,
      block_type: block.block_type,
      questionCount: questionCount,
      evaluation_context: evaluationContext,
    },
  });
  if (error instanceof FunctionsHttpError) {
    const errorMessage = await error.context.json();
    throw new Error(`Error al generar preguntas con IA: ${errorMessage.error}`);
  } else if (error) {
    throw new Error(`Error al generar preguntas con IA: ${error.message}`);
  }
  return data;
};

export const saveGeneratedQuestions = async (evaluationId: string, blockId: string, questions: any[]) => {
  const { data: lastItem, error: lastItemError } = await supabase
    .from('evaluacion_items')
    .select('orden')
    .eq('evaluacion_id', evaluationId)
    .order('orden', { ascending: false })
    .limit(1)
    .single();

  if (lastItemError && lastItemError.code !== 'PGRST116') { // Ignore "no rows found" error
    throw new Error(`Error fetching current question count: ${lastItemError.message}`);
  }

  const currentItemCount = lastItem ? lastItem.orden : 0;

  const itemsToInsert = questions.map((q, index) => ({
    evaluacion_id: evaluationId,
    content_block_id: blockId,
    enunciado: q.enunciado,
    tipo_item: q.tipo_item,
    puntaje: q.puntaje,
    orden: currentItemCount + index + 1,
    habilidad_evaluada: q.habilidad_evaluada,
    nivel_comprension: q.nivel_comprension,
  }));

  const { data: insertedItems, error: itemsError } = await supabase
    .from('evaluacion_items')
    .insert(itemsToInsert)
    .select();

  if (itemsError) throw new Error(`Error al guardar las preguntas: ${itemsError.message}`);
  if (!insertedItems) throw new Error('No se pudieron guardar las preguntas.');

  const alternativesToInsert: any[] = [];
  insertedItems.forEach((item, index) => {
    if (questions[index].tipo_item === 'seleccion_multiple' && questions[index].alternativas) {
      questions[index].alternativas.forEach((alt: any, altIndex: number) => {
        alternativesToInsert.push({
          evaluacion_item_id: item.id,
          texto: alt.texto,
          es_correcta: alt.es_correcta,
          orden: altIndex + 1,
        });
      });
    }
  });

  if (alternativesToInsert.length > 0) {
    const { error: altsError } = await supabase.from('item_alternativas').insert(alternativesToInsert);
    if (altsError) {
      throw new Error(`Error al guardar las alternativas: ${altsError.message}`);
    }
  }

  return insertedItems;
};

export const fetchItemsForBlock = async (blockId: string): Promise<EvaluationItem[]> => {
    const { data, error } = await supabase
        .from('evaluacion_items')
        .select(`
            id, enunciado, tipo_item, puntaje, orden, content_block_id, tiene_adaptacion_pie, habilidad_evaluada, nivel_comprension,
            item_alternativas ( id, texto, es_correcta, orden ),
            adaptaciones_pie ( id, enunciado_adaptado, alternativas_adaptadas )
        `)
        .eq('content_block_id', blockId)
        .order('orden');

    if (error) throw new Error(`Error fetching items for block: ${error.message}`);
    return data as EvaluationItem[];
};

export const generatePIEAdaptation = async (itemId: string) => {
    const { data, error } = await supabase.functions.invoke('adapt-question-pie', {
        body: { itemId }
    });
    if (error instanceof FunctionsHttpError) {
        const errorMessage = await error.context.json();
        throw new Error(`Error al generar adaptación PIE: ${errorMessage.error}`);
    } else if (error) {
        throw new Error(`Error al generar adaptación PIE: ${error.message}`);
    }
    return data;
};

export const savePIEAdaptation = async (parentItemId: string, adaptationData: any): Promise<PIEAdaptation> => {
    const { data: upsertedData, error: upsertError } = await supabase
        .from('adaptaciones_pie')
        .upsert({
            parent_item_id: parentItemId,
            enunciado_adaptado: adaptationData.enunciado_adaptado,
            alternativas_adaptadas: adaptationData.alternativas_adaptadas,
        }, {
            onConflict: 'parent_item_id'
        })
        .select()
        .single();

    if (upsertError) {
        throw new Error(`Error al guardar la adaptación PIE: ${upsertError.message}`);
    }

    const { error: updateError } = await supabase
        .from('evaluacion_items')
        .update({ tiene_adaptacion_pie: true })
        .eq('id', parentItemId);

    if (updateError) {
        throw new Error(`Error al actualizar el item, pero la adaptación se guardó: ${updateError.message}`);
    }
    
    return upsertedData;
};

export const updateEvaluationItem = async (itemId: string, data: { enunciado: string; puntaje: number; habilidad_evaluada: string | null; nivel_comprension: string | null; alternativas: any[] }) => {
    const { error } = await supabase.rpc('actualizar_pregunta_y_alternativas', {
        p_item_id: itemId,
        p_enunciado: data.enunciado,
        p_puntaje: data.puntaje,
        p_habilidad_evaluada: data.habilidad_evaluada,
        p_nivel_comprension: data.nivel_comprension,
        p_alternativas: data.alternativas,
    });
    if (error) throw new Error(`Error al actualizar la pregunta: ${error.message}`);
};

export const increaseQuestionDifficulty = async (itemId: string) => {
    const { data: item, error: fetchError } = await supabase
        .from('evaluacion_items')
        .select('enunciado, puntaje, habilidad_evaluada, nivel_comprension, item_alternativas(*)')
        .eq('id', itemId)
        .single();

    if (fetchError) throw new Error(`Error al obtener la pregunta para modificar: ${fetchError.message}`);
    if (!item) throw new Error('Pregunta no encontrada.');

    const { data: newData, error } = await supabase.functions.invoke('increase-question-difficulty', {
        body: { item }
    });
    if (error instanceof FunctionsHttpError) {
        const errorMessage = await error.context.json();
        throw new Error(`Error en la IA para aumentar dificultad: ${errorMessage.error}`);
    } else if (error) {
        throw new Error(`Error en la IA para aumentar dificultad: ${error.message}`);
    }

    await updateEvaluationItem(itemId, {
        enunciado: newData.enunciado,
        puntaje: item.puntaje,
        habilidad_evaluada: item.habilidad_evaluada,
        nivel_comprension: item.nivel_comprension,
        alternativas: newData.alternativas,
    });
};

export const decreaseQuestionDifficulty = async (itemId: string) => {
    const { data: item, error: fetchError } = await supabase
        .from('evaluacion_items')
        .select('enunciado, puntaje, habilidad_evaluada, nivel_comprension, item_alternativas(*)')
        .eq('id', itemId)
        .single();

    if (fetchError) throw new Error(`Error al obtener la pregunta para modificar: ${fetchError.message}`);
    if (!item) throw new Error('Pregunta no encontrada.');

    const { data: newData, error } = await supabase.functions.invoke('decrease-question-difficulty', {
        body: { item }
    });
    if (error instanceof FunctionsHttpError) {
        const errorMessage = await error.context.json();
        throw new Error(`Error en la IA para disminuir dificultad: ${errorMessage.error}`);
    } else if (error) {
        throw new Error(`Error en la IA para disminuir dificultad: ${error.message}`);
    }

    await updateEvaluationItem(itemId, {
        enunciado: newData.enunciado,
        puntaje: item.puntaje,
        habilidad_evaluada: item.habilidad_evaluada,
        nivel_comprension: item.nivel_comprension,
        alternativas: newData.alternativas,
    });
};

export const fetchStudentAndEvaluationInfo = async (responseId: string): Promise<StudentResponseHeader> => {
  const { data, error } = await supabase
    .from('respuestas_estudiante')
    .select(`
      evaluaciones ( titulo ),
      perfiles ( nombre_completo )
    `)
    .eq('id', responseId)
    .single();

  if (error) throw new Error(`Error fetching response info: ${error.message}`);
  if (!data) throw new Error('Response not found.');

  return {
    student_name: (data.perfiles as any)?.nombre_completo || 'Estudiante Desconocido',
    evaluation_title: (data.evaluaciones as any)?.titulo || 'Evaluación Desconocida',
  };
};

export const fetchStudentResponseDetails = async (responseId: string): Promise<StudentResponseItem[]> => {
  const { data, error } = await supabase
    .from('desempeno_item_estudiante')
    .select('*')
    .eq('respuesta_estudiante_id', responseId);

  if (error) throw new Error(`Error fetching student response details: ${error.message}`);
  return data || [];
};

export const submitEvaluationResponse = async (evaluationId: string, answers: StudentAnswer[]): Promise<string> => {
  const { data, error } = await supabase.rpc('submit_student_response', {
    p_evaluation_id: evaluationId,
    p_answers: answers,
  });

  if (error) throw new Error(`Error submitting evaluation: ${error.message}`);
  return data;
};

export const fetchStudentResponseForEvaluation = async (evaluationId: string, studentId: string): Promise<{ id: string } | null> => {
  const { data, error } = await supabase
    .from('respuestas_estudiante')
    .select('id')
    .eq('evaluacion_id', evaluationId)
    .eq('estudiante_perfil_id', studentId)
    .maybeSingle();
  
  if (error) throw new Error(`Error checking for existing response: ${error.message}`);
  return data;
};

export const deleteEvaluationItem = async (itemId: string) => {
  const { error } = await supabase
    .from('evaluacion_items')
    .delete()
    .eq('id', itemId);

  if (error) {
    throw new Error(`Error al eliminar la pregunta: ${error.message}`);
  }
};