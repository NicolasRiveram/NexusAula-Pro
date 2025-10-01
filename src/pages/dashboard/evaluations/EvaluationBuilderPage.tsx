import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Step1GeneralInfo, { EvaluationStep1Data, schema as step1Schema } from '@/components/evaluations/builder/Step1_GeneralInfo';
import Step2ContentBlocks from '@/components/evaluations/builder/Step2_ContentBlocks';
import { createEvaluation, fetchEvaluationDetails, updateEvaluation, CreateEvaluationData } from '@/api/evaluationsApi';
import { showSuccess, showError, showLoading, dismissToast } from '@/utils/toast';
import { format, parseISO } from 'date-fns';

const EvaluationBuilderPage = () => {
  const navigate = useNavigate();
  const { evaluationId: evaluationIdFromParams } = useParams<{ evaluationId: string }>();
  
  const [isEditMode] = useState(!!evaluationIdFromParams);
  const [step, setStep] = useState(1);
  const [evaluationId, setEvaluationId] = useState<string | null>(evaluationIdFromParams || null);
  const [evaluationTitle, setEvaluationTitle] = useState<string>('');
  const [loadingInitialData, setLoadingInitialData] = useState(isEditMode);

  const { control, handleSubmit, formState: { isSubmitting }, reset } = useForm<EvaluationStep1Data>({
    resolver: zodResolver(step1Schema),
  });

  useEffect(() => {
    if (isEditMode && evaluationId) {
      const loadEvaluationData = async () => {
        try {
          const data = await fetchEvaluationDetails(evaluationId);
          setEvaluationTitle(data.titulo);
          reset({
            titulo: data.titulo,
            tipo: data.tipo,
            descripcion: data.descripcion || '',
            fecha_aplicacion: parseISO(data.fecha_aplicacion),
            cursoAsignaturaIds: data.curso_asignaturas.map(ca => ca.id),
          });
        } catch (error: any) {
          showError(`Error al cargar datos para editar: ${error.message}`);
          navigate('/dashboard/evaluacion');
        } finally {
          setLoadingInitialData(false);
        }
      };
      loadEvaluationData();
    }
  }, [isEditMode, evaluationId, reset, navigate]);

  const handleStep1Submit = async (data: EvaluationStep1Data) => {
    const toastId = showLoading(isEditMode ? "Actualizando evaluación..." : "Creando evaluación...");
    try {
      const payload: CreateEvaluationData = {
        titulo: data.titulo,
        tipo: data.tipo,
        descripcion: data.descripcion,
        fecha_aplicacion: format(data.fecha_aplicacion, 'yyyy-MM-dd'),
        cursoAsignaturaIds: data.cursoAsignaturaIds,
      };

      if (isEditMode && evaluationId) {
        await updateEvaluation(evaluationId, payload);
        showSuccess("Información general actualizada.");
      } else {
        const newEvaluationId = await createEvaluation(payload);
        setEvaluationId(newEvaluationId);
        showSuccess("Información general guardada. Ahora añade contenido.");
      }
      
      setEvaluationTitle(data.titulo);
      dismissToast(toastId);
      setStep(2);
    } catch (error: any) {
      dismissToast(toastId);
      showError(`Error: ${error.message}`);
    }
  };

  const handleNextFromContent = () => {
    showSuccess("Contenido y preguntas guardados.");
    navigate(`/dashboard/evaluacion/${evaluationId}`);
  };

  const getStepDescription = () => {
    switch (step) {
      case 1: return 'Define la información general de tu evaluación.';
      case 2: return 'Añade bloques de contenido y genera preguntas para cada uno.';
      case 3: return 'Revisa y edita la evaluación completa antes de finalizar.';
      default: return '';
    }
  };

  return (
    <div className="container mx-auto space-y-6">
      <Link to="/dashboard/evaluacion" className="flex items-center text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Volver al Banco de Evaluaciones
      </Link>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{isEditMode ? 'Editar Evaluación' : 'Asistente de Creación de Evaluaciones'}</CardTitle>
          <CardDescription>Paso {step}/3: {getStepDescription()}</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingInitialData ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : step === 1 ? (
            <Step1GeneralInfo onFormSubmit={handleSubmit(handleStep1Submit)} control={control} isSubmitting={isSubmitting} />
          ) : (
            evaluationId && (
              <Step2ContentBlocks 
                evaluationId={evaluationId} 
                evaluationTitle={evaluationTitle}
                onNextStep={handleNextFromContent}
              />
            )
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EvaluationBuilderPage;