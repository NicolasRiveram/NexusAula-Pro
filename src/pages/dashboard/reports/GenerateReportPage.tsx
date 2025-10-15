import React, { useState, useMemo } from 'react';
import { useSearchParams, useNavigate, useOutletContext } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useEstablishment } from '@/contexts/EstablishmentContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Loader2, Sparkles, AlertCircle } from 'lucide-react';
import { fetchCursosAsignaturasDocente, fetchEstudiantesPorCurso, fetchCursosPorEstablecimiento, Estudiante, CursoBase } from '@/api/coursesApi';
import { checkReportEligibility, generateReport, saveReport } from '@/api/reportsApi';
import { showError } from '@/utils/toast';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';

interface DashboardContext {
  profile: { rol: string };
}

const GenerateReportPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { activeEstablishment } = useEstablishment();
  const { profile } = useOutletContext<DashboardContext>();
  const { user } = useAuth();
  const isAdmin = profile.rol === 'administrador_establecimiento' || profile.rol === 'coordinador';
  
  const [selectedCursoId, setSelectedCursoId] = useState<string>('');
  const [selectedEstudianteId, setSelectedEstudianteId] = useState(searchParams.get('studentId') || '');
  
  const { data: cursos = [], isLoading: isLoadingCursos } = useQuery({
    queryKey: ['reportCourses', user?.id, activeEstablishment?.id, isAdmin],
    queryFn: async () => {
      if (isAdmin) {
        return await fetchCursosPorEstablecimiento(activeEstablishment!.id);
      } else {
        const data = await fetchCursosAsignaturasDocente(user!.id, activeEstablishment!.id);
        return Array.from(new Map(data.map(item => [item.curso.id, item.curso])).values());
      }
    },
    enabled: !!user && !!activeEstablishment,
    onError: (err: any) => showError(err.message),
  });

  const { data: estudiantes = [], isLoading: isLoadingEstudiantes } = useQuery({
    queryKey: ['reportStudents', selectedCursoId],
    queryFn: () => fetchEstudiantesPorCurso(selectedCursoId),
    enabled: !!selectedCursoId,
    onError: (err: any) => showError(err.message),
  });

  const { data: eligibility, isLoading: isLoadingEligibility } = useQuery({
    queryKey: ['reportEligibility', selectedEstudianteId],
    queryFn: () => checkReportEligibility(selectedEstudianteId),
    enabled: !!selectedEstudianteId,
    onError: (err: any) => showError(err.message),
  });

  const generateMutation = useMutation({
    mutationFn: async () => {
      if (!selectedEstudianteId || !eligibility?.eligible || !activeEstablishment || !user) {
        throw new Error("Faltan datos para generar el informe.");
      }
      const reportData = await generateReport(selectedEstudianteId);
      const newReport = {
        estudiante_perfil_id: selectedEstudianteId,
        docente_perfil_id: user.id,
        establecimiento_id: activeEstablishment.id,
        curso_id: selectedCursoId || null,
        informe_docente_html: reportData.informe_docente_html,
        comunicado_apoderado_html: reportData.comunicado_apoderado_html,
        datos_fuente_jsonb: reportData.sourceData,
        evaluaciones_consideradas_ids: reportData.consideredEvaluationIds,
      };
      return await saveReport(newReport);
    },
    onSuccess: (newReportId) => {
      navigate(`/dashboard/informes/${newReportId}`);
    },
    onError: (error: any) => {
      showError(`Error al generar el informe: ${error.message}`);
    }
  });

  const selectedStudentName = useMemo(() => {
    return estudiantes.find(e => e.id === selectedEstudianteId)?.nombre_completo || 'estudiante seleccionado';
  }, [estudiantes, selectedEstudianteId]);

  return (
    <div className="container mx-auto space-y-6">
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle>Generar Informe Pedagógico con IA</CardTitle>
          <CardDescription>Selecciona un estudiante para analizar su rendimiento y generar un informe detallado.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Curso</Label>
              <Select value={selectedCursoId} onValueChange={setSelectedCursoId}>
                <SelectTrigger><SelectValue placeholder={isLoadingCursos ? "Cargando..." : "Selecciona un curso"} /></SelectTrigger>
                <SelectContent>{cursos.map(c => <SelectItem key={c.id} value={c.id}>{c.nivel.nombre} {c.nombre}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Estudiante</Label>
              <Select value={selectedEstudianteId} onValueChange={setSelectedEstudianteId} disabled={!selectedCursoId || isLoadingEstudiantes}>
                <SelectTrigger><SelectValue placeholder={isLoadingEstudiantes ? "Cargando..." : "Selecciona un estudiante"} /></SelectTrigger>
                <SelectContent>{estudiantes.map(e => <SelectItem key={e.id} value={e.id}>{e.nombre_completo}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>

          {isLoadingEligibility && <div className="flex justify-center items-center p-4"><Loader2 className="h-6 w-6 animate-spin" /></div>}

          {eligibility && !eligibility.eligible && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-md flex items-start">
              <AlertCircle className="h-5 w-5 mr-3 mt-0.5" />
              <div>
                <h4 className="font-semibold">No se puede generar un nuevo informe</h4>
                <p className="text-sm">{eligibility.message}</p>
              </div>
            </div>
          )}

          {selectedEstudianteId && eligibility?.eligible && (
            <div className="text-center pt-4">
              <p className="mb-4">Se analizará el rendimiento de <strong>{selectedStudentName}</strong> para generar el informe.</p>
              <Button onClick={() => generateMutation.mutate()} disabled={generateMutation.isPending}>
                {generateMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                {generateMutation.isPending ? 'Generando Informe...' : 'Generar Informe con IA'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default GenerateReportPage;