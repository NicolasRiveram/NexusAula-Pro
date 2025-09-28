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

export const fetchCursosPorEstablecimiento = async (establecimientoId: string): Promise<CursoBase[]> => {
    const { data, error } = await supabase
      .from('cursos')
      .select('id, nombre, anio, niveles(nombre)')
      .eq('establecimiento_id', establecimientoId)
      .order('anio', { ascending: false })
      .order('nombre');
    if (error) throw new Error(error.message);
    return data.map(c => ({ ...c, nivel: c.niveles })) as CursoBase[];
};

export const fetchCursosAsignaturasDocente = async (docenteId: string): Promise<CursoAsignatura[]> => {
  const { data, error } = await supabase
    .from('curso_asignaturas')
    .select(`
      id,
      asignaturas (nombre),
      cursos (id, nombre, anio, niveles (nombre))
    `)
    .eq('docente_id', docenteId);
  
  if (error) throw new Error(error.message);
  return data.map(ca => ({
      id: ca.id,
      asignatura: { nombre: ca.asignaturas.nombre },
      curso: { ...ca.cursos, nivel: { nombre: ca.cursos.niveles.nombre } }
  })) as CursoAsignatura[];
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
    return {
        id: data.id,
        asignatura: { nombre: data.asignaturas.nombre },
        curso: { ...data.cursos, nivel: { nombre: data.cursos.niveles.nombre } }
    } as CursoAsignatura;
};

export const fetchEstudiantesPorCurso = async (cursoId: string): Promise<Estudiante[]> => {
    const { data, error } = await supabase
        .from('curso_estudiantes')
        .select('perfiles (id, nombre_completo, rut, email:auth.users(email))')
        .eq('curso_id', cursoId);

    if (error) throw new Error(error.message);
    
    // La estructura de datos es un poco compleja, la aplanamos aquí
    return data.map((ce: any) => ({
        id: ce.perfiles.id,
        nombre_completo: ce.perfiles.nombre_completo,
        rut: ce.perfiles.rut,
        email: ce.perfiles.email?.email || 'No disponible'
    }));
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