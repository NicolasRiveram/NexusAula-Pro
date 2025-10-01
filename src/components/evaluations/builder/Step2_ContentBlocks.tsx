import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { PlusCircle, FileText, Trash2, Loader2, Sparkles, Edit, ChevronUp, BrainCircuit, Image as ImageIcon, ChevronsUpDown, BookCopy, CopyPlus, EyeOff } from 'lucide-react';
import { fetchContentBlocks, deleteContentBlock, EvaluationContentBlock, createContentBlock, generateQuestionsFromBlock, saveGeneratedQuestions, fetchItemsForBlock, EvaluationItem, generatePIEAdaptation, savePIEAdaptation, updateEvaluationItem, increaseQuestionDifficulty, getPublicImageUrl, fetchEvaluationContentForImport, updateContentBlock } from '@/api/evaluationsApi';
import { UnitPlan } from '@/api/planningApi';
import { showError, showSuccess, showLoading, dismissToast } from '@/utils/toast';
import AddTextBlockDialog from './AddTextBlockDialog';
import AddImageBlockDialog from './AddImageBlockDialog';
import EditQuestionDialog from './EditQuestionDialog';
import UseDidacticPlanDialog from './UseDidacticPlanDialog';
import UseExistingResourceDialog from './UseExistingResourceDialog';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface Step2ContentBlocksProps {
  evaluationId: string;
  evaluationTitle: string;
  onNextStep: () => void;
}

const QuestionItem: React.FC<{
  item: EvaluationItem;
  onEdit: (item: EvaluationItem) => void;
  onAdapt: (itemId: string) => void;
  onIncreaseDifficulty: (itemId: string) => void;
  isAdapting: boolean;
  isIncreasingDifficulty: boolean;
}> = ({ item, onEdit, onAdapt, onIncreaseDifficulty, isAdapting, isIncreasingDifficulty }) => {
  return (
    <div className="p-3 border rounded-md bg-background relative group">
      <div className="flex justify-between items-start">
        <p className="text-sm pr-12">{item.orden}. {item.enunciado}</p>
        <Badge variant="secondary">{item.puntaje} pts.</Badge>
      </div>
      {item.tipo_item === 'seleccion_multiple' && (
        <ul className="mt-2 space-y-1 text-xs pl-4 text-muted-foreground">
          {item.item_alternativas.sort((a, b) => a.orden - b.orden).map((alt, index) => (
            <li key={alt.id} className={cn("flex items-center", alt.es_correcta && "font-semibold text-foreground")}>
              <span className="mr-2">{String.fromCharCode(97 + index)})</span>
              <span>{alt.texto}</span>
            </li>
          ))}
        </ul>
      )}
      {item.tiene_adaptacion_pie && (
        <div className="mt-2 p-2 border-l-2 border-blue-500 bg-blue-50 dark:bg-blue-900/20">
          <p className="text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center">
            <BrainCircuit className="h-3 w-3 mr-1" /> Adaptación PIE generada
          </p>
        </div>
      )}
      <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(item)}><Edit className="h-4 w-4" /></Button>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onAdapt(item.id)} disabled={isAdapting}>
          {isAdapting ? <Loader2 className="h-4 w-4 animate-spin" /> : <BrainCircuit className="h-4 w-4" />}
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onIncreaseDifficulty(item.id)} disabled={isIncreasingDifficulty}>
          {isIncreasingDifficulty ? <Loader2 className="h-4 w-4 animate-spin" /> : <ChevronUp className="h-4 w-4" />}
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
  const [increasingDifficultyId, setIncreasingDifficultyId] = useState<string | null>(null);
  const [isAddTextDialogOpen, setAddTextDialogOpen] = useState(false);
  const [isAddImageDialogOpen, setAddImageDialogOpen] = useState(false);
  const [isUsePlanDialogOpen, setUsePlanDialogOpen] = useState(false);
  const [isUseResourceDialogOpen, setUseResourceDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<EvaluationItem | null>(null);
  const [expandedBlocks, setExpandedBlocks] = useState<Record<string, boolean>>({});
  const [questionQuantities, setQuestionQuantities] = useState<Record<string, number>>({});

  const toggleBlockExpansion = (blockId: string) => {
    setExpandedBlocks(prev => ({ ...prev, [blockId]: !prev[blockId] }));
  };

  const loadBlocksAndQuestions = useCallback(async () => {
    setLoading(true);
    try {
      const blockData = await fetchContentBlocks(evaluationId);
      setBlocks(blockData);
      
      const questionsPromises = blockData.map(block => fetchItemsForBlock(block.id));
      const questionsResults = await Promise.all(questionsPromises);
      
      const questionsMap: Record<string, EvaluationItem[]> = {};
      const initialExpansionState: Record<string, boolean> = {};
      blockData.forEach((block, index) => {
        questionsMap[block.id] = questionsResults[index];
        initialExpansionState[block.id] = true;
      });
      setQuestionsByBlock(questionsMap);
      setExpandedBlocks(initialExpansionState);

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
    const quantity = questionQuantities[block.id] || 2;
    if (quantity < 1 || quantity > 10) {
        showError("Por favor, ingresa un número de preguntas entre 1 y 10.");
        return;
    }
    setGeneratingForBlock(block.id);
    try {
        const generatedQuestions = await generateQuestionsFromBlock(block, quantity);
        const totalItemsInEvaluation = Object.values(questionsByBlock).flat().length;
        await saveGeneratedQuestions(evaluationId, block.id, generatedQuestions, totalItemsInEvaluation);
        showSuccess(`Se generaron ${generatedQuestions.length} preguntas para el bloque.`);
        loadBlocksAndQuestions();
    } catch (error: any) {
        showError(error.message);
    } finally {
        setGeneratingForBlock(null);
    }
  };

  const handleVisibilityChange = async (block: EvaluationContentBlock, newVisibility: boolean) => {
    const originalVisibility = block.visible_en_evaluacion;
    // Optimistic UI update
    setBlocks(prev => prev.map(b => b.id === block.id ? { ...b, visible_en_evaluacion: newVisibility } : b));
    try {
        await updateContentBlock(block.id, { visible_en_evaluacion: newVisibility });
    } catch (error: any) {
        showError(`Error al actualizar la visibilidad: ${error.message}`);
        // Revert on error
        setBlocks(prev => prev.map(b => b.id === block.id ? { ...b, visible_en_evaluacion: originalVisibility } : b));
    }
  };

  const handleAdaptPIE = async (itemId: string) => {
    setAdaptingItemId(itemId);
    try {
      const adaptation = await generatePIEAdaptation(itemId);
      await savePIEAdaptation(itemId, adaptation);
      showSuccess("Adaptación PIE generada y guardada.");
      loadBlocksAndQuestions();
    } catch (error: any) {
      showError(error.message);
    } finally {
      setAdaptingItemId(null);
    }
  };

  const handleIncreaseDifficulty = async (itemId: string) => {
    setIncreasingDifficultyId(itemId);
    try {
      await increaseQuestionDifficulty(itemId);
      showSuccess("La pregunta ha sido actualizada con mayor dificultad.");
      loadBlocksAndQuestions();
    } catch (error: any) {
      showError(error.message);
    } finally {
      setIncreasingDifficultyId(null);
    }
  };

  const handleEditSave = async (item: EvaluationItem, data: any) => {
    try {
      await updateEvaluationItem(item.id, data);
      showSuccess("Pregunta actualizada.");
      setEditingItem(null);
      loadBlocksAndQuestions();
    } catch (error: any) {
      showError(`Error al guardar: ${error.message}`);
    }
  };

  const handlePlanSelected = async (plan: UnitPlan) => {
    const toastId = showLoading("Creando bloque desde el plan...");
    try {
      const contentText = `Contenido de la unidad: ${plan.titulo}\n\n${plan.descripcion_contenidos}`;
      await createContentBlock(
        evaluationId,
        'text',
        { text: contentText },
        blocks.length + 1,
        `Unidad: ${plan.titulo}`
      );
      showSuccess("Bloque de contenido creado desde el plan didáctico.");
      loadBlocksAndQuestions();
    } catch (error: any) {
      showError(`Error al crear el bloque: ${error.message}`);
    } finally {
      dismissToast(toastId);
    }
  };

  const handleResourceSelected = async (resourceId: string) => {
    const toastId = showLoading("Importando contenido del recurso...");
    try {
      const blocksToImport = await fetchEvaluationContentForImport(resourceId);
      if (blocksToImport.length === 0) {
        showError("El recurso seleccionado no tiene contenido para importar.");
        dismissToast(toastId);
        return;
      }

      const createBlockPromises = blocksToImport.map((block, index) =>
        createContentBlock(
          evaluationId,
          block.block_type,
          block.content,
          blocks.length + index + 1,
          block.title
        )
      );
      await Promise.all(createBlockPromises);

      showSuccess(`Se importaron ${blocksToImport.length} bloques de contenido.`);
      loadBlocksAndQuestions();
    } catch (error: any) {
      showError(`Error al importar el recurso: ${error.message}`);
    } finally {
      dismissToast(toastId);
    }
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Bloques de Contenido para "{evaluationTitle}"</h3>
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => setAddTextDialogOpen(true)}><PlusCircle className="mr-2 h-4 w-4" /> Añadir Temario/Texto</Button>
        <Button onClick={() => setAddImageDialogOpen(true)}><ImageIcon className="mr-2 h-4 w-4" /> Añadir Imagen</Button>
        <Button onClick={() => setUsePlanDialogOpen(true)} variant="outline"><BookCopy className="mr-2 h-4 w-4" /> Usar Plan Didáctico</Button>
        <Button onClick={() => setUseResourceDialogOpen(true)} variant="outline"><CopyPlus className="mr-2 h-4 w-4" /> Reutilizar Recurso</Button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-24"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : blocks.length > 0 ? (
        <div className="space-y-6">
          {blocks.map(block => (
            <div key={block.id}>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between cursor-pointer" onClick={() => toggleBlockExpansion(block.id)}>
                  <div className="flex items-center">
                    {block.block_type === 'text' ? <FileText className="mr-3 h-5 w-5 text-muted-foreground" /> : <ImageIcon className="mr-3 h-5 w-5 text-muted-foreground" />}
                    <div>
                      <CardTitle className="text-base">{block.title || `Bloque de ${block.block_type === 'text' ? 'Texto' : 'Imagen'} #${block.orden}`}</CardTitle>
                      <CardDescription>
                        {questionsByBlock[block.id]?.length || 0} preguntas generadas. Haz clic para {expandedBlocks[block.id] ? 'ocultar' : 'mostrar'}.
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleDeleteBlock(block.id); }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    <ChevronsUpDown className={cn("h-4 w-4 text-muted-foreground transition-transform", expandedBlocks[block.id] && "rotate-180")} />
                  </div>
                </CardHeader>
              </Card>
              {expandedBlocks[block.id] && (
                <div className="pl-6 border-l-2 border-primary ml-4 space-y-3 py-4 mt-2">
                  <div className="p-4 border rounded-md bg-muted/30 space-y-4">
                    {block.block_type === 'text' ? (
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{block.content.text}</p>
                    ) : (
                        <div>
                            <img src={getPublicImageUrl(block.content.imageUrl)} alt={block.title || `Bloque ${block.orden}`} className="rounded-md max-h-60 object-contain mx-auto" />
                            {block.content.context && <p className="text-xs text-muted-foreground italic mt-2 text-center">Contexto: {block.content.context}</p>}
                        </div>
                    )}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                            <Switch
                                id={`visible-${block.id}`}
                                checked={block.visible_en_evaluacion}
                                onCheckedChange={(checked) => handleVisibilityChange(block, checked)}
                            />
                            <Label htmlFor={`visible-${block.id}`} className="text-xs text-muted-foreground flex items-center">
                                {block.visible_en_evaluacion ? 'Visible para estudiantes' : <><EyeOff className="h-3 w-3 mr-1"/> Oculto para estudiantes</>}
                            </Label>
                        </div>
                        <div className="flex items-center gap-2">
                            <Label htmlFor={`quantity-${block.id}`} className="text-sm">N° de preguntas:</Label>
                            <Input
                                id={`quantity-${block.id}`}
                                type="number"
                                min="1"
                                max="10"
                                className="w-16 h-8"
                                value={questionQuantities[block.id] || 2}
                                onChange={(e) => setQuestionQuantities(prev => ({ ...prev, [block.id]: parseInt(e.target.value, 10) }))}
                            />
                            <Button onClick={() => handleGenerateQuestions(block)} disabled={generatingForBlock === block.id} size="sm">
                                {generatingForBlock === block.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                                <span className="ml-2">Generar</span>
                            </Button>
                        </div>
                    </div>
                  </div>
                  {questionsByBlock[block.id] && questionsByBlock[block.id].length > 0 ? (
                    questionsByBlock[block.id].map(item => (
                      <QuestionItem
                        key={item.id}
                        item={item}
                        onEdit={setEditingItem}
                        onAdapt={handleAdaptPIE}
                        onIncreaseDifficulty={handleIncreaseDifficulty}
                        isAdapting={adaptingItemId === item.id}
                        isIncreasingDifficulty={increasingDifficultyId === item.id}
                      />
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground text-center pt-4">Aún no hay preguntas para este bloque.</p>
                  )}
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
        <Button onClick={onNextStep} disabled={blocks.length === 0}>Continuar a Configuración Final</Button>
      </div>

      <AddTextBlockDialog isOpen={isAddTextDialogOpen} onClose={() => setAddTextDialogOpen(false)} onBlockCreated={loadBlocksAndQuestions} evaluationId={evaluationId} currentOrder={blocks.length + 1} />
      <AddImageBlockDialog isOpen={isAddImageDialogOpen} onClose={() => setAddImageDialogOpen(false)} onBlockCreated={loadBlocksAndQuestions} evaluationId={evaluationId} currentOrder={blocks.length + 1} />
      <UseDidacticPlanDialog isOpen={isUsePlanDialogOpen} onClose={() => setUsePlanDialogOpen(false)} onPlanSelected={handlePlanSelected} />
      <UseExistingResourceDialog isOpen={isUseResourceDialogOpen} onClose={() => setUseResourceDialogOpen(false)} onResourceSelected={handleResourceSelected} currentEvaluationId={evaluationId} />
      <EditQuestionDialog isOpen={!!editingItem} onClose={() => setEditingItem(null)} onSave={handleEditSave} item={editingItem} />
    </div>
  );
};

export default Step2ContentBlocks;