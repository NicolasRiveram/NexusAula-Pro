import { supabase } from '@/integrations/supabase/client';

// Tipos de datos
export interface Nivel {
  id: string;
  nombre: string;
}

export interface Asignatura {
  id: string;
  nombre: string;
}

export interface CursoBase {
  id: string;
  nombre: string;
  anio: number;
  nivel: { nombre: string };
}

export interface CursoAsignatura {
  id: string;
  asignatura: { nombre: string };
  curso: CursoBase;
}

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

// --- Funciones de Lectura ---

export const fetchNiveles = async (): Promise<Nivel[]> => {
  const { data, error } = await supabase.from('niveles').select('id, nombre').order('orden');
  if (error) throw new Error(error.message);
  return data;
};

export const fetchAsignaturas = async (): Promise<Asignatura[]> => {
  const { data, error } = await supabase.from('asignaturas').select('id, nombre').order('nombre');
  if (error) throw new Error(error.message);
  return data;
};

export const fetchDocenteAsignaturas = async (docenteId: string): Promise<Asignatura[]> => {
    const { data, error } = await supabase
        .from('docente_asignaturas')
        .select('asignaturas(id, nombre)')
        .eq('docente_id', docenteId);
    
    if (error) throw new Error(error.message);
    return data.map((item: any) => item.asignaturas).filter(Boolean);
};

export const fetchCursosPorEstablecimiento = async (establecimientoId: string): Promise<CursoBase[]> => {
    const { data, error } = await supabase
      .from('cursos')
      .select('id, nombre, anio, niveles(nombre)')
      .eq('establecimiento_id', establecimientoId)
      .order('anio', { ascending: false })
      .order('nombre');
    if (error) throw new Error(error.message);
    // Filtro de seguridad para evitar errores si un curso no tiene nivel.
    return data.filter(c => c.niveles).map(c => ({ id: c.id, nombre: c.nombre, anio: c.anio, nivel: c.niveles as any }));
};

export const fetchCursosAsignaturasDocente = async (docenteId: string, establecimientoId: string): Promise<CursoAsignatura[]> => {
  // Si no hay un establecimiento seleccionado, no se devuelve nada.
  if (!establecimientoId) return [];

  const { data, error } = await supabase
    .from('curso_asignaturas')
    .select(`
      id,
      asignaturas (nombre),
      cursos!inner (id, nombre, anio, niveles (nombre))
    `)
    .eq('docente_id', docenteId)
    .eq('cursos.establecimiento_id', establecimientoId);
  
  if (error) throw new Error(error.message);
  if (!data) return [];

  return data.map(ca => {
    const asignaturaData = ca.asignaturas as any;
    const cursoData = ca.cursos as any;

    const asignatura = asignaturaData ? { nombre: asignaturaData.nombre } : { nombre: 'Asignatura no asignada' };
    const curso = {
      id: cursoData?.id || 'ID-invalido',
      nombre: cursoData?.nombre || 'Curso sin nombre',
      anio: cursoData?.anio || new Date().getFullYear(),
      nivel: {
        nombre: (cursoData?.niveles as any)?.nombre || 'Nivel no asignado'
      }
    };

    return {
      id: ca.id,
      asignatura,
      curso
    };
  }) as CursoAsignatura[];
};

export const fetchDetallesCursoAsignatura = async (cursoAsignaturaId: string) => {
    const { data, error } = await supabase
        .from('curso_asignaturas')
        .select(`
            id,
            asignaturas (nombre),
            cursos (id, nombre, anio, niveles (nombre))
        `)
        .eq('id', cursoAsignaturaId)
        .single();
    if (error) throw new Error(error.message);

    const asignaturaData = data.asignaturas as any;
    const cursoData = data.cursos as any;

    if (!data || !asignaturaData || !cursoData || !cursoData.niveles) {
        throw new Error("Datos del curso incompletos o no encontrados.");
    }

    return {
        id: data.id,
        asignatura: { nombre: asignaturaData.nombre },
        curso: { 
            id: cursoData.id,
            nombre: cursoData.nombre,
            anio: cursoData.anio,
            nivel: { nombre: (cursoData.niveles as any).nombre } 
        }
    } as CursoAsignatura;
};

export const fetchEstudiantesPorCurso = async (cursoId: string): Promise<Estudiante[]> => {
    const { data, error } = await supabase
        .from('curso_estudiantes')
        .select('perfiles!inner(id, nombre_completo, rut, email, apoyo_pie)')
        .eq('curso_id', cursoId);

    if (error) throw new Error(error.message);
    
    return data
        .filter((ce: any) => ce.perfiles)
        .map((ce: any) => ({
            id: ce.perfiles.id,
            nombre_completo: ce.perfiles.nombre_completo || 'Nombre no disponible',
            rut: ce.perfiles.rut || 'RUT no disponible',
            email: ce.perfiles.email || 'Email no disponible',
            apoyo_pie: ce.perfiles.apoyo_pie || false
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

    const enrollments = data || [];
    
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


// --- Funciones de Escritura ---

export const crearCurso = async (
  nombre: string,
  nivelId: string,
  anio: number,
  establecimientoId: string
): Promise<string> => {
  const { data, error } = await supabase
    .from('cursos')
    .insert({
      nombre,
      nivel_id: nivelId,
      anio,
      establecimiento_id: establecimientoId,
    })
    .select('id')
    .single();
  if (error) throw new Error(error.message);
  return data.id;
};

export const inscribirYCrearEstudiantes = async (cursoId: string, estudiantesData: any[]) => {
  const { data, error } = await supabase.rpc('inscribir_y_crear_estudiantes', {
    p_curso_id: cursoId,
    p_estudiantes_data: estudiantesData,
  });
  if (error) throw new Error(error.message);
  return data;
};

export const asignarAsignatura = async (cursoId: string, asignaturaId: string, docenteId: string) => {
    const { error } = await supabase
        .from('curso_asignaturas')
        .insert({
            curso_id: cursoId,
            asignatura_id: asignaturaId,
            docente_id: docenteId
        });
    if (error) {
        if (error.code === '23505') { // unique_violation
            throw new Error('Esta asignatura ya está asignada a este curso por ti o por otro docente.');
        }
        throw new Error(error.message);
    }
};

export const updateStudentProfile = async (studentId: string, profileData: Partial<Estudiante>) => {
    const { error } = await supabase
        .from('perfiles')
        .update(profileData)
        .eq('id', studentId);
    if (error) throw new Error(error.message);
};