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

export interface Eje {
  id: string;
  nombre: string;
  descripcion: string | null;
  asignatura_id: string;
  asignaturas?: { nombre: string };
}
export type EjeData = Omit<Eje, 'id' | 'asignaturas'>;

export interface Habilidad {
  id: string;
  nombre: string;
  descripcion: string | null;
}
export type HabilidadData = Omit<Habilidad, 'id'>;

export interface ObjetivoAprendizaje {
  id: string;
  codigo: string;
  descripcion: string;
  nivel_id: string;
  asignatura_id: string;
  eje_id: string;
  niveles?: { nombre: string };
  asignaturas?: { nombre: string };
  ejes?: { nombre: string };
}
export type ObjetivoAprendizajeData = Omit<ObjetivoAprendizaje, 'id' | 'niveles' | 'asignaturas' | 'ejes'>;


export interface GlobalUser {
  id: string;
  nombre_completo: string;
  email: string;
  rol: string;
  subscription_plan: string;
  establecimientos: {
    id: string;
    nombre: string;
    rol_en_establecimiento: string;
  }[];
}

export const bulkInsertObjectives = async (nivelId: string, asignaturaId: string, ejeId: string, text: string) => {
  const { data, error } = await supabase.functions.invoke('bulk-insert-objectives', {
    body: { nivelId, asignaturaId, ejeId, text },
  });
  if (error) throw new Error(error.message);
  return data;
};

export const fetchAllUsers = async (): Promise<GlobalUser[]> => {
  const { data, error } = await supabase
    .from('perfiles')
    .select(`
      id,
      nombre_completo,
      email,
      rol,
      subscription_plan,
      perfil_establecimientos (
        rol_en_establecimiento,
        establecimientos ( id, nombre )
      )
    `)
    .order('nombre_completo');

  if (error) throw new Error(`Error fetching users: ${error.message}`);
  
  return (data || []).map((user: any) => ({
    ...user,
    establecimientos: (user.perfil_establecimientos || [])
      .filter((pe: any) => pe.establecimientos)
      .map((pe: any) => ({
        id: pe.establecimientos.id,
        nombre: pe.establecimientos.nombre,
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

export const updateUserSubscriptionPlan = async (userId: string, newPlan: string) => {
  const { error } = await supabase
    .from('perfiles')
    .update({ subscription_plan: newPlan })
    .eq('id', userId);
  if (error) throw new Error(`Error updating user subscription: ${error.message}`);
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

export const fetchAllEjes = async (): Promise<Eje[]> => {
  const { data, error } = await supabase.from('ejes').select('*, asignaturas(nombre)').order('nombre');
  if (error) throw new Error(`Error fetching ejes: ${error.message}`);
  return data || [];
};

export const saveEje = async (ejeData: EjeData, ejeId?: string) => {
  if (ejeId) {
    const { error } = await supabase.from('ejes').update(ejeData).eq('id', ejeId);
    if (error) throw new Error(`Error updating eje: ${error.message}`);
  } else {
    const { error } = await supabase.from('ejes').insert(ejeData);
    if (error) throw new Error(`Error creating eje: ${error.message}`);
  }
};

export const deleteEje = async (ejeId: string) => {
  const { error } = await supabase.from('ejes').delete().eq('id', ejeId);
  if (error) throw new Error(`Error deleting eje: ${error.message}`);
};

export const fetchAllHabilidades = async (): Promise<Habilidad[]> => {
  const { data, error } = await supabase.from('habilidades').select('*').order('nombre');
  if (error) throw new Error(`Error fetching habilidades: ${error.message}`);
  return data || [];
};

export const saveHabilidad = async (habilidadData: HabilidadData, habilidadId?: string) => {
  if (habilidadId) {
    const { error } = await supabase.from('habilidades').update(habilidadData).eq('id', habilidadId);
    if (error) throw new Error(`Error updating habilidad: ${error.message}`);
  } else {
    const { error } = await supabase.from('habilidades').insert(habilidadData);
    if (error) throw new Error(`Error creating habilidad: ${error.message}`);
  }
};

export const deleteHabilidad = async (habilidadId: string) => {
  const { error } = await supabase.from('habilidades').delete().eq('id', habilidadId);
  if (error) throw new Error(`Error deleting habilidad: ${error.message}`);
};

export const fetchAllObjetivosAprendizaje = async (): Promise<ObjetivoAprendizaje[]> => {
  const { data, error } = await supabase
    .from('objetivos_aprendizaje')
    .select('*, niveles(nombre), asignaturas(nombre), ejes(nombre)')
    .order('codigo');
  if (error) throw new Error(`Error fetching OAs: ${error.message}`);
  return data || [];
};

export const saveObjetivoAprendizaje = async (oaData: ObjetivoAprendizajeData, oaId?: string) => {
  if (oaId) {
    const { error } = await supabase.from('objetivos_aprendizaje').update(oaData).eq('id', oaId);
    if (error) throw new Error(`Error updating OA: ${error.message}`);
  } else {
    const { error } = await supabase.from('objetivos_aprendizaje').insert(oaData);
    if (error) throw new Error(`Error creating OA: ${error.message}`);
  }
};

export const deleteObjetivoAprendizaje = async (oaId: string) => {
  const { error } = await supabase.from('objetivos_aprendizaje').delete().eq('id', oaId);
  if (error) throw new Error(`Error deleting OA: ${error.message}`);
};