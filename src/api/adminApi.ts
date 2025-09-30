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
}

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