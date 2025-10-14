import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useEstablishment } from '@/contexts/EstablishmentContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Loader2, Save } from 'lucide-react';
import { fetchRubricById, saveRubricEvaluation, Rubric, RubricEvaluationResult, fetchRubrics } from '@/api/rubricsApi';
import { fetchCursosAsignaturasDocente, fetchEstudiantesPorCurso, CursoAsignatura, Estudiante } from '@/api/coursesApi';
import { showError, showSuccess, showLoading, dismissToast } from '@/utils/toast';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';
import ReadingEvaluationModule from '@/components/rubrics/ReadingEvaluationModule';

const calcularNota = (puntajeObtenido: number, puntajeMaximo: number): number => {
  if (puntajeMaximo <= 0) return 1.0;
  const porcentajeLogro = puntajeObtenido / puntajeMaximo;
  let nota;
  if (porcentajeLogro >= 0.6) {
    nota = 4.0 + 3.0 * ((porcentajeLogro - 0.6) / 0.4);
  } else {
    nota = 1.0 + 3.0 * (porcentajeLogro / 0.6);
  }
  const notaFinal = Math.max(1.0, Math.min(7.0, nota));
  return Math.round(notaFinal * 10) / 10;
};

const EvaluateRubricPage = () => {
  const { rubricId: initialRubricId } = useParams<{ rubricId?: string }>();
  const navigate = useNavigate();
  const { activeEstablishment } = useEstablishment();
  
  const [cursos, setCursos] = useState<CursoAsignatura[]>([]);
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([]);
  const [rubricas, setRubricas] = useState<Rubric[]>([]);
  
  const [selectedCursoId, setSelectedCursoId] = useState<string>('');
  const [selectedEstudianteId, setSelectedEstudianteId] = useState<string>('');
  const [selectedRubricId, setSelectedRubricId] = useState<string>(initialRubricId || '');
  const [selectedRubric, setSelectedRubric] = useState<Rubric | null>(null);

  const [evaluation, setEvaluation] = useState<Record<number, number>>({});
  const [comentarios, setComentarios] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [isReadingModuleActive, setIsReadingModuleActive] = useState(false);
  const [isDictationEnabled, setIsDictationEnabled] = useState(false);
  const [originalText, setOriginalText] = useState('');
  const [readingData, setReadingData] = useState({ seconds: 0, ppm: 0, errors: [] as number[], transcript: '' });

  useEffect(() => {
    const loadInitialData = async () => {
      if (!activeEstablishment) return;
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        try {
          const [cursosData, rubricasData] = await Promise.all([
            fetchCursosAsignaturasDocente(user.id, activeEstablishment.id),
            fetchRubrics(user.id, activeEstablishment.id),
          ]);
          setCursos(cursosData);
          setRubricas(rubricasData);
        } catch (err: any) { showError(err.message); }
      }
      setLoading(false);
    };
    loadInitialData();
  }, [activeEstablishment]);

  useEffect(() => {
    const loadEstudiantes = async () => {
      if (selectedCursoId) {
        const cursoAsignatura = cursos.find(c => c.id === selectedCursoId);
        if (cursoAsignatura) {
          try {
            const studentData = await fetchEstudiantesPorCurso(cursoAsignatura.curso.id);
            setEstudiantes(studentData);
          } catch (err: any) { showError(err.message); }
        }
      } else {
        setEstudiantes([]);
      }
      setSelectedEstudianteId('');
    };
    loadEstudiantes();
  }, [selectedCursoId, cursos]);

  useEffect(() => {
    if (selectedRubricId) {
      const rubric = rubricas.find(r => r.id === selectedRubricId);
      setSelectedRubric(rubric || null);
    } else {
      setSelectedRubric(null);
    }
  }, [selectedRubricId, rubricas]);

  useEffect(() => {
    const storageKey = selectedRubricId && selectedEstudianteId ? `rubric-draft-${selectedRubricId}-${selectedEstudianteId}` : null;
    if (storageKey) {
      const savedDraft = localStorage.getItem(storageKey);
      if (savedDraft) {
        try {
          const { evaluation: savedEvaluation, comentarios: savedComentarios } = JSON.parse(savedDraft);
          setEvaluation(savedEvaluation || {});
          setComentarios(savedComentarios || '');
        } catch (e) {
          console.error("Failed to parse rubric draft from localStorage", e);
          setEvaluation({}); setComentarios('');
        }
      } else {
        setEvaluation({}); setComentarios('');
      }
    } else {
      setEvaluation({}); setComentarios('');
    }
  }, [selectedEstudianteId, selectedRubricId]);

  useEffect(() => {
    const storageKey = selectedRubricId && selectedEstudianteId ? `rubric-draft-${selectedRubricId}-${selectedEstudianteId}` : null;
    if (storageKey) {
      const draft = { evaluation, comentarios };
      localStorage.setItem(storageKey, JSON.stringify(draft));
    }
  }, [evaluation, comentarios, selectedRubricId, selectedEstudianteId]);

  const { puntajeTotal, puntajeMaximo } = useMemo(() => {
    const criterios = selectedRubric?.contenido_json?.criterios;
    if (!criterios) return { puntajeTotal: 0, puntajeMaximo: 0 };
    const max = criterios.reduce((acc, crit) => acc + Math.max(...(crit.niveles || []).map(n => n.puntaje)), 0);
    const total = Object.entries(evaluation).reduce((acc, [critIndex, levelIndex]) => acc + (criterios[Number(critIndex)]?.niveles?.[Number(levelIndex)]?.puntaje || 0), 0);
    return { puntajeTotal: total, puntajeMaximo: max };
  }, [selectedRubric, evaluation]);

  const calificacionFinal = useMemo(() => calcularNota(puntajeTotal, puntajeMaximo), [puntajeTotal, puntajeMaximo]);

  const handleSave = async () => {
    if (!selectedRubricId || !selectedEstudianteId || !selectedCursoId) {
      showError("Debes seleccionar curso, estudiante y rúbrica.");
      return;
    }
    setIsSaving(true);
    const toastId = showLoading("Guardando evaluación...");
    try {
      const payload: RubricEvaluationResult = {
        rubrica_id: selectedRubricId,
        estudiante_perfil_id: selectedEstudianteId,
        curso_asignatura_id: selectedCursoId,
        puntaje_obtenido: puntajeTotal,
        puntaje_maximo: puntajeMaximo,
        calificacion_final: calificacionFinal,
        comentarios,
        resultados_json: evaluation,
      };
      if (isReadingModuleActive) {
        payload.tiempo_lectura_segundos = readingData.seconds;
        payload.palabras_por_minuto = readingData.ppm;
        if (isDictationEnabled) {
          payload.resultados_lectura_json = { originalText, transcript: readingData.transcript, markedErrors: readingData.errors };
        }
      }
      await saveRubricEvaluation(payload);
      dismissToast(toastId);
      showSuccess("Evaluación guardada.");
      localStorage.removeItem(`rubric-draft-${selectedRubricId}-${selectedEstudianteId}`);
      setSelectedEstudianteId('');
    } catch (err: any) {
      dismissToast(toastId);
      showError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) return <div className="container mx-auto"><Loader2 className="h-8 w-8 animate-spin" /></div>;

  const criterios = selectedRubric?.contenido_json?.criterios;
  const hasCriterios = Array.isArray(criterios) && criterios.length > 0;

  return (
    <div className="container mx-auto space-y-6">
      <Link to="/dashboard/rubricas" className="flex items-center text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="mr-2 h-4 w-4" /> Volver al Banco de Rúbricas
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Evaluar con Rúbrica</CardTitle>
          <CardDescription>Selecciona un curso, un estudiante y una rúbrica para comenzar a evaluar.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Select onValueChange={setSelectedCursoId} value={selectedCursoId}>
            <SelectTrigger><SelectValue placeholder="1. Selecciona un curso..." /></SelectTrigger>
            <SelectContent>{cursos.map(c => <SelectItem key={c.id} value={c.id}>{c.curso.nivel.nombre} {c.curso.nombre} - {c.asignatura.nombre}</SelectItem>)}</SelectContent>
          </Select>
          <Select onValueChange={setSelectedEstudianteId} value={selectedEstudianteId} disabled={!selectedCursoId}>
            <SelectTrigger><SelectValue placeholder="2. Selecciona un estudiante..." /></SelectTrigger>
            <SelectContent>{estudiantes.map(e => <SelectItem key={e.id} value={e.id}>{e.nombre_completo}</SelectItem>)}</SelectContent>
          </Select>
          <Select onValueChange={setSelectedRubricId} value={selectedRubricId} disabled={!selectedEstudianteId}>
            <SelectTrigger><SelectValue placeholder="3. Selecciona una rúbrica..." /></SelectTrigger>
            <SelectContent>{rubricas.map(r => <SelectItem key={r.id} value={r.id}>{r.nombre}</SelectItem>)}</SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedEstudianteId && selectedRubric && (
        <>
          <Card>
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="reading-module-switch" className="text-base">Activar Módulo de Lectura</Label>
                  <p className="text-sm text-muted-foreground">Habilita el cronómetro para medir fluidez y PPM.</p>
                </div>
                <Switch id="reading-module-switch" checked={isReadingModuleActive} onCheckedChange={setIsReadingModuleActive} />
              </div>
              {isReadingModuleActive && (
                <div className="flex items-center justify-between pl-4">
                  <div className="space-y-0.5">
                    <Label htmlFor="dictation-switch" className="text-base">Activar Transcripción en Vivo</Label>
                    <p className="text-sm text-muted-foreground">Usa el micrófono para transcribir la lectura y marcar errores.</p>
                  </div>
                  <Switch id="dictation-switch" checked={isDictationEnabled} onCheckedChange={setIsDictationEnabled} />
                </div>
              )}
            </CardContent>
          </Card>

          {isReadingModuleActive && <ReadingEvaluationModule onDataChange={setReadingData} onTextChange={setOriginalText} originalText={originalText} isDictationEnabled={isDictationEnabled} />}

          {hasCriterios ? (
            <Card>
              <CardHeader>
                <CardTitle>{selectedRubric.nombre}</CardTitle>
                <CardDescription>{selectedRubric.actividad_a_evaluar}</CardDescription>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <table className="w-full border-collapse min-w-[1000px]">
                  <thead>
                    <tr>
                      <th className="border p-2 w-1/4 align-top text-left">Criterio</th>
                      {criterios[0]?.niveles?.map((level, levelIndex) => (
                        <th key={levelIndex} className="border p-2 align-top text-left">
                          <p className="font-bold">{level.nombre}</p>
                          <p className="font-normal text-sm">({level.puntaje} pts)</p>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {criterios.map((criterion, critIndex) => (
                      <tr key={critIndex}>
                        <td className="border p-2 align-top">
                          <p className="font-semibold">{criterion.nombre}</p>
                          <Badge variant="secondary" className="mt-1">{criterion.habilidad}</Badge>
                          <p className="text-sm text-muted-foreground mt-2">{criterion.descripcion}</p>
                        </td>
                        {Array.isArray(criterion.niveles) && criterion.niveles.map((level, levelIndex) => (
                          <td key={levelIndex} className={cn("border p-2 align-top cursor-pointer hover:bg-primary/10", evaluation[critIndex] === levelIndex && "bg-primary/20")} onClick={() => setEvaluation(prev => ({ ...prev, [critIndex]: levelIndex }))}>
                            <p className="text-sm">{level.descripcion}</p>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
              <CardContent className="mt-6 space-y-4">
                <div>
                  <Label htmlFor="comentarios">Comentarios Adicionales</Label>
                  <Textarea id="comentarios" value={comentarios} onChange={(e) => setComentarios(e.target.value)} />
                </div>
                <div className="flex justify-between items-center p-4 bg-muted rounded-md">
                  <div>
                    <p className="font-semibold">Puntaje Total: {puntajeTotal} / {puntajeMaximo}</p>
                    <p className="font-semibold">Calificación (60%): <span className={cn("text-xl", calificacionFinal < 4.0 ? "text-destructive" : "text-green-600")}>{calificacionFinal.toFixed(1)}</span></p>
                  </div>
                  <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Guardar Evaluación
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-6 text-center text-muted-foreground">
                La rúbrica seleccionada no tiene criterios de evaluación definidos. Por favor, edítala para añadir contenido.
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
};

export default EvaluateRubricPage;