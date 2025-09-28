import { supabase } from '@/integrations/supabase/client';

export interface Project {
  id: string;
  nombre: string;
  descripcion: string;
  fecha_inicio: string;
  fecha_fin: string;
  producto_final: string;
  curso_asignatura: {
    id: string;
    curso: {
      nombre: string;
      nivel: {
        nombre: string;
      }
    },
    asignatura: {
      nombre: string;
    }
  }
}

export const fetchProjects = async (docenteId: string, establecimientoId: string): Promise<Project[]> => {
  if (!establecimientoId) return [];

  const { data, error } = await supabase
    .from('proyectos_abp')
    .select(`
      id,
      nombre,
      descripcion,
      fecha_inicio,
      fecha_fin,
      producto_final,
      curso_asignaturas!inner (
        id,
        cursos!inner ( nombre, establecimiento_id, niveles ( nombre ) ),
        asignaturas ( nombre )
      )
    `)
    .eq('curso_asignaturas.cursos.establecimiento_id', establecimientoId)
    .order('fecha_inicio', { ascending: false });

  if (error) throw new Error(`Error fetching projects: ${error.message}`);

  // Filtrar por docente en el lado del cliente, ya que la consulta RLS lo requiere
  const userProjects = data.filter((p: any) => p.curso_asignaturas.docente_id === docenteId);

  return userProjects.map((p: any) => ({
    id: p.id,
    nombre: p.nombre,
    descripcion: p.descripcion,
    fecha_inicio: p.fecha_inicio,
    fecha_fin: p.fecha_fin,
    producto_final: p.producto_final,
    curso_asignatura: {
      id: p.curso_asignaturas.id,
      curso: {
        nombre: p.curso_asignaturas.cursos.nombre,
        nivel: {
          nombre: p.curso_asignaturas.cursos.niveles.nombre,
        }
      },
      asignatura: {
        nombre: p.curso_asignaturas.asignaturas.nombre,
      }
    }
  }));
};

export interface CreateProjectData {
  cursoAsignaturaId: string;
  nombre: string;
  descripcion: string;
  fecha_inicio: string;
  fecha_fin: string;
  producto_final: string;
}

export const createProject = async (projectData: CreateProjectData) => {
  const { error } = await supabase
    .from('proyectos_abp')
    .insert({
      curso_asignatura_id: projectData.cursoAsignaturaId,
      nombre: projectData.nombre,
      descripcion: projectData.descripcion,
      fecha_inicio: projectData.fecha_inicio,
      fecha_fin: projectData.fecha_fin,
      producto_final: projectData.producto_final,
    });

  if (error) throw new Error(`Error creating project: ${error.message}`);
};