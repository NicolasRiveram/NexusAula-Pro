import { supabase } from '@/integrations/supabase/client';

export interface Evaluation {
  id: string;
  titulo: string;
  tipo: string;
  fecha_aplicacion: string;
  curso_asignatura: {
    curso: {
      nombre: string;
      nivel: {
        nombre: string;
      };
    };
    asignatura: {
      nombre: string;
    };
  };
}

export interface EvaluationContentBlock {
  id: string;
  evaluation_id: string;
  block_type: 'text' | 'image' | 'unit_plan' | 'library_text';
  content: any;
  orden: number;
}

export const fetchEvaluations = async (docenteId: string, establecimientoId: string): Promise<Evaluation[]> => {
  if (!establecimientoId) return [];

  const { data, error } = await supabase
    .from('evaluaciones')
    .select(`
      id,
      titulo,
      tipo,
      fecha_aplicacion,
      evaluation_course_links!inner (
        curso_asignaturas!inner (
          docente_id,
          cursos!inner ( nombre, establecimiento_id, niveles ( nombre ) ),
          asignaturas ( nombre )
        )
      )
    `)
    .eq('evaluation_course_links.curso_asignaturas.cursos.establecimiento_id', establecimientoId)
    .eq('evaluation_course_links.curso_asignaturas.docente_id', docenteId)
    .order('fecha_aplicacion', { ascending: false });

  if (error) throw new Error(`Error al cargar las evaluaciones: ${error.message}`);

  // Since one evaluation can be linked to multiple courses, we need to flatten the result.
  const evaluations: Evaluation[] = [];
  (data || []).forEach((e: any) => {
    e.evaluation_course_links.forEach((link: any) => {
      evaluations.push({
        id: e.id,
        titulo: e.titulo,
        tipo: e.tipo,
        fecha_aplicacion: e.fecha_aplicacion,
        curso_asignatura: {
          curso: {
            nombre: link.curso_asignaturas.cursos.nombre,
            nivel: { nombre: link.curso_asignaturas.cursos.niveles.nombre }
          },
          asignatura: { nombre: link.curso_asignaturas.asignaturas.nombre }
        }
      });
    });
  });

  return evaluations;
};

export interface CreateEvaluationData {
  titulo: string;
  tipo: string;
  descripcion: string;
  fecha_aplicacion: string;
  cursoAsignaturaIds: string[];
}

export const createEvaluation = async (evalData: CreateEvaluationData) => {
  const { data, error } = await supabase
    .from('evaluaciones')
    .insert({
      titulo: evalData.titulo,
      tipo: evalData.tipo,
      descripcion: evalData.descripcion,
      fecha_aplicacion: evalData.fecha_aplicacion,
    })
    .select('id')
    .single();

  if (error) throw new Error(`Error al crear la evaluación: ${error.message}`);
  const evaluationId = data.id;

  const links = evalData.cursoAsignaturaIds.map(id => ({
    evaluation_id: evaluationId,
    curso_asignatura_id: id,
  }));

  const { error: linkError } = await supabase.from('evaluation_course_links').insert(links);

  if (linkError) {
    // Rollback
    await supabase.from('evaluaciones').delete().eq('id', evaluationId);
    throw new Error(`Error al vincular la evaluación a los cursos: ${linkError.message}`);
  }

  return evaluationId;
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

export const createContentBlock = async (evaluationId: string, blockType: string, content: any, order: number) => {
  const { data, error } = await supabase
    .from('evaluation_content_blocks')
    .insert({
      evaluation_id: evaluationId,
      block_type: blockType,
      content: content,
      orden: order,
    })
    .select()
    .single();
  if (error) throw new Error(`Error al crear el bloque de contenido: ${error.message}`);
  return data;
};

export const deleteContentBlock = async (blockId: string) => {
  const { error } = await supabase.from('evaluation_content_blocks').delete().eq('id', blockId);
  if (error) throw new Error(`Error al eliminar el bloque de contenido: ${error.message}`);
};