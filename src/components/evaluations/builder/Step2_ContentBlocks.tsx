import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, FileText, Trash2, Loader2, Sparkles, Edit, ChevronUp, BrainCircuit, Image as ImageIcon } from 'lucide-react';
import { fetchContentBlocks, deleteContentBlock, EvaluationContentBlock, generateQuestionsFromBlock, saveGeneratedQuestions, fetchItemsForBlock, EvaluationItem, generatePIEAdaptation, savePIEAdaptation } from '@/api/evaluationsApi';
import { showError, showSuccess } from '@/utils/toast';
import AddTextBlockDialog from './AddTextBlockDialog';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface Step2ContentBlocksProps {
  evaluationId: string;
  evaluationTitle: string;
  onNextStep: () => void;
}

const QuestionItem = ({ item, onAdaptPIE, isAdapting }: { item: EvaluationItem, onAdaptPIE: (itemId: string) => void, isAdapting: boolean }) => {
    const adaptation = item.adaptaciones_pie && item.adaptaciones_pie[0];

    return (
        <div className="p-3 border rounded-md bg-background">
            <p className="text-sm font-medium">{item.orden}. {item.enunciado}</p>
            {item.tipo_item === 'seleccion_multiple' && (
                <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                    {item.item_alternativas.map((alt, index) => (
                        <li key={alt.id} className={cn(alt.es_correcta && "font-semibold text-primary")}>
                            {String.fromCharCode(97 + index)}) {alt.texto}
                        </li>
                    ))}
                </ul>
            )}

            {adaptation && (
                <div className="mt-3 p-3 border rounded-md bg-blue-50 dark:bg-blue-900/20">
                    <h5 className="text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center mb-2">
                        <BrainCircuit className="h-4 w-4 mr-2" /> VERSIÓN ADAPTADA (PIE)
                    </h5>
                    <p className="text-sm font-medium" dangerouslySetInnerHTML={{ __html: adaptation.enunciado_adaptado.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                    {item.tipo_item === 'seleccion_multiple' && (
                        <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                            {adaptation.alternativas_adaptadas.map((alt, index) => (
                                <li key={index} className={cn(alt.es_correcta && "font-semibold text-primary")}>
                                    {String.fromCharCode(97 + index)}) {alt.texto}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}

            <div className="flex items-center justify-end gap-2 mt-2">
                <Badge variant="outline" className="capitalize">{item.tipo_item.replace('_', ' ')}</Badge>
                <Button variant="ghost" size="sm" disabled><Edit className="h-3 w-3 mr-1" /> Editar</Button>
                <Button variant="ghost" size="sm" disabled><ChevronUp className="h-3 w-3 mr-1" /> Subir Dificultad</Button>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onAdaptPIE(item.id)}
                    disabled={isAdapting || item.tiene_adaptacion_pie}
                    className={cn(
                        item.tiene_adaptacion_pie && "text-green-600 dark:text-green-500 hover:text-green-700 dark:hover:text-green-600"
                    )}
                >
                    {isAdapting ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <BrainCircuit className="h-3 w-3 mr-1" />}
                    {item.tiene_adaptacion_pie ? 'Adaptada' : 'Adaptar PIE'}
                </Button>
            </div>
        </div>
    );
};

const Step2ContentBlocks: React.FC<Step2ContentBlocksProps> = ({ evaluationId, evaluationTitle, onNextStep }) => {
  const [blocks, setBlocks] = useState<EvaluationContentBlock[]>([]);
  const [questionsByBlock, setQuestionsByBlock] = useState<Record<string, EvaluationItem[]>>({});
  const [loading, setLoading] = useState(true);
  const [generatingForBlock, setGeneratingForBlock] = useState<string | null>(null);
  const [adaptingItemId, setAdaptingItemId] = useState<string | null>(null);
  const [isAddTextDialogOpen, setAddTextDialogOpen] = useState(false);

  const loadBlocksAndQuestions = useCallback(async () => {
    setLoading(true);
    try {
      const blockData = await fetchContentBlocks(evaluationId);
      setBlocks(blockData);
      
      const questionsPromises = blockData.map(block => fetchItemsForBlock(block.id));
      const questionsResults = await Promise.all(questionsPromises);
      
      const questionsMap: Record<string, EvaluationItem[]> = {};
      blockData.forEach((block, index) => {
        questionsMap[block.id] = questionsResults[index];
      });
      setQuestionsByBlock(questionsMap);

    } catch (error: any) {
      showError(`Error al cargar bloques y preguntas: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [evaluationId]);

  useEffect(() => {
    loadBlocksAndQuestions();
  }, [loadBlocksAndQuestions]);

  const handleDeleteBlock = async (blockId: string) => {
    try {
      await deleteContentBlock(blockId);
      showSuccess("Bloque eliminado.");
      loadBlocksAndQuestions();
    } catch (error: any) {
      showError(`Error al eliminar el bloque: ${error.message}`);
    }
  };

  const handleGenerateQuestions = async (block: EvaluationContentBlock) => {
    setGeneratingForBlock(block.id);
    try {
        const generatedQuestions = await generateQuestionsFromBlock(block);
        const totalItemsInEvaluation = Object.values(questionsByBlock).flat().length;

        await saveGeneratedQuestions(evaluationId, block.id, generatedQuestions, totalItemsInEvaluation);
        showSuccess(`Se generaron ${generatedQuestions.length} preguntas para el bloque.`);
        
        const newQuestions = await fetchItemsForBlock(block.id);
        setQuestionsByBlock(prev => ({ ...prev, [block.id]: newQuestions }));

    } catch (error: any) {
        showError(error.message);
    } finally {
        setGeneratingForBlock(null);
    }
  };

  const handleAdaptPIE = async (itemId: string) => {
    setAdaptingItemId(itemId);
    try {
        const adaptationData = await generatePIEAdaptation(itemId);
        await savePIEAdaptation(itemId, adaptationData);
        showSuccess("Pregunta adaptada para PIE exitosamente.");
        loadBlocksAndQuestions(); // Recargar para mostrar la adaptación
    } catch (error: any) {
        showError(`Error al adaptar la pregunta: ${error.message}`);
    } finally {
        setAdaptingItemId(null);
    }
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Bloques de Contenido para "{evaluationTitle}"</h3>
      <div className="flex gap-2">
        <Button onClick={() => setAddTextDialogOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" /> Añadir Temario/Texto
        </Button>
        <Button disabled>
          <ImageIcon className="mr-2 h-4 w-4" /> Añadir Imagen (Próximamente)
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-24">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : blocks.length > 0 ? (
        <div className="space-y-6">
          {blocks.map(block => (
            <div key={block.id}>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div className="flex items-center">
                    <FileText className="mr-3 h-5 w-5 text-muted-foreground" />
                    <div>
                      <CardTitle className="text-base">Bloque de Texto</CardTitle>
                      <CardDescription>Orden: {block.orden}</CardDescription>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => handleDeleteBlock(block.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap line-clamp-4">{block.content.text}</p>
                  <div className="flex justify-end mt-4">
                    <Button onClick={() => handleGenerateQuestions(block)} disabled={generatingForBlock === block.id}>
                      {generatingForBlock === block.id ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
                      Generar Preguntas
                    </Button>
                  </div>
                </CardContent>
              </Card>
              {questionsByBlock[block.id] && questionsByBlock[block.id].length > 0 && (
                <div className="pl-6 border-l-2 border-primary ml-4 space-y-3 py-4 mt-2">
                  <h4 className="font-semibold text-sm">Preguntas Generadas:</h4>
                  {questionsByBlock[block.id].map(item => (
                    <QuestionItem 
                        key={item.id} 
                        item={item} 
                        onAdaptPIE={handleAdaptPIE}
                        isAdapting={adaptingItemId === item.id}
                    />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <h3 className="text-xl font-semibold">Sin contenido</h3>
          <p className="text-muted-foreground mt-2">Añade tu primer bloque de contenido para empezar a generar preguntas.</p>
        </div>
      )}

      <div className="flex justify-end pt-4">
        <Button onClick={onNextStep} disabled={blocks.length === 0}>
          Continuar a Revisión Final
        </Button>
      </div>

      <AddTextBlockDialog
        isOpen={isAddTextDialogOpen}
        onClose={() => setAddTextDialogOpen(false)}
        onBlockCreated={loadBlocksAndQuestions}
        evaluationId={evaluationId}
        currentOrder={blocks.length + 1}
      />
    </div>
  );
};

export default Step2ContentBlocks;