import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useEstablishment } from '@/contexts/EstablishmentContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Download, Loader2, Save, Edit, Trash2 } from 'lucide-react';
import { fetchRubricById, saveRubricEvaluation, Rubric, deleteRubric, RubricEvaluationResult } from '@/api/rubricsApi';
import { fetchCursosAsignaturasDocente, fetchEstudiantesPorCurso, CursoAsignatura, Estudiante } from '@/api/coursesApi';
import { showError, showSuccess, showLoading, dismissToast } from '@/utils/toast';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { printComponent } from '@/utils/printUtils';
import PrintableRubric from '@/components/rubrics/PrintableRubric';
import PrintableRubricForEvaluation from '@/components/rubrics/PrintableRubricForEvaluation';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Switch } from '@/components/ui/switch';
import ReadingEvaluationModule from '@/components/rubrics/ReadingEvaluationModule';

const calcularNota = (puntajeObtenido: number, puntajeMaximo: number): number => {
  if (puntajeMaximo <= 0) {
    return 1.0;
  }
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

const RubricDetailPage = () => {
  const { rubricId } = useParams<{ rubricId: string }>();
  const navigate = useNavigate();
  const { activeEstablishment } = useEstablishment();
  const [rubric, setRubric] = useState<Rubric | null>(null);
  const [cursos, setCursos] = useState<CursoAsignatura[]>([]);
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([]);
  const [selectedCursoId, setSelectedCursoId] = useState<string>('');
  const [selectedEstudianteId, setSelectedEstudianteId] = useState<string>('');
  const [evaluation, setEvaluation] = useState<Record<number, number>>({});
  const [comentarios, setComentarios] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [isReadingModuleActive, setIsReadingModuleActive] = useState(false);
  const [isDictationEnabled, setIsDictationEnabled] = useState(false);
  const [originalText, setOriginalText] = useState('');
  const [readingData, setReadingData] = useState({ seconds: 0, ppm: 0, errors: [] as number[], transcript: '' });

  useEffect(() => {
    const loadInitialData = async () => {
      if (!rubricId || !activeEstablishment) return;
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        try {
          const [rubricData, cursosData] = await Promise.all([
            fetchRubricById(rubricId),
            fetchCursosAsignaturasDocente(user.id, activeEstablishment.id),
          ]);
          setRubric(rubricData);
          setCursos(cursosData);
        } catch (err: any) {
          showError(err.message);
        }
      }
      setLoading(false);
    };
    loadInitialData();
  }, [rubricId, activeEstablishment]);

  useEffect(() => {
    const loadEstudiantes = async () => {
      if (selectedCursoId) {
        const cursoAsignatura = cursos.find(c => c.id === selectedCursoId);
        if (cursoAsignatura) {
          try {
            const studentData = await fetchEstudiantesPorCurso(cursoAsignatura.curso.id);
            setEstudiantes(studentData);
          } catch (err: any) {
            showError(err.message);
          }
        }
      } else {
        setEstudiantes([]);
      }
      setSelectedEstudianteId('');
    };
    loadEstudiantes();
  }, [selectedCursoId, cursos]);

  // Load draft from localStorage when student changes
  useEffect(() => {
    const storageKey = rubricId && selectedEstudianteId ? `rubric-draft-${rubricId}-${selectedEstudianteId}` : null;
    if (storageKey) {
      const savedDraft = localStorage.getItem(storageKey);
      if (savedDraft) {
        try {
          const { evaluation: savedEvaluation, comentarios: savedComentarios } = JSON.parse(savedDraft);
          setEvaluation(savedEvaluation || {});
          setComentarios(savedComentarios || '');
        } catch (e) {
          console.error("Failed to parse rubric draft from localStorage", e);
          setEvaluation({});
          setComentarios('');
        }
      } else {
        setEvaluation({});
        setComentarios('');
      }
    } else {
      setEvaluation({});
      setComentarios('');
    }
  }, [selectedEstudianteId, rubricId]);

  // Save draft to localStorage on change
  useEffect(() => {
    const storageKey = rubricId && selectedEstudianteId ? `rubric-draft-${rubricId}-${selectedEstudianteId}` : null;
    if (storageKey) {
      const draft = { evaluation, comentarios };
      localStorage.setItem(storageKey, JSON.stringify(draft));
    }
  }, [evaluation, comentarios, rubricId, selectedEstudianteId]);

  const { puntajeTotal, puntajeMaximo } = useMemo(() => {
    const criterios = rubric?.contenido_json?.criterios;
    if (!criterios || criterios.length === 0) {
      return { puntajeTotal: 0, puntajeMaximo: 0 };
    }
    const max = criterios.reduce((acc, crit) => {
      const nivelPuntajes = Array.isArray(crit.niveles) ? crit.niveles.map(n => n.puntaje) : [];
      return acc + (nivelPuntajes.length > 0 ? Math.max(...nivelPuntajes) : 0);
    }, 0);
    const total = Object.entries(evaluation).reduce((acc, [critIndex, levelIndex]) => {
      const criterion = criterios[Number(critIndex)];
      return acc + (criterion?.niveles?.[Number(levelIndex)]?.puntaje || 0);
    }, 0);
    return { puntajeTotal: total, puntajeMaximo: max };
  }, [rubric, evaluation]);

  const calificacionFinal = useMemo(() => calcularNota(puntajeTotal, puntajeMaximo), [puntajeTotal, puntajeMaximo]);

  const handleLevelSelect = (criterionIndex: number, levelIndex: number) => {
    setEvaluation(prev => ({ ...prev, [criterionIndex]: levelIndex }));
  };

  const handleSave = async () => {
    if (!rubricId || !selectedEstudianteId || !selectedCursoId) {
      showError("Debes seleccionar un curso y un estudiante.");
      return;
    }
    setIsSaving(true);
    const toastId = showLoading("Guardando evaluación...");
    try {
      const evaluationPayload: RubricEvaluationResult = {
        rubrica_id: rubricId,
        estudiante_perfil_id: selectedEstudianteId,
        curso_asignatura_id: selectedCursoId,
        puntaje_obtenido: puntajeTotal,
        puntaje_maximo: puntajeMaximo,
        calificacion_final: calificacionFinal,
        comentarios,
        resultados_json: evaluation,
      };

      if (isReadingModuleActive) {
        evaluationPayload.tiempo_lectura_segundos = readingData.seconds;
        evaluationPayload.palabras_por_minuto = readingData.ppm;
        if (isDictationEnabled) {
          evaluationPayload.resultados_lectura_json = {
            originalText,
            transcript: readingData.transcript,
            markedErrors: readingData.errors,
          };
        }
      }

      await saveRubricEvaluation(evaluationPayload);
      dismissToast(toastId);
      showSuccess("Evaluación guardada correctamente.");
      
      const storageKey = `rubric-draft-${rubricId}-${selectedEstudianteId}`;
      localStorage.removeItem(storageKey);

      setSelectedEstudianteId('');
    } catch (err: any) {
      dismissToast(toastId);
      showError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!rubricId) return;
    try {
      await deleteRubric(rubricId);
      showSuccess("Rúbrica eliminada.");
      navigate('/dashboard/rubricas');
    } catch (error: any) {
      showError(error.message);
    } finally {
      setIsAlertOpen(false);
    }
  };

  const handleDownloadPauta = () => {
    if (rubric) {
        printComponent(
            <PrintableRubric rubric={rubric} />,
            `Pauta Rúbrica - ${rubric.nombre}`,
            'landscape'
        );
    }
  };

  const handleDownloadInstrumento = () => {
      if (rubric) {
          printComponent(
              <PrintableRubricForEvaluation rubric={rubric} />,
              `Instrumento Rúbrica - ${rubric.nombre}`,
              'landscape'
          );
      }
  };

  if (loading) return <div className="container mx-auto"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  if (!rubric) return <div className="container mx-auto"><p>Rúbrica no encontrada.</p></div>;

  const criterios = rubric.contenido_json?.criterios;
  const hasCriterios = Array.isArray(criterios) && criterios.length > 0;

  return (
    <>
      <div className="container mx-auto space-y-6">
        <Link to="/dashboard/rubricas" className="flex items-center text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="mr-2 h-4 w-4" /> Volver al Banco de Rúbricas
        </Link>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-2xl">{rubric.nombre}</CardTitle>
                <CardDescription>Actividad: {rubric.actividad_a_evaluar}</CardDescription>
                {rubric.categoria && <Badge variant="outline" className="mt-2">{rubric.categoria}</Badge>}
              </div>
              <div className="flex gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline"><Download className="mr-2 h-4 w-4" /> Descargar</Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={handleDownloadPauta}>
                      Descargar Pauta de Rúbrica
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleDownloadInstrumento}>
                      Descargar Instrumento para Evaluar
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button onClick={() => navigate(`/dashboard/rubricas/editar/${rubric.id}`)}><Edit className="mr-2 h-4 w-4" /> Editar</Button>
                <Button variant="destructive" onClick={() => setIsAlertOpen(true)}><Trash2 className="mr-2 h-4 w-4" /> Eliminar</Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{rubric.descripcion}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Evaluar Estudiante</CardTitle>
            <CardDescription>Selecciona un curso y un estudiante para aplicar esta rúbrica.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select onValueChange={setSelectedCursoId} value={selectedCursoId}>
              <SelectTrigger><SelectValue placeholder="Selecciona un curso..." /></SelectTrigger>
              <SelectContent>{cursos.map(c => <SelectItem key={c.id} value={c.id}>{c.curso.nivel.nombre} {c.curso.nombre} - {c.asignatura.nombre}</SelectItem>)}</SelectContent>
            </Select>
            <Select onValueChange={setSelectedEstudianteId} value={selectedEstudianteId} disabled={!selectedCursoId}>
              <SelectTrigger><SelectValue placeholder="Selecciona un estudiante..." /></SelectTrigger>
              <SelectContent>{estudiantes.map(e => <SelectItem key={e.id} value={e.id}>{e.nombre_completo}</SelectItem>)}</SelectContent>
            </Select>
          </CardContent>
        </Card>

        {selectedEstudianteId && (
          <Card>
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="reading-module-switch" className="text-base">
                    Activar Módulo de Lectura
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Habilita el cronómetro para medir fluidez y palabras por minuto (PPM).
                  </p>
                </div>
                <Switch
                  id="reading-module-switch"
                  checked={isReadingModuleActive}
                  onCheckedChange={setIsReadingModuleActive}
                />
              </div>
              {isReadingModuleActive && (
                <div className="flex items-center justify-between pl-4">
                  <div className="space-y-0.5">
                    <Label htmlFor="dictation-switch" className="text-base">
                      Activar Transcripción en Vivo (Dictado)
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Usa el micrófono para transcribir la lectura y marcar errores.
                    </p>
                  </div>
                  <Switch
                    id="dictation-switch"
                    checked={isDictationEnabled}
                    onCheckedChange={setIsDictationEnabled}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {isReadingModuleActive && selectedEstudianteId && (
          <ReadingEvaluationModule
            onDataChange={setReadingData}
            onTextChange={setOriginalText}
            originalText={originalText}
            isDictationEnabled={isDictationEnabled}
          />
        )}

        {selectedEstudianteId && !hasCriterios && (
          <Card>
            <CardHeader>
              <CardTitle>Rúbrica Incompleta</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-center text-muted-foreground">Esta rúbrica no tiene criterios de evaluación definidos. Por favor, edita la rúbrica para añadir el contenido.</p>
            </CardContent>
          </Card>
        )}

        {selectedEstudianteId && hasCriterios && (
          <Card>
            <CardHeader>
              <CardTitle>Rúbrica de Evaluación</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="border p-2 w-1/4 align-top text-left">Criterio de Evaluación</th>
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
                        <td key={levelIndex} className={cn("border p-2 align-top cursor-pointer hover:bg-primary/10", evaluation[critIndex] === levelIndex && "bg-primary/20")} onClick={() => handleLevelSelect(critIndex, levelIndex)}>
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
        )}
      </div>
      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente la rúbrica "{rubric?.nombre}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default RubricDetailPage;