import { supabase } from '@/integrations/supabase/client';

export interface Report {
  id: string;
  estudiante_perfil_id: string;
  docente_perfil_id: string;
  establecimiento_id: string;
  curso_id: string | null;
  informe_docente_html: string;
  comunicado_apoderado_html: string;
  created_at: string;
  perfiles: { nombre_completo: string }; // Student name
  cursos: {
    nombre: string;
    niveles: {
      nombre: string;
    };
  } | null;
}

export const fetchReports = async (userId: string, establecimientoId: string, isAdmin: boolean): Promise<Report[]> => {
  let query = supabase
    .from('informes_pedagogicos')
    .select(`
      *, 
      perfiles!informes_pedagogicos_estudiante_perfil_id_fkey(nombre_completo),
      cursos ( nombre, niveles ( nombre ) )
    `)
    .eq('establecimiento_id', establecimientoId)
    .order('created_at', { ascending: false });

  if (!isAdmin) {
    query = query.eq('docente_perfil_id', userId);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data as any;
};

export const fetchReportById = async (reportId: string): Promise<Report> => {
    const { data, error } = await supabase
        .from('informes_pedagogicos')
        .select('*, perfiles!informes_pedagogicos_estudiante_perfil_id_fkey(nombre_completo)')
        .eq('id', reportId)
        .single();
    if (error) throw new Error(error.message);
    return data as any;
};

export const checkReportEligibility = async (studentId: string) => {
    const { data, error } = await supabase.rpc('check_report_eligibility', { p_student_id: studentId });
    if (error) throw new Error(error.message);
    return data;
};

export const generateReport = async (studentId: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("No hay sesión de usuario activa.");

    const { data, error } = await supabase.functions.invoke('generate-student-report', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: { studentId },
    });
    if (error) throw new Error(error.message);
    return data;
};

export const saveReport = async (reportData: any): Promise<string> => {
    const { data, error } = await supabase
        .from('informes_pedagogicos')
        .insert(reportData)
        .select('id')
        .single();
    if (error) throw new Error(error.message);
    return data.id;
};