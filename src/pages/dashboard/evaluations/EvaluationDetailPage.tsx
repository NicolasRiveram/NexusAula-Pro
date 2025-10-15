import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Download, Edit, Loader2, BrainCircuit, FileText, Image as ImageIcon, BarChart, Camera, ClipboardList, MoreVertical } from 'lucide-react';
import { fetchEvaluationDetails, EvaluationDetail, getPublicImageUrl, fetchStudentsForEvaluation } from '@/api/evaluationsApi';
import { showError, showLoading, dismissToast } from '@/utils/toast';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { formatEvaluationType } from '@/utils/evaluationUtils';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useEstablishment } from '@/contexts/EstablishmentContext';
import { printComponent } from '@/utils/printUtils';
import PrintableEvaluation from '@/components/evaluations/printable/PrintableEvaluation';
import PrintEvaluationDialog, { PrintFormData } from '@/components/evaluations/printable/PrintEvaluationDialog';
import { seededShuffle } from '@/utils/shuffleUtils';
import AnswerKeyDialog from '@/components/evaluations/AnswerKeyDialog';
import PrintAnswerSheetDialog, { AnswerSheetFormData } from '@/components/evaluations/printable/PrintAnswerSheetDialog';
import PrintableAnswerSheet from '@/components/evaluations/printable/PrintableAnswerSheet';
import PrintableAnswerKey from '@/components/evaluations/printable/PrintableAnswerKey';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

const formatTeacherNameForPrint = (fullName: string | null): string => {
  if (!fullName || fullName.trim() === '') {
    return '';
  }
  const parts = fullName.trim().split(/\s+/);
  if (parts.length <= 1) {
    return fullName;
  }
  if (parts.length === 2) {
    return fullName;
  }
  const firstName = parts[0];
  const paternalLastName = parts[parts.length - 2];
  return `${firstName} ${paternalLastName}`;
};

const EvaluationDetailPage = () => {
  const { evaluationId } = useParams<{ evaluationId: string }>();
  const navigate = useNavigate();
  const [evaluation, setEvaluation] = useState<EvaluationDetail | null>(null);
  const [teacherName, setTeacherName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { activeEstablishment } = useEstablishment();
  const [isPrintModalOpen, setPrintModalOpen] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [isAnswerKeyDialogOpen, setAnswerKeyDialogOpen] = useState(false);
  const [isAnswerSheetModalOpen, setAnswerSheetModalOpen] = useState(false);
  const [printMode, setPrintMode] = useState<'regular' | 'pie'>('regular');
  const [showPieVersion, setShowPieVersion] = useState(false);

  useEffect(() => {
    if (evaluationId) {
      setLoading(true);
      fetchEvaluationDetails(evaluationId)
        .then(async (evalData) => {
          setEvaluation(evalData);
          if (evalData.creado_por) {
            const { data: profileData } = await supabase
              .from('perfiles')
              .select('nombre_completo')
              .eq('id', evalData.creado_por)
              .single();
            if (profileData && profileData.nombre_completo) {
              setTeacherName(profileData.nombre_completo);
            }
          }
        })
        .catch(err => showError(`Error al cargar la evaluación: ${err.message}`))
        .finally(() => setLoading(false));
    }
  }, [evaluationId]);

  const hasAnyAdaptation = useMemo(() => {
    return evaluation?.evaluation_content_blocks.some(b => b.evaluacion_items.some(i => i.tiene_adaptacion_pie));
  }, [evaluation]);

  const totalPuntaje = (evaluation?.evaluation_content_blocks || []).reduce((total, block) => {
    const blockTotal = (block.evaluacion_items || []).reduce((subTotal, item) => subTotal + (item.puntaje || 0), 0);
    return total + blockTotal;
  }, 0);

  const handleConfirmPrint = async (formData: PrintFormData) => {
    if (!evaluation || !activeEstablishment) return;

    setIsPrinting(true);
    const toastId = showLoading("Preparando evaluación para imprimir...");
    try {
      if (!evaluation.aspectos_a_evaluar_ia) {
        showError("Falta el resumen 'Aspectos a Evaluar'. Por favor, edita y finaliza la evaluación para generarlo.");
        dismissToast(toastId);
        setPrintModalOpen(false);
        setIsPrinting(false);
        return;
      }
      
      const formattedTeacherName = formatTeacherNameForPrint(teacherName);
      const printableComponents: React.ReactElement[] = [];

      for (let i = 0; i < formData.rows; i++) {
        const rowLabel = String.fromCharCode(65 + i);
        const evaluationCopy = JSON.parse(JSON.stringify(evaluation)); // Deep copy

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
              if (item.tipo_item === 'seleccion_multiple') {
                if (item.item_alternativas) {
                  const sortedOriginal = [...item.item_alternativas].sort((a, b) => a.orden - b.orden);
                  item.item_alternativas = seededShuffle(sortedOriginal, `${formData.seed}-${rowLabel}-${item.id}`);
                }
                if (item.adaptaciones_pie && item.adaptaciones_pie[0] && item.adaptaciones_pie[0].alternativas_adaptadas) {
                  const sortedAdapted = [...item.adaptaciones_pie[0].alternativas_adaptadas].sort((a, b) => a.orden - b.orden);
                  item.adaptaciones_pie[0].alternativas_adaptadas = seededShuffle(sortedAdapted, `${formData.seed}-${rowLabel}-${item.id}`);
                }
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
            teacherName={formattedTeacherName || 'Docente no especificado'}
            totalScore={totalPuntaje}
            rowLabel={formData.rows > 1 ? rowLabel : undefined}
            usePieAdaptations={printMode === 'pie'}
          />
        );
      }

      printComponent(
        <div>{printableComponents}</div>,
        `Evaluación: ${evaluation.titulo}`,
        'portrait'
      );

      dismissToast(toastId);
    } catch (error: any) {
      dismissToast(toastId);
      showError(`Error al preparar la impresión: ${error.message}`);
    } finally {
      setIsPrinting(false);
      setPrintModalOpen(false);
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

        allQuestions.forEach(q => {
          if (q.tipo_item === 'seleccion_multiple') {
            const sortedAlts = [...q.item_alternativas].sort((a, b) => a.orden - b.orden);
            const shuffledAlts = seededShuffle(sortedAlts, `${formData.seed}-${rowLabel}-${q.id}`);
            const correctIndex = shuffledAlts.findIndex(alt => alt.es_correcta);
            answerKey[rowLabel][q.orden] = String.fromCharCode(65 + correctIndex);
          }
        });

        for (const student of students) {
          const qrCodeData = `${evaluation.id}|${student.id}|${rowLabel}`;
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
              questions={allQuestions.map(q => ({ orden: q.orden, alternativesCount: q.item_alternativas.length }))}
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

  if (loading) {
    return (
      <div className="container mx-auto flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!evaluation) {
    return (
      <div className="container mx-auto text-center">
        <p>No se pudo encontrar la evaluación.</p>
        <Link to="/dashboard/evaluacion" className="text-primary hover:underline mt-4 inline-block">
          Volver al Banco de Evaluaciones
        </Link>
      </div>
    );
  }

  const hasScannableQuestions = (evaluation.evaluation_content_blocks || []).some(b => b.evaluacion_items.some(i => i.tipo_item === 'seleccion_multiple'));

  return (
    <>
      <div className="container mx-auto space-y-6">
        <Link to="/dashboard/evaluacion" className="flex items-center text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver al Banco de Evaluaciones
        </Link>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <Badge variant="secondary" className="mb-2">{formatEvaluationType(evaluation.tipo)}</Badge>
                <CardTitle className="text-3xl">{evaluation.titulo}</CardTitle>
                <CardDescription className="mt-2">
                  Fecha de Aplicación: {evaluation.fecha_aplicacion ? format(parseISO(evaluation.fecha_aplicacion), "d 'de' LLLL, yyyy", { locale: es }) : 'Sin fecha definida'}
                </CardDescription>
                <div className="flex flex-wrap gap-2 mt-2">
                  {evaluation.curso_asignaturas.map((ca, index) => (
                    <Badge key={index} variant="outline">
                      {ca.curso.nivel.nombre} {ca.curso.nombre} - {ca.asignatura.nombre}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="flex flex-wrap gap-2 justify-end">
                <Button onClick={() => navigate(`/dashboard/evaluacion/editar/${evaluation.id}`)}><Edit className="mr-2 h-4 w-4" /> Editar</Button>
                <Button onClick={() => navigate(`/dashboard/evaluacion/${evaluation.id}/resultados`)}><BarChart className="mr-2 h-4 w-4" /> Ver Resultados</Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon"><MoreVertical className="h-4 w-4" /></Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => navigate(`/dashboard/evaluacion/adaptar/${evaluation.id}`)}>
                      <BrainCircuit className="mr-2 h-4 w-4" /> Adaptar para PIE
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => { setPrintMode('regular'); setPrintModalOpen(true); }}>
                      <Download className="mr-2 h-4 w-4" /> Descargar Evaluación
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => { setPrintMode('pie'); setPrintModalOpen(true); }}>
                      <Download className="mr-2 h-4 w-4" /> Descargar Versión PIE
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleAnswerSheetClick(evaluation.id)}>
                      <FileText className="mr-2 h-4 w-4" /> Imprimir Hojas de Respuesta
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setAnswerKeyDialogOpen(true)}>
                      <ClipboardList className="mr-2 h-4 w-4" /> Ver Pauta de Corrección
                    </DropdownMenuItem>
                    {hasScannableQuestions && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => navigate(`/dashboard/evaluacion/${evaluation.id}/corregir`)}>
                          <Camera className="mr-2 h-4 w-4" /> Corregir con Cámara
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {evaluation.descripcion && (
              <p className="text-sm text-muted-foreground mb-4">{evaluation.descripcion}</p>
            )}
            {evaluation.aspectos_a_evaluar_ia && (
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
                <h3 className="font-semibold flex items-center text-blue-800 dark:text-blue-300"><BrainCircuit className="h-5 w-5 mr-2" /> Aspectos a Evaluar (IA)</h3>
                <p className="text-sm text-blue-700 dark:text-blue-300/90 mt-2">{evaluation.aspectos_a_evaluar_ia}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Contenido de la Evaluación</CardTitle>
                <CardDescription>Puntaje Total: {totalPuntaje} puntos</CardDescription>
              </div>
              {hasAnyAdaptation && (
                <div className="flex items-center space-x-2">
                  <Switch
                    id="pie-version-toggle"
                    checked={showPieVersion}
                    onCheckedChange={setShowPieVersion}
                  />
                  <Label htmlFor="pie-version-toggle">Mostrar Versión Adaptada (PIE)</Label>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-8">
            {(evaluation.evaluation_content_blocks || []).map(block => (
              <div key={block.id}>
                <div className="flex items-center text-lg font-semibold mb-4">
                  {block.block_type === 'text' || block.block_type === 'syllabus' ? <FileText className="mr-3 h-5 w-5" /> : <ImageIcon className="mr-3 h-5 w-5" />}
                  <h3>{block.title || `Sección ${block.orden}`}</h3>
                  {!block.visible_en_evaluacion && <Badge variant="outline" className="ml-3">Oculto para estudiantes</Badge>}
                </div>
                <div className="p-4 border rounded-md bg-muted/30">
                  {block.block_type === 'text' || block.block_type === 'syllabus' ? (
                    <p className="text-sm whitespace-pre-wrap">{block.content.text}</p>
                  ) : (
                    <img src={getPublicImageUrl(block.content.imageUrl)} alt={`Contenido de la sección ${block.orden}`} />
                  )}
                </div>
                <div className="mt-6 space-y-6">
                  {block.evaluacion_items.map(item => {
                    const adaptation = showPieVersion && item.tiene_adaptacion_pie && item.adaptaciones_pie?.[0];
                    const enunciado = adaptation ? adaptation.enunciado_adaptado : item.enunciado;
                    const alternativas = adaptation 
                      ? (adaptation.alternativas_adaptadas || []).sort((a, b) => a.orden - b.orden)
                      : (item.item_alternativas || []).sort((a, b) => a.orden - b.orden);

                    return (
                      <div key={item.id}>
                        <div className="flex justify-between items-start">
                          <p className="font-semibold" dangerouslySetInnerHTML={{ __html: `${item.orden}. ${enunciado.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')} (${item.puntaje || 0} pts.)` }} />
                          <Badge variant="outline">{item.puntaje} pts.</Badge>
                        </div>
                        {item.tipo_item === 'seleccion_multiple' && (
                          <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
                            {(alternativas || []).map((alt, index) => (
                              <li key={alt.id || index} className={cn("flex items-center", alt.es_correcta && "font-bold text-primary")}>
                                <span className="mr-2">{String.fromCharCode(97 + index)})</span>
                                <span>{alt.texto || ''}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    );
                  })}
                </div>
                <Separator className="my-8" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
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
      <AnswerKeyDialog
        isOpen={isAnswerKeyDialogOpen}
        onClose={() => setAnswerKeyDialogOpen(false)}
        evaluationId={evaluationId || null}
      />
    </>
  );
};

export default EvaluationDetailPage;