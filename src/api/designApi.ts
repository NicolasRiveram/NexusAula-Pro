import { supabase } from '@/integrations/supabase/client';

export interface DesignSetting {
  key: string;
  value: string | null;
  description: string | null;
}

export const fetchDesignSettings = async (): Promise<DesignSetting[]> => {
  const { data, error } = await supabase.from('design_settings').select('*');
  if (error) throw new Error(`Error fetching design settings: ${error.message}`);
  return data || [];
};

export const updateDesignSetting = async (key: string, value: string | null) => {
  const { error } = await supabase.from('design_settings').update({ value, updated_at: new Date().toISOString() }).eq('key', key);
  if (error) throw new Error(`Error updating design setting: ${error.message}`);
};

export const uploadDesignAsset = async (file: File): Promise<string> => {
  const fileExtension = file.name.split('.').pop();
  const fileName = `${Date.now()}.${fileExtension}`;
  // Corregido: Se eliminó el prefijo 'public/'
  const filePath = `${fileName}`;

  const { data, error } = await supabase.storage
    .from('design_assets')
    .upload(filePath, file);

  if (error) {
    throw new Error(`Error uploading design asset: ${error.message}`);
  }

  return data.path;
};

export const getDesignAssetUrl = (path: string): string => {
  if (!path) return '';
  const { data } = supabase.storage.from('design_assets').getPublicUrl(path);
  return data.publicUrl;
};

export const removeDesignAsset = async (path: string) => {
    const { error } = await supabase.storage.from('design_assets').remove([path]);
    if (error) throw new Error(`Error removing design asset: ${error.message}`);
};