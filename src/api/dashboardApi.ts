import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

export interface AgendaClase {
  id: string;
  titulo: string;
  hora_inicio: string;
  hora_fin: string;
  curso_info: {
    nombre: string;
    nivel: string;
  };
}

export interface AgendaEvaluacion {
  id: string;
  titulo: string;
  tipo: string;
  curso_info: {
    nombre: string;
    nivel: string;
  };
}

export interface AgendaAnuncio {
  id: string;
  titulo: string;
  mensaje: string;
}

export interface DailyAgendaData {
  clases: AgendaClase[];
  evaluaciones: AgendaEvaluacion[];
  anuncios: AgendaAnuncio[];
}

export const fetchDashboardDataForDay = async (
  docenteId: string,
  establecimientoId: string,
  date: Date
): Promise<DailyAgendaData> => {
  const formattedDate = format(date, 'yyyy-MM-dd');

  // 1. Fetch Clases
  const { data: clasesData, error: clasesError } = await supabase
    .from('horario_curso')
    .select(`
      id, hora_inicio, hora_fin,
      curso_asignaturas!inner (
        id,
        cursos!inner ( nombre, establecimiento_id, niveles ( nombre ) ),
        asignaturas ( nombre )
      )
    `)
    .eq('curso_asignaturas.docente_id', docenteId)
    .eq('curso_asignaturas.cursos.establecimiento_id', establecimientoId)
    .eq('dia_semana', date.getDay() === 0 ? 7 : date.getDay()); // Ajuste para DOW

  if (clasesError) throw new Error(`Error fetching classes: ${clasesError.message}`);

  const clases: AgendaClase[] = (clasesData || []).map((c: any) => ({
    id: c.id,
    titulo: c.curso_asignaturas.asignaturas.nombre,
    hora_inicio: c.hora_inicio.substring(0, 5),
    hora_fin: c.hora_fin.substring(0, 5),
    curso_info: {
      nombre: c.curso_asignaturas.cursos.nombre,
      nivel: c.curso_asignaturas.cursos.niveles.nombre,
    },
  }));

  // 2. Fetch Evaluaciones
  const { data: evaluacionesData, error: evaluacionesError } = await supabase
    .from('evaluaciones')
    .select(`
      id, titulo, tipo,
      curso_asignaturas!inner (
        docente_id,
        cursos!inner ( nombre, establecimiento_id, niveles ( nombre ) )
      )
    `)
    .eq('curso_asignaturas.docente_id', docenteId)
    .eq('curso_asignaturas.cursos.establecimiento_id', establecimientoId)
    .eq('fecha_aplicacion', formattedDate);

  if (evaluacionesError) throw new Error(`Error fetching evaluations: ${evaluacionesError.message}`);

  const evaluaciones: AgendaEvaluacion[] = (evaluacionesData || []).map((e: any) => ({
    id: e.id,
    titulo: e.titulo,
    tipo: e.tipo,
    curso_info: {
      nombre: e.curso_asignaturas.cursos.nombre,
      nivel: e.curso_asignaturas.cursos.niveles.nombre,
    },
  }));

  // 3. Fetch Anuncios
  const { data: anunciosData, error: anunciosError } = await supabase
    .from('anuncios')
    .select('id, titulo, mensaje')
    .eq('establecimiento_id', establecimientoId)
    .lte('fecha_inicio', formattedDate)
    .gte('fecha_fin', formattedDate);

  if (anunciosError) throw new Error(`Error fetching announcements: ${anunciosError.message}`);

  return {
    clases: clases.sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio)),
    evaluaciones,
    anuncios: anunciosData || [],
  };
};