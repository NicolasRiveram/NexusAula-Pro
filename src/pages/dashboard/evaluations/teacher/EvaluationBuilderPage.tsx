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
import { createEvaluation, fetchEvaluationDetails, updateEvaluation, CreateEvaluationData, EvaluationDetail } from '@/api/evaluations';
import { showSuccess, showError, showLoading, dismissToast } from '@/utils/toast';
import { format, parseISO } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const evaluationBuilderSchema = step1Schema.extend({
  randomizar_preguntas: z.boolean().default(false),
  randomizar_alternativas: z.boolean().default(false),
  estandar_esperado: z.string().optional(),
});

type EvaluationBuilderFormData = z.infer<typeof evaluationBuilderSchema>;

const EvaluationBuilderPage = () => {
  const navigate = useNavigate();
  const { evaluationId: evaluationIdFromParams } = useParams<{ evaluationId: string }>();
  const queryClient = useQueryClient();
  
  const [isEditMode] = useState(!!evaluationIdFromParams);
  const [step, setStep] = useState(1);
  const [evaluationId, setEvaluationId] = useState<string | null>(evaluationIdFromParams || null);

  const { control, handleSubmit, formState: { isSubmitting }, reset, getValues, setValue } = useForm<EvaluationBuilderFormData>({
    resolver: zodResolver(evaluationBuilderSchema),
    defaultValues: {
      titulo: '',
      descripcion: '',
      tipo: '',
      momento_evaluativo: '',
      habilidades: [],
      fecha_aplicacion: undefined,
      asignaturaId: '',
      nivelId: '',
      cursoAsignaturaIds: [],
      objetivos_aprendizaje_ids: [],
      objetivosSugeridos: '',
      randomizar_preguntas: false,
      randomizar_alternativas: false,
      estandar_esperado: '',
    }
  });

  const { data: evaluationDetails, isLoading: loadingInitialData } = useQuery({
    queryKey: ['evaluationDetails', evaluationId],
    queryFn: () => fetchEvaluationDetails(evaluationId!),
    enabled: isEditMode && !!evaluationId,
    onSuccess: (data) => {
      reset({
        titulo: data.titulo,
        descripcion: data.descripcion || '',
        tipo: data.tipo,
        momento_evaluativo: data.momento_evaluativo,
        habilidades: data.evaluacion_habilidades.map(eh => eh.habilidades.nombre),
        fecha_aplicacion: data.fecha_aplicacion ? parseISO(data.fecha_aplicacion) : undefined,
        cursoAsignaturaIds: data.curso_asignaturas.map((link: any) => link.id),
        objetivos_aprendizaje_ids: data.evaluacion_objetivos.map(eo => eo.oa_id),
        randomizar_preguntas: data.randomizar_preguntas,
        randomizar_alternativas: data.randomizar_alternativas,
        estandar_esperado: data.estandar_esperado || '',
        asignaturaId: data.curso_asignaturas[0]?.asignatura.id,
        nivelId: data.curso_asignaturas[0]?.curso.nivel.id,
      });
    },
    onError: (error: any) => {
      showError(`Error al cargar datos para editar: ${error.message}`);
      navigate('/dashboard/evaluacion');
    }
  });

  const step1Mutation = useMutation({
    mutationFn: async (data: EvaluationStep1Data) => {
      const payload: CreateEvaluationData & { objetivos_aprendizaje_ids: string[] } = {
        titulo: data.titulo,
        tipo: data.tipo,
        descripcion: data.descripcion,
        momento_evaluativo: data.momento_evaluativo,
        habilidades: data.habilidades,
        fecha_aplicacion: data.fecha_aplicacion ? format(data.fecha_aplicacion, 'yyyy-MM-dd') : null,
        cursoAsignaturaIds: data.cursoAsignaturaIds || [],
        objetivos_aprendizaje_ids: data.objetivos_aprendizaje_ids || [],
      };

      if (isEditMode && evaluationId) {
        await updateEvaluation(evaluationId, payload);
        return evaluationId;
      } else {
        return await createEvaluation(payload);
      }
    },
    onSuccess: (newOrUpdatedId) => {
      if (!isEditMode) {
        setEvaluationId(newOrUpdatedId);
        showSuccess("Información general guardada. Ahora añade contenido.");
      } else {
        showSuccess("Información general actualizada.");
      }
      setStep(2);
    },
    onError: (error: any) => showError(`Error: ${error.message}`),
  });

  const prepareForReviewMutation = useMutation({
    mutationFn: async () => {
      if (!evaluationId) throw new Error("ID de evaluación no encontrado.");
      const data = await fetchEvaluationDetails(evaluationId);
      
      if (!data.estandar_esperado) {
        const questions = data.evaluation_content_blocks.flatMap(b => b.evaluacion_items);
        if (questions.length > 0) {
          const questionsSummary = questions.map(q => ({
            enunciado: q.enunciado,
            habilidad_evaluada: q.habilidad_evaluada,
            nivel_comprension: q.nivel_comprension,
          }));

          const { data: aiData, error: aiError } = await supabase.functions.invoke('generate-expected-standard', {
            body: { evaluationTitle: data.titulo, questions: questionsSummary },
          });
          if (aiError) throw aiError;
          
          setValue('estandar_esperado', aiData.standard);
        }
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evaluationDetails', evaluationId] });
      setStep(3);
    },
    onError: (error: any) => showError(`Error al preparar la revisión: ${error.message}`),
  });

  const finalSubmitMutation = useMutation({
    mutationFn: async () => {
      if (!evaluationId || !evaluationDetails) throw new Error("Datos de evaluación incompletos.");
      const formData = getValues();
      
      await updateEvaluation(evaluationId, {
        titulo: formData.titulo,
        tipo: formData.tipo,
        descripcion: formData.descripcion,
        momento_evaluativo: formData.momento_evaluativo,
        habilidades: formData.habilidades,
        fecha_aplicacion: formData.fecha_aplicacion ? format(formData.fecha_aplicacion, 'yyyy-MM-dd') : null,
        cursoAsignaturaIds: formData.cursoAsignaturaIds || [],
        randomizar_preguntas: formData.randomizar_preguntas,
        randomizar_alternativas: formData.randomizar_alternativas,
        estandar_esperado: formData.estandar_esperado,
        objetivos_aprendizaje_ids: formData.objetivos_aprendizaje_ids || [],
      });

      if (!evaluationDetails.aspectos_a_evaluar_ia) {
        const questions = evaluationDetails.evaluation_content_blocks.flatMap(b => b.evaluacion_items);
        const questionsSummary = questions.map(q => ({
          enunciado: q.enunciado,
          habilidad_evaluada: q.habilidad_evaluada,
          nivel_comprension: q.nivel_comprension,
        }));

        const { data: aiData, error: aiError } = await supabase.functions.invoke('generate-evaluation-aspects', {
          body: { evaluationTitle: evaluationDetails.titulo, questions: questionsSummary },
        });
        if (aiError) throw aiError;

        await supabase.from('evaluaciones').update({ aspectos_a_evaluar_ia: aiData.aspects }).eq('id', evaluationId);
      }
    },
    onSuccess: () => {
      showSuccess("Evaluación guardada y configurada exitosamente.");
      navigate(`/dashboard/evaluacion/${evaluationId}`);
    },
    onError: (error: any) => showError(`Error al finalizar: ${error.message}`),
  });

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
            <Step1GeneralInfo 
              onFormSubmit={handleSubmit((data) => step1Mutation.mutate(data))} 
              control={control} 
              isSubmitting={step1Mutation.isPending}
              setValue={setValue}
              getValues={getValues}
            />
          ) : step === 2 && evaluationId ? (
            <Step2ContentBlocks 
              evaluationId={evaluationId} 
              evaluationTitle={getValues('titulo')}
              onNextStep={() => prepareForReviewMutation.mutate()}
              temario={(getValues('habilidades') || []).join(', ')}
              getEvaluationContext={() => getValues('descripcion')}
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
              <Button onClick={() => finalSubmitMutation.mutate()} disabled={finalSubmitMutation.isPending}>
                {finalSubmitMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
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