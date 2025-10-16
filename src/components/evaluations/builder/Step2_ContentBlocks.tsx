import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, FileText, Trash2, Loader2, Sparkles, Edit, ChevronUp, BrainCircuit, Image as ImageIcon, ChevronsUpDown, BookCopy, CopyPlus, GripVertical, ClipboardList, Copy, ChevronDown } from 'lucide-react';
import { fetchContentBlocks, deleteContentBlock, EvaluationContentBlock, createContentBlock, generateQuestionsFromBlock, saveGeneratedQuestions, fetchItemsForBlock, EvaluationItem, generatePIEAdaptation, savePIEAdaptation, updateEvaluationItem, increaseQuestionDifficulty, getPublicImageUrl, fetchEvaluationContentForImport, updateContentBlock, reorderContentBlocks, updateEvaluationItemDetails, deleteEvaluationItem, decreaseQuestionDifficulty } from '@/api/evaluationsApi';
import { UnitPlan } from '@/api/planningApi';
import { showError, showSuccess, showLoading, dismissToast } from '@/utils/toast';
import AddTextBlockDialog from './AddTextBlockDialog';
import AddImageBlockDialog from './AddImageBlockDialog';
import EditQuestionDialog from './EditQuestionDialog';
import AddQuestionDialog from './AddQuestionDialog';
import UseDidacticPlanDialog from './UseDidacticPlanDialog';
import UseExistingResourceDialog from './UseExistingResourceDialog';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import AddSyllabusBlockDialog from './AddSyllabusBlockDialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface Step2ContentBlocksProps {
  evaluationId: string;
  evaluationTitle: string;
  onNextStep: () => void;
  temario: string;
  getEvaluationContext: () => string | undefined;
}

interface QuestionItemProps {
  item: EvaluationItem;
  onAdaptPIE: (itemId: string) => void;
  onEdit: (item: EvaluationItem) => void;
  onIncreaseDifficulty: (itemId: string) => void;
  onDecreaseDifficulty: (itemId: string) => void;
  onScoreChange: (itemId: string, newScore: number) => void;
  onDelete: (itemId: string) => void;
  isAdapting: boolean;
  isIncreasingDifficulty: boolean;
  isDecreasingDifficulty: boolean;
}

const QuestionItem = ({ item, onAdaptPIE, onEdit, onIncreaseDifficulty, onDecreaseDifficulty, onScoreChange, onDelete, isAdapting, isIncreasingDifficulty, isDecreasingDifficulty }: QuestionItemProps) => {
    const adaptation = item.adaptaciones_pie && item.adaptaciones_pie[0];
    const [localScore, setLocalScore] = useState(item.puntaje);

    useEffect(() => {
        setLocalScore(item.puntaje);
    }, [item.puntaje]);

    const handleScoreBlur = () => {
        const newScore = Number(localScore);
        if (newScore !== item.puntaje && !isNaN(newScore) && newScore >= 0) {
            onScoreChange(item.id, newScore);
        } else {
            setLocalScore(item.puntaje); // Revert if invalid
        }
    };

    return (
        <div className="p-3 border rounded-md bg-background">
            <div className="flex justify-between items-start">
                <p className="text-sm font-medium flex-1 pr-4">{item.orden}. {item.enunciado}</p>
                <div className="flex items-center gap-1">
                    <Input
                        type="number"
                        value={localScore}
                        onChange={(e) => setLocalScore(Number(e.target.value))}
                        onBlur={handleScoreBlur}
                        className="w-16 h-8 text-center"
                    />
                    <span className="text-sm text-muted-foreground">pts.</span>
                </div>
            </div>
            {item.tipo_item === 'seleccion_multiple' && (
                <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                    {item.item_alternativas.sort((a, b) => a.orden - b.orden).map((alt, index) => (
                        <li key={alt.id} className={cn(alt.es_correcta && "font-semibold text-primary")}>
                            {String.fromCharCode(97 + index)}) {alt.texto}
                        </li>
                    ))}
                </ul>
            )}
            {item.tipo_item === 'verdadero_falso' && (
                <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                    {item.item_alternativas.sort((a, b) => a.orden - b.orden).map(alt => (
                        <li key={alt.id} className={cn(alt.es_correcta && "font-semibold text-primary")}>
                            {alt.texto}
                        </li>
                    ))}
                </ul>
            )}
            {item.tipo_item === 'desarrollo' && (
                <div className="mt-2 p-2 border-dashed border rounded-md text-sm text-muted-foreground">
                    Respuesta abierta
                </div>
            )}

            {adaptation && (
                <div className="mt-3 p-3 border rounded-md bg-blue-50 dark:bg-blue-900/20">
                    <h5 className="text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center mb-2">
                        <BrainCircuit className="h-4 w-4 mr-2" /> VERSIÓN ADAPTADA (PIE)
                    </h5>
                    <p className="text-sm font-medium" dangerouslySetInnerHTML={{ __html: adaptation.enunciado_adaptado.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                    {item.tipo_item === 'seleccion_multiple' && adaptation.alternativas_adaptadas && (
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

            <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-2">
                    {item.habilidad_evaluada && <Badge variant="secondary">{item.habilidad_evaluada}</Badge>}
                    {item.nivel_comprension && <Badge variant="outline">{item.nivel_comprension}</Badge>}
                </div>
                <div className="flex items-center gap-2">
                    <Badge variant="outline" className="capitalize">{item.tipo_item.replace(/_/g, ' ')}</Badge>
                    {item.tipo_item === 'seleccion_multiple' && (
                        <>
                            <Button variant="ghost" size="sm" onClick={() => onEdit(item)}><Edit className="h-3 w-3 mr-1" /> Editar</Button>
                            <Button variant="ghost" size="sm" onClick={() => onIncreaseDifficulty(item.id)} disabled={isIncreasingDifficulty}>
                                {isIncreasingDifficulty ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <ChevronUp className="h-3 w-3 mr-1" />}
                                Subir Dificultad
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => onDecreaseDifficulty(item.id)} disabled={isDecreasingDifficulty}>
                                {isDecreasingDifficulty ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <ChevronDown className="h-3 w-3 mr-1" />}
                                Bajar Dificultad
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => onAdaptPIE(item.id)} disabled={isAdapting || item.tiene_adaptacion_pie} className={cn(item.tiene_adaptacion_pie && "text-green-600 dark:text-green-500 hover:text-green-700 dark:hover:text-green-600")}>
                                {isAdapting ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <BrainCircuit className="h-3 w-3 mr-1" />}
                                {item.tiene_adaptacion_pie ? 'Adaptada' : 'Adaptar PIE'}
                            </Button>
                        </>
                    )}
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onDelete(item.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                </div>
            </div>
        </div>
    );
};

function SortableItem({ id, children }: { id: string, children: (props: any) => React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 100 : 'auto',
  };
  return children({ ref: setNodeRef, style, attributes, listeners });
}

const Step2ContentBlocks: React.FC<Step2ContentBlocksProps> = ({ evaluationId, evaluationTitle, onNextStep, temario, getEvaluationContext }) => {
  const [blocks, setBlocks] = useState<EvaluationContentBlock[]>([]);
  const [questionsByBlock, setQuestionsByBlock] = useState<Record<string, EvaluationItem[]>>({});
  const [loading, setLoading] = useState(true);
  const [generatingForBlock, setGeneratingForBlock] = useState<string | null>(null);
  const [adaptingItemId, setAdaptingItemId] = useState<string | null>(null);
  const [increasingDifficultyId, setIncreasingDifficultyId] = useState<string | null>(null);
  const [decreasingDifficultyId, setDecreasingDifficultyId] = useState<string | null>(null);
  const [isAddTextDialogOpen, setAddTextDialogOpen] = useState(false);
  const [isAddSyllabusDialogOpen, setAddSyllabusDialogOpen] = useState(false);
  const [isAddImageDialogOpen, setAddImageDialogOpen] = useState(false);
  const [isAddQuestionDialogOpen, setAddQuestionDialogOpen] = useState(false);
  const [isUsePlanDialogOpen, setUsePlanDialogOpen] = useState(false);
  const [isUseResourceDialogOpen, setUseResourceDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<EvaluationItem | null>(null);
  const [editingBlock, setEditingBlock] = useState<EvaluationContentBlock | null>(null);
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null);
  const [expandedBlocks, setExpandedBlocks] = useState<Record<string, boolean>>({});
  const [questionCounts, setQuestionCounts] = useState<Record<string, number>>({});

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

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

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
        setBlocks((items) => {
            const oldIndex = items.findIndex((item) => item.id === active.id);
            const newIndex = items.findIndex((item) => item.id === over.id);
            const newOrder = arrayMove(items, oldIndex, newIndex);
            
            const blockIds = newOrder.map(b => b.id);
            
            reorderContentBlocks(blockIds).catch(err => {
                showError(`Error al reordenar: ${err.message}`);
                loadBlocksAndQuestions(); 
            });

            return newOrder;
        });
    }
  };

  const handleTitleChange = async (blockId: string, newTitle: string) => {
    setBlocks(prevBlocks => 
        prevBlocks.map(b => b.id === blockId ? { ...b, title: newTitle } : b)
    );
    try {
        await updateContentBlock(blockId, { title: newTitle });
    } catch (error: any) {
        showError(`Error al guardar el título: ${error.message}`);
        loadBlocksAndQuestions(); 
    }
  };

  const handleVisibilityChange = async (blockId: string, newVisibility: boolean) => {
    setBlocks(prevBlocks => 
        prevBlocks.map(b => b.id === blockId ? { ...b, visible_en_evaluacion: newVisibility } : b)
    );
    try {
        await updateContentBlock(blockId, { visible_en_evaluacion: newVisibility });
        showSuccess("Visibilidad del bloque actualizada.");
    } catch (error: any) {
        showError(`Error al actualizar la visibilidad: ${error.message}`);
        loadBlocksAndQuestions(); 
    }
  };

  const handleDeleteBlock = async (blockId: string) => {
    try {
      await deleteContentBlock(blockId);
      showSuccess("Bloque eliminado.");
      loadBlocksAndQuestions();
    } catch (error: any) {
      showError(`Error al eliminar el bloque: ${error.message}`);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!window.confirm("¿Estás seguro de que quieres eliminar esta pregunta? Esta acción no se puede deshacer.")) {
      return;
    }
    const toastId = showLoading("Eliminando pregunta...");
    try {
      await deleteEvaluationItem(itemId);
      showSuccess("Pregunta eliminada.");
      loadBlocksAndQuestions();
    } catch (error: any) {
      showError(error.message);
    } finally {
      dismissToast(toastId);
    }
  };

  const handleGenerateQuestions = async (block: EvaluationContentBlock, count: number) => {
    setGeneratingForBlock(block.id);
    try {
        const evaluationContext = getEvaluationContext();
        const generatedQuestions = await generateQuestionsFromBlock(block, count, evaluationContext);
        await saveGeneratedQuestions(evaluationId, block.id, generatedQuestions);
        showSuccess(`Se generaron ${generatedQuestions.length} preguntas para el bloque.`);
        loadBlocksAndQuestions();
    } catch (error: any) {
        showError(error.message);
    } finally {
        setGeneratingForBlock(null);
    }
  };

  const handleAddManualQuestion = (blockId: string) => {
    setActiveBlockId(blockId);
    setAddQuestionDialogOpen(true);
  };

  const handleAdaptPIE = async (itemId: string) => {
    setAdaptingItemId(itemId);
    try {
        const adaptationData = await generatePIEAdaptation(itemId);
        await savePIEAdaptation(itemId, adaptationData);
        showSuccess("Pregunta adaptada para PIE exitosamente.");
        loadBlocksAndQuestions();
    } catch (error: any) {
        showError(`Error al adaptar la pregunta: ${error.message}`);
    } finally {
        setAdaptingItemId(null);
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

  const handleIncreaseDifficulty = async (itemId: string) => {
    setIncreasingDifficultyId(itemId);
    try {
        await increaseQuestionDifficulty(itemId);
        showSuccess("Dificultad de la pregunta aumentada.");
        loadBlocksAndQuestions();
    } catch (error: any) {
        showError(`Error al aumentar dificultad: ${error.message}`);
    } finally {
        setIncreasingDifficultyId(null);
    }
  };

  const handleDecreaseDifficulty = async (itemId: string) => {
    setDecreasingDifficultyId(itemId);
    try {
        await decreaseQuestionDifficulty(itemId);
        showSuccess("Dificultad de la pregunta disminuida.");
        loadBlocksAndQuestions();
    } catch (error: any) {
        showError(`Error al disminuir la dificultad: ${error.message}`);
    } finally {
        setDecreasingDifficultyId(null);
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
        `Desde Plan: ${plan.titulo}`
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
          block.title || undefined
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

  const handleEditBlock = (block: EvaluationContentBlock) => {
    setEditingBlock(block);
    if (block.block_type === 'text') {
      setAddTextDialogOpen(true);
    } else if (block.block_type === 'image') {
      setAddImageDialogOpen(true);
    } else if (block.block_type === 'syllabus') {
      setAddSyllabusDialogOpen(true);
    }
  };

  const handleScoreChange = async (itemId: string, newScore: number) => {
    setQuestionsByBlock(prev => {
        const newQuestions = { ...prev };
        for (const blockId in newQuestions) {
            const itemIndex = newQuestions[blockId].findIndex(i => i.id === itemId);
            if (itemIndex !== -1) {
                newQuestions[blockId][itemIndex] = { ...newQuestions[blockId][itemIndex], puntaje: newScore };
                break;
            }
        }
        return newQuestions;
    });

    try {
        await updateEvaluationItemDetails(itemId, { puntaje: newScore });
    } catch (error: any) {
        showError(error.message);
        loadBlocksAndQuestions();
    }
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Bloques de Contenido para "{evaluationTitle}"</h3>
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => setAddSyllabusDialogOpen(true)}><ClipboardList className="mr-2 h-4 w-4" /> Añadir Temario</Button>
        <Button onClick={() => setAddTextDialogOpen(true)}><FileText className="mr-2 h-4 w-4" /> Añadir Texto</Button>
        <Button onClick={() => setAddImageDialogOpen(true)}><ImageIcon className="mr-2 h-4 w-4" /> Añadir Imagen</Button>
        <Button onClick={() => setUsePlanDialogOpen(true)} variant="outline"><BookCopy className="mr-2 h-4 w-4" /> Usar Plan Didáctico</Button>
        <Button onClick={() => setUseResourceDialogOpen(true)} variant="outline"><CopyPlus className="mr-2 h-4 w-4" /> Reutilizar Recurso</Button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-24"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : blocks.length > 0 ? (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={blocks.map(b => b.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-6">
              {blocks.map(block => (
                <SortableItem key={block.id} id={block.id}>
                  {({ ref, style, attributes, listeners }) => (
                    <div ref={ref} style={style}>
                      <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                          <div className="flex items-center flex-grow gap-3">
                            <div {...attributes} {...listeners} className="cursor-grab touch-none p-2 -ml-2">
                              <GripVertical className="h-5 w-5 text-muted-foreground" />
                            </div>
                            {block.block_type === 'text' ? <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0" /> : block.block_type === 'syllabus' ? <ClipboardList className="h-5 w-5 text-muted-foreground flex-shrink-0" /> : <ImageIcon className="h-5 w-5 text-muted-foreground flex-shrink-0" />}
                            <div className="flex-grow" onClick={() => toggleBlockExpansion(block.id)}>
                              <Input
                                defaultValue={block.title || ''}
                                placeholder={`Título del Bloque ${block.orden}`}
                                className="text-base font-semibold border-none focus-visible:ring-1 focus-visible:ring-ring p-0 h-auto bg-transparent"
                                onClick={(e) => e.stopPropagation()}
                                onBlur={(e) => {
                                    if (e.target.value !== (block.title || '')) {
                                        handleTitleChange(block.id, e.target.value);
                                    }
                                }}
                              />
                              <CardDescription>
                                {questionsByBlock[block.id]?.length || 0} preguntas generadas. Haz clic para {expandedBlocks[block.id] ? 'ocultar' : 'mostrar'}.
                              </CardDescription>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="flex items-center space-x-2" onClick={(e) => e.stopPropagation()}>
                                      <Switch
                                          id={`visibility-${block.id}`}
                                          checked={block.visible_en_evaluacion}
                                          onCheckedChange={(checked) => handleVisibilityChange(block.id, checked)}
                                      />
                                      <Label htmlFor={`visibility-${block.id}`} className="text-xs text-muted-foreground">Visible</Label>
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Si está activado, el contenido de este bloque será visible para el estudiante.</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleEditBlock(block); }}><Edit className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleDeleteBlock(block.id); }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                            <ChevronsUpDown className={cn("h-4 w-4 text-muted-foreground transition-transform", expandedBlocks[block.id] && "rotate-180")} />
                          </div>
                        </CardHeader>
                        {!expandedBlocks[block.id] && (
                            <CardContent>
                                {block.block_type === 'text' || block.block_type === 'syllabus' ? (
                                    <p className="text-sm text-muted-foreground whitespace-pre-wrap line-clamp-2">{block.content.text}</p>
                                ) : (
                                    <img src={getPublicImageUrl(block.content.imageUrl)} alt={`Bloque ${block.orden}`} className="rounded-md max-h-24 object-contain" />
                                )}
                            </CardContent>
                        )}
                      </Card>
                      {expandedBlocks[block.id] && (
                        <div className="pl-6 border-l-2 border-primary ml-4 space-y-3 py-4 mt-2">
                          <div className="flex justify-end items-center gap-2">
                            <Button variant="outline" size="sm" onClick={() => handleAddManualQuestion(block.id)}>
                                <PlusCircle className="h-4 w-4 mr-2" /> Añadir Pregunta Manual
                            </Button>
                            <div className="flex items-center gap-2">
                                <Input
                                    type="number"
                                    min="1"
                                    max="10"
                                    value={questionCounts[block.id] || 3}
                                    onChange={(e) => setQuestionCounts(prev => ({ ...prev, [block.id]: parseInt(e.target.value, 10) || 3 }))}
                                    className="w-16 h-9"
                                />
                                <Button onClick={() => handleGenerateQuestions(block, questionCounts[block.id] || 3)} disabled={generatingForBlock === block.id}>
                                  {generatingForBlock === block.id ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
                                  Generar
                                </Button>
                            </div>
                          </div>
                          {questionsByBlock[block.id] && questionsByBlock[block.id].length > 0 ? (
                            questionsByBlock[block.id].map(item => (
                              <QuestionItem 
                                  key={item.id} 
                                  item={item} 
                                  onAdaptPIE={handleAdaptPIE}
                                  onEdit={setEditingItem}
                                  onIncreaseDifficulty={handleIncreaseDifficulty}
                                  onDecreaseDifficulty={handleDecreaseDifficulty}
                                  onScoreChange={handleScoreChange}
                                  onDelete={handleDeleteItem}
                                  isAdapting={adaptingItemId === item.id}
                                  isIncreasingDifficulty={increasingDifficultyId === item.id}
                                  isDecreasingDifficulty={decreasingDifficultyId === item.id}
                              />
                            ))
                          ) : (
                            <p className="text-sm text-muted-foreground text-center">Aún no hay preguntas para este bloque.</p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </SortableItem>
              ))}
            </div>
          </SortableContext>
        </DndContext>
      ) : (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <h3 className="text-xl font-semibold">Sin contenido</h3>
          <p className="text-muted-foreground mt-2">Añade tu primer bloque de contenido para empezar a generar preguntas.</p>
        </div>
      )}

      <div className="flex justify-end pt-4">
        <Button onClick={onNextStep} disabled={blocks.length === 0}>Continuar a Revisión Final</Button>
      </div>

      <AddTextBlockDialog isOpen={isAddTextDialogOpen} onClose={() => { setAddTextDialogOpen(false); setEditingBlock(null); }} onSave={loadBlocksAndQuestions} evaluationId={evaluationId} currentOrder={blocks.length + 1} blockToEdit={editingBlock} />
      <AddSyllabusBlockDialog isOpen={isAddSyllabusDialogOpen} onClose={() => { setAddSyllabusDialogOpen(false); setEditingBlock(null); }} onSave={loadBlocksAndQuestions} evaluationId={evaluationId} currentOrder={blocks.length + 1} blockToEdit={editingBlock} />
      <AddImageBlockDialog isOpen={isAddImageDialogOpen} onClose={() => { setAddImageDialogOpen(false); setEditingBlock(null); }} onSave={loadBlocksAndQuestions} evaluationId={evaluationId} currentOrder={blocks.length + 1} blockToEdit={editingBlock} />
      {activeBlockId && <AddQuestionDialog isOpen={isAddQuestionDialogOpen} onClose={() => setAddQuestionDialogOpen(false)} onSave={loadBlocksAndQuestions} evaluationId={evaluationId} blockId={activeBlockId} />}
      <UseDidacticPlanDialog isOpen={isUsePlanDialogOpen} onClose={() => setUsePlanDialogOpen(false)} onPlanSelected={handlePlanSelected} />
      <UseExistingResourceDialog isOpen={isUseResourceDialogOpen} onClose={() => setUseResourceDialogOpen(false)} onResourceSelected={handleResourceSelected} currentEvaluationId={evaluationId} />
      <EditQuestionDialog isOpen={!!editingItem} onClose={() => setEditingItem(null)} onSave={handleEditSave} item={editingItem} />
    </div>
  );
};

export default Step2ContentBlocks;