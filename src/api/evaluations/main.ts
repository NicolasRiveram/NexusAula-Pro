import { supabase } from '@/integrations/supabase/client';
import type { Evaluation, StudentEvaluation, CreateEvaluationData, EvaluationDetail } from './types';

export const fetchEvaluations = async (docenteId: string, establecimientoId: string): Promise<Evaluation[]> => {
  if (!establecimientoId) return [];

  const { data, error } = await supabase
    .from('evaluaciones')
    .select(`
      id,
      titulo,
      tipo,
      fecha_aplicacion,
      evaluacion_curso_asignaturas!inner (
        curso_asignatura_id,
        curso_asignaturas!inner (
          docente_id,
          cursos!inner ( nombre, establecimiento_id, niveles ( nombre ) ),
          asignaturas ( nombre )
        )
      )
    `)
    .eq('evaluacion_curso_asignaturas.curso_asignaturas.cursos.establecimiento_id', establecimientoId)
    .eq('evaluacion_curso_asignaturas.curso_asignaturas.docente_id', docenteId)
    .order('fecha_aplicacion', { ascending: false });

  if (error) throw new Error(`Error al cargar las evaluaciones: ${error.message}`);

  return (data || []).map((e: any) => ({
    id: e.id,
    titulo: e.titulo,
    tipo: e.tipo,
    fecha_aplicacion: e.fecha_aplicacion,
    curso_asignaturas: e.evaluacion_curso_asignaturas.map((link: any) => ({
      id: link.curso_asignatura_id,
      curso: {
        nombre: link.curso_asignaturas.cursos.nombre,
        nivel: { nombre: link.curso_asignaturas.cursos.niveles.nombre }
      },
      asignatura: { nombre: link.curso_asignaturas.asignaturas.nombre }
    }))
  }));
};

export const fetchStudentEvaluations = async (studentId: string, establecimientoId: string): Promise<StudentEvaluation[]> => {
  if (!establecimientoId) return [];

  const { data, error } = await supabase
    .from('evaluaciones')
    .select(`
      id, titulo, tipo, fecha_aplicacion,
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
      status: e.respuestas_estudiante.some((r: any) => r.id) ? 'Completado' : 'Pendiente',
      curso_nombre: `${cursoAsignatura?.cursos?.niveles?.nombre} ${cursoAsignatura?.cursos?.nombre}`,
      asignatura_nombre: cursoAsignatura?.asignaturas?.nombre,
    };
  });
};

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
  const newEvaluationId = data.id;

  const links = evalData.cursoAsignaturaIds.map(id => ({
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
  
  return newEvaluationId;
};

export const updateEvaluation = async (evaluationId: string, evalData: CreateEvaluationData) => {
  const { error: updateError } = await supabase
    .from('evaluaciones')
    .update({
      titulo: evalData.titulo,
      tipo: evalData.tipo,
      descripcion: evalData.descripcion,
      fecha_aplicacion: evalData.fecha_aplicacion,
      randomizar_preguntas: evalData.randomizar_preguntas,
      randomizar_alternativas: evalData.randomizar_alternativas,
    })
    .eq('id', evaluationId);

  if (updateError) throw new Error(`Error updating evaluation: ${updateError.message}`);

  const { data: existingLinks, error: fetchError } = await supabase
    .from('evaluacion_curso_asignaturas')
    .select('curso_asignatura_id')
    .eq('evaluacion_id', evaluationId);

  if (fetchError) throw new Error(`Error fetching existing links: ${fetchError.message}`);

  const existingIds = existingLinks.map(l => l.curso_asignatura_id);
  const newIds = evalData.cursoAsignaturaIds;

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
      evaluacion_curso_asignaturas (
        curso_asignatura_id,
        curso_asignaturas (
          cursos ( nombre, niveles ( nombre ) ),
          asignaturas ( nombre )
        )
      ),
      evaluation_content_blocks (
        *,
        evaluacion_items (
          *,
          item_alternativas ( * ),
          adaptaciones_pie ( * )
        )
      )
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
        nivel: { nombre: link.curso_asignaturas.cursos.niveles.nombre }
      },
      asignatura: { nombre: link.curso_asignaturas.asignaturas.nombre }
    }))
  };

  return formattedData as EvaluationDetail;
};