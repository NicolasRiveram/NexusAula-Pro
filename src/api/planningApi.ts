import { supabase } from '@/integrations/supabase/client';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { AISuggestions } from '@/pages/dashboard/planning/Step2_ReviewSuggestions';
import { ClassPlan } from '@/pages/dashboard/planning/Step3_ClassSequence';
import { UnitPlanFormData } from '@/pages/dashboard/planning/Step1_UnitConfig';

// --- Tipos para leer datos ---
export interface LinkedCourse {
  curso_asignaturas: {
    id: string;
    cursos: {
      establecimiento_id: string;
      nombre: string;
      niveles: {
        nombre: string;
      };
    };
    asignaturas: {
      nombre:string;
    };
  };
}

export interface UnitPlan {
  id: string;
  titulo: string;
  fecha_inicio: string;
  fecha_fin: string;
  descripcion_contenidos: string;
  unidad_maestra_curso_asignatura_link: LinkedCourse[];
}

export interface ScheduledClass {
  id: string;
  fecha: string;
  titulo: string;
  objetivos_clase: string;
  objetivo_estudiante: string;
  aporte_proyecto: string;
  actividades_inicio: string;
  actividades_desarrollo: string;
  actividades_cierre: string;
  recursos: string;
  objetivo_aprendizaje_texto: string;
  habilidades: string;
  vinculo_interdisciplinario: string;
  aspectos_valoricos_actitudinales: string;
  bitacora_contenido_cubierto?: string;
  bitacora_observaciones?: string;
  estado: 'programada' | 'realizada' | 'cancelada' | 'sin_programar';
  curso_info: {
    nombre: string;
    nivel: string;
    asignatura: string;
  };
}

export interface UnitPlanDetail extends UnitPlan {
  sugerencias_ia: AISuggestions | null;
  clases: ScheduledClass[];
}

export interface ClassLogEntry {
  id: string;
  fecha: string;
  bitacora_contenido_cubierto: string;
  bitacora_observaciones: string | null;
  curso_asignatura_id: string;
  curso_info: {
    nombre: string;
    nivel: string;
    asignatura: string;
  };
}

export interface UpdateClassPayload {
  titulo?: string;
  objetivos_clase?: string;
  objetivo_estudiante?: string;
  aporte_proyecto?: string;
  actividades_inicio?: string;
  actividades_desarrollo?: string;
  actividades_cierre?: string;
  recursos?: string;
  objetivo_aprendizaje_texto?: string;
  habilidades?: string;
  vinculo_interdisciplinario?: string;
  aspectos_valoricos_actitudinales?: string;
}

export interface UpdateUnitPlanData {
  titulo: string;
  descripcion_contenidos: string;
  fecha_inicio: string;
  fecha_fin: string;
  cursoAsignaturaIds: string[];
}


// --- Funciones de API ---

export const fetchClassesWithoutLog = async (docenteId: string, establecimientoId: string): Promise<any[]> => {
  const today = new Date().toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('planificaciones_clase')
    .select(`
      id,
      fecha,
      titulo,
      unidades!inner (
        curso_asignaturas!inner (
          docente_id,
          cursos!inner (
            nombre,
            establecimiento_id,
            niveles ( nombre )
          ),
          asignaturas ( nombre )
        )
      )
    `)
    .eq('unidades.curso_asignaturas.docente_id', docenteId)
    .eq('unidades.curso_asignaturas.cursos.establecimiento_id', establecimientoId)
    .lt('fecha', today)
    .is('bitacora_contenido_cubierto', null)
    .order('fecha', { ascending: false });

  if (error) {
    throw new Error(`Error fetching classes without log: ${error.message}`);
  }

  return (data || []).map((clase: any) => ({
    id: clase.id,
    fecha: clase.fecha,
    titulo: clase.titulo,
    curso_info: {
      nombre: clase.unidades.curso_asignaturas.cursos.nombre,
      nivel: clase.unidades.curso_asignaturas.cursos.niveles.nombre,
      asignatura: clase.unidades.curso_asignaturas.asignaturas.nombre,
    }
  }));
};

export const updateUnitPlanDetails = async (unitMasterId: string, data: UpdateUnitPlanData) => {
  // 1. Update the main unit details
  const { error: updateError } = await supabase
    .from('unidades_maestras')
    .update({
      titulo: data.titulo,
      descripcion_contenidos: data.descripcion_contenidos,
      fecha_inicio: data.fecha_inicio,
      fecha_fin: data.fecha_fin,
    })
    .eq('id', unitMasterId);

  if (updateError) throw new Error(`Error updating unit plan: ${updateError.message}`);

  // 2. Handle course links (delete all, then re-insert)
  const { error: deleteError } = await supabase
    .from('unidad_maestra_curso_asignatura_link')
    .delete()
    .eq('unidad_maestra_id', unitMasterId);

  if (deleteError) throw new Error(`Error clearing old course links: ${deleteError.message}`);

  const newLinks = data.cursoAsignaturaIds.map(id => ({
    unidad_maestra_id: unitMasterId,
    curso_asignatura_id: id,
  }));

  if (newLinks.length > 0) {
    const { error: insertError } = await supabase
      .from('unidad_maestra_curso_asignatura_link')
      .insert(newLinks);
    if (insertError) throw new Error(`Error inserting new course links: ${insertError.message}`);
  }
};

export const linkNewUnitsToProject = async (unidadMaestraId: string, proyectoId: string) => {
  // 1. Find all planificaciones_clase with unidad_maestra_id
  const { data: clases, error: clasesError } = await supabase
    .from('planificaciones_clase')
    .select('unidad_id')
    .eq('unidad_maestra_id', unidadMaestraId);

  if (clasesError) {
    throw new Error(`Error finding newly created units: ${clasesError.message}`);
  }

  if (!clases || clases.length === 0) {
    // No classes were created, so nothing to link. Not an error.
    return;
  }

  // 2. Get distinct unidad_ids
  const unidadIds = [...new Set(clases.map(c => c.unidad_id).filter(Boolean))];

  if (unidadIds.length === 0) {
    return;
  }

  // 3. Create links in proyecto_unidades_link
  const linksToInsert = unidadIds.map(unidadId => ({
    proyecto_id: proyectoId,
    unidad_id: unidadId,
  }));

  const { error: linkError } = await supabase
    .from('proyecto_unidades_link')
    .insert(linksToInsert);

  if (linkError) {
    throw new Error(`Error linking new units to project: ${linkError.message}`);
  }
};

export const fetchClassLogsForTeacher = async (docenteId: string, establecimientoId: string): Promise<ClassLogEntry[]> => {
  const { data, error } = await supabase
    .from('planificaciones_clase')
    .select(`
      id, fecha, bitacora_contenido_cubierto, bitacora_observaciones,
      unidades!inner (
        curso_asignatura_id,
        curso_asignaturas!inner (
          docente_id,
          cursos!inner ( nombre, establecimiento_id, niveles ( nombre ) ),
          asignaturas ( nombre )
        )
      )
    `)
    .eq('unidades.curso_asignaturas.docente_id', docenteId)
    .eq('unidades.curso_asignaturas.cursos.establecimiento_id', establecimientoId)
    .not('bitacora_contenido_cubierto', 'is', null)
    .order('fecha', { ascending: false });

  if (error) throw new Error(`Error fetching class logs: ${error.message}`);

  return (data || []).map((log: any) => ({
    id: log.id,
    fecha: log.fecha,
    bitacora_contenido_cubierto: log.bitacora_contenido_cubierto,
    bitacora_observaciones: log.bitacora_observaciones,
    curso_asignatura_id: log.unidades.curso_asignatura_id,
    curso_info: {
      nombre: log.unidades.curso_asignaturas.cursos.nombre,
      nivel: log.unidades.curso_asignaturas.cursos.niveles.nombre,
      asignatura: log.unidades.curso_asignaturas.asignaturas.nombre,
    }
  }));
};

export const fetchClassesForMonth = async (docenteId: string, establecimientoId: string, month: Date): Promise<ScheduledClass[]> => {
  const startDate = format(startOfMonth(month), 'yyyy-MM-dd');
  const endDate = format(endOfMonth(month), 'yyyy-MM-dd');

  const { data, error } = await supabase
    .from('planificaciones_clase')
    .select(`
      id, fecha, titulo,
      unidades!inner (
        curso_asignatura_id,
        curso_asignaturas!inner (
          docente_id,
          cursos!inner ( nombre, establecimiento_id, niveles ( nombre ) ),
          asignaturas ( nombre )
        )
      )
    `)
    .eq('unidades.curso_asignaturas.docente_id', docenteId)
    .eq('unidades.curso_asignaturas.cursos.establecimiento_id', establecimientoId)
    .gte('fecha', startDate)
    .lte('fecha', endDate);

  if (error) throw new Error(`Error fetching classes for month: ${error.message}`);

  return (data || []).map((c: any) => ({
    id: c.id,
    fecha: c.fecha,
    titulo: c.titulo,
    curso_info: {
      nombre: c.unidades?.curso_asignaturas?.cursos?.nombre || 'N/A',
      nivel: c.unidades?.curso_asignaturas?.cursos?.niveles?.nombre || 'N/A',
      asignatura: c.unidades?.curso_asignaturas?.asignaturas?.nombre || 'N/A',
    }
  })) as ScheduledClass[];
};


export const fetchUnitPlans = async (docenteId: string, establecimientoId: string): Promise<UnitPlan[]> => {
  if (!establecimientoId) return [];

  const { data, error } = await supabase
    .from('unidades_maestras')
    .select(`
      id,
      titulo,
      fecha_inicio,
      fecha_fin,
      descripcion_contenidos,
      unidad_maestra_curso_asignatura_link (
        curso_asignaturas (
          cursos!inner ( establecimiento_id, nombre, niveles ( nombre ) ),
          asignaturas ( nombre )
        )
      )
    `)
    .eq('docente_id', docenteId)
    .eq('establecimiento_id', establecimientoId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Error al cargar los planes de unidad: ${error.message}`);
  
  return (data || []).map(plan => ({
    ...plan,
    unidad_maestra_curso_asignatura_link: plan.unidad_maestra_curso_asignatura_link.filter((link: any) => link.curso_asignaturas && link.curso_asignaturas.cursos)
  })) as any;
};

export const fetchUnitPlanDetails = async (planId: string): Promise<UnitPlanDetail> => {
  const { data: unitData, error: unitError } = await supabase
    .from('unidades_maestras')
    .select(`
      id,
      titulo,
      fecha_inicio,
      fecha_fin,
      descripcion_contenidos,
      sugerencias_ia,
      unidad_maestra_curso_asignatura_link (
        curso_asignaturas (
          id,
          cursos!inner ( establecimiento_id, nombre, niveles ( nombre ) ),
          asignaturas ( nombre )
        )
      )
    `)
    .eq('id', planId)
    .single();

  if (unitError) throw new Error(`Error fetching unit plan details: ${unitError.message}`);
  if (!unitData) throw new Error('Unit plan not found.');

  const { data: classData, error: classError } = await supabase
    .from('planificaciones_clase')
    .select(`
      id, fecha, titulo, objetivos_clase, objetivo_estudiante, aporte_proyecto,
      actividades_inicio, actividades_desarrollo, actividades_cierre, recursos,
      bitacora_contenido_cubierto, bitacora_observaciones, estado,
      objetivo_aprendizaje_texto, habilidades, vinculo_interdisciplinario, aspectos_valoricos_actitudinales,
      unidades ( curso_asignaturas ( cursos ( nombre, niveles ( nombre ) ), asignaturas ( nombre ) ) )
    `)
    .eq('unidad_maestra_id', planId)
    .order('fecha');

  if (classError) throw new Error(`Error fetching scheduled classes: ${classError.message}`);

  let scheduledClasses: ScheduledClass[] = [];

  if (classData && classData.length > 0) {
    scheduledClasses = (classData || []).map((c: any) => ({
      id: c.id,
      fecha: c.fecha,
      titulo: c.titulo,
      objetivos_clase: c.objetivos_clase,
      objetivo_estudiante: c.objetivo_estudiante,
      aporte_proyecto: c.aporte_proyecto,
      actividades_inicio: c.actividades_inicio,
      actividades_desarrollo: c.actividades_desarrollo,
      actividades_cierre: c.actividades_cierre,
      recursos: c.recursos,
      objetivo_aprendizaje_texto: c.objetivo_aprendizaje_texto,
      habilidades: c.habilidades,
      vinculo_interdisciplinario: c.vinculo_interdisciplinario,
      aspectos_valoricos_actitudinales: c.aspectos_valoricos_actitudinales,
      bitacora_contenido_cubierto: c.bitacora_contenido_cubierto,
      bitacora_observaciones: c.bitacora_observaciones,
      estado: c.estado,
      curso_info: {
        nombre: c.unidades?.curso_asignaturas?.cursos?.nombre || 'N/A',
        nivel: c.unidades?.curso_asignaturas?.cursos?.niveles?.nombre || 'N/A',
        asignatura: c.unidades?.curso_asignaturas?.asignaturas?.nombre || 'N/A',
      }
    }));
  } else {
    const { data: masterClasses, error: masterClassError } = await supabase
      .from('clases_maestras')
      .select('*')
      .eq('unidad_maestra_id', planId)
      .order('orden');

    if (masterClassError) throw new Error(`Error fetching master classes: ${masterClassError.message}`);

    scheduledClasses = (masterClasses || []).map((c: any) => ({
      id: c.id,
      fecha: '', // No date for templates
      titulo: c.titulo,
      objetivos_clase: c.objetivos_clase,
      objetivo_estudiante: c.objetivo_estudiante,
      aporte_proyecto: c.aporte_proyecto,
      actividades_inicio: c.actividades_inicio,
      actividades_desarrollo: c.actividades_desarrollo,
      actividades_cierre: c.actividades_cierre,
      recursos: c.recursos,
      objetivo_aprendizaje_texto: c.objetivo_aprendizaje_texto,
      habilidades: c.habilidades,
      vinculo_interdisciplinario: c.vinculo_interdisciplinario,
      aspectos_valoricos_actitudinales: c.aspectos_valoricos_actitudinales,
      estado: 'sin_programar',
      curso_info: { nombre: '', nivel: '', asignatura: '' }
    }));
  }

  return {
    ...unitData,
    unidad_maestra_curso_asignatura_link: unitData.unidad_maestra_curso_asignatura_link.filter((link: any) => link.curso_asignaturas && link.curso_asignaturas.cursos),
    clases: scheduledClasses,
  } as any;
};

export const createUnitPlan = async (formData: UnitPlanFormData, docenteId: string, establecimientoId: string) => {
  const { data: unitMasterData, error: unitMasterError } = await supabase
    .from('unidades_maestras')
    .insert({
      docente_id: docenteId,
      titulo: formData.titulo,
      descripcion_contenidos: formData.descripcionContenidos,
      fecha_inicio: format(formData.fechas.from, 'yyyy-MM-dd'),
      fecha_fin: format(formData.fechas.to, 'yyyy-MM-dd'),
      instrucciones_adicionales_ia: formData.instruccionesAdicionales,
      establecimiento_id: establecimientoId,
    })
    .select('id')
    .single();

  if (unitMasterError) throw new Error(`Error creando la unidad maestra: ${unitMasterError.message}`);
  const unidadMaestraId = unitMasterData.id;

  if (formData.cursoAsignaturaIds && formData.cursoAsignaturaIds.length > 0) {
    const links = formData.cursoAsignaturaIds.map(cursoAsignaturaId => ({
      unidad_maestra_id: unidadMaestraId,
      curso_asignatura_id: cursoAsignaturaId,
    }));

    const { error: linkError } = await supabase
      .from('unidad_maestra_curso_asignatura_link')
      .insert(links);

    if (linkError) {
      await supabase.from('unidades_maestras').delete().eq('id', unidadMaestraId);
      throw new Error(`Error vinculando la unidad a los cursos: ${linkError.message}`);
    }
  }

  return unidadMaestraId;
};

export const updateUnitPlanSuggestions = async (unitMasterId: string, suggestions: AISuggestions) => {
  const { error } = await supabase
    .from('unidades_maestras')
    .update({ sugerencias_ia: suggestions })
    .eq('id', unitMasterId);

  if (error) throw new Error(`Error guardando las sugerencias de la IA: ${error.message}`);
};

export const saveMasterPlanClasses = async (unitMasterId: string, classes: Omit<ClassPlan, 'id' | 'fecha'>[]) => {
  const { error } = await supabase.rpc('guardar_clases_maestras', {
    p_unidad_maestra_id: unitMasterId,
    p_clases_data: classes,
  });
  if (error) throw new Error(`Error al guardar las plantillas de clase: ${error.message}`);
};

export const scheduleClassesFromUnitPlan = async (unitMasterId: string) => {
  const { error } = await supabase.rpc('programar_clases_desde_maestra', {
    p_unidad_maestra_id: unitMasterId,
  });

  if (error) throw new Error(`Error al programar las clases: ${error.message}`);
};

export const updateClassLog = async (planificacionId: string, contenido: string, observaciones: string) => {
  const { error } = await supabase
    .from('planificaciones_clase')
    .update({
      bitacora_contenido_cubierto: contenido,
      bitacora_observaciones: observaciones,
    })
    .eq('id', planificacionId);

  if (error) throw new Error(`Error al guardar la bitácora: ${error.message}`);
};

export const updateClassStatus = async (classId: string, estado: 'programada' | 'realizada' | 'cancelada') => {
  const { error } = await supabase
    .from('planificaciones_clase')
    .update({ estado })
    .eq('id', classId);
  if (error) throw new Error(`Error al actualizar estado de la clase: ${error.message}`);
};

export const updateClassDetails = async (classId: string, details: UpdateClassPayload) => {
    const { error } = await supabase
        .from('planificaciones_clase')
        .update(details)
        .eq('id', classId);
    if (error) throw new Error(`Error al actualizar los detalles de la clase: ${error.message}`);
};

export const updateMasterClassDetails = async (classId: string, details: UpdateClassPayload) => {
    const { error } = await supabase
        .from('clases_maestras')
        .update(details)
        .eq('id', classId);
    if (error) throw new Error(`Error al actualizar la plantilla de clase: ${error.message}`);
};

export const deleteUnitPlan = async (unitMasterId: string) => {
  const { error } = await supabase.rpc('delete_unidad_maestra', {
    p_unidad_maestra_id: unitMasterId,
  });
  if (error) throw new Error(`Error al eliminar el plan de unidad: ${error.message}`);
};