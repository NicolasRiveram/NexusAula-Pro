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
import { fetchEvaluations, Evaluation, fetchStudentEvaluations, StudentEvaluation, fetchEvaluationDetails, fetchStudentsForEvaluation } from '@/api/evaluationsApi';
import { showError, showLoading, dismissToast } from '@/utils/toast';
import { format, parseISO, isPast } from 'date-fns';
import { es } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatEvaluationType } from '@/utils/evaluationUtils';
import { printComponent } from '@/utils/printUtils';
import PrintableEvaluation from '@/components/evaluations/printable/PrintableEvaluation';
import PrintAnswerSheetDialog, { AnswerSheetFormData } from '@/components/evaluations/PrintAnswerSheetDialog';
import PrintableAnswerSheet from '@/components/evaluations/printable/PrintableAnswerSheet';
import PrintableAnswerKey from '@/components/evaluations/printable/PrintableAnswerKey';
import { seededShuffle } from '@/utils/shuffleUtils';

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
  const [fontSize, setFontSize] = useState<'text-sm' | 'text-base' | 'text-lg'>('text-base');

  const [isAnswerSheetModalOpen, setAnswerSheetModalOpen] = useState(false);
  const [evaluationForAnswerSheet, setEvaluationForAnswerSheet] = useState<string | null>(null);
  const [isPrinting, setIsPrinting] = useState(false);

  useEffect(() => {
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
    loadEvaluations();
  }, [activeEstablishment, isStudent]);

  const handlePrintClick = (evaluationId: string) => {
    setEvaluationToPrint(evaluationId);
    setPrintModalOpen(true);
  };

  const handleConfirmPrint = async () => {
    if (!evaluationToPrint || !activeEstablishment) return;

    const toastId = showLoading("Preparando evaluación para imprimir...");
    try {
      let evaluationDetails = await fetchEvaluationDetails(evaluationToPrint);

      if (!evaluationDetails.aspectos_a_evaluar_ia) {
        dismissToast(toastId);
        const generatingToastId = showLoading("Generando aspectos pedagógicos con IA...");

        const contentSummary = evaluationDetails.evaluation_content_blocks
          .map(block => {
            if (block.block_type === 'text') return block.content.text;
            if (block.block_type === 'image') return `[Imagen: ${block.title || 'Sin título'}]`;
            return '';
          })
          .join('\n\n');

        const { data: aiData, error: aiError } = await supabase.functions.invoke('generate-evaluation-aspects', {
          body: { evaluationContent: contentSummary },
        });

        if (aiError) throw aiError;

        const newAspects = aiData.aspects;
        
        const { error: updateError } = await supabase
          .from('evaluaciones')
          .update({ aspectos_a_evaluar_ia: newAspects })
          .eq('id', evaluationToPrint);

        if (updateError) throw updateError;

        evaluationDetails.aspectos_a_evaluar_ia = newAspects;
        dismissToast(generatingToastId);
      }
      
      printComponent(
        <PrintableEvaluation 
          evaluation={evaluationDetails} 
          establishment={activeEstablishment}
          fontSize={fontSize}
        />,
        `Evaluación: ${evaluationDetails.titulo}`
      );

      dismissToast(toastId);
    } catch (error: any) {
      dismissToast(toastId);
      showError(`Error al preparar la impresión: ${error.message}`);
    } finally {
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

      printComponent(<div>{printableComponents}</div>, `Hojas de Respuesta - ${evaluation.titulo}`);
      dismissToast(toastId);
    } catch (error: any) {
      dismissToast(toastId);
      showError(`Error al generar las hojas: ${error.message}`);
    } finally {
      setIsPrinting(false);
      setAnswerSheetModalOpen(false);
    }
  };

  const renderTeacherView = () => {
    const groupEvaluationsByLevel = (evals: Evaluation[]): Record<string, Evaluation[]> => {
      const groups: Record<string, Evaluation[]> = {};
      evals.forEach(evaluation => {
        const levels = new Set<string>();
        evaluation.curso_asignaturas.forEach(ca => {
          if (ca.curso?.nivel?.nombre) {
            levels.add(ca.curso.nivel.nombre);
          }
        });

        levels.forEach(levelName => {
          if (!groups[levelName]) {
            groups[levelName] = [];
          }
          if (!groups[levelName].some(e => e.id === evaluation.id)) {
              groups[levelName].push(evaluation);
          }
        });
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
                  <Card key={evaluation.id} className="flex flex-col">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <CardTitle>{evaluation.titulo}</CardTitle>
                          <CardDescription>
                            Aplicación: {format(parseISO(evaluation.fecha_aplicacion), "d 'de' LLLL, yyyy", { locale: es })}
                          </CardDescription>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
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
                            <DropdownMenuItem disabled className="text-destructive">
                              <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardHeader>
                    <CardContent className="flex-grow">
                      <div className="space-y-2">
                        <Badge variant="secondary" className="capitalize">{formatEvaluationType(evaluation.tipo)}</Badge>
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
          </div>
        </div>
        <Tabs defaultValue="todas" className="w-full">
          <TabsList>
            <TabsTrigger value="todas">Todas</TabsTrigger>
            <TabsTrigger value="prueba">Pruebas</TabsTrigger>
            <TabsTrigger value="guia_de_trabajo">Guías</TabsTrigger>
            <TabsTrigger value="disertacion">Disertaciones</TabsTrigger>
            <TabsTrigger value="otro">Otras</TabsTrigger>
          </TabsList>
          <TabsContent value="todas">{renderEvaluations()}</TabsContent>
          <TabsContent value="prueba">{renderEvaluations('prueba')}</TabsContent>
          <TabsContent value="guia_de_trabajo">{renderEvaluations('guia_de_trabajo')}</TabsContent>
          <TabsContent value="disertacion">{renderEvaluations('disertacion')}</TabsContent>
          <TabsContent value="otro">{renderEvaluations('otro')}</TabsContent>
        </Tabs>
      </>
    );
  };

  const renderStudentView = () => {
    const pending = studentEvaluations.filter(e => e.status === 'Pendiente' && !isPast(parseISO(e.fecha_aplicacion)));
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
                      <p className="text-sm text-muted-foreground">Fecha de aplicación: {format(parseISO(e.fecha_aplicacion), "d 'de' LLLL", { locale: es })}</p>
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

      <Dialog open={isPrintModalOpen} onOpenChange={setPrintModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Configurar Impresión</DialogTitle>
            <DialogDescription>
              Selecciona el tamaño de la letra para la evaluación. Un tamaño más pequeño puede ahorrar páginas.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="font-size">Tamaño de la letra</Label>
            <Select value={fontSize} onValueChange={(value) => setFontSize(value as any)}>
              <SelectTrigger id="font-size">
                <SelectValue placeholder="Selecciona un tamaño" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="text-sm">Pequeño</SelectItem>
                <SelectItem value="text-base">Normal</SelectItem>
                <SelectItem value="text-lg">Grande</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPrintModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleConfirmPrint}>Imprimir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <PrintAnswerSheetDialog
        isOpen={isAnswerSheetModalOpen}
        onClose={() => setAnswerSheetModalOpen(false)}
        onConfirm={handleConfirmPrintAnswerSheets}
        isPrinting={isPrinting}
      />
    </div>
  );
};

export default EvaluationPage;