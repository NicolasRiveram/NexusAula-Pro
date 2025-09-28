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
      }
    },
    asignatura: {
      nombre: string;
    }
  }
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
      curso_asignaturas!inner (
        docente_id,
        cursos!inner ( nombre, establecimiento_id, niveles ( nombre ) ),
        asignaturas ( nombre )
      )
    `)
    .eq('curso_asignaturas.cursos.establecimiento_id', establecimientoId)
    .eq('curso_asignaturas.docente_id', docenteId)
    .order('fecha_aplicacion', { ascending: false });

  if (error) throw new Error(`Error al cargar las evaluaciones: ${error.message}`);

  return data.map((e: any) => ({
    id: e.id,
    titulo: e.titulo,
    tipo: e.tipo,
    fecha_aplicacion: e.fecha_aplicacion,
    curso_asignatura: {
      curso: {
        nombre: e.curso_asignaturas.cursos.nombre,
        nivel: {
          nombre: e.curso_asignaturas.cursos.niveles.nombre,
        }
      },
      asignatura: {
        nombre: e.curso_asignaturas.asignaturas.nombre,
      }
    }
  }));
};

export interface CreateEvaluationData {
  cursoAsignaturaId: string;
  titulo: string;
  tipo: string;
  descripcion: string;
  fecha_aplicacion: string;
}

export const createEvaluation = async (evalData: CreateEvaluationData) => {
  const { data, error } = await supabase
    .from('evaluaciones')
    .insert({
      curso_asignatura_id: evalData.cursoAsignaturaId,
      titulo: evalData.titulo,
      tipo: evalData.tipo,
      descripcion: evalData.descripcion,
      fecha_aplicacion: evalData.fecha_aplicacion,
    })
    .select('id')
    .single();

  if (error) throw new Error(`Error al crear la evaluación: ${error.message}`);
  return data.id;
};