import { supabase } from '@/integrations/supabase/client';

export interface Evaluation {
  id: string;
  titulo: string;
  tipo: string;
  fecha_aplicacion: string;
  curso_asignaturas: {
    curso: {
      nombre: string;
      nivel: {
        nombre: string;
      };
    };
    asignatura: {
      nombre: string;
    };
  }[];
}

export interface EvaluationContentBlock {
  id: string;
  evaluation_id: string;
  block_type: 'text' | 'image';
  content: any;
  orden: number;
}

export interface ItemAlternative {
  id: string;
  texto: string;
  es_correcta: boolean;
  orden: number;
}

export interface PIEAdaptation {
  id: string;
  enunciado_adaptado: string;
  alternativas_adaptadas: { texto: string; es_correcta: boolean }[];
}

export interface EvaluationItem {
  id: string;
  enunciado: string;
  tipo_item: 'seleccion_multiple' | 'desarrollo' | 'verdadero_falso';
  puntaje: number;
  orden: number;
  content_block_id: string;
  item_alternativas: ItemAlternative[];
  tiene_adaptacion_pie: boolean;
  adaptaciones_pie: PIEAdaptation[]; // Supabase returns this as an array
}


export const fetchEvaluations = async (docenteId: string, establecimientoId: string): Promise<Evaluation[]> => {
  if (!establecimientoId) return [];

  const { data, error } = await supabase
    .from('evaluaciones')
    .select(`
      id,
      titulo,
      tipo,
      fecha_aplicacion,
      evaluacion_curso_asignaturas!inner (
        curso_asignaturas!inner (
          docente_id,
          cursos!inner ( nombre, establecimiento_id, niveles ( nombre ) ),
          asignaturas ( nombre )
        )
      )
    `)
    .eq('evaluacion_curso_asignaturas.curso_asignaturas.cursos.establecimiento_id', establecimientoId)
    .eq('evaluacion_curso_asignaturas.curso_asignaturas.docente_id', docenteId)
    .order('fecha_aplicacion', { ascending: false });

  if (error) throw new Error(`Error al cargar las evaluaciones: ${error.message}`);

  return (data || []).map((e: any) => ({
    id: e.id,
    titulo: e.titulo,
    tipo: e.tipo,
    fecha_aplicacion: e.fecha_aplicacion,
    curso_asignaturas: e.evaluacion_curso_asignaturas.map((link: any) => ({
      curso: {
        nombre: link.curso_asignaturas.cursos.nombre,
        nivel: { nombre: link.curso_asignaturas.cursos.niveles.nombre }
      },
      asignatura: { nombre: link.curso_asignaturas.asignaturas.nombre }
    }))
  }));
};

export interface CreateEvaluationData {
  titulo: string;
  tipo: string;
  descripcion: string;
  fecha_aplicacion: string;
  cursoAsignaturaIds: string[];
}

export const createEvaluation = async (evalData: CreateEvaluationData) => {
  const { data, error } = await supabase
    .from('evaluaciones')
    .insert({
      titulo: evalData.titulo,
      tipo: evalData.tipo,
      descripcion: evalData.descripcion,
      fecha_aplicacion: evalData.fecha_aplicacion,
    })
    .select('id')
    .single();

  if (error) throw new Error(`Error al crear la evaluación: ${error.message}`);
  const newEvaluationId = data.id;

  const links = evalData.cursoAsignaturaIds.map(id => ({
    evaluacion_id: newEvaluationId,
    curso_asignatura_id: id,
  }));

  const { error: linkError } = await supabase
    .from('evaluacion_curso_asignaturas')
    .insert(links);

  if (linkError) {
    await supabase.from('evaluaciones').delete().eq('id', newEvaluationId);
    throw new Error(`Error al vincular la evaluación a los cursos: ${linkError.message}`);
  }
  
  return newEvaluationId;
};

export const fetchContentBlocks = async (evaluationId: string): Promise<EvaluationContentBlock[]> => {
  const { data, error } = await supabase
    .from('evaluation_content_blocks')
    .select('*')
    .eq('evaluation_id', evaluationId)
    .order('orden');
  if (error) throw new Error(`Error al cargar los bloques de contenido: ${error.message}`);
  return data;
};

export const fetchEvaluationContentForImport = async (resourceId: string): Promise<Pick<EvaluationContentBlock, 'block_type' | 'content'>[]> => {
    const { data, error } = await supabase
        .from('evaluation_content_blocks')
        .select('block_type, content')
        .eq('evaluation_id', resourceId)
        .order('orden');
    if (error) throw new Error(`Error al importar contenido: ${error.message}`);
    return data;
};

export const createContentBlock = async (evaluationId: string, blockType: string, content: any, order: number) => {
  const { data, error } = await supabase
    .from('evaluation_content_blocks')
    .insert({
      evaluation_id: evaluationId,
      block_type: blockType,
      content: content,
      orden: order,
    })
    .select()
    .single();
  if (error) throw new Error(`Error al crear el bloque de contenido: ${error.message}`);
  return data;
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

export const generateQuestionsFromBlock = async (block: EvaluationContentBlock) => {
  const { data, error } = await supabase.rpc('generar_preguntas_ia', {
    p_block_content: block.content,
    p_block_type: block.block_type,
  });
  if (error) throw new Error(`Error al generar preguntas con IA: ${error.message}`);
  return data;
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

export const generatePIEAdaptation = async (itemId: string) => {
    const { data, error } = await supabase.rpc('adaptar_pregunta_pie_ia', { p_item_id: itemId });
    if (error) throw new Error(`Error al generar adaptación PIE: ${error.message}`);
    return data;
};

export const savePIEAdaptation = async (parentItemId: string, adaptationData: any) => {
    const { error } = await supabase.tx(async (tx) => {
        const { error: insertError } = await tx
            .from('adaptaciones_pie')
            .insert({
                parent_item_id: parentItemId,
                enunciado_adaptado: adaptationData.enunciado_adaptado,
                alternativas_adaptadas: adaptationData.alternativas_adaptadas,
            });

        if (insertError) throw insertError;

        const { error: updateError } = await tx
            .from('evaluacion_items')
            .update({ tiene_adaptacion_pie: true })
            .eq('id', parentItemId);

        if (updateError) throw updateError;
    });

    if (error) throw new Error(`Error al guardar la adaptación PIE: ${error.message}`);
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

export const increaseQuestionDifficulty = async (itemId: string) => {
    const { data: newData, error: rpcError } = await supabase.rpc('aumentar_dificultad_pregunta_ia', { p_item_id: itemId });
    if (rpcError) throw new Error(`Error en la IA para aumentar dificultad: ${rpcError.message}`);

    const { data: itemData, error: fetchError } = await supabase.from('evaluacion_items').select('puntaje').eq('id', itemId).single();
    if (fetchError) throw new Error(`Error al obtener puntaje original: ${fetchError.message}`);

    await updateEvaluationItem(itemId, {
        enunciado: newData.enunciado,
        puntaje: itemData.puntaje, // Mantenemos el puntaje original
        alternativas: newData.alternativas,
    });
};