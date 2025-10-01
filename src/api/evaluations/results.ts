import { supabase } from '@/integrations/supabase/client';
import type { ItemAnalysisResult, EvaluationResultSummary, EvaluationStatistics, StudentResponseHeader, StudentResponseItem, StudentAnswer } from './types';

export const fetchItemAnalysis = async (evaluationId: string): Promise<ItemAnalysisResult[]> => {
  const { data, error } = await supabase.rpc('get_item_analysis', {
    p_evaluation_id: evaluationId,
  });

  if (error) {
    throw new Error(`Error fetching item analysis: ${error.message}`);
  }
  return data || [];
};

export const fetchEvaluationResultsSummary = async (evaluationId: string): Promise<EvaluationResultSummary[]> => {
  const { data, error } = await supabase.rpc('get_evaluation_results_summary', {
    p_evaluation_id: evaluationId,
  });

  if (error) {
    throw new Error(`Error fetching evaluation results: ${error.message}`);
  }
  return data;
};

export const fetchEvaluationStatistics = async (evaluationId: string): Promise<EvaluationStatistics> => {
  const { data, error } = await supabase.rpc('get_evaluation_statistics', {
    p_evaluation_id: evaluationId,
  });

  if (error) {
    throw new Error(`Error fetching evaluation statistics: ${error.message}`);
  }
  return data;
};

export const fetchStudentAndEvaluationInfo = async (responseId: string): Promise<StudentResponseHeader> => {
  const { data, error } = await supabase
    .from('respuestas_estudiante')
    .select(`
      evaluaciones ( titulo ),
      perfiles ( nombre_completo )
    `)
    .eq('id', responseId)
    .single();

  if (error) throw new Error(`Error fetching response info: ${error.message}`);
  if (!data) throw new Error('Response not found.');

  return {
    student_name: (data.perfiles as any)?.nombre_completo || 'Estudiante Desconocido',
    evaluation_title: (data.evaluaciones as any)?.titulo || 'Evaluación Desconocida',
  };
};

export const fetchStudentResponseDetails = async (responseId: string): Promise<StudentResponseItem[]> => {
  const { data, error } = await supabase
    .from('desempeno_item_estudiante')
    .select('*')
    .eq('respuesta_estudiante_id', responseId);

  if (error) throw new Error(`Error fetching student response details: ${error.message}`);
  return data || [];
};

export const submitEvaluationResponse = async (evaluationId: string, answers: StudentAnswer[]): Promise<string> => {
  const { data, error } = await supabase.rpc('submit_student_response', {
    p_evaluation_id: evaluationId,
    p_answers: answers,
  });

  if (error) throw new Error(`Error submitting evaluation: ${error.message}`);
  return data;
};

export const fetchStudentResponseForEvaluation = async (evaluationId: string, studentId: string): Promise<{ id: string } | null> => {
  const { data, error } = await supabase
    .from('respuestas_estudiante')
    .select('id')
    .eq('evaluacion_id', evaluationId)
    .eq('estudiante_perfil_id', studentId)
    .maybeSingle();
  
  if (error) throw new Error(`Error checking for existing response: ${error.message}`);
  return data;
};