import { supabase } from '@/integrations/supabase/client';
import { Asignatura, Nivel } from './coursesApi';

export interface UserProfile {
  nombre_completo: string;
  email: string;
}

export interface UserPedagogicalProfile {
  asignaturas: Asignatura[];
  niveles: Nivel[];
}

export const fetchUserProfile = async (userId: string): Promise<UserProfile> => {
  const { data, error } = await supabase
    .from('perfiles')
    .select('nombre_completo, email')
    .eq('id', userId)
    .single();
  if (error) throw new Error(`Error al obtener el perfil: ${error.message}`);
  return data;
};

export const updateUserProfile = async (userId: string, nombre_completo: string) => {
  const { error } = await supabase
    .from('perfiles')
    .update({ nombre_completo })
    .eq('id', userId);
  if (error) throw new Error(`Error al actualizar el perfil: ${error.message}`);
};

export const fetchUserPedagogicalProfile = async (userId: string): Promise<UserPedagogicalProfile> => {
  const { data: asignaturasData, error: asignaturasError } = await supabase
    .from('docente_asignaturas')
    .select('asignaturas(id, nombre)')
    .eq('docente_id', userId);
  if (asignaturasError) throw new Error(`Error al obtener asignaturas: ${asignaturasError.message}`);

  const { data: nivelesData, error: nivelesError } = await supabase
    .from('docente_niveles')
    .select('niveles(id, nombre)')
    .eq('docente_id', userId);
  if (nivelesError) throw new Error(`Error al obtener niveles: ${nivelesError.message}`);

  return {
    asignaturas: asignaturasData.map((item: any) => item.asignaturas).filter(Boolean),
    niveles: nivelesData.map((item: any) => item.niveles).filter(Boolean),
  };
};

export const updateUserPedagogicalProfile = async (userId: string, asignaturaIds: string[], nivelIds: string[]) => {
  // We use a transaction to ensure data consistency
  const { error: deleteAsignaturasError } = await supabase.from('docente_asignaturas').delete().eq('docente_id', userId);
  if (deleteAsignaturasError) throw new Error(`Error al limpiar asignaturas: ${deleteAsignaturasError.message}`);

  const { error: deleteNivelesError } = await supabase.from('docente_niveles').delete().eq('docente_id', userId);
  if (deleteNivelesError) throw new Error(`Error al limpiar niveles: ${deleteNivelesError.message}`);

  if (asignaturaIds.length > 0) {
    const asignaturasToInsert = asignaturaIds.map(id => ({ docente_id: userId, asignatura_id: id }));
    const { error: insertAsignaturasError } = await supabase.from('docente_asignaturas').insert(asignaturasToInsert);
    if (insertAsignaturasError) throw new Error(`Error al guardar nuevas asignaturas: ${insertAsignaturasError.message}`);
  }

  if (nivelIds.length > 0) {
    const nivelesToInsert = nivelIds.map(id => ({ docente_id: userId, nivel_id: id }));
    const { error: insertNivelesError } = await supabase.from('docente_niveles').insert(nivelesToInsert);
    if (insertNivelesError) throw new Error(`Error al guardar nuevos niveles: ${insertNivelesError.message}`);
  }
};