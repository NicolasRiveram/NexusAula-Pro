import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import Step1GeneralInfo, { EvaluationStep1Data, schema as step1Schema } from '@/components/evaluations/builder/Step1_GeneralInfo';
import Step2ContentBlocks from '@/components/evaluations/builder/Step2_ContentBlocks';
import Step3FinalReview from '@/components/evaluations/builder/Step3_FinalReview';
import { createEvaluation, fetchEvaluationDetails, updateEvaluation, CreateEvaluationData, EvaluationDetail } from '@/api/evaluationsApi';
import { showSuccess, showError, showLoading, dismissToast } from '@/utils/toast';
import { format, parseISO } from 'date-fns';

const evaluationBuilderSchema = step1Schema.extend({
  randomizar_preguntas: z.boolean().default(false),
  randomizar_alternativas: z.boolean().default(false),
});

type EvaluationBuilderFormData = z.infer<typeof evaluationBuilderSchema>;

const EvaluationBuilderPage = () => {
  const navigate = useNavigate();
  const { evaluationId: evaluationIdFromParams } = useParams<{ evaluationId: string }>();
  
  const [isEditMode] = useState(!!evaluationIdFromParams);
  const [step, setStep] = useState(1);
  const [evaluationId, setEvaluationId] = useState<string | null>(evaluationIdFromParams || null);
  const [evaluationDetails, setEvaluationDetails] = useState<EvaluationDetail | null>(null);
  const [loadingInitialData, setLoadingInitialData] = useState(isEditMode);

  const { control, handleSubmit, formState: { isSubmitting }, reset, getValues } = useForm<EvaluationBuilderFormData>({
    resolver: zodResolver(evaluationBuilderSchema),
  });

  useEffect(() => {
    if (isEditMode && evaluationId) {
      const loadEvaluationData = async () => {
        try {
          const data = await fetchEvaluationDetails(evaluationId);
          setEvaluationDetails(data);
          reset({
            titulo: data.titulo,
            tipo: data.tipo,
            descripcion: data.descripcion || '',
            fecha_aplicacion: parseISO(data.fecha_aplicacion),
            cursoAsignaturaIds: data.curso_asignaturas.map(ca => ca.id),
            randomizar_preguntas: data.randomizar_preguntas,
            randomizar_alternativas: data.randomizar_alternativas,
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
      
      dismissToast(toastId);
      setStep(2);
    } catch (error: any) {
      dismissToast(toastId);
      showError(`Error: ${error.message}`);
    }
  };

  const handleNextFromContent = async () => {
    if (!evaluationId) return;
    const toastId = showLoading("Cargando resumen de la evaluación...");
    try {
      const data = await fetchEvaluationDetails(evaluationId);
      setEvaluationDetails(data);
      setStep(3);
    } catch (error: any) {
      showError(`Error al cargar el resumen: ${error.message}`);
    } finally {
      dismissToast(toastId);
    }
  };

  const handleFinalSubmit = async () => {
    if (!evaluationId) return;
    const formData = getValues();
    const toastId = showLoading("Finalizando y guardando configuración...");
    try {
      await updateEvaluation(evaluationId, {
        titulo: formData.titulo,
        tipo: formData.tipo,
        descripcion: formData.descripcion,
        fecha_aplicacion: format(formData.fecha_aplicacion, 'yyyy-MM-dd'),
        cursoAsignaturaIds: formData.cursoAsignaturaIds,
        randomizar_preguntas: formData.randomizar_preguntas,
        randomizar_alternativas: formData.randomizar_alternativas,
      });
      showSuccess("Evaluación guardada y configurada exitosamente.");
      navigate(`/dashboard/evaluacion/${evaluationId}`);
    } catch (error: any) {
      showError(`Error al finalizar: ${error.message}`);
    } finally {
      dismissToast(toastId);
    }
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
          ) : step === 2 && evaluationId ? (
            <Step2ContentBlocks 
              evaluationId={evaluationId} 
              evaluationTitle={getValues('titulo')}
              onNextStep={handleNextFromContent}
            />
          ) : step === 3 && evaluationDetails ? (
            <Step3FinalReview control={control} evaluation={evaluationDetails} />
          ) : null}
        </CardContent>
        {step > 1 && (
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(step - 1)} disabled={isSubmitting}>
              <ChevronLeft className="mr-2 h-4 w-4" /> Atrás
            </Button>
            {step === 3 && (
              <Button onClick={handleFinalSubmit} disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Finalizar y Guardar
              </Button>
            )}
          </CardFooter>
        )}
      </Card>
    </div>
  );
};

export default EvaluationBuilderPage;