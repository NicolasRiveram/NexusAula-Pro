import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Download, Edit, Loader2, BrainCircuit, FileText, Image as ImageIcon, BarChart, Camera } from 'lucide-react';
import { fetchEvaluationDetails, EvaluationDetail, getPublicImageUrl } from '@/api/evaluationsApi';
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from '@/components/ui/label';

const EvaluationDetailPage = () => {
  const { evaluationId } = useParams<{ evaluationId: string }>();
  const navigate = useNavigate();
  const [evaluation, setEvaluation] = useState<EvaluationDetail | null>(null);
  const [teacherName, setTeacherName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { activeEstablishment } = useEstablishment();
  const [isPrintModalOpen, setPrintModalOpen] = useState(false);
  const [fontSize, setFontSize] = useState<'text-sm' | 'text-base' | 'text-lg'>('text-base');

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
            if (profileData) {
              setTeacherName(profileData.nombre_completo);
            }
          }
        })
        .catch(err => showError(`Error al cargar la evaluación: ${err.message}`))
        .finally(() => setLoading(false));
    }
  }, [evaluationId]);

  const handlePrintClick = () => {
    setPrintModalOpen(true);
  };

  const handleConfirmPrint = async () => {
    if (!evaluation || !activeEstablishment) return;

    const toastId = showLoading("Preparando evaluación para imprimir...");
    try {
      if (!evaluation.aspectos_a_evaluar_ia) {
        showError("Falta el resumen 'Aspectos a Evaluar'. Por favor, edita y finaliza la evaluación para generarlo.");
        dismissToast(toastId);
        setPrintModalOpen(false);
        return;
      }
      
      const totalPuntaje = (evaluation.evaluation_content_blocks || []).reduce((total, block) => {
        return total + block.evaluacion_items.reduce((blockTotal, item) => blockTotal + item.puntaje, 0);
      }, 0);
      const passingScore = totalPuntaje * 0.6;

      printComponent(
        <PrintableEvaluation 
          evaluation={evaluation} 
          establishment={activeEstablishment}
          fontSize={fontSize}
          teacherName={teacherName || 'Docente no especificado'}
          totalScore={totalPuntaje}
          passingScore={passingScore}
        />,
        `Evaluación: ${evaluation.titulo}`
      );

      dismissToast(toastId);
    } catch (error: any) {
      dismissToast(toastId);
      showError(`Error al preparar la impresión: ${error.message}`);
    } finally {
      setPrintModalOpen(false);
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

  const totalPuntaje = (evaluation.evaluation_content_blocks || []).reduce((total, block) => {
    return total + block.evaluacion_items.reduce((blockTotal, item) => blockTotal + item.puntaje, 0);
  }, 0);

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
                  Fecha de Aplicación: {format(parseISO(evaluation.fecha_aplicacion), "d 'de' LLLL, yyyy", { locale: es })}
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
                <Button variant="outline" onClick={handlePrintClick}><Download className="mr-2 h-4 w-4" /> Descargar</Button>
                <Button onClick={() => navigate(`/dashboard/evaluacion/editar/${evaluation.id}`)}><Edit className="mr-2 h-4 w-4" /> Editar</Button>
                <Button onClick={() => navigate(`/dashboard/evaluacion/${evaluation.id}/resultados`)}><BarChart className="mr-2 h-4 w-4" /> Ver Resultados</Button>
                {hasScannableQuestions && (
                  <Button onClick={() => navigate(`/dashboard/evaluacion/${evaluation.id}/corregir`)} variant="secondary">
                    <Camera className="mr-2 h-4 w-4" /> Corregir con Cámara
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          {evaluation.descripcion && (
            <CardContent>
              <p className="text-sm text-muted-foreground">{evaluation.descripcion}</p>
            </CardContent>
          )}
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contenido de la Evaluación</CardTitle>
            <CardDescription>Puntaje Total: {totalPuntaje} puntos</CardDescription>
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
                  {block.evaluacion_items.map(item => (
                    <div key={item.id}>
                      <div className="flex justify-between items-start">
                        <p className="font-semibold">{item.orden}. {item.enunciado}</p>
                        <Badge variant="outline">{item.puntaje} pts.</Badge>
                      </div>
                      {item.tipo_item === 'seleccion_multiple' && (
                        <ul className="mt-2 space-y-2 text-sm pl-5">
                          {item.item_alternativas.sort((a, b) => a.orden - b.orden).map((alt, index) => (
                            <li key={alt.id} className={cn("flex items-center", alt.es_correcta && "font-bold")}>
                              <span className="mr-2">{String.fromCharCode(97 + index)})</span>
                              <span>{alt.texto}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                      {item.tiene_adaptacion_pie && item.adaptaciones_pie[0] && (
                          <div className="mt-3 p-3 border rounded-md bg-blue-50 dark:bg-blue-900/20">
                              <h5 className="text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center mb-2">
                                  <BrainCircuit className="h-4 w-4 mr-2" /> VERSIÓN ADAPTADA (PIE)
                              </h5>
                              <p className="text-sm font-medium" dangerouslySetInnerHTML={{ __html: item.adaptaciones_pie[0].enunciado_adaptado.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                          </div>
                      )}
                    </div>
                  ))}
                </div>
                <Separator className="my-8" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
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
    </>
  );
};

export default EvaluationDetailPage;