import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

export interface UnitPlanFormData {
  cursoAsignaturaIds: string[];
  titulo: string;
  fechas: {
    from: Date;
    to: Date;
  };
  descripcionContenidos: string;
  instruccionesAdicionales?: string;
}

export const createUnitPlan = async (formData: UnitPlanFormData, docenteId: string) => {
  // 1. Crear la unidad maestra
  const { data: unitMasterData, error: unitMasterError } = await supabase
    .from('unidades_maestras')
    .insert({
      docente_id: docenteId,
      titulo: formData.titulo,
      descripcion_contenidos: formData.descripcionContenidos,
      fecha_inicio: format(formData.fechas.from, 'yyyy-MM-dd'),
      fecha_fin: format(formData.fechas.to, 'yyyy-MM-dd'),
      instrucciones_adicionales_ia: formData.instruccionesAdicionales,
    })
    .select('id')
    .single();

  if (unitMasterError) throw new Error(`Error creando la unidad maestra: ${unitMasterError.message}`);
  const unidadMaestraId = unitMasterData.id;

  // 2. Vincular la unidad a los cursos seleccionados
  const links = formData.cursoAsignaturaIds.map(cursoAsignaturaId => ({
    unidad_maestra_id: unidadMaestraId,
    curso_asignatura_id: cursoAsignaturaId,
  }));

  const { error: linkError } = await supabase
    .from('unidad_maestra_curso_asignatura_link')
    .insert(links);

  if (linkError) {
    // Intenta limpiar la unidad maestra creada si la vinculación falla
    await supabase.from('unidades_maestras').delete().eq('id', unidadMaestraId);
    throw new Error(`Error vinculando la unidad a los cursos: ${linkError.message}`);
  }

  return unidadMaestraId;
};