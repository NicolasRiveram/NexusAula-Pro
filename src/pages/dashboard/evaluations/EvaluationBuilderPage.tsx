import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Step1GeneralInfo, { EvaluationStep1Data, schema as step1Schema } from '@/components/evaluations/builder/Step1_GeneralInfo';
import Step2ContentBlocks from '@/components/evaluations/builder/Step2_ContentBlocks';
import Step3FinalConfig from '@/components/evaluations/builder/Step3_FinalConfig';
import { createEvaluation, fetchEvaluationDetails, updateEvaluation, CreateEvaluationData } from '@/api/evaluationsApi';
import { showSuccess, showError, showLoading, dismissToast } from '@/utils/toast';
import { format, parseISO } from 'date-fns';
import * as z from 'zod';

// Esquema combinado para todos los pasos
const combinedSchema = step1Schema.extend({
  randomizar_preguntas: z.boolean().default(false),
  randomizar_alternativas: z.boolean().default(false),
});

type CombinedFormData = z.infer<typeof combinedSchema>;

const EvaluationBuilderPage = () => {
  const navigate = useNavigate();
  const { evaluationId: evaluationIdFromParams } = useParams<{ evaluationId: string }>();
  
  const [isEditMode] = useState(!!evaluationIdFromParams);
  const [step, setStep] = useState(1);
  const [evaluationId, setEvaluationId] = useState<string | null>(evaluationIdFromParams || null);
  const [evaluationTitle, setEvaluationTitle] = useState<string>('');
  const [loadingInitialData, setLoadingInitialData] = useState(isEditMode);

  const { control, handleSubmit, formState: { isSubmitting }, reset } = useForm<CombinedFormData>({
    resolver: zodResolver(combinedSchema),
    defaultValues: {
      randomizar_preguntas: false,
      randomizar_alternativas: false,
    }
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
            randomizar_preguntas: (data as any).randomizar_preguntas || false,
            randomizar_alternativas: (data as any).randomizar_alternativas || false,
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

  const handleStep1Submit = async (data: CombinedFormData) => {
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

  const handleFinalSubmit = async (data: CombinedFormData) => {
    if (!evaluationId) return;
    const toastId = showLoading("Guardando configuración final...");
    try {
        await updateEvaluation(evaluationId, {
            titulo: data.titulo,
            tipo: data.tipo,
            descripcion: data.descripcion,
            fecha_aplicacion: format(data.fecha_aplicacion, 'yyyy-MM-dd'),
            cursoAsignaturaIds: data.cursoAsignaturaIds,
            randomizar_preguntas: data.randomizar_preguntas,
            randomizar_alternativas: data.randomizar_alternativas,
        });
        dismissToast(toastId);
        showSuccess("Evaluación guardada y configurada exitosamente.");
        navigate(`/dashboard/evaluacion/${evaluationId}`);
    } catch (error: any) {
        dismissToast(toastId);
        showError(`Error al guardar la configuración: ${error.message}`);
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
          ) : (
            <form onSubmit={step === 3 ? handleSubmit(handleFinalSubmit) : handleSubmit(handleStep1Submit)}>
              {step === 1 && <Step1GeneralInfo onFormSubmit={handleSubmit(handleStep1Submit)} control={control} isSubmitting={isSubmitting} />}
              
              {step === 2 && evaluationId && (
                <Step2ContentBlocks 
                  evaluationId={evaluationId} 
                  evaluationTitle={evaluationTitle}
                  onNextStep={() => setStep(3)}
                />
              )}

              {step === 3 && (
                <>
                  <Step3FinalConfig control={control} />
                  <div className="flex justify-between mt-6">
                    <Button type="button" variant="outline" onClick={() => setStep(2)}>Volver</Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? 'Finalizando...' : 'Finalizar y Guardar Evaluación'}
                    </Button>
                  </div>
                </>
              )}
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EvaluationBuilderPage;