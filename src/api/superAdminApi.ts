import { supabase } from '@/integrations/supabase/client';

export interface Establishment {
  id: string;
  nombre: string;
  direccion: string | null;
  comuna: string | null;
  region: string | null;
  telefono: string | null;
  email_contacto: string | null;
  created_at: string;
}

export type EstablishmentData = Omit<Establishment, 'id' | 'created_at'>;

export interface Nivel {
  id: string;
  nombre: string;
  orden: number;
}

export type NivelData = Omit<Nivel, 'id'>;

export interface Asignatura {
  id: string;
  nombre: string;
  descripcion: string | null;
}

export type AsignaturaData = Omit<Asignatura, 'id'>;

export interface GlobalUser {
  id: string;
  nombre_completo: string;
  email: string;
  rol: string;
  establecimientos: {
    nombre: string;
    rol_en_establecimiento: string;
  }[];
}

export const fetchAllUsers = async (): Promise<GlobalUser[]> => {
  const { data, error } = await supabase
    .from('perfiles')
    .select(`
      id,
      nombre_completo,
      email,
      rol,
      perfil_establecimientos (
        rol_en_establecimiento,
        establecimientos ( nombre )
      )
    `)
    .order('nombre_completo');

  if (error) throw new Error(`Error fetching users: ${error.message}`);
  
  return (data || []).map((user: any) => ({
    ...user,
    establecimientos: (user.perfil_establecimientos || []).map((pe: any) => ({
      nombre: pe.establecimientos?.nombre || 'Establecimiento no encontrado',
      rol_en_establecimiento: pe.rol_en_establecimiento,
    })),
  }));
};

export const updateUserGlobalRole = async (userId: string, newRole: string) => {
  const { error } = await supabase
    .from('perfiles')
    .update({ rol: newRole })
    .eq('id', userId);
  if (error) throw new Error(`Error updating user role: ${error.message}`);
};

export const fetchAllEstablishments = async (): Promise<Establishment[]> => {
  const { data, error } = await supabase
    .from('establecimientos')
    .select('*')
    .order('nombre', { ascending: true });
  if (error) throw new Error(`Error fetching establishments: ${error.message}`);
  return data || [];
};

export const saveEstablishment = async (establishmentData: Partial<EstablishmentData>, establishmentId?: string) => {
  if (establishmentId) {
    const { error } = await supabase
      .from('establecimientos')
      .update(establishmentData)
      .eq('id', establishmentId);
    if (error) throw new Error(`Error updating establishment: ${error.message}`);
  } else {
    const { error } = await supabase
      .from('establecimientos')
      .insert(establishmentData as EstablishmentData);
    if (error) throw new Error(`Error creating establishment: ${error.message}`);
  }
};

export const deleteEstablishment = async (establishmentId: string) => {
  const { error } = await supabase
    .from('establecimientos')
    .delete()
    .eq('id', establishmentId);
  if (error) throw new Error(`Error deleting establishment: ${error.message}`);
};

// --- Curriculum Management ---

export const fetchAllNiveles = async (): Promise<Nivel[]> => {
  const { data, error } = await supabase.from('niveles').select('*').order('orden');
  if (error) throw new Error(`Error fetching niveles: ${error.message}`);
  return data || [];
};

export const saveNivel = async (nivelData: NivelData, nivelId?: string) => {
  if (nivelId) {
    const { error } = await supabase.from('niveles').update(nivelData).eq('id', nivelId);
    if (error) throw new Error(`Error updating nivel: ${error.message}`);
  } else {
    const { error } = await supabase.from('niveles').insert(nivelData);
    if (error) throw new Error(`Error creating nivel: ${error.message}`);
  }
};

export const deleteNivel = async (nivelId: string) => {
  const { error } = await supabase.from('niveles').delete().eq('id', nivelId);
  if (error) throw new Error(`Error deleting nivel: ${error.message}`);
};

export const fetchAllAsignaturas = async (): Promise<Asignatura[]> => {
  const { data, error } = await supabase.from('asignaturas').select('*').order('nombre');
  if (error) throw new Error(`Error fetching asignaturas: ${error.message}`);
  return data || [];
};

export const saveAsignatura = async (asignaturaData: AsignaturaData, asignaturaId?: string) => {
  if (asignaturaId) {
    const { error } = await supabase.from('asignaturas').update(asignaturaData).eq('id', asignaturaId);
    if (error) throw new Error(`Error updating asignatura: ${error.message}`);
  } else {
    const { error } = await supabase.from('asignaturas').insert(asignaturaData);
    if (error) throw new Error(`Error creating asignatura: ${error.message}`);
  }
};

export const deleteAsignatura = async (asignaturaId: string) => {
  const { error } = await supabase.from('asignaturas').delete().eq('id', asignaturaId);
  if (error) throw new Error(`Error deleting asignatura: ${error.message}`);
};