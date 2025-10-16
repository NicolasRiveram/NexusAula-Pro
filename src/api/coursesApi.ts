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
  nivel: { id: string; nombre: string };
}

export interface CursoAsignatura {
  id: string;
  asignatura: { id: string; nombre: string };
  curso: CursoBase;
}

export interface Estudiante {
  id: string;
  nombre_completo: string;
  rut: string;
  email: string;
  apoyo_pie: boolean;
}

// --- Funciones de Lectura ---

export const fetchNiveles = async (): Promise<Nivel[]> => {
  const { data, error } = await supabase.from('niveles').select('id, nombre').order('orden');
  if (error) throw new Error(error.message);
  return data;
};

export const fetchDocenteNiveles = async (docenteId: string): Promise<Nivel[]> => {
    const { data, error } = await supabase
        .from('docente_niveles')
        .select('niveles(id, nombre, orden)')
        .eq('docente_id', docenteId)
        .order('orden', { referencedTable: 'niveles' });
    
    if (error) throw new Error(error.message);
    return data.map((item: any) => item.niveles).filter(Boolean);
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
      .select('id, nombre, anio, niveles(id, nombre)')
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
      asignaturas (id, nombre),
      cursos!inner (id, nombre, anio, niveles (id, nombre))
    `)
    .eq('docente_id', docenteId)
    .eq('cursos.establecimiento_id', establecimientoId);
  
  if (error) throw new Error(error.message);
  if (!data) return [];

  return data.map(ca => {
    const asignaturaData = ca.asignaturas as any;
    const cursoData = ca.cursos as any;

    const asignatura = asignaturaData ? { id: asignaturaData.id, nombre: asignaturaData.nombre } : { id: 'ID-invalido', nombre: 'Asignatura no asignada' };
    const curso = {
      id: cursoData?.id || 'ID-invalido',
      nombre: cursoData?.nombre || 'Curso sin nombre',
      anio: cursoData?.anio || new Date().getFullYear(),
      nivel: {
        id: (cursoData?.niveles as any)?.id || 'ID-invalido',
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
            asignaturas (id, nombre),
            cursos (id, nombre, anio, niveles (id, nombre))
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
        asignatura: { id: asignaturaData.id, nombre: asignaturaData.nombre },
        curso: { 
            id: cursoData.id,
            nombre: cursoData.nombre,
            anio: cursoData.anio,
            nivel: { id: (cursoData.niveles as any).id, nombre: (cursoData.niveles as any).nombre } 
        }
    } as CursoAsignatura;
};

export const fetchEstudiantesPorCurso = async (cursoId: string): Promise<Estudiante[]> => {
    const { data, error } = await supabase
        .from('curso_estudiantes')
        .select('perfiles!inner(id, nombre_completo, rut, email, apoyo_pie)')
        .eq('curso_id', cursoId)
        .order('created_at', { ascending: true });

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
  const { data, error } = await supabase.functions.invoke('enroll-students', {
    body: {
      cursoId: cursoId,
      estudiantesData: estudiantesData,
    },
  });
  if (error) {
    throw new Error(`Error al invocar la función: ${error.message}`);
  }
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