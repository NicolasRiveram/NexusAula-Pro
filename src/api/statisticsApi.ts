import { supabase } from '@/integrations/supabase/client';

export interface SkillStatistic {
  habilidad_nombre: string;
  promedio_logro: number;
}

export const fetchSkillStatistics = async (docenteId: string, establecimientoId: string): Promise<SkillStatistic[]> => {
  if (!docenteId || !establecimientoId) {
    return [];
  }

  const { data, error } = await supabase.rpc('get_skill_statistics_for_teacher', {
    p_docente_id: docenteId,
    p_establecimiento_id: establecimientoId,
  });

  if (error) {
    console.error('Error fetching skill statistics:', error);
    // Don't throw, just return empty so the UI doesn't break
    return []; 
  }

  return data || [];
};