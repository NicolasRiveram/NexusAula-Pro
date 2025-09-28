import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { AISuggestions } from '@/pages/dashboard/planning/Step2_ReviewSuggestions';
import { ClassPlan } from '@/pages/dashboard/planning/Step3_ClassSequence';

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

// --- Tipos para leer datos ---
export interface LinkedCourse {
  curso_asignaturas: {
    cursos: {
      establecimiento_id: string;
      nombre: string;
      niveles: {
        nombre: string;
      };
    };
    asignaturas: {
      nombre:string;
    };
  };
}

export interface UnitPlan {
  id: string;
  titulo: string;
  fecha_inicio: string;
  fecha_fin: string;
  descripcion_contenidos: string;
  unidad_maestra_curso_asignatura_link: LinkedCourse[];
}

// --- Funciones de API ---

export const fetchUnitPlans = async (docenteId: string): Promise<UnitPlan[]> => {
  const { data, error } = await supabase
    .from('unidades_maestras')
    .select(`
      id,
      titulo,
      fecha_inicio,
      fecha_fin,
      descripcion_contenidos,
      unidad_maestra_curso_asignatura_link (
        curso_asignaturas (
          cursos!inner ( establecimiento_id, nombre, niveles ( nombre ) ),
          asignaturas ( nombre )
        )
      )
    `)
    .eq('docente_id', docenteId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Error al cargar los planes de unidad: ${error.message}`);
  
  return (data || []).map(plan => ({
    ...plan,
    unidad_maestra_curso_asignatura_link: plan.unidad_maestra_curso_asignatura_link.filter((link: any) => link.curso_asignaturas && link.curso_asignaturas.cursos)
  })) as UnitPlan[];
};

export const createUnitPlan = async (formData: UnitPlanFormData, docenteId: string) => {
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

  const links = formData.cursoAsignaturaIds.map(cursoAsignaturaId => ({
    unidad_maestra_id: unidadMaestraId,
    curso_asignatura_id: cursoAsignaturaId,
  }));

  const { error: linkError } = await supabase
    .from('unidad_maestra_curso_asignatura_link')
    .insert(links);

  if (linkError) {
    await supabase.from('unidades_maestras').delete().eq('id', unidadMaestraId);
    throw new Error(`Error vinculando la unidad a los cursos: ${linkError.message}`);
  }

  return unidadMaestraId;
};

export const updateUnitPlanSuggestions = async (unitMasterId: string, suggestions: AISuggestions) => {
  const { error } = await supabase
    .from('unidades_maestras')
    .update({ sugerencias_ia: suggestions })
    .eq('id', unitMasterId);

  if (error) throw new Error(`Error guardando las sugerencias de la IA: ${error.message}`);
};

export const scheduleClassesFromUnitPlan = async (unitMasterId: string, classes: Omit<ClassPlan, 'id'>[]) => {
  const { error } = await supabase.rpc('programar_clases_desde_maestra', {
    p_unidad_maestra_id: unitMasterId,
    p_clases_data: classes,
  });

  if (error) throw new Error(`Error al programar las clases: ${error.message}`);
};