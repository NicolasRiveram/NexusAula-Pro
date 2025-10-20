import { supabase } from '@/integrations/supabase/client';

export interface ClassbookStudent {
  id: string;
  name: string;
}

export interface ClassbookEvaluation {
  id: string;
  title: string;
  type: 'standard' | 'rubric';
  date: string;
}

export interface ClassbookGrade {
  student_id: string;
  evaluation_id: string;
  grade: number;
}

export interface ClassbookData {
  students: ClassbookStudent[];
  evaluations: ClassbookEvaluation[];
  grades: ClassbookGrade[];
}

export const fetchClassbookData = async (courseId: string): Promise<ClassbookData> => {
  if (!courseId) {
    return { students: [], evaluations: [], grades: [] };
  }

  const { data, error } = await supabase.rpc('get_classbook_data', {
    p_curso_id: courseId,
  });

  if (error) {
    throw new Error(`Error fetching classbook data: ${error.message}`);
  }

  return {
    students: data?.students || [],
    evaluations: data?.evaluations || [],
    grades: data?.grades || [],
  };
};