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
  creado_por: {
    nombre_completo: string;
  };
  proyecto_curso_asignaturas: {
    curso_asignaturas: {
      id: string;
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

export interface ProjectDetail extends Project {
  proyecto_etapas: ProjectStage[];
}

export const fetchAllProjects = async (establecimientoId: string, nivelId?: string, asignaturaId?: string): Promise<Project[]> => {
  let query = supabase
    .from('proyectos_abp')
    .select(`
      id, nombre, descripcion, fecha_inicio, fecha_fin, producto_final,
      perfiles!creado_por ( nombre_completo ),
      proyecto_curso_asignaturas!inner (
        curso_asignaturas!inner (
          id,
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
  
  // Deduplicate projects since a project can match multiple courses
  const uniqueProjects = Array.from(new Map(data.map(p => [p.id, p])).values());
  
  return uniqueProjects as any;
};

export const fetchProjectDetails = async (projectId: string): Promise<ProjectDetail> => {
  const { data, error } = await supabase
    .from('proyectos_abp')
    .select(`
      id, nombre, descripcion, fecha_inicio, fecha_fin, producto_final,
      perfiles!creado_por ( nombre_completo ),
      proyecto_curso_asignaturas (
        curso_asignaturas (
          id,
          cursos ( id, nombre, niveles ( nombre ) ),
          asignaturas ( id, nombre )
        )
      ),
      proyecto_etapas ( * )
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
    // Rollback project creation
    await supabase.from('proyectos_abp').delete().eq('id', newProject.id);
    throw new Error(`Error linking courses to project: ${linkError.message}`);
  }

  return newProject.id;
};