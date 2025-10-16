import React, { useState, useEffect, useMemo } from 'react';
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

interface DashboardContext {
  profile: { rol: string };
}

const GenerateReportPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { activeEstablishment } = useEstablishment();
  const { profile } = useOutletContext<DashboardContext>();
  const isAdmin = profile.rol === 'administrador_establecimiento' || profile.rol === 'coordinador';
  
  const [cursos, setCursos] = useState<CursoBase[]>([]);
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([]);
  
  const [selectedCursoId, setSelectedCursoId] = useState<string>('');
  const [selectedEstudianteId, setSelectedEstudianteId] = useState(searchParams.get('studentId') || '');
  
  const [eligibility, setEligibility] = useState<{ eligible: boolean; message: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    const loadCursos = async () => {
      if (activeEstablishment) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          try {
            if (isAdmin) {
              const data = await fetchCursosPorEstablecimiento(activeEstablishment.id);
              setCursos(data);
            } else {
              const data = await fetchCursosAsignaturasDocente(user.id, activeEstablishment.id);
              const uniqueCourses = Array.from(new Map(data.map(item => [item.curso.id, item.curso])).values());
              setCursos(uniqueCourses);
            }
          } catch (err: any) { showError(err.message); }
        }
      }
    };
    loadCursos();
  }, [activeEstablishment, isAdmin]);

  useEffect(() => {
    const loadEstudiantes = async () => {
      if (selectedCursoId) {
        try {
          const data = await fetchEstudiantesPorCurso(selectedCursoId);
          setEstudiantes(data);
        } catch (err: any) { showError(err.message); }
      }
    };
    loadEstudiantes();
  }, [selectedCursoId]);

  useEffect(() => {
    const checkEligibility = async () => {
      if (selectedEstudianteId) {
        setLoading(true);
        try {
          const data = await checkReportEligibility(selectedEstudianteId);
          setEligibility(data);
        } catch (err: any) { showError(err.message); }
        setLoading(false);
      } else {
        setEligibility(null);
      }
    };
    checkEligibility();
  }, [selectedEstudianteId]);

  const handleGenerate = async () => {
    if (!selectedEstudianteId || !eligibility?.eligible || !activeEstablishment) return;
    setIsGenerating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuario no autenticado.");

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

      const newReportId = await saveReport(newReport);
      navigate(`/dashboard/informes/${newReportId}`);

    } catch (error: any) {
      showError(`Error al generar el informe: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

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
                <SelectTrigger><SelectValue placeholder="Selecciona un curso" /></SelectTrigger>
                <SelectContent>{cursos.map(c => <SelectItem key={c.id} value={c.id}>{c.nivel.nombre} {c.nombre}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Estudiante</Label>
              <Select value={selectedEstudianteId} onValueChange={setSelectedEstudianteId} disabled={!selectedCursoId}>
                <SelectTrigger><SelectValue placeholder="Selecciona un estudiante" /></SelectTrigger>
                <SelectContent>{estudiantes.map(e => <SelectItem key={e.id} value={e.id}>{e.nombre_completo}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>

          {loading && <div className="flex justify-center items-center p-4"><Loader2 className="h-6 w-6 animate-spin" /></div>}

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
              <Button onClick={handleGenerate} disabled={isGenerating}>
                {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                {isGenerating ? 'Generando Informe...' : 'Generar Informe con IA'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default GenerateReportPage;