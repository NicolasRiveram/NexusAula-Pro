import { supabase } from '@/integrations/supabase/client';

interface CreateEstablishmentParams {
  p_nombre: string;
  p_direccion: string;
  p_comuna: string;
  p_region: string;
  p_telefono: string | null;
  p_email_contacto: string | null;
}

export const createEstablishmentAndPromoteCoordinator = async (params: CreateEstablishmentParams) => {
  const { data, error } = await supabase.rpc('crear_establecimiento_y_promover_a_coordinador', params);
  if (error) throw error;
  return data;
};

export const requestJoinEstablishment = async (p_establecimiento_id: string) => {
  const { error } = await supabase.rpc('solicitar_union_a_establecimiento', { p_establecimiento_id });
  if (error) throw error;
};

interface CompleteDocenteProfileParams {
  p_nombre_completo: string;
  p_rol_seleccionado: 'docente'; // Especificar que es para docente
  p_asignatura_ids: string[];
  p_nivel_ids: string[];
}

export const completeDocenteProfile = async (params: CompleteDocenteProfileParams) => {
  const { error } = await supabase.rpc('completar_perfil_docente', params);
  if (error) throw error;
};

interface CompleteCoordinatorProfileParams {
  p_nombre_completo: string;
}

export const completeCoordinatorProfile = async (params: CompleteCoordinatorProfileParams) => {
  const { error } = await supabase.rpc('completar_perfil_coordinador', params);
  if (error) throw error;
};

export const searchEstablishments = async (query_text: string) => {
  const { data, error } = await supabase.rpc('buscar_establecimientos', { query_text });
  if (error) throw error;
  return data;
};

export interface Asignatura {
  id: string;
  nombre: string;
}

export interface Nivel {
  id: string;
  nombre: string;
}

export interface Establecimiento {
  id: string;
  nombre: string;
}

export const fetchAsignaturas = async (): Promise<Asignatura[]> => {
  const { data, error } = await supabase
    .from('asignaturas')
    .select('id, nombre')
    .order('nombre');
  if (error) throw error;
  return data;
};

export const fetchNiveles = async (): Promise<Nivel[]> => {
  const { data, error } = await supabase
    .from('niveles')
    .select('id, nombre')
    .order('orden');
  if (error) throw error;
  return data;
};

export const fetchUserProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from('perfiles')
    .select('nombre_completo, rol, perfil_completo')
    .eq('id', userId)
    .single();
  if (error && error.code !== 'PGRST116') throw error; // PGRST116 means no rows found
  return data;
};