import { supabase } from '@/integrations/supabase/client';

export interface StudentPerformance {
  student_id: string;
  student_name: string;
  average_score: number;
  completed_evaluations: number;
}

export interface SkillPerformance {
  habilidad_nombre: string;
  promedio_logro: number;
}

export const fetchStudentPerformance = async (
  docenteId: string,
  establecimientoId: string,
  cursoId?: string | null
): Promise<StudentPerformance[]> => {
  const { data, error } = await supabase.rpc('get_student_performance_summary', {
    p_docente_id: docenteId,
    p_establecimiento_id: establecimientoId,
    p_curso_id_filter: cursoId || null,
  });
  if (error) throw new Error(`Error fetching student performance: ${error.message}`);
  return data || [];
};

export const fetchSkillPerformance = async (
  docenteId: string,
  establecimientoId: string,
  cursoId?: string | null
): Promise<SkillPerformance[]> => {
  const { data, error } = await supabase.rpc('get_filtered_skill_statistics', {
    p_docente_id: docenteId,
    p_establecimiento_id: establecimientoId,
    p_curso_id_filter: cursoId || null,
  });
  if (error) throw new Error(`Error fetching skill performance: ${error.message}`);
  return data || [];
};