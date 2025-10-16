import { supabase } from '@/integrations/supabase/client';

export interface PendingRequest {
  perfil_id: string;
  nombre_completo: string;
  email: string;
  rol_solicitado: string;
  fecha_solicitud: string;
}

export interface EstablishmentUser {
  perfil_id: string;
  nombre_completo: string;
  email: string;
  rol_en_establecimiento: string;
  estado: string;
  stats: {
    planificaciones: number;
    evaluaciones: number;
    rubricas: number;
  };
}

export interface Announcement {
  id: string;
  titulo: string;
  mensaje: string;
  fecha_inicio: string;
  fecha_fin: string;
}

export interface NonSchoolDay {
  id: string;
  fecha: string;
  descripcion: string;
  tipo: string;
}

export interface EstablishmentStats {
  docentes: number;
  estudiantes: number;
  cursos: number;
  pendientes: number;
}

export const fetchEstablishmentStats = async (establecimientoId: string): Promise<EstablishmentStats> => {
  const { data, error } = await supabase.rpc('get_establishment_stats', {
    p_establecimiento_id: establecimientoId,
  });
  if (error) throw new Error(`Error fetching establishment stats: ${error.message}`);
  return data;
};

export const fetchPendingRequests = async (establecimientoId: string): Promise<PendingRequest[]> => {
  const { data, error } = await supabase.rpc('get_pending_requests', {
    p_establecimiento_id: establecimientoId,
  });
  if (error) throw new Error(`Error fetching pending requests: ${error.message}`);
  return data || [];
};

export const approveRequest = async (perfilId: string, establecimientoId: string) => {
  const { error } = await supabase.rpc('update_request_status', {
    p_perfil_id: perfilId,
    p_establecimiento_id: establecimientoId,
    p_new_status: 'aprobado',
  });
  if (error) throw new Error(`Error approving request: ${error.message}`);
};

export const rejectRequest = async (perfilId: string, establecimientoId: string) => {
  const { error } = await supabase.rpc('update_request_status', {
    p_perfil_id: perfilId,
    p_establecimiento_id: establecimientoId,
    p_new_status: 'rechazado',
  });
  if (error) throw new Error(`Error rejecting request: ${error.message}`);
};

export const fetchEstablishmentUsers = async (establecimientoId: string): Promise<EstablishmentUser[]> => {
  const { data, error } = await supabase.rpc('get_establishment_users', {
    p_establecimiento_id: establecimientoId,
  });
  if (error) throw new Error(`Error fetching establishment users: ${error.message}`);
  return data || [];
};

export const updateUserRole = async (perfilId: string, establecimientoId: string, newRole: string) => {
  const { error } = await supabase.rpc('update_user_role_in_establishment', {
    p_perfil_id: perfilId,
    p_establecimiento_id: establecimientoId,
    p_new_role: newRole,
  });
  if (error) throw new Error(`Error updating user role: ${error.message}`);
};

export const removeUserFromEstablishment = async (perfilId: string, establecimientoId: string) => {
  const { error } = await supabase.rpc('remove_user_from_establishment', {
    p_perfil_id: perfilId,
    p_establecimiento_id: establecimientoId,
  });
  if (error) throw new Error(`Error removing user: ${error.message}`);
};

export const fetchAnnouncements = async (establecimientoId: string): Promise<Announcement[]> => {
  const { data, error } = await supabase
    .from('anuncios')
    .select('*')
    .eq('establecimiento_id', establecimientoId)
    .order('fecha_inicio', { ascending: false });
  if (error) throw new Error(`Error fetching announcements: ${error.message}`);
  return data || [];
};

export const fetchActiveAnnouncements = async (establecimientoId: string): Promise<Pick<Announcement, 'id' | 'titulo' | 'mensaje'>[]> => {
  const today = new Date().toISOString().split('T')[0];
  const { data, error } = await supabase
    .from('anuncios')
    .select('id, titulo, mensaje')
    .eq('establecimiento_id', establecimientoId)
    .lte('fecha_inicio', today)
    .gte('fecha_fin', today);
  if (error) throw new Error(`Error fetching active announcements: ${error.message}`);
  return data || [];
};

export const saveAnnouncement = async (
  announcementData: Omit<Announcement, 'id'>,
  establecimientoId: string,
  announcementId?: string
) => {
  if (announcementId) {
    const { error } = await supabase
      .from('anuncios')
      .update(announcementData)
      .eq('id', announcementId);
    if (error) throw new Error(`Error updating announcement: ${error.message}`);
  } else {
    const { error } = await supabase
      .from('anuncios')
      .insert({ ...announcementData, establecimiento_id: establecimientoId });
    if (error) throw new Error(`Error creating announcement: ${error.message}`);
  }
};

export const deleteAnnouncement = async (announcementId: string) => {
  const { error } = await supabase
    .from('anuncios')
    .delete()
    .eq('id', announcementId);
  if (error) throw new Error(`Error deleting announcement: ${error.message}`);
};

export const updateCourse = async (courseId: string, nombre: string, nivelId: string, anio: number) => {
    const { error } = await supabase.rpc('update_course', {
        p_course_id: courseId,
        p_nombre: nombre,
        p_nivel_id: nivelId,
        p_anio: anio,
    });
    if (error) throw new Error(`Error updating course: ${error.message}`);
};

export const deleteCourse = async (courseId: string) => {
    const { error } = await supabase.rpc('delete_course', { p_course_id: courseId });
    if (error) throw new Error(`Error deleting course: ${error.message}`);
};

export const fetchNonSchoolDays = async (establecimientoId: string): Promise<NonSchoolDay[]> => {
  const { data, error } = await supabase
    .from('dias_no_lectivos')
    .select('id, fecha, descripcion, tipo')
    .eq('establecimiento_id', establecimientoId)
    .order('fecha', { ascending: true });
  if (error) throw new Error(`Error fetching non-school days: ${error.message}`);
  return data || [];
};

export const saveNonSchoolDay = async (
  dayData: Omit<NonSchoolDay, 'id'>,
  establecimientoId: string,
  dayId?: string
) => {
  if (dayId) {
    const { error } = await supabase.from('dias_no_lectivos').update(dayData).eq('id', dayId);
    if (error) throw new Error(`Error updating non-school day: ${error.message}`);
  } else {
    const { error } = await supabase.from('dias_no_lectivos').insert({ ...dayData, establecimiento_id: establecimientoId });
    if (error) throw new Error(`Error creating non-school day: ${error.message}`);
  }
};

export const deleteNonSchoolDay = async (dayId: string) => {
  const { error } = await supabase.from('dias_no_lectivos').delete().eq('id', dayId);
  if (error) throw new Error(`Error deleting non-school day: ${error.message}`);
};