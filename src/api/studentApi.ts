import { supabase } from '@/integrations/supabase/client';
import { format, addDays } from 'date-fns';

export interface StudentCourse {
  id: string; // curso_asignatura_id
  curso_nombre: string;
  asignatura_nombre: string;
  nivel_nombre: string;
  docente_nombre: string | null;
}

export interface StudentAgendaItem {
  id: string;
  type: 'class' | 'evaluation';
  titulo: string;
  hora_inicio?: string;
  curso_info: string;
}

export interface StudentDashboardData {
  agenda: StudentAgendaItem[];
  anuncios: { id: string; titulo: string; mensaje: string }[];
}

export const fetchStudentCourses = async (studentId: string, establecimientoId: string): Promise<StudentCourse[]> => {
  const { data, error } = await supabase
    .from('curso_estudiantes')
    .select(`
      cursos!inner (
        id, nombre, establecimiento_id, niveles ( nombre ),
        curso_asignaturas!inner (
          id,
          asignaturas ( nombre ),
          perfiles ( nombre_completo )
        )
      )
    `)
    .eq('estudiante_perfil_id', studentId)
    .eq('cursos.establecimiento_id', establecimientoId);

  if (error) throw new Error(`Error fetching student courses: ${error.message}`);

  const courses: StudentCourse[] = [];
  data.forEach((enrollment: any) => {
    enrollment.cursos.curso_asignaturas.forEach((ca: any) => {
      courses.push({
        id: ca.id,
        curso_nombre: enrollment.cursos.nombre,
        asignatura_nombre: ca.asignaturas.nombre,
        nivel_nombre: enrollment.cursos.niveles.nombre,
        docente_nombre: ca.perfiles?.nombre_completo || 'No asignado',
      });
    });
  });
  return courses;
};

export const fetchStudentDashboardData = async (studentId: string, establecimientoId: string, date: Date): Promise<StudentDashboardData> => {
  const formattedDate = format(date, 'yyyy-MM-dd');

  const { data: agendaData, error: agendaError } = await supabase.rpc('get_student_agenda_for_day', {
    p_student_id: studentId,
    p_date: formattedDate
  });

  if (agendaError) throw new Error(`Error fetching student agenda: ${agendaError.message}`);

  const { data: anunciosData, error: anunciosError } = await supabase
    .from('anuncios')
    .select('id, titulo, mensaje')
    .eq('establecimiento_id', establecimientoId)
    .lte('fecha_inicio', formattedDate)
    .gte('fecha_fin', formattedDate);

  if (anunciosError) throw new Error(`Error fetching announcements: ${anunciosError.message}`);

  return {
    agenda: agendaData || [],
    anuncios: anunciosData || [],
  };
};