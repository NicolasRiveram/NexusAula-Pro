import { supabase } from '@/integrations/supabase/client';

export interface ProjectStage {
  id: string;
  nombre: string;
  descripcion: string;
  fecha_inicio: string;
  fecha_fin: string;
  completada: boolean;
  orden: number;
}

export interface Project {
  id: string;
  nombre: string;
  descripcion: string;
  fecha_inicio: string;
  fecha_fin: string;
  producto_final: string;
  creado_por: string;
  proyecto_curso_asignaturas: {
    curso_asignaturas: {
      id: string;
      docente_id: string;
      cursos: {
        nombre: string;
        niveles: {
          nombre: string;
        };
      };
      asignaturas: {
        nombre: string;
      };
    };
  }[];
}

export interface UnitLink {
  unidades: {
    id: string;
    nombre: string;
    curso_asignaturas: {
      cursos: {
        nombre: string;
        niveles: {
          nombre: string;
        };
      };
    };
  };
}

export interface ProjectDetail extends Project {
  creado_por: string;
  proyecto_etapas: ProjectStage[];
  proyecto_unidades_link: UnitLink[];
}

export const fetchAllProjects = async (establecimientoId: string, nivelId?: string, asignaturaId?: string): Promise<Project[]> => {
  let query = supabase
    .from('proyectos_abp')
    .select(`
      id, nombre, descripcion, fecha_inicio, fecha_fin, producto_final,
      creado_por,
      perfiles!creado_por ( nombre_completo ),
      proyecto_curso_asignaturas!inner (
        curso_asignaturas!inner (
          id,
          docente_id,
          cursos!inner ( id, nombre, nivel_id, niveles ( nombre ) ),
          asignaturas!inner ( id, nombre )
        )
      )
    `)
    .eq('establecimiento_id', establecimientoId);

  if (nivelId) {
    query = query.eq('proyecto_curso_asignaturas.curso_asignaturas.cursos.nivel_id', nivelId);
  }
  if (asignaturaId) {
    query = query.eq('proyecto_curso_asignaturas.curso_asignaturas.asignaturas.id', asignaturaId);
  }

  const { data, error } = await query.order('fecha_inicio', { ascending: false });
  if (error) throw new Error(`Error fetching projects: ${error.message}`);
  
  const uniqueProjects = Array.from(new Map(data.map(p => [p.id, p])).values());
  
  return uniqueProjects as any;
};

export const fetchProjectDetails = async (projectId: string): Promise<ProjectDetail> => {
  const { data, error } = await supabase
    .from('proyectos_abp')
    .select(`
      id, nombre, descripcion, fecha_inicio, fecha_fin, producto_final,
      creado_por,
      perfiles!creado_por ( nombre_completo ),
      proyecto_curso_asignaturas (
        curso_asignaturas (
          id,
          docente_id,
          cursos ( id, nombre, niveles ( nombre ) ),
          asignaturas ( id, nombre )
        )
      ),
      proyecto_etapas ( * ),
      proyecto_unidades_link (
        unidades (
          id,
          nombre,
          curso_asignaturas (
            cursos ( nombre, niveles ( nombre ) )
          )
        )
      )
    `)
    .eq('id', projectId)
    .order('orden', { referencedTable: 'proyecto_etapas' })
    .single();

  if (error) throw new Error(`Error fetching project details: ${error.message}`);
  return data as any;
};

export interface CreateProjectData {
  nombre: string;
  descripcion: string;
  fecha_inicio: string;
  fecha_fin: string;
  producto_final: string;
  establecimiento_id: string;
  creado_por: string;
  curso_asignatura_ids: string[];
}

export const createProject = async (projectData: CreateProjectData) => {
  const { curso_asignatura_ids, ...project } = projectData;
  
  const { data: newProject, error } = await supabase
    .from('proyectos_abp')
    .insert(project)
    .select('id')
    .single();

  if (error) throw new Error(`Error creating project: ${error.message}`);

  const links = curso_asignatura_ids.map(id => ({
    proyecto_id: newProject.id,
    curso_asignatura_id: id,
  }));

  const { error: linkError } = await supabase
    .from('proyecto_curso_asignaturas')
    .insert(links);

  if (linkError) {
    await supabase.from('proyectos_abp').delete().eq('id', newProject.id);
    throw new Error(`Error linking courses to project: ${linkError.message}`);
  }

  return newProject.id;
};

export const linkCoursesToProject = async (projectId: string, cursoAsignaturaIds: string[]) => {
  const links = cursoAsignaturaIds.map(id => ({
    proyecto_id: projectId,
    curso_asignatura_id: id,
  }));

  const { error } = await supabase
    .from('proyecto_curso_asignaturas')
    .insert(links);

  if (error) throw new Error(`Error al unirse al proyecto: ${error.message}`);
};

export const unlinkCourseFromProject = async (projectId: string, cursoAsignaturaId: string) => {
    const { error } = await supabase
        .from('proyecto_curso_asignaturas')
        .delete()
        .eq('proyecto_id', projectId)
        .eq('curso_asignatura_id', cursoAsignaturaId);

    if (error) throw new Error(`Error al desvincular el curso: ${error.message}`);
};

export const fetchAvailableUnitsForProject = async (projectId: string, docenteId: string): Promise<any[]> => {
  const { data: linkedCourses, error: linkedCoursesError } = await supabase
    .from('proyecto_curso_asignaturas')
    .select('curso_asignatura_id')
    .eq('proyecto_id', projectId);
  if (linkedCoursesError) throw new Error(linkedCoursesError.message);
  const linkedCourseIds = linkedCourses.map(lc => lc.curso_asignatura_id);

  const { data: linkedUnits, error: linkedUnitsError } = await supabase
    .from('proyecto_unidades_link')
    .select('unidad_id')
    .eq('proyecto_id', projectId);
  if (linkedUnitsError) throw new Error(linkedUnitsError.message);
  const linkedUnitIds = linkedUnits.map(lu => lu.unidad_id);

  let query = supabase
    .from('unidades')
    .select('id, nombre, curso_asignaturas(cursos(nombre, niveles(nombre)), asignaturas(nombre))')
    .in('curso_asignatura_id', linkedCourseIds);
  
  if (linkedUnitIds.length > 0) {
    query = query.not('id', 'in', `(${linkedUnitIds.join(',')})`);
  }

  const { data: availableUnits, error: availableUnitsError } = await query;
  if (availableUnitsError) throw new Error(availableUnitsError.message);

  return availableUnits || [];
};

export const linkUnitsToProject = async (projectId: string, unidadIds: string[]) => {
  const links = unidadIds.map(id => ({
    proyecto_id: projectId,
    unidad_id: id,
  }));
  const { error } = await supabase.from('proyecto_unidades_link').insert(links);
  if (error) throw new Error(`Error linking units: ${error.message}`);
};

export const unlinkUnitFromProject = async (projectId: string, unidadId: string) => {
  const { error } = await supabase
    .from('proyecto_unidades_link')
    .delete()
    .eq('proyecto_id', projectId)
    .eq('unidad_id', unidadId);
  if (error) throw new Error(`Error unlinking unit: ${error.message}`);
};

export interface StageData {
  nombre: string;
  descripcion: string;
  fecha_inicio: string;
  fecha_fin: string;
}

export const saveStage = async (projectId: string, stageData: StageData, stageId?: string) => {
  if (stageId) {
    const { error } = await supabase.from('proyecto_etapas').update(stageData).eq('id', stageId);
    if (error) throw new Error(`Error updating stage: ${error.message}`);
  } else {
    const { data: existingStages, error: countError } = await supabase.from('proyecto_etapas').select('orden', { count: 'exact' }).eq('proyecto_id', projectId);
    if (countError) throw new Error(`Error counting stages: ${countError.message}`);
    const newOrder = (existingStages?.length || 0) + 1;

    const { error } = await supabase.from('proyecto_etapas').insert({ ...stageData, proyecto_id: projectId, orden: newOrder });
    if (error) throw new Error(`Error creating stage: ${error.message}`);
  }
};

export const deleteStage = async (stageId: string) => {
  const { error } = await supabase.from('proyecto_etapas').delete().eq('id', stageId);
  if (error) throw new Error(`Error deleting stage: ${error.message}`);
};

export const updateStageStatus = async (stageId: string, completada: boolean) => {
  const { error } = await supabase.from('proyecto_etapas').update({ completada }).eq('id', stageId);
  if (error) throw new Error(`Error updating stage status: ${error.message}`);
};