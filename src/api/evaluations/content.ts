import { supabase } from '@/integrations/supabase/client';
import type { EvaluationContentBlock } from './types';

export const fetchContentBlocks = async (evaluationId: string): Promise<EvaluationContentBlock[]> => {
  const { data, error } = await supabase
    .from('evaluation_content_blocks')
    .select('*')
    .eq('evaluation_id', evaluationId)
    .order('orden');
  if (error) throw new Error(`Error al cargar los bloques de contenido: ${error.message}`);
  return data;
};

export const fetchEvaluationContentForImport = async (resourceId: string): Promise<Pick<EvaluationContentBlock, 'block_type' | 'content' | 'title'>[]> => {
    const { data, error } = await supabase
        .from('evaluation_content_blocks')
        .select('block_type, content, title')
        .eq('evaluation_id', resourceId)
        .order('orden');
    if (error) throw new Error(`Error al importar contenido: ${error.message}`);
    return data;
};

export const createContentBlock = async (evaluationId: string, blockType: string, content: any, order: number, title: string | null) => {
  const { data, error } = await supabase
    .from('evaluation_content_blocks')
    .insert({
      evaluation_id: evaluationId,
      block_type: blockType,
      content: content,
      orden: order,
      title: title,
    })
    .select()
    .single();
  if (error) throw new Error(`Error al crear el bloque de contenido: ${error.message}`);
  return data;
};

export const updateContentBlock = async (blockId: string, updates: Partial<EvaluationContentBlock>) => {
  const { error } = await supabase
    .from('evaluation_content_blocks')
    .update(updates)
    .eq('id', blockId);
  if (error) throw new Error(`Error updating content block: ${error.message}`);
};

export const deleteContentBlock = async (blockId: string) => {
  const { error } = await supabase.from('evaluation_content_blocks').delete().eq('id', blockId);
  if (error) throw new Error(`Error al eliminar el bloque de contenido: ${error.message}`);
};

export const uploadEvaluationImage = async (evaluationId: string, file: File): Promise<string> => {
    const fileExtension = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExtension}`;
    const filePath = `public/${evaluationId}/${fileName}`;

    const { error } = await supabase.storage
        .from('evaluation_images')
        .upload(filePath, file);

    if (error) {
        throw new Error(`Error al subir la imagen: ${error.message}`);
    }

    return filePath;
};

export const getPublicImageUrl = (path: string): string => {
    const { data } = supabase.storage.from('evaluation_images').getPublicUrl(path);
    return data.publicUrl;
};