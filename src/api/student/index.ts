import { supabase } from '@/integrations/supabase/client';
import { format, addDays } from 'date-fns';

export interface Estudiante {
  id: string;
  nombre_completo: string;
  rut: string;
  email: string;
  apoyo_pie: boolean;
}

export interface StudentEnrollment {
  curso_asignatura_id: string;
  curso_nombre: string;
  anio: number;
  nivel_nombre: string;
  asignatura_nombre: string;
}

export interface StudentEvaluationHistory {
  evaluation_id: string;
  evaluation_title: string;
  response_date: string;
  score_obtained: number;
  max_score: number;
}

export interface StudentPerformanceStats {
  average_score: number | null;
  completed_evaluations: number | null;
  total_evaluations: number | null;
}

export interface StudentSkillPerformance {
  habilidad_nombre: string;
  promedio_logro: number;
}

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

export interface StudentScheduleBlock {
  id: string;
  dia_semana: number;
  hora_inicio: string;
  hora_fin: string;
  curso_nombre: string;
  nivel_nombre: string;
  asignatura_nombre: string;
}

export interface StudentCourseEvaluation {
  id: string;
  titulo: string;
  tipo: string;
  fecha_aplicacion: string;
  status: 'Pendiente' | 'Completado';
}

export interface StudentCourseClass {
  id: string;
  fecha: string;
  titulo: string;
  estado: string;
}

export const fetchClassesForStudentCourse = async (cursoAsignaturaId: string): Promise<StudentCourseClass[]> => {
  const { data: unidades, error: unidadesError } = await supabase
    .from('unidades')
    .select('id')
    .eq('curso_asignatura_id', cursoAsignaturaId);

  if (unidadesError) throw new Error(`Error fetching units for course: ${unidadesError.message}`);
  if (!unidades || unidades.length === 0) return [];

  const unidadIds = unidades.map(u => u.id);

  const { data: clases, error: clasesError } = await supabase
    .from('planificaciones_clase')
    .select('id, fecha, titulo, estado')
    .in('unidad_id', unidadIds)
    .order('fecha', { ascending: false });

  if (clasesError) throw new Error(`Error fetching classes for course: ${clasesError.message}`);
  return clases || [];
};

export const fetchStudentCourseDetails = async (studentId: string, cursoAsignaturaId: string): Promise<StudentCourse | null> => {
  const { data, error } = await supabase
    .from('curso_asignaturas')
    .select(`
      id,
      asignaturas ( nombre ),
      perfiles ( nombre_completo ),
      cursos!inner (
        nombre,
        niveles ( nombre ),
        curso_estudiantes!inner ( estudiante_perfil_id )
      )
    `)
    .eq('id', cursoAsignaturaId)
    .eq('cursos.curso_estudiantes.estudiante_perfil_id', studentId)
    .single();

  if (error) throw new Error(`Error fetching student course details: ${error.message}`);
  if (!data) return null;

  return {
    id: data.id,
    curso_nombre: (data.cursos as any).nombre,
    asignatura_nombre: (data.asignaturas as any).nombre,
    nivel_nombre: (data.cursos as any).niveles.nombre,
    docente_nombre: (data.perfiles as any)?.nombre_completo || 'No asignado',
  };
};

export const fetchStudentEvaluationsForCourse = async (studentId: string, cursoAsignaturaId: string): Promise<StudentCourseEvaluation[]> => {
  const { data: evalLinks, error: linkError } = await supabase
    .from('evaluacion_curso_asignaturas')
    .select('evaluacion_id')
    .eq('curso_asignatura_id', cursoAsignaturaId);
  if (linkError) throw new Error(linkError.message);
  const evalIds = evalLinks.map(l => l.evaluacion_id);

  if (evalIds.length === 0) return [];

  const { data: evals, error: evalsError } = await supabase
    .from('evaluaciones')
    .select('id, titulo, tipo, fecha_aplicacion')
    .in('id', evalIds)
    .order('fecha_aplicacion', { ascending: false });
  if (evalsError) throw new Error(evalsError.message);

  const { data: responses, error: responsesError } = await supabase
    .from('respuestas_estudiante')
    .select('evaluacion_id')
    .eq('estudiante_perfil_id', studentId)
    .in('evaluacion_id', evalIds);
  if (responsesError) throw new Error(responsesError.message);
  const completedEvalIds = new Set(responses.map(r => r.evaluacion_id));

  return evals.map(e => ({
    ...e,
    status: completedEvalIds.has(e.id) ? 'Completado' : 'Pendiente',
  }));
};

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

export const fetchStudentWeeklySchedule = async (studentId: string, establecimientoId: string): Promise<StudentScheduleBlock[]> => {
  const { data, error } = await supabase
    .from('horario_curso')
    .select(`
      id,
      dia_semana,
      hora_inicio,
      hora_fin,
      curso_asignaturas!inner (
        cursos!inner (
          nombre,
          establecimiento_id,
          niveles ( nombre ),
          curso_estudiantes!inner ( estudiante_perfil_id )
        ),
        asignaturas ( nombre )
      )
    `)
    .eq('curso_asignaturas.cursos.establecimiento_id', establecimientoId)
    .eq('curso_asignaturas.cursos.curso_estudiantes.estudiante_perfil_id', studentId);

  if (error) throw new Error(`Error fetching student schedule: ${error.message}`);

  return (data || []).map((item: any) => ({
    id: item.id,
    dia_semana: item.dia_semana,
    hora_inicio: item.hora_inicio.substring(0, 5),
    hora_fin: item.hora_fin.substring(0, 5),
    curso_nombre: item.curso_asignaturas.cursos.nombre,
    nivel_nombre: item.curso_asignaturas.cursos.niveles.nombre,
    asignatura_nombre: item.curso_asignaturas.asignaturas.nombre,
  }));
};

export const fetchStudentProfile = async (studentId: string): Promise<Estudiante> => {
    const { data, error } = await supabase
        .from('perfiles')
        .select('id, nombre_completo, rut, email, apoyo_pie')
        .eq('id', studentId)
        .single();
    if (error) throw new Error(error.message);
    return data;
};

export const fetchStudentEnrollments = async (studentId: string): Promise<StudentEnrollment[]> => {
    const { data, error } = await supabase.rpc('get_student_enrollments', {
        p_student_id: studentId,
    });

    if (error) {
        throw new Error(`Error fetching student enrollments: ${error.message}`);
    }

    const enrollments: StudentEnrollment[] = (data as any) || [];
    
    const uniqueEnrollments = Array.from(new Map(enrollments.map(e => [e.curso_asignatura_id, e])).values());
    
    return uniqueEnrollments.sort((a, b) => b.anio - a.anio || a.nivel_nombre.localeCompare(b.nivel_nombre));
};

export const fetchStudentEvaluationHistory = async (studentId: string): Promise<StudentEvaluationHistory[]> => {
    const { data, error } = await supabase.rpc('get_student_evaluation_history', {
        p_student_id: studentId,
    });

    if (error) {
        throw new Error(`Error fetching student evaluation history: ${error.message}`);
    }
    return data || [];
};

export const fetchStudentPerformanceStats = async (studentId: string): Promise<StudentPerformanceStats> => {
    const { data, error } = await supabase.rpc('get_student_performance_details', {
        p_student_id: studentId,
    });
    if (error) throw new Error(`Error fetching student performance stats: ${error.message}`);
    return data?.[0] || { average_score: 0, completed_evaluations: 0, total_evaluations: 0 };
};

export const fetchStudentSkillPerformance = async (studentId: string): Promise<StudentSkillPerformance[]> => {
    const { data, error } = await supabase.rpc('get_student_skill_performance', {
        p_student_id: studentId,
    });
    if (error) throw new Error(`Error fetching student skill performance: ${error.message}`);
    return data || [];
};

export const updateStudentProfile = async (studentId: string, profileData: Partial<Estudiante>) => {
    const { error } = await supabase
        .from('perfiles')
        .update(profileData)
        .eq('id', studentId);
    if (error) throw new Error(error.message);
};