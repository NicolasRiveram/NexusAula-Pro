import { supabase } from '@/integrations/supabase/client';

export interface ScheduleBlock {
  id: string;
  dia_semana: number;
  hora_inicio: string;
  hora_fin: string;
  curso_asignatura_id: string;
  curso_asignatura?: {
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

export const fetchTeacherSchedule = async (docenteId: string, establecimientoId: string): Promise<ScheduleBlock[]> => {
  if (!establecimientoId) return [];

  const { data, error } = await supabase
    .from('horario_curso')
    .select(`
      id,
      dia_semana,
      hora_inicio,
      hora_fin,
      curso_asignatura_id,
      curso_asignaturas!inner (
        docente_id,
        cursos!inner ( nombre, establecimiento_id, niveles ( nombre ) ),
        asignaturas ( nombre )
      )
    `)
    .eq('curso_asignaturas.docente_id', docenteId)
    .eq('curso_asignaturas.cursos.establecimiento_id', establecimientoId)
    .order('dia_semana')
    .order('hora_inicio');

  if (error) throw new Error(`Error al obtener el horario: ${error.message}`);

  return data.map((item: any) => ({
    id: item.id,
    dia_semana: item.dia_semana,
    hora_inicio: item.hora_inicio.substring(0, 5),
    hora_fin: item.hora_fin.substring(0, 5),
    curso_asignatura_id: item.curso_asignatura_id,
    curso_asignatura: {
      curso: {
        nombre: item.curso_asignaturas.cursos.nombre,
        nivel: {
          nombre: item.curso_asignaturas.cursos.niveles.nombre,
        },
      },
      asignatura: {
        nombre: item.curso_asignaturas.asignaturas.nombre,
      },
    },
  }));
};

export const fetchScheduleForCourse = async (cursoAsignaturaId: string): Promise<ScheduleBlock[]> => {
    const { data, error } = await supabase
        .from('horario_curso')
        .select(`*`)
        .eq('curso_asignatura_id', cursoAsignaturaId)
        .order('dia_semana')
        .order('hora_inicio');
    
    if (error) throw new Error(`Error al obtener el horario del curso: ${error.message}`);
    return data.map(item => ({...item, hora_inicio: item.hora_inicio.substring(0,5), hora_fin: item.hora_fin.substring(0,5)}));
}

export interface ScheduleBlockData {
  curso_asignatura_id: string;
  dia_semana: number;
  hora_inicio: string;
  hora_fin: string;
}

export const saveScheduleBlock = async (blockData: ScheduleBlockData, blockId?: string) => {
  if (blockId) {
    const { error } = await supabase.from('horario_curso').update(blockData).eq('id', blockId);
    if (error) throw new Error(`Error al actualizar el bloque de horario: ${error.message}`);
  } else {
    const { error } = await supabase.from('horario_curso').insert(blockData);
    if (error) throw new Error(`Error al crear el bloque de horario: ${error.message}`);
  }
};

export const deleteScheduleBlock = async (blockId: string) => {
  const { error } = await supabase.from('horario_curso').delete().eq('id', blockId);
  if (error) throw new Error(`Error al eliminar el bloque de horario: ${error.message}`);
};