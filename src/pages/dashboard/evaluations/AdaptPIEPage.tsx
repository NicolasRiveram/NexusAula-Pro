import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Loader2, Sparkles, BrainCircuit, CheckCircle, Save } from 'lucide-react';
import { fetchEvaluationDetails, EvaluationDetail, EvaluationItem, generatePIEAdaptation, savePIEAdaptation } from '@/api/evaluationsApi';
import { showError, showSuccess, showLoading, dismissToast } from '@/utils/toast';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

const AdaptPIEPage = () => {
  const { evaluationId } = useParams<{ evaluationId: string }>();
  const navigate = useNavigate();
  const [evaluation, setEvaluation] = useState<EvaluationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [adaptingItems, setAdaptingItems] = useState<string[]>([]);
  const [showOriginal, setShowOriginal] = useState<Record<string, boolean>>({});
  const [modifiedItems, setModifiedItems] = useState<Record<string, any>>({});
  const [isSaving, setIsSaving] = useState(false);

  const loadEvaluation = useCallback(async () => {
    if (evaluationId) {
      try {
        const data = await fetchEvaluationDetails(evaluationId);
        setEvaluation(data);
      } catch (err: any) {
        showError(`Error al cargar la evaluación: ${err.message}`);
      } finally {
        setLoading(false);
      }
    }
  }, [evaluationId]);

  useEffect(() => {
    setLoading(true);
    loadEvaluation();
  }, [loadEvaluation]);

  const handleAdaptSelected = async () => {
    if (selectedItems.length === 0) return;

    setAdaptingItems(selectedItems);
    const itemsToAdapt = [...selectedItems];
    setSelectedItems([]);
    const toastId = showLoading(`Adaptando ${itemsToAdapt.length} pregunta(s)...`);

    try {
      const adaptationPromises = itemsToAdapt.map(async (itemId) => {
        const adaptationDataFromAI = await generatePIEAdaptation(itemId);
        return { itemId, adaptationData: adaptationDataFromAI };
      });

      const results = await Promise.all(adaptationPromises);

      setEvaluation(prevEval => {
        if (!prevEval) return null;
        const newEval = JSON.parse(JSON.stringify(prevEval));
        results.forEach(({ itemId, adaptationData }) => {
          for (const block of newEval.evaluation_content_blocks) {
            const itemIndex = block.evaluacion_items.findIndex((i: EvaluationItem) => i.id === itemId);
            if (itemIndex !== -1) {
              block.evaluacion_items[itemIndex].tiene_adaptacion_pie = true;
              block.evaluacion_items[itemIndex].adaptaciones_pie = [adaptationData];
              break;
            }
          }
        });
        return newEval;
      });

      const newModifications = results.reduce((acc, { itemId, adaptationData }) => {
        acc[itemId] = adaptationData;
        return acc;
      }, {} as Record<string, any>);

      setModifiedItems(prev => ({ ...prev, ...newModifications }));

      dismissToast(toastId);
      showSuccess(`${itemsToAdapt.length} pregunta(s) adaptada(s) localmente. Guarda los cambios para finalizar.`);
    } catch (error: any) {
      dismissToast(toastId);
      showError(`Error durante la adaptación: ${error.message}`);
    } finally {
      setAdaptingItems([]);
    }
  };

  const handleSaveChanges = async () => {
    const itemsToSave = Object.keys(modifiedItems);
    if (itemsToSave.length === 0) {
      navigate(`/dashboard/evaluacion/${evaluationId}`);
      return;
    }

    setIsSaving(true);
    const toastId = showLoading(`Guardando ${itemsToSave.length} adaptación(es)...`);
    try {
      const savePromises = itemsToSave.map(itemId => 
        savePIEAdaptation(itemId, modifiedItems[itemId])
      );
      await Promise.all(savePromises);
      dismissToast(toastId);
      showSuccess("Todas las adaptaciones han sido guardadas exitosamente.");
      setModifiedItems({});
      navigate(`/dashboard/evaluacion/${evaluationId}`);
    } catch (error: any) {
      dismissToast(toastId);
      showError(`Error al guardar los cambios: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const allItems = evaluation?.evaluation_content_blocks.flatMap(b => b.evaluacion_items || []) || [];

  if (loading) {
    return <div className="container mx-auto flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  if (!evaluation) {
    return <div className="container mx-auto"><p>Evaluación no encontrada.</p></div>;
  }

  return (
    <div className="container mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <Link to={`/dashboard/evaluacion/${evaluationId}`} className="flex items-center text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver sin Guardar
        </Link>
        <div className="flex gap-2">
          <Button onClick={handleAdaptSelected} disabled={selectedItems.length === 0 || adaptingItems.length > 0 || isSaving}>
            {adaptingItems.length > 0 ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
            Adaptar ({selectedItems.length}) Seleccionada(s)
          </Button>
          <Button onClick={handleSaveChanges} disabled={isSaving || adaptingItems.length > 0}>
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Guardar Cambios y Volver
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Adaptación para PIE: {evaluation.titulo}</CardTitle>
          <CardDescription>Selecciona las preguntas que deseas adaptar. La IA simplificará el enunciado y las alternativas.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {allItems.map(item => {
            const isAdapting = adaptingItems.includes(item.id);
            const adaptation = item.adaptaciones_pie && item.adaptaciones_pie[0];
            const isAdapted = item.tiene_adaptacion_pie && adaptation;
            const isShowingOriginal = showOriginal[item.id];

            const enunciadoToShow = isAdapted && !isShowingOriginal ? adaptation.enunciado_adaptado : item.enunciado;
            const alternativesToShow = isAdapted && !isShowingOriginal ? adaptation.alternativas_adaptadas : item.item_alternativas;

            return (
              <div key={item.id} className="p-4 border rounded-md">
                <div className="flex items-start gap-4">
                  <Checkbox
                    id={`item-${item.id}`}
                    checked={selectedItems.includes(item.id)}
                    onCheckedChange={(checked) => {
                      setSelectedItems(prev => checked ? [...prev, item.id] : prev.filter(id => id !== item.id));
                    }}
                    disabled={isAdapting || isAdapted}
                  />
                  <div className="flex-1">
                    <Label htmlFor={`item-${item.id}`} className="font-semibold flex items-center gap-2">
                      <span>{item.orden}.</span>
                      <span dangerouslySetInnerHTML={{ __html: enunciadoToShow.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                      {isAdapted && (
                        <Badge variant={isShowingOriginal ? "secondary" : "default"} className="ml-2">
                          {isShowingOriginal ? "Original" : "Adaptada"}
                        </Badge>
                      )}
                    </Label>
                    <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                      {(alternativesToShow || []).sort((a, b) => a.orden - b.orden).map((alt, index) => (
                        <li key={alt.id || index} className={cn(alt.es_correcta && "font-bold text-primary")}>
                          {String.fromCharCode(97 + index)}) {alt.texto || ''}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                
                <div className="flex justify-end items-center mt-2 h-8">
                  {isAdapting && <div className="flex items-center text-primary"><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Adaptando...</div>}
                  
                  {isAdapted && (
                    <Button variant="link" size="sm" onClick={() => setShowOriginal(prev => ({ ...prev, [item.id]: !prev[item.id] }))}>
                      {isShowingOriginal ? 'Ocultar Original' : 'Ver Original'}
                    </Button>
                  )}
                  
                  {!isAdapting && isAdapted && (
                    <div className="flex items-center text-green-600 text-sm font-medium">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Adaptada
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdaptPIEPage;