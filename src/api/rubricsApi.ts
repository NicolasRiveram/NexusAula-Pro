import { supabase } from '@/integrations/supabase/client';

export interface Rubric {
  id: string;
  nombre: string;
  actividad_a_evaluar: string;
  descripcion: string;
  created_at: string;
  contenido_json?: RubricContent;
}

export interface RubricContent {
  criterios: {
    nombre: string;
    descripcion: string;
    niveles: {
      puntaje: number;
      nombre: string;
      descripcion: string;
    }[];
  }[];
}

export const fetchRubrics = async (docenteId: string, establecimientoId: string): Promise<Rubric[]> => {
  if (!establecimientoId) return [];

  const { data, error } = await supabase
    .from('rubricas')
    .select('*')
    .eq('creado_por', docenteId)
    .eq('establecimiento_id', establecimientoId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Error al cargar las rúbricas: ${error.message}`);
  return data;
};

export const createRubric = async (
  nombre: string,
  actividad: string,
  descripcion: string,
  establecimientoId: string
): Promise<string> => {
  const { data, error } = await supabase
    .from('rubricas')
    .insert({
      nombre,
      actividad_a_evaluar: actividad,
      descripcion,
      establecimiento_id: establecimientoId,
    })
    .select('id')
    .single();

  if (error) throw new Error(`Error al crear la rúbrica: ${error.message}`);
  return data.id;
};

export const generateRubricWithAI = async (activity: string, description: string): Promise<RubricContent> => {
  const { data, error } = await supabase.rpc('generar_rubrica_ia', {
    p_nombre_actividad: activity,
    p_descripcion: description,
  });

  if (error) throw new Error(`Error en la IA al generar la rúbrica: ${error.message}`);
  return data as RubricContent;
};

export const saveGeneratedRubricContent = async (rubricId: string, content: RubricContent) => {
  const { error } = await supabase
    .from('rubricas')
    .update({ contenido_json: content })
    .eq('id', rubricId);

  if (error) throw new Error(`Error al guardar el contenido de la rúbrica: ${error.message}`);
};