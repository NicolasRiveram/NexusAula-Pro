import { supabase } from '@/integrations/supabase/client';
import { FunctionsHttpError } from '@supabase/supabase-js';
import { updateEvaluationItem } from './items';
import type { EvaluationContentBlock } from './types';

export const generateQuestionsFromBlock = async (block: EvaluationContentBlock, quantity: number) => {
  const { data, error } = await supabase.functions.invoke('generate-questions', {
    body: {
      block_content: block.content,
      block_type: block.block_type,
      quantity: quantity,
    },
  });
  if (error instanceof FunctionsHttpError) {
    const errorMessage = await error.context.json();
    throw new Error(`Error al generar preguntas con IA: ${errorMessage.error}`);
  } else if (error) {
    throw new Error(`Error al generar preguntas con IA: ${error.message}`);
  }
  return data;
};

export const generatePIEAdaptation = async (itemId: string) => {
    const { data: item, error: fetchError } = await supabase
        .from('evaluacion_items')
        .select('enunciado, item_alternativas(*)')
        .eq('id', itemId)
        .single();

    if (fetchError) throw new Error(`Error al obtener la pregunta para adaptar: ${fetchError.message}`);
    if (!item) throw new Error('Pregunta no encontrada.');

    const { data, error } = await supabase.functions.invoke('adapt-question-pie', {
        body: { item }
    });
    if (error instanceof FunctionsHttpError) {
        const errorMessage = await error.context.json();
        throw new Error(`Error al generar adaptación PIE: ${errorMessage.error}`);
    } else if (error) {
        throw new Error(`Error al generar adaptación PIE: ${error.message}`);
    }
    return data;
};

export const savePIEAdaptation = async (parentItemId: string, adaptationData: any) => {
    const { error: insertError } = await supabase
        .from('adaptaciones_pie')
        .insert({
            parent_item_id: parentItemId,
            enunciado_adaptado: adaptationData.enunciado_adaptado,
            alternativas_adaptadas: adaptationData.alternativas_adaptadas,
        });

    if (insertError) {
        throw new Error(`Error al guardar la adaptación PIE: ${insertError.message}`);
    }

    const { error: updateError } = await supabase
        .from('evaluacion_items')
        .update({ tiene_adaptacion_pie: true })
        .eq('id', parentItemId);

    if (updateError) {
        await supabase.from('adaptaciones_pie').delete().eq('parent_item_id', parentItemId);
        throw new Error(`Error al actualizar el item, se revirtió la adaptación: ${updateError.message}`);
    }
};

export const increaseQuestionDifficulty = async (itemId: string) => {
    const { data: item, error: fetchError } = await supabase
        .from('evaluacion_items')
        .select('enunciado, puntaje, item_alternativas(*)')
        .eq('id', itemId)
        .single();

    if (fetchError) throw new Error(`Error al obtener la pregunta para modificar: ${fetchError.message}`);
    if (!item) throw new Error('Pregunta no encontrada.');

    const { data: newData, error } = await supabase.functions.invoke('increase-question-difficulty', {
        body: { item }
    });
    if (error instanceof FunctionsHttpError) {
        const errorMessage = await error.context.json();
        throw new Error(`Error en la IA para aumentar dificultad: ${errorMessage.error}`);
    } else if (error) {
        throw new Error(`Error en la IA para aumentar dificultad: ${error.message}`);
    }

    await updateEvaluationItem(itemId, {
        enunciado: newData.enunciado,
        puntaje: item.puntaje,
        alternativas: newData.alternativas,
    });
};