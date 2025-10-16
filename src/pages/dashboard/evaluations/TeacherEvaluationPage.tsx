import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useEstablishment } from '@/contexts/EstablishmentContext';
import { Button } from '@/components/ui/button';
import { PlusCircle, Trash2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { fetchEvaluations, Evaluation, deleteEvaluation, deleteMultipleEvaluations, fetchEvaluationDetails, fetchStudentsForEvaluation } from '@/api/evaluationsApi';
import { showError, showLoading, dismissToast, showSuccess } from '@/utils/toast';
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
import PrintEvaluationDialog, { PrintFormData } from '@/components/evaluations/printable/PrintEvaluationDialog';
import PrintAnswerSheetDialog, { AnswerSheetFormData } from '@/components/evaluations/printable/PrintAnswerSheetDialog';
import AnswerKeyDialog from '@/components/evaluations/AnswerKeyDialog';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import EvaluationList from '@/components/evaluations/EvaluationList';
import { printComponent } from '@/utils/printUtils';
import PrintableEvaluation from '@/components/evaluations/printable/PrintableEvaluation';
import PrintableAnswerSheet from '@/components/evaluations/printable/PrintableAnswerSheet';
import PrintableAnswerKey from '@/components/evaluations/printable/PrintableAnswerKey';
import { seededShuffle } from '@/utils/shuffleUtils';

const TeacherEvaluationPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { activeEstablishment } = useEstablishment();
  const { user } = useAuth();

  const [isPrintModalOpen, setPrintModalOpen] = useState(false);
  const [evaluationToPrint, setEvaluationToPrint] = useState<string | null>(null);
  const [isAnswerSheetModalOpen, setAnswerSheetModalOpen] = useState(false);
  const [evaluationForAnswerSheet, setEvaluationForAnswerSheet] = useState<string | null>(null);
  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [evaluationToDelete, setEvaluationToDelete] = useState<Evaluation | null>(null);
  const [selectedEvaluations, setSelectedEvaluations] = useState<string[]>([]);
  const [isBulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [isAnswerKeyDialogOpen, setAnswerKeyDialogOpen] = useState(false);
  const [evaluationForAnswerKey, setEvaluationForAnswerKey] = useState<string | null>(null);

  const { data: teacherEvaluations = [], isLoading: loading } = useQuery({
    queryKey: ['evaluations', user?.id, activeEstablishment?.id, 'teacher'],
    queryFn: () => fetchEvaluations(user!.id, activeEstablishment!.id),
    enabled: !!user && !!activeEstablishment,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteEvaluation,
    onSuccess: (_, deletedId) => {
      const deletedEval = teacherEvaluations.find(e => e.id === deletedId);
      showSuccess(`Evaluación "${deletedEval?.titulo}" eliminada.`);
      queryClient.invalidateQueries({ queryKey: ['evaluations', user?.id, activeEstablishment?.id, 'teacher'] });
    },
    onError: (error: any) => showError(error.message),
    onSettled: () => {
      setDeleteDialogOpen(false);
      setEvaluationToDelete(null);
    }
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: deleteMultipleEvaluations,
    onSuccess: (_, deletedIds) => {
      showSuccess(`${deletedIds.length} evaluaciones eliminadas.`);
      setSelectedEvaluations([]);
      queryClient.invalidateQueries({ queryKey: ['evaluations', user?.id, activeEstablishment?.id, 'teacher'] });
    },
    onError: (error: any) => showError(error.message),
    onSettled: () => setBulkDeleteDialogOpen(false),
  });

  const printMutation = useMutation({
    mutationFn: async (formData: PrintFormData) => {
      if (!evaluationToPrint || !activeEstablishment) throw new Error("Datos de evaluación incompletos.");
      
      const evaluationDetails = await queryClient.fetchQuery({
        queryKey: ['evaluationDetails', evaluationToPrint],
        queryFn: () => fetchEvaluationDetails(evaluationToPrint),
      });

      if (!evaluationDetails.aspectos_a_evaluar_ia) {
        throw new Error("Falta el resumen 'Aspectos a Evaluar'. Por favor, edita y finaliza la evaluación para generarlo.");
      }

      let teacherName = 'Docente no especificado';
      if (evaluationDetails.creado_por) {
        const { data: profileData } = await supabase.from('perfiles').select('nombre_completo').eq('id', evaluationDetails.creado_por).single();
        if (profileData?.nombre_completo) teacherName = profileData.nombre_completo;
      }

      const totalScore = (evaluationDetails.evaluation_content_blocks || []).reduce((total, block) => 
        total + (block.evaluacion_items || []).reduce((subTotal, item) => subTotal + (item.puntaje || 0), 0), 0);

      const formatTeacherNameForPrint = (fullName: string | null): string => {
        if (!fullName) return '';
        const parts = fullName.trim().split(/\s+/);
        if (parts.length <= 2) return fullName;
        return `${parts[0]} ${parts[parts.length - 2]}`;
      };
      const formattedTeacherName = formatTeacherNameForPrint(teacherName);
      
      const printableComponents: React.ReactElement[] = [];
      for (let i = 0; i < formData.rows; i++) {
        const rowLabel = String.fromCharCode(65 + i);
        const evaluationCopy = JSON.parse(JSON.stringify(evaluationDetails));

        if (evaluationCopy.randomizar_preguntas) {
          const allItems = evaluationCopy.evaluation_content_blocks.flatMap((b: any) => b.evaluacion_items);
          const shuffledItems = seededShuffle(allItems, `${formData.seed}-${rowLabel}`);
          shuffledItems.forEach((item: any, index: number) => item.orden = index + 1);
          
          let firstBlockIdx = evaluationCopy.evaluation_content_blocks.findIndex((b: any) => b.evaluacion_items.length > 0);
          if (firstBlockIdx === -1 && shuffledItems.length > 0) firstBlockIdx = 0;
          if (firstBlockIdx !== -1) {
            evaluationCopy.evaluation_content_blocks.forEach((b: any, idx: number) => {
              b.evaluacion_items = idx === firstBlockIdx ? shuffledItems : [];
            });
          }
        }

        if (evaluationCopy.randomizar_alternativas) {
          evaluationCopy.evaluation_content_blocks.forEach((b: any) => b.evaluacion_items.forEach((item: any) => {
            if (item.tipo_item === 'seleccion_multiple' && item.item_alternativas) {
              item.item_alternativas = seededShuffle(item.item_alternativas, `${formData.seed}-${rowLabel}-${item.id}`);
            }
          }));
        }

        printableComponents.push(
          <PrintableEvaluation key={rowLabel} evaluation={evaluationCopy} establishment={activeEstablishment} fontSize={formData.fontSize}
            teacherName={formattedTeacherName} totalScore={totalScore} rowLabel={formData.rows > 1 ? rowLabel : undefined} />
        );
      }
      printComponent(<div>{printableComponents}</div>, `Evaluación: ${evaluationDetails.titulo}`);
    },
    onMutate: () => showLoading("Preparando evaluación para imprimir..."),
    onSuccess: (_, __, toastId) => dismissToast(toastId),
    onError: (error: any, _, toastId) => {
      if (toastId) dismissToast(toastId);
      showError(`Error al preparar la impresión: ${error.message}`);
    },
    onSettled: () => {
      setPrintModalOpen(false);
      setEvaluationToPrint(null);
    }
  });

  const answerSheetMutation = useMutation({
    mutationFn: async (formData: AnswerSheetFormData) => {
      if (!evaluationForAnswerSheet || !activeEstablishment) throw new Error("Datos de evaluación incompletos.");
      
      const [evaluation, students] = await Promise.all([
        queryClient.fetchQuery({ queryKey: ['evaluationDetails', evaluationForAnswerSheet], queryFn: () => fetchEvaluationDetails(evaluationForAnswerSheet) }),
        queryClient.fetchQuery({ queryKey: ['studentsForEvaluation', evaluationForAnswerSheet], queryFn: () => fetchStudentsForEvaluation(evaluationForAnswerSheet) })
      ]);

      const allQuestions = evaluation.evaluation_content_blocks.flatMap(b => b.evaluacion_items);
      const answerKey: { [row: string]: { [q: number]: string } } = {};
      const printableComponents: React.ReactElement[] = [];

      for (let i = 0; i < formData.rows; i++) {
        const rowLabel = String.fromCharCode(65 + i);
        answerKey[rowLabel] = {};
        allQuestions.forEach(q => {
          if (q.tipo_item === 'seleccion_multiple') {
            const shuffledAlts = seededShuffle(q.item_alternativas, `${formData.seed}-${rowLabel}-${q.id}`);
            const correctIndex = shuffledAlts.findIndex(alt => alt.es_correcta);
            answerKey[rowLabel][q.orden] = String.fromCharCode(65 + correctIndex);
          }
        });
        students.forEach(student => {
          printableComponents.push(
            <PrintableAnswerSheet key={`${student.id}-${rowLabel}`} evaluationTitle={evaluation.titulo} establishmentName={activeEstablishment.nombre}
              logoUrl={activeEstablishment.logo_url} studentName={student.nombre_completo} courseName={student.curso_nombre}
              rowLabel={rowLabel} qrCodeData={`${evaluation.id}|${student.id}|${rowLabel}`}
              questions={allQuestions.map(q => ({ orden: q.orden, alternativesCount: q.item_alternativas.length }))} />
          );
        });
      }
      printableComponents.push(<PrintableAnswerKey key="answer-key" evaluationTitle={evaluation.titulo} answerKey={answerKey} />);
      printComponent(<div>{printableComponents}</div>, `Hojas de Respuesta - ${evaluation.titulo}`);
    },
    onMutate: () => showLoading("Generando hojas de respuesta y pautas..."),
    onSuccess: (_, __, toastId) => dismissToast(toastId),
    onError: (error: any, _, toastId) => {
      if (toastId) dismissToast(toastId);
      showError(`Error al generar las hojas: ${error.message}`);
    },
    onSettled: () => setAnswerSheetModalOpen(false),
  });

  const handleSelectionChange = (evaluationId: string, isSelected: boolean) => {
    setSelectedEvaluations(prev => isSelected ? [...prev, evaluationId] : prev.filter(id => id !== evaluationId));
  };

  const handlePrintClick = (evaluationId: string) => {
    setEvaluationToPrint(evaluationId);
    setPrintModalOpen(true);
  };

  const handleAnswerSheetClick = (evaluationId: string) => {
    setEvaluationForAnswerSheet(evaluationId);
    setAnswerSheetModalOpen(true);
  };

  const handleDeleteClick = (evaluation: Evaluation) => {
    setEvaluationToDelete(evaluation);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (evaluationToDelete) {
      deleteMutation.mutate(evaluationToDelete.id);
    }
  };

  const handleBulkDelete = () => {
    if (selectedEvaluations.length > 0) {
      bulkDeleteMutation.mutate(selectedEvaluations);
    }
  };

  const renderEvaluations = (filterType?: string) => {
    const filtered = filterType ? teacherEvaluations.filter(e => e.tipo === filterType) : teacherEvaluations;
    
    return (
      <EvaluationList
        evaluations={filtered}
        selectedEvaluations={selectedEvaluations}
        onSelectionChange={handleSelectionChange}
        onViewDetails={(id) => navigate(`/dashboard/evaluacion/${id}`)}
        onViewResults={(id) => navigate(`/dashboard/evaluacion/${id}/resultados`)}
        onShowAnswerKey={(id) => { setEvaluationForAnswerKey(id); setAnswerKeyDialogOpen(true); }}
        onPrint={handlePrintClick}
        onPrintAnswerSheet={handleAnswerSheetClick}
        onDelete={handleDeleteClick}
        onCorrectWithCamera={(id) => navigate(`/dashboard/evaluacion/${id}/corregir`)}
      />
    );
  };

  return (
    <>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Banco de Evaluaciones</h1>
          <p className="text-muted-foreground">Crea, gestiona y comparte tus instrumentos de evaluación.</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          {selectedEvaluations.length > 0 ? (
            <Button variant="destructive" onClick={() => setBulkDeleteDialogOpen(true)} className="w-full">
              <Trash2 className="mr-2 h-4 w-4" />
              Eliminar ({selectedEvaluations.length})
            </Button>
          ) : (
            <>
              <Button asChild variant="outline" disabled={!activeEstablishment} className="w-1/2">
                <Link to="/dashboard/rubricas/crear">
                  <PlusCircle className="mr-2 h-4 w-4" /> Crear Rúbrica
                </Link>
              </Button>
              <Button asChild disabled={!activeEstablishment} className="w-1/2">
                <Link to="/dashboard/evaluacion/crear">
                  <PlusCircle className="mr-2 h-4 w-4" /> Crear Evaluación
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

      <PrintEvaluationDialog
        isOpen={isPrintModalOpen}
        onClose={() => setPrintModalOpen(false)}
        onConfirm={(data) => printMutation.mutate(data)}
        isPrinting={printMutation.isPending}
      />

      <PrintAnswerSheetDialog
        isOpen={isAnswerSheetModalOpen}
        onClose={() => setAnswerSheetModalOpen(false)}
        onConfirm={(data) => answerSheetMutation.mutate(data)}
        isPrinting={answerSheetMutation.isPending}
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
            <AlertDialogAction onClick={confirmDelete}>
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
    </>
  );
};

export default TeacherEvaluationPage;