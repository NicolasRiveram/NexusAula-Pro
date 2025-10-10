import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useOutletContext } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useEstablishment } from '@/contexts/EstablishmentContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, CheckCircle, Send, MoreVertical, Eye, Printer, FileText, ClipboardList, BarChart, Camera, Trash2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from '@/components/ui/label';
import { fetchEvaluations, Evaluation, fetchStudentEvaluations, StudentEvaluation, fetchEvaluationDetails, fetchStudentsForEvaluation, deleteEvaluation, deleteMultipleEvaluations } from '@/api/evaluationsApi';
import { showError, showLoading, dismissToast, showSuccess } from '@/utils/toast';
import { format, parseISO, isPast } from 'date-fns';
import { es } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatEvaluationType } from '@/utils/evaluationUtils';
import { printComponent } from '@/utils/printUtils';
import PrintableEvaluation from '@/components/evaluations/printable/PrintableEvaluation';
import PrintAnswerSheetDialog, { AnswerSheetFormData } from '@/components/evaluations/printable/PrintAnswerSheetDialog';
import PrintableAnswerSheet from '@/components/evaluations/printable/PrintableAnswerSheet';
import PrintableAnswerKey from '@/components/evaluations/printable/PrintableAnswerKey';
import { seededShuffle } from '@/utils/shuffleUtils';
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
import { Checkbox } from '@/components/ui/checkbox';
import PrintEvaluationDialog, { PrintFormData } from '@/components/evaluations/printable/PrintEvaluationDialog';
import AnswerKeyDialog from '@/components/evaluations/AnswerKeyDialog';

interface DashboardContext {
  profile: { rol: string };
}

const EvaluationPage = () => {
  const navigate = useNavigate();
  const [teacherEvaluations, setTeacherEvaluations] = useState<Evaluation[]>([]);
  const [studentEvaluations, setStudentEvaluations] = useState<StudentEvaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const { activeEstablishment } = useEstablishment();
  const { profile } = useOutletContext<DashboardContext>();
  const isStudent = profile.rol === 'estudiante';

  const [isPrintModalOpen, setPrintModalOpen] = useState(false);
  const [evaluationToPrint, setEvaluationToPrint] = useState<string | null>(null);
  const [isPrinting, setIsPrinting] = useState(false);

  const [isAnswerSheetModalOpen, setAnswerSheetModalOpen] = useState(false);
  const [evaluationForAnswerSheet, setEvaluationForAnswerSheet] = useState<string | null>(null);

  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [evaluationToDelete, setEvaluationToDelete] = useState<Evaluation | null>(null);

  const [selectedEvaluations, setSelectedEvaluations] = useState<string[]>([]);
  const [isBulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  
  const [isAnswerKeyDialogOpen, setAnswerKeyDialogOpen] = useState(false);
  const [evaluationForAnswerKey, setEvaluationForAnswerKey] = useState<string | null>(null);

  const loadEvaluations = async () => {
    if (!activeEstablishment) {
      setTeacherEvaluations([]);
      setStudentEvaluations([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      try {
        if (isStudent) {
          const data = await fetchStudentEvaluations(user.id, activeEstablishment.id);
          setStudentEvaluations(data);
        } else {
          const data = await fetchEvaluations(user.id, activeEstablishment.id);
          setTeacherEvaluations(data);
        }
      } catch (err: any) {
        showError(`Error al cargar evaluaciones: ${err.message}`);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    loadEvaluations();
  }, [activeEstablishment, isStudent]);

  const handleSelectionChange = (evaluationId: string, isSelected: boolean) => {
    setSelectedEvaluations(prev => 
      isSelected ? [...prev, evaluationId] : prev.filter(id => id !== evaluationId)
    );
  };

  const handlePrintClick = (evaluationId: string) => {
    setEvaluationToPrint(evaluationId);
    setPrintModalOpen(true);
  };

  const handleConfirmPrint = async (formData: PrintFormData) => {
    if (!evaluationToPrint || !activeEstablishment) return;

    setIsPrinting(true);
    const toastId = showLoading("Preparando evaluación para imprimir...");
    try {
      const evaluationDetails = await fetchEvaluationDetails(evaluationToPrint);

      if (!evaluationDetails.aspectos_a_evaluar_ia) {
        showError("Falta el resumen 'Aspectos a Evaluar'. Por favor, edita y finaliza la evaluación para generarlo.");
        dismissToast(toastId);
        setPrintModalOpen(false);
        setIsPrinting(false);
        return;
      }

      let teacherName = 'Docente no especificado';
      if (evaluationDetails.creado_por) {
        const { data: profileData } = await supabase
          .from('perfiles')
          .select('nombre_completo')
          .eq('id', evaluationDetails.creado_por)
          .single();
        if (profileData && profileData.nombre_completo) {
          teacherName = profileData.nombre_completo;
        }
      }

      const totalScore = (evaluationDetails.evaluation_content_blocks || []).reduce((total, block) => {
        const blockTotal = (block.evaluacion_items || []).reduce((subTotal, item) => subTotal + (item.puntaje || 0), 0);
        return total + blockTotal;
      }, 0);

      const formatTeacherNameForPrint = (fullName: string | null): string => {
        if (!fullName || fullName.trim() === '') return '';
        const parts = fullName.trim().split(/\s+/);
        if (parts.length <= 1) return fullName;
        if (parts.length === 2) return fullName;
        const firstName = parts[0];
        const paternalLastName = parts[parts.length - 2];
        return `${firstName} ${paternalLastName}`;
      };
      const formattedTeacherName = formatTeacherNameForPrint(teacherName);
      
      const printableComponents: React.ReactElement[] = [];

      for (let i = 0; i < formData.rows; i++) {
        const rowLabel = String.fromCharCode(65 + i);
        const evaluationCopy = JSON.parse(JSON.stringify(evaluationDetails)); // Deep copy

        if (evaluationCopy.randomizar_preguntas) {
          const allItems = evaluationCopy.evaluation_content_blocks.flatMap((block: any) => block.evaluacion_items);
          const shuffledItems = seededShuffle(allItems, `${formData.seed}-${rowLabel}`);
          
          shuffledItems.forEach((item: any, index: number) => {
            item.orden = index + 1;
          });

          let firstBlockWithItemsIndex = evaluationCopy.evaluation_content_blocks.findIndex((block: any) => block.evaluacion_items.length > 0);
          if (firstBlockWithItemsIndex === -1 && shuffledItems.length > 0) {
              firstBlockWithItemsIndex = 0;
          }

          if (firstBlockWithItemsIndex !== -1) {
              evaluationCopy.evaluation_content_blocks[firstBlockWithItemsIndex].evaluacion_items = shuffledItems;
              for (let j = 0; j < evaluationCopy.evaluation_content_blocks.length; j++) {
                  if (j !== firstBlockWithItemsIndex) {
                      evaluationCopy.evaluation_content_blocks[j].evaluacion_items = [];
                  }
              }
          }
        }

        if (evaluationCopy.randomizar_alternativas) {
          evaluationCopy.evaluation_content_blocks.forEach((block: any) => {
            block.evaluacion_items.forEach((item: any) => {
              if (item.tipo_item === 'seleccion_multiple' && item.item_alternativas) {
                item.item_alternativas = seededShuffle(item.item_alternativas, `${formData.seed}-${rowLabel}-${item.id}`);
              }
            });
          });
        }

        printableComponents.push(
          <PrintableEvaluation 
            key={rowLabel}
            evaluation={evaluationCopy} 
            establishment={activeEstablishment}
            fontSize={formData.fontSize}
            teacherName={formattedTeacherName}
            totalScore={totalScore}
            rowLabel={formData.rows > 1 ? rowLabel : undefined}
          />
        );
      }

      printComponent(
        <div>{printableComponents}</div>,
        `Evaluación: ${evaluationDetails.titulo}`,
        'portrait'
      );

      dismissToast(toastId);
    } catch (error: any) {
      dismissToast(toastId);
      showError(`Error al preparar la impresión: ${error.message}`);
    } finally {
      setIsPrinting(false);
      setPrintModalOpen(false);
      setEvaluationToPrint(null);
    }
  };

  const handleAnswerSheetClick = (evaluationId: string) => {
    setEvaluationForAnswerSheet(evaluationId);
    setAnswerSheetModalOpen(true);
  };

  const handleConfirmPrintAnswerSheets = async (formData: AnswerSheetFormData) => {
    if (!evaluationForAnswerSheet || !activeEstablishment) return;
    setIsPrinting(true);
    const toastId = showLoading("Generando hojas de respuesta y pautas...");

    try {
      const [evaluation, students] = await Promise.all([
        fetchEvaluationDetails(evaluationForAnswerSheet),
        fetchStudentsForEvaluation(evaluationForAnswerSheet),
      ]);

      const allQuestions = evaluation.evaluation_content_blocks.flatMap(b => b.evaluacion_items);
      const answerKey: { [row: string]: { [q: number]: string } } = {};
      const printableComponents: React.ReactElement[] = [];

      for (let i = 0; i < formData.rows; i++) {
        const rowLabel = String.fromCharCode(65 + i);
        answerKey[rowLabel] = {};

        for (const student of students) {
          const qrCodeData = `${evaluation.id}|${student.id}|${rowLabel}`;
          const shuffledQuestions = allQuestions.map(q => {
            const shuffledAlts = seededShuffle(q.item_alternativas, `${formData.seed}-${rowLabel}-${q.id}`);
            const correctIndex = shuffledAlts.findIndex(alt => alt.es_correcta);
            answerKey[rowLabel][q.orden] = String.fromCharCode(65 + correctIndex);
            return { ...q, item_alternativas: shuffledAlts };
          });

          printableComponents.push(
            <PrintableAnswerSheet
              key={`${student.id}-${rowLabel}`}
              evaluationTitle={evaluation.titulo}
              establishmentName={activeEstablishment.nombre}
              logoUrl={activeEstablishment.logo_url}
              studentName={student.nombre_completo}
              courseName={student.curso_nombre}
              rowLabel={rowLabel}
              qrCodeData={qrCodeData}
              questions={shuffledQuestions.map(q => ({ orden: q.orden, alternativesCount: q.item_alternativas.length }))}
            />
          );
        }
      }

      printableComponents.push(
        <PrintableAnswerKey
          key="answer-key"
          evaluationTitle={evaluation.titulo}
          answerKey={answerKey}
        />
      );

      printComponent(<div>{printableComponents}</div>, `Hojas de Respuesta - ${evaluation.titulo}`, 'portrait');
      dismissToast(toastId);
    } catch (error: any) {
      dismissToast(toastId);
      showError(`Error al generar las hojas: ${error.message}`);
    } finally {
      setIsPrinting(false);
      setAnswerSheetModalOpen(false);
    }
  };

  const handleDeleteClick = (evaluation: Evaluation) => {
    setEvaluationToDelete(evaluation);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!evaluationToDelete) return;
    const toastId = showLoading("Eliminando evaluación...");
    try {
      await deleteEvaluation(evaluationToDelete.id);
      showSuccess(`Evaluación "${evaluationToDelete.titulo}" eliminada.`);
      loadEvaluations();
    } catch (error: any) {
      showError(error.message);
    } finally {
      dismissToast(toastId);
      setDeleteDialogOpen(false);
      setEvaluationToDelete(null);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedEvaluations.length === 0) return;
    const toastId = showLoading(`Eliminando ${selectedEvaluations.length} evaluaciones...`);
    try {
      await deleteMultipleEvaluations(selectedEvaluations);
      showSuccess(`${selectedEvaluations.length} evaluaciones eliminadas.`);
      setSelectedEvaluations([]);
      loadEvaluations();
    } catch (error: any) {
      showError(error.message);
    } finally {
      dismissToast(toastId);
      setBulkDeleteDialogOpen(false);
    }
  };

  const renderTeacherView = () => {
    const groupEvaluationsByLevel = (evals: Evaluation[]): Record<string, Evaluation[]> => {
      const groups: Record<string, Evaluation[]> = {};
      evals.forEach(evaluation => {
        const levels = new Set<string>();
        if (evaluation.curso_asignaturas && evaluation.curso_asignaturas.length > 0) {
          evaluation.curso_asignaturas.forEach(ca => {
            if (ca.curso?.nivel?.nombre) {
              levels.add(ca.curso.nivel.nombre);
            }
          });
        }

        if (levels.size === 0) {
          const key = 'Sin Asignar';
          if (!groups[key]) groups[key] = [];
          if (!groups[key].some(e => e.id === evaluation.id)) {
            groups[key].push(evaluation);
          }
        } else {
          levels.forEach(levelName => {
            if (!groups[levelName]) groups[levelName] = [];
            if (!groups[levelName].some(e => e.id === evaluation.id)) {
              groups[levelName].push(evaluation);
            }
          });
        }
      });
      return groups;
    };

    const renderEvaluations = (filterType?: string) => {
      const filtered = filterType ? teacherEvaluations.filter(e => e.tipo === filterType) : teacherEvaluations;
      
      if (filtered.length === 0) {
        return (
          <div className="text-center py-12 border-2 border-dashed rounded-lg mt-4">
            <h3 className="text-xl font-semibold">No hay evaluaciones de este tipo</h3>
            <p className="text-muted-foreground mt-2">Crea una nueva evaluación para empezar.</p>
          </div>
        );
      }

      const grouped = groupEvaluationsByLevel(filtered);
      const sortedLevels = Object.keys(grouped).sort();

      return (
        <div className="space-y-8 mt-4">
          {sortedLevels.map(levelName => (
            <div key={levelName}>
              <h2 className="text-2xl font-bold mb-4 pb-2 border-b">{levelName}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {grouped[levelName].map(evaluation => (
                  <div key={evaluation.id} className="relative">
                    <div className="absolute top-2 left-2 z-10">
                      <Checkbox
                        checked={selectedEvaluations.includes(evaluation.id)}
                        onCheckedChange={(checked) => handleSelectionChange(evaluation.id, !!checked)}
                        className="bg-white"
                      />
                    </div>
                    <Card className="flex flex-col h-full">
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div className="flex-1 pr-8">
                            <CardTitle>{evaluation.titulo}</CardTitle>
                            <CardDescription>
                              Aplicación: {evaluation.fecha_aplicacion ? format(parseISO(evaluation.fecha_aplicacion), "d 'de' LLLL, yyyy", { locale: es }) : 'Sin fecha definida'}
                            </CardDescription>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 -mt-2 -mr-2">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => navigate(`/dashboard/evaluacion/${evaluation.id}`)}>
                                <Eye className="mr-2 h-4 w-4" /> Ver / Editar Contenido
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => navigate(`/dashboard/evaluacion/${evaluation.id}/resultados`)}>
                                <BarChart className="mr-2 h-4 w-4" /> Ver Resultados
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => { setEvaluationForAnswerKey(evaluation.id); setAnswerKeyDialogOpen(true); }}>
                                <ClipboardList className="mr-2 h-4 w-4" /> Ver Pauta
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handlePrintClick(evaluation.id)}>
                                <Printer className="mr-2 h-4 w-4" /> Imprimir Evaluación
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleAnswerSheetClick(evaluation.id)}>
                                <FileText className="mr-2 h-4 w-4" /> Imprimir Hoja de Respuestas
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => navigate(`/dashboard/evaluacion/${evaluation.id}/corregir`)}>
                                <Camera className="mr-2 h-4 w-4" /> Corregir con Cámara
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleDeleteClick(evaluation)} className="text-destructive">
                                <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </CardHeader>
                      <CardContent className="flex-grow">
                        <div className="space-y-2">
                          <div className="flex gap-2">
                            <Badge variant="secondary" className="capitalize">{formatEvaluationType(evaluation.tipo)}</Badge>
                            {evaluation.momento_evaluativo && <Badge variant="outline" className="capitalize">{evaluation.momento_evaluativo}</Badge>}
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {evaluation.curso_asignaturas.map((ca, index) => (
                              <Badge key={index} variant="outline">
                                {ca.curso.nivel.nombre} {ca.curso.nombre}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      );
    };

    return (
      <>
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Banco de Evaluaciones</h1>
            <p className="text-muted-foreground">Crea, gestiona y comparte tus instrumentos de evaluación.</p>
          </div>
          <div className="flex gap-2">
            {selectedEvaluations.length > 0 ? (
              <Button variant="destructive" onClick={() => setBulkDeleteDialogOpen(true)}>
                <Trash2 className="mr-2 h-4 w-4" />
                Eliminar ({selectedEvaluations.length})
              </Button>
            ) : (
              <>
                <Button asChild variant="outline" disabled={!activeEstablishment}>
                  <Link to="/dashboard/rubricas/crear">
                    <PlusCircle className="mr-2 h-4 w-4" /> Crear Rúbrica
                  </Link>
                </Button>
                <Button asChild disabled={!activeEstablishment}>
                  <Link to="/dashboard/evaluacion/crear">
                    <PlusCircle className="mr-2 h-4 w-4" /> Crear Nueva Evaluación
                  </Link>
                </Button>
              </>
            )}
          </div>
        </div>
        <Tabs defaultValue="todas" className="w-full">
          <TabsList>
            <TabsTrigger value="todas">Todas</TabsTrigger>
            <TabsTrigger value="prueba">Pruebas</TabsTrigger>
            <TabsTrigger value="guia_de_trabajo">Guías</TabsTrigger>
            <TabsTrigger value="otro">Otras</TabsTrigger>
          </TabsList>
          <TabsContent value="todas">{renderEvaluations()}</TabsContent>
          <TabsContent value="prueba">{renderEvaluations('prueba')}</TabsContent>
          <TabsContent value="guia_de_trabajo">{renderEvaluations('guia_de_trabajo')}</TabsContent>
          <TabsContent value="otro">{renderEvaluations('otro')}</TabsContent>
        </Tabs>
      </>
    );
  };

  const renderStudentView = () => {
    const pending = studentEvaluations.filter(e => e.status === 'Pendiente' && !isPast(parseISO(e.fecha_aplicacion!)));
    const completed = studentEvaluations.filter(e => e.status === 'Completado');

    return (
      <>
        <div>
          <h1 className="text-3xl font-bold">Mis Evaluaciones</h1>
          <p className="text-muted-foreground">Aquí encontrarás tus evaluaciones pendientes y completadas.</p>
        </div>
        <Tabs defaultValue="pendientes" className="w-full">
          <TabsList>
            <TabsTrigger value="pendientes">Pendientes ({pending.length})</TabsTrigger>
            <TabsTrigger value="completadas">Completadas ({completed.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="pendientes">
            {pending.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
                {pending.map(e => (
                  <Card key={e.id}>
                    <CardHeader>
                      <CardTitle>{e.titulo}</CardTitle>
                      <CardDescription>{e.asignatura_nombre} - {e.curso_nombre}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">Fecha de aplicación: {e.fecha_aplicacion ? format(parseISO(e.fecha_aplicacion), "d 'de' LLLL", { locale: es }) : 'Sin fecha'}</p>
                      <Button asChild className="w-full mt-4">
                        <Link to={`/dashboard/evaluacion/${e.id}/responder`}>
                          <Send className="mr-2 h-4 w-4" /> Responder
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : <p className="text-center text-muted-foreground py-12">¡Genial! No tienes evaluaciones pendientes.</p>}
          </TabsContent>
          <TabsContent value="completadas">
            {completed.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
                {completed.map(e => (
                  <Card key={e.id} className="bg-muted/50">
                    <CardHeader>
                      <CardTitle>{e.titulo}</CardTitle>
                      <CardDescription>{e.asignatura_nombre} - {e.curso_nombre}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center text-green-600">
                        <CheckCircle className="mr-2 h-4 w-4" />
                        <span>Completado</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : <p className="text-center text-muted-foreground py-12">Aún no has completado ninguna evaluación.</p>}
          </TabsContent>
        </Tabs>
      </>
    );
  };

  return (
    <div className="container mx-auto space-y-6">
      {loading ? (
        <p>Cargando evaluaciones...</p>
      ) : !activeEstablishment ? (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <h3 className="text-xl font-semibold">Selecciona un establecimiento</h3>
          <p className="text-muted-foreground mt-2">Elige un establecimiento para gestionar tus evaluaciones.</p>
        </div>
      ) : isStudent ? renderStudentView() : renderTeacherView()}

      <PrintEvaluationDialog
        isOpen={isPrintModalOpen}
        onClose={() => setPrintModalOpen(false)}
        onConfirm={handleConfirmPrint}
        isPrinting={isPrinting}
      />

      <PrintAnswerSheetDialog
        isOpen={isAnswerSheetModalOpen}
        onClose={() => setAnswerSheetModalOpen(false)}
        onConfirm={handleConfirmPrintAnswerSheets}
        isPrinting={isPrinting}
      />

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás absolutamente seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente la evaluación
              "{evaluationToDelete?.titulo}" y todas sus preguntas, respuestas y resultados asociados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete}>
              Sí, eliminar evaluación
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isBulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro de eliminar {selectedEvaluations.length} evaluaciones?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminarán permanentemente las evaluaciones seleccionadas y todos sus datos asociados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkDelete}>
              Sí, eliminar seleccionados
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <AnswerKeyDialog
        isOpen={isAnswerKeyDialogOpen}
        onClose={() => setAnswerKeyDialogOpen(false)}
        evaluationId={evaluationForAnswerKey}
      />
    </div>
  );
};

export default EvaluationPage;