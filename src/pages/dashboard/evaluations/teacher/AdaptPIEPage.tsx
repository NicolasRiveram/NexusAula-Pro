import React, { useState, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Loader2, Sparkles, BrainCircuit, CheckCircle, Save } from 'lucide-react';
import { fetchEvaluationDetails, EvaluationDetail, EvaluationItem, generatePIEAdaptation, savePIEAdaptation } from '@/api/evaluationsApi';
import { showError, showSuccess } from '@/utils/toast';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const AdaptPIEPage = () => {
  const { evaluationId } = useParams<{ evaluationId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [showOriginal, setShowOriginal] = useState<Record<string, boolean>>({});
  const [modifiedItems, setModifiedItems] = useState<Record<string, any>>({});

  const { data: evaluation, isLoading: loading } = useQuery({
    queryKey: ['evaluationDetailsForPIE', evaluationId],
    queryFn: () => fetchEvaluationDetails(evaluationId!),
    enabled: !!evaluationId,
    onError: (err: any) => showError(`Error al cargar la evaluación: ${err.message}`),
  });

  const adaptMutation = useMutation({
    mutationFn: async (itemIds: string[]) => {
      const adaptationPromises = itemIds.map(async (itemId) => {
        const adaptationDataFromAI = await generatePIEAdaptation(itemId);
        return { itemId, adaptationData: adaptationDataFromAI };
      });
      return await Promise.all(adaptationPromises);
    },
    onSuccess: (results) => {
      const newModifications = results.reduce((acc, { itemId, adaptationData }) => {
        acc[itemId] = adaptationData;
        return acc;
      }, {} as Record<string, any>);
      setModifiedItems(prev => ({ ...prev, ...newModifications }));
      
      queryClient.setQueryData(['evaluationDetailsForPIE', evaluationId], (oldData: EvaluationDetail | undefined) => {
        if (!oldData) return oldData;
        const newEval = JSON.parse(JSON.stringify(oldData));
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

      showSuccess(`${results.length} pregunta(s) adaptada(s) localmente. Guarda los cambios para finalizar.`);
      setSelectedItems([]);
    },
    onError: (error: any) => {
      showError(`Error durante la adaptación: ${error.message}`);
    }
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const itemsToSave = Object.keys(modifiedItems);
      if (itemsToSave.length === 0) return;
      const savePromises = itemsToSave.map(itemId => 
        savePIEAdaptation(itemId, modifiedItems[itemId])
      );
      await Promise.all(savePromises);
    },
    onSuccess: () => {
      showSuccess("Todas las adaptaciones han sido guardadas exitosamente.");
      setModifiedItems({});
      navigate(`/dashboard/evaluacion/${evaluationId}`);
    },
    onError: (error: any) => {
      showError(`Error al guardar los cambios: ${error.message}`);
    }
  });

  const handleAdaptSelected = () => {
    if (selectedItems.length > 0) {
      adaptMutation.mutate(selectedItems);
    }
  };

  const handleSaveChanges = () => {
    if (Object.keys(modifiedItems).length > 0) {
      saveMutation.mutate();
    } else {
      navigate(`/dashboard/evaluacion/${evaluationId}`);
    }
  };

  const allItems = evaluation?.evaluation_content_blocks.flatMap(b => b.evaluacion_items || []) || [];
  const totalQuestions = allItems.length;
  const adaptedQuestions = allItems.filter(item => item.tiene_adaptacion_pie).length;

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
          <Button onClick={handleAdaptSelected} disabled={selectedItems.length === 0 || adaptMutation.isPending || saveMutation.isPending}>
            {adaptMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
            Adaptar ({selectedItems.length}) Seleccionada(s)
          </Button>
          <Button onClick={handleSaveChanges} disabled={saveMutation.isPending || adaptMutation.isPending}>
            {saveMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Guardar Cambios y Volver
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Adaptación para PIE: {evaluation.titulo}</CardTitle>
          <CardDescription>
            Selecciona las preguntas que deseas adaptar. La IA simplificará el enunciado y las alternativas.
            <br />
            <span className="font-semibold">{adaptedQuestions} de {totalQuestions} preguntas ya han sido adaptadas.</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {allItems.map(item => {
            const isAdapting = adaptMutation.isPending && selectedItems.includes(item.id);
            const adaptation = item.adaptaciones_pie && item.adaptaciones_pie[0];
            const isAdapted = item.tiene_adaptacion_pie && adaptation;
            const isShowingOriginal = showOriginal[item.id];

            const enunciadoToShow = isAdapted && !isShowingOriginal ? adaptation.enunciado_adaptado : item.enunciado;
            const alternativesToShow = isAdapted && !isShowingOriginal 
              ? adaptation.alternativas_adaptadas 
              : (item.item_alternativas || []).sort((a, b) => a.orden - b.orden);

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
                      {(alternativesToShow || []).map((alt, index) => (
                        <li key={alt.id || index} className={cn("flex items-center", alt.es_correcta && "font-bold text-primary")}>
                          <span className="mr-2">{String.fromCharCode(97 + index)})</span>
                          <span>{alt.texto || ''}</span>
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