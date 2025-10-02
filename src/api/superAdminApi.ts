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