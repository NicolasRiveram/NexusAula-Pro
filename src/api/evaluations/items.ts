import { supabase } from '@/integrations/supabase/client';
import type { EvaluationItem } from './types';

export const fetchItemsForBlock = async (blockId: string): Promise<EvaluationItem[]> => {
    const { data, error } = await supabase
        .from('evaluacion_items')
        .select(`
            id, enunciado, tipo_item, puntaje, orden, content_block_id, tiene_adaptacion_pie,
            item_alternativas ( id, texto, es_correcta, orden ),
            adaptaciones_pie ( id, enunciado_adaptado, alternativas_adaptadas )
        `)
        .eq('content_block_id', blockId)
        .order('orden');

    if (error) throw new Error(`Error fetching items for block: ${error.message}`);
    return data as EvaluationItem[];
};

export const saveGeneratedQuestions = async (evaluationId: string, blockId: string, questions: any[], currentItemCount: number) => {
  const itemsToInsert = questions.map((q, index) => ({
    evaluacion_id: evaluationId,
    content_block_id: blockId,
    enunciado: q.enunciado,
    tipo_item: q.tipo_item,
    puntaje: q.puntaje,
    orden: currentItemCount + index + 1,
  }));

  const { data: insertedItems, error: itemsError } = await supabase
    .from('evaluacion_items')
    .insert(itemsToInsert)
    .select();

  if (itemsError) throw new Error(`Error al guardar las preguntas: ${itemsError.message}`);
  if (!insertedItems) throw new Error('No se pudieron guardar las preguntas.');

  const alternativesToInsert: any[] = [];
  insertedItems.forEach((item, index) => {
    if (questions[index].tipo_item === 'seleccion_multiple' && questions[index].alternativas) {
      questions[index].alternativas.forEach((alt: any, altIndex: number) => {
        alternativesToInsert.push({
          evaluacion_item_id: item.id,
          texto: alt.texto,
          es_correcta: alt.es_correcta,
          orden: altIndex + 1,
        });
      });
    }
  });

  if (alternativesToInsert.length > 0) {
    const { error: altsError } = await supabase.from('item_alternativas').insert(alternativesToInsert);
    if (altsError) {
      throw new Error(`Error al guardar las alternativas: ${altsError.message}`);
    }
  }

  return insertedItems;
};

export const updateEvaluationItem = async (itemId: string, data: { enunciado: string; puntaje: number; alternativas: any[] }) => {
    const { error } = await supabase.rpc('actualizar_pregunta_y_alternativas', {
        p_item_id: itemId,
        p_enunciado: data.enunciado,
        p_puntaje: data.puntaje,
        p_alternativas: data.alternativas,
    });
    if (error) throw new Error(`Error al actualizar la pregunta: ${error.message}`);
};