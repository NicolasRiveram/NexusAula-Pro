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
import { supabase } from '@/integrations/supabase/client';

const evaluationBuilderSchema = step1Schema.extend({
  randomizar_preguntas: z.boolean().default(false),
  randomizar_alternativas: z.boolean().default(false),
  estandar_esperado: z.string().optional(),
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
  const [habilidades, setHabilidades] = useState<string[]>([]);

  const { control, handleSubmit, formState: { isSubmitting }, reset, getValues, setValue } = useForm<EvaluationBuilderFormData>({
    resolver: zodResolver(evaluationBuilderSchema),
  });

  useEffect(() => {
    if (isEditMode && evaluationId) {
      const loadEvaluationData = async () => {
        try {
          const data = await fetchEvaluationDetails(evaluationId);
          setEvaluationDetails(data);
          const fetchedHabilidades = data.evaluacion_habilidades.map(eh => eh.habilidades.nombre);
          setHabilidades(fetchedHabilidades);
          reset({
            titulo: data.titulo,
            tipo: data.tipo,
            momento_evaluativo: data.momento_evaluativo,
            habilidades: fetchedHabilidades,
            fecha_aplicacion: data.fecha_aplicacion ? parseISO(data.fecha_aplicacion) : undefined,
            cursoAsignaturaIds: data.curso_asignaturas.map((link: any) => link.id),
            objetivos_aprendizaje_ids: data.evaluacion_objetivos.map(eo => eo.oa_id),
            randomizar_preguntas: data.randomizar_preguntas,
            randomizar_alternativas: data.randomizar_alternativas,
            estandar_esperado: data.estandar_esperado || '',
            asignaturaId: data.curso_asignaturas[0]?.asignatura.id,
            nivelId: data.curso_asignaturas[0]?.curso.nivel.id,
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
      const payload: CreateEvaluationData & { objetivos_aprendizaje_ids: string[] } = {
        titulo: data.titulo,
        tipo: data.tipo,
        momento_evaluativo: data.momento_evaluativo,
        habilidades: data.habilidades,
        fecha_aplicacion: data.fecha_aplicacion ? format(data.fecha_aplicacion, 'yyyy-MM-dd') : null,
        cursoAsignaturaIds: data.cursoAsignaturaIds || [],
        objetivos_aprendizaje_ids: data.objetivos_aprendizaje_ids || [],
      };

      if (isEditMode && evaluationId) {
        await updateEvaluation(evaluationId, payload);
        showSuccess("Información general actualizada.");
      } else {
        const newEvaluationId = await createEvaluation(payload);
        setEvaluationId(newEvaluationId);
        showSuccess("Información general guardada. Ahora añade contenido.");
      }
      
      setHabilidades(data.habilidades || []);
      dismissToast(toastId);
      setStep(2);
    } catch (error: any) {
      dismissToast(toastId);
      showError(`Error: ${error.message}`);
    }
  };

  const handleNextFromContent = async () => {
    if (!evaluationId) return;
    const toastId = showLoading("Cargando y preparando revisión final...");
    try {
      const data = await fetchEvaluationDetails(evaluationId);
      setEvaluationDetails(data);

      // Auto-generate standard if empty
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

      setStep(3);
    } catch (error: any) {
      showError(`Error al preparar la revisión: ${error.message}`);
    } finally {
      dismissToast(toastId);
    }
  };

  const handleFinalSubmit = async () => {
    if (!evaluationId || !evaluationDetails) return;
    const formData = getValues();
    const toastId = showLoading("Finalizando y guardando configuración...");
    try {
      // 1. Save main settings
      await updateEvaluation(evaluationId, {
        titulo: formData.titulo,
        tipo: formData.tipo,
        momento_evaluativo: formData.momento_evaluativo,
        habilidades: formData.habilidades,
        fecha_aplicacion: formData.fecha_aplicacion ? format(formData.fecha_aplicacion, 'yyyy-MM-dd') : null,
        cursoAsignaturaIds: formData.cursoAsignaturaIds || [],
        randomizar_preguntas: formData.randomizar_preguntas,
        randomizar_alternativas: formData.randomizar_alternativas,
        estandar_esperado: formData.estandar_esperado,
        objetivos_aprendizaje_ids: formData.objetivos_aprendizaje_ids || [],
      });

      // 2. Generate and save "Aspectos a Evaluar" if not present
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

        await supabase
          .from('evaluaciones')
          .update({ aspectos_a_evaluar_ia: aiData.aspects })
          .eq('id', evaluationId);
      }

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
            <Step1GeneralInfo 
              onFormSubmit={handleSubmit(handleStep1Submit)} 
              control={control} 
              isSubmitting={isSubmitting}
              setValue={setValue}
              getValues={getValues}
            />
          ) : step === 2 && evaluationId ? (
            <Step2ContentBlocks 
              evaluationId={evaluationId} 
              evaluationTitle={getValues('titulo')}
              onNextStep={handleNextFromContent}
              temario={habilidades.join(', ')}
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