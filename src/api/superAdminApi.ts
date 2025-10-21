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
  parent_id: string | null;
}

export type EstablishmentData = Omit<Establishment, 'id' | 'created_at'>;

export interface Feature {
  feature_key: string;
  is_enabled: boolean;
}

export const fetchEstablishmentFeatures = async (establishmentId: string): Promise<Feature[]> => {
  const { data, error } = await supabase
    .from('establishment_features')
    .select('feature_key, is_enabled')
    .eq('establishment_id', establishmentId);
  if (error) throw new Error(`Error fetching features: ${error.message}`);
  return data || [];
};

export const saveEstablishmentFeature = async (establishmentId: string, featureKey: string, isEnabled: boolean) => {
  const { error } = await supabase
    .from('establishment_features')
    .upsert(
      { establishment_id: establishmentId, feature_key: featureKey, is_enabled: isEnabled },
      { onConflict: 'establishment_id, feature_key' }
    );
  if (error) throw new Error(`Error saving feature: ${error.message}`);
};

export const bulkCreateUsers = async (establishmentId: string, emails: string[], initialPassword: string) => {
  const { data, error } = await supabase.functions.invoke('bulk-create-users', {
    body: {
      establishment_id: establishmentId,
      emails,
      initial_password: initialPassword,
    },
  });
  if (error) throw new Error(error.message);
  return data;
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
  nivel?: { nombre: string };
  asignatura?: { nombre: string };
  eje?: { nombre: string };
}
export type ObjetivoAprendizajeData = Omit<ObjetivoAprendizaje, 'id' | 'nivel' | 'asignatura' | 'eje'>;


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

export interface CurriculumUploadJob {
  id: string;
  created_at: string;
  file_name: string;
  status: 'processing' | 'completed' | 'failed';
  error_message: string | null;
  niveles: { nombre: string } | null;
  asignaturas: { nombre: string } | null;
}

export interface AllPendingRequest {
  perfil_id: string;
  nombre_completo: string;
  email: string;
  rol_solicitado: string;
  fecha_solicitud: string;
  establecimiento_id: string;
  establecimiento_nombre: string;
}

export const fetchAllPendingRequests = async (): Promise<AllPendingRequest[]> => {
  const { data, error } = await supabase.rpc('get_all_pending_requests');
  if (error) throw new Error(`Error fetching all pending requests: ${error.message}`);
  return data || [];
};

export const superAdminUpdateRequestStatus = async (perfilId: string, establecimientoId: string, newStatus: 'aprobado' | 'rechazado') => {
  const { error } = await supabase.rpc('super_admin_update_request_status', {
    p_perfil_id: perfilId,
    p_establecimiento_id: establecimientoId,
    p_new_status: newStatus,
  });
  if (error) throw new Error(`Error updating request status: ${error.message}`);
};

export const fetchCurriculumUploadJobs = async (): Promise<CurriculumUploadJob[]> => {
  const { data, error } = await supabase
    .from('curriculum_upload_jobs')
    .select('*, niveles(nombre), asignaturas(nombre)')
    .order('created_at', { ascending: false });
  if (error) throw new Error(`Error fetching curriculum upload jobs: ${error.message}`);
  return data || [];
};

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

export const deleteEstablishment = async (establishmentId: string) => {
  const { error } = await supabase
    .from('establecimientos')
    .delete()
    .eq('id', establishmentId);
  if (error) throw new Error(`Error deleting establishment: ${error.message}`);
};

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

export const deleteMultipleNiveles = async (nivelIds: string[]) => {
  const { error } = await supabase.from('niveles').delete().in('id', nivelIds);
  if (error) throw new Error(`Error deleting niveles: ${error.message}`);
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

export const deleteMultipleAsignaturas = async (asignaturaIds: string[]) => {
  const { error } = await supabase.from('asignaturas').delete().in('id', asignaturaIds);
  if (error) throw new Error(`Error deleting asignaturas: ${error.message}`);
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

export const deleteMultipleEjes = async (ejeIds: string[]) => {
  const { error } = await supabase.from('ejes').delete().in('id', ejeIds);
  if (error) throw new Error(`Error deleting ejes: ${error.message}`);
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

export const deleteMultipleHabilidades = async (habilidadIds: string[]) => {
  const { error } = await supabase.from('habilidades').delete().in('id', habilidadIds);
  if (error) throw new Error(`Error deleting habilidades: ${error.message}`);
};

export const fetchAllObjetivosAprendizaje = async (): Promise<ObjetivoAprendizaje[]> => {
  const { data, error } = await supabase
    .from('objetivos_aprendizaje')
    .select('*, nivel:niveles(nombre), asignatura:asignaturas(nombre), eje:ejes(nombre)')
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

export const deleteMultipleObjetivosAprendizaje = async (oaIds: string[]) => {
  const { error } = await supabase.from('objetivos_aprendizaje').delete().in('id', oaIds);
  if (error) throw new Error(`Error deleting OAs: ${error.message}`);
};

export const fetchEstablishmentUsersSuperAdmin = async (establishmentId: string) => {
  const { data, error } = await supabase.rpc('get_establishment_users_super_admin', {
    p_establecimiento_id: establishmentId,
  });
  if (error) throw new Error(`Error fetching establishment users: ${error.message}`);
  return data || [];
};

export const superAdminUpdateUserRoleInEstablishment = async (perfilId: string, establecimientoId: string, newRole: string) => {
  const { error } = await supabase.rpc('super_admin_update_user_role_in_establishment', {
    p_perfil_id: perfilId,
    p_establecimiento_id: establecimientoId,
    p_new_role: newRole,
  });
  if (error) throw new Error(`Error updating user role: ${error.message}`);
};

export const superAdminRemoveUserFromEstablishment = async (perfilId: string, establecimientoId: string) => {
  const { error } = await supabase.rpc('super_admin_remove_user_from_establishment', {
    p_perfil_id: perfilId,
    p_establecimiento_id: establecimientoId,
  });
  if (error) throw new Error(`Error removing user: ${error.message}`);
};