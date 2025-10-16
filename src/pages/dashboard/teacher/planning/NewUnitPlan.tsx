import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import Step1UnitConfig, { UnitPlanFormData } from './Step1_UnitConfig';
import Step2ReviewSuggestions, { AISuggestions } from './Step2_ReviewSuggestions';
import Step3ClassSequence, { ClassPlan } from './Step3_ClassSequence';
import { createUnitPlan, updateUnitPlanSuggestions, saveMasterPlanClasses } from '@/api/planning';
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError, showLoading, dismissToast } from '@/utils/toast';
import { FunctionsHttpError } from '@supabase/supabase-js';
import { useEstablishment } from '@/contexts/EstablishmentContext';
import { format } from 'date-fns';
import AskClassCountDialog from '@/components/planning/AskClassCountDialog';
import { useMutation } from '@tanstack/react-query';

const NewUnitPlan = () => {
  const navigate = useNavigate();
  const { activeEstablishment } = useEstablishment();
  const [step, setStep] = useState(1);
  
  const [unitMasterId, setUnitMasterId] = useState<string | null>(null);
  const [proyectoId, setProyectoId] = useState<string | null>(null);
  const [unitPlanData, setUnitPlanData] = useState<UnitPlanFormData | null>(null);
  const [aiSuggestions, setAiSuggestions] = useState<AISuggestions | null>(null);
  const [classSequence, setClassSequence] = useState<ClassPlan[] | null>(null);
  const [isAskCountDialogOpen, setIsAskCountDialogOpen] = useState(false);
  const [tempAiSuggestions, setTempAiSuggestions] = useState<AISuggestions | null>(null);

  const step1Mutation = useMutation({
    mutationFn: async (data: UnitPlanFormData) => {
      setUnitPlanData(data);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error("Usuario no autenticado.");
      if (!activeEstablishment) throw new Error("No hay un establecimiento activo seleccionado.");

      const newUnitId = await createUnitPlan(data, session.user.id, activeEstablishment.id);
      
      if (data.proyectoId && data.proyectoId !== 'none') {
        setProyectoId(data.proyectoId);
      } else {
        setProyectoId(null);
      }

      const { data: suggestions, error } = await supabase.functions.invoke('generate-unit-suggestions', {
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: { 
          title: data.titulo, 
          description: data.descripcionContenidos, 
          instructions: data.instruccionesAdicionales 
        },
      });

      if (error) throw error;
      return { newUnitId, suggestions };
    },
    onSuccess: ({ newUnitId, suggestions }) => {
      setUnitMasterId(newUnitId);
      setAiSuggestions(suggestions);
      showSuccess("Sugerencias de Objetivos y Proyecto generadas.");
      setStep(2);
    },
    onError: (error: any) => {
      if (error instanceof FunctionsHttpError) {
        error.context.json().then((errorMessage: any) => {
          showError(`Error en el paso 1: ${errorMessage.error}`);
        });
      } else {
        showError(`Error en el paso 1: ${error.message}`);
      }
    }
  });

  const generateSequenceMutation = useMutation({
    mutationFn: async ({ suggestions, classCount }: { suggestions: AISuggestions, classCount: number }) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Usuario no autenticado.");

      const BATCH_SIZE = 8;
      const totalBatches = Math.ceil(classCount / BATCH_SIZE);
      let allSequences: ClassPlan[] = [];

      for (let i = 0; i < classCount; i += BATCH_SIZE) {
        const batchNumber = (i / BATCH_SIZE) + 1;
        const countInBatch = Math.min(BATCH_SIZE, classCount - i);
        const batchToastId = showLoading(`Generando clases ${i + 1} a ${i + countInBatch} (lote ${batchNumber}/${totalBatches})...`);

        const { data: sequence, error } = await supabase.functions.invoke('generate-class-sequence', {
          headers: { Authorization: `Bearer ${session.access_token}` },
          body: { 
            suggestions, 
            projectContext: !!proyectoId, 
            classCount: countInBatch,
            batchNumber,
            totalBatches,
          },
        });
        
        dismissToast(batchToastId);
        if (error) throw error;

        allSequences = [...allSequences, ...sequence];
      }
      return allSequences;
    },
    onSuccess: (allSequences) => {
      const sequenceWithTempIds = allSequences.map((cls: Omit<ClassPlan, 'id' | 'fecha'>, index: number) => ({
        ...cls,
        id: `temp_${index}`,
        fecha: '',
      }));
      setClassSequence(sequenceWithTempIds);
      showSuccess("Secuencia de clases generada.");
      setStep(3);
    },
    onError: (error: any) => {
      if (error instanceof FunctionsHttpError) {
        error.context.json().then((errorMessage: any) => {
          showError(`Error al generar secuencia: ${errorMessage.error}`);
        });
      } else {
        showError(`Error al generar secuencia: ${error.message}`);
      }
    },
    onSettled: () => {
      setIsAskCountDialogOpen(false);
      setTempAiSuggestions(null);
    }
  });

  const step2Mutation = useMutation({
    mutationFn: async (data: AISuggestions) => {
      if (!unitMasterId || !unitPlanData || !activeEstablishment) {
        throw new Error("Faltan datos de la unidad o del establecimiento.");
      }
      await updateUnitPlanSuggestions(unitMasterId, data);
      setAiSuggestions(data);

      const { data: classCount, error: countError } = await supabase.rpc('calculate_class_slots', {
        p_start_date: format(unitPlanData.fechas.from, 'yyyy-MM-dd'),
        p_end_date: format(unitPlanData.fechas.to, 'yyyy-MM-dd'),
        p_curso_asignatura_ids: unitPlanData.cursoAsignaturaIds,
        p_establecimiento_id: activeEstablishment.id,
      });

      if (countError) throw countError;
      return { classCount, suggestions: data };
    },
    onSuccess: ({ classCount, suggestions }) => {
      if (classCount > 0) {
        showSuccess(`Se generará una secuencia de ${classCount} clases.`);
        generateSequenceMutation.mutate({ suggestions, classCount });
      } else {
        setTempAiSuggestions(suggestions);
        setIsAskCountDialogOpen(true);
      }
    },
    onError: (error: any) => {
      if (error instanceof FunctionsHttpError) {
        error.context.json().then((errorMessage: any) => {
          showError(`Error en el paso 2: ${errorMessage.error}`);
        });
      } else {
        showError(`Error en el paso 2: ${error.message}`);
      }
    }
  });

  const step3Mutation = useMutation({
    mutationFn: async (data: { classes: ClassPlan[] }) => {
      if (!unitMasterId) throw new Error("Error: No se encontró el ID de la unidad para guardar.");
      const classesToSave = data.classes.map(({ id, fecha, ...rest }) => rest);
      await saveMasterPlanClasses(unitMasterId, classesToSave);
    },
    onSuccess: () => {
      showSuccess("¡Planificación guardada exitosamente! Ahora puedes programarla desde la página de edición.");
      setTimeout(() => navigate('/dashboard/planificacion'), 2000);
    },
    onError: (error: any) => {
      showError(`Error al guardar la planificación: ${error.message}`);
    }
  });

  const handleGenerateWithManualCount = (count: number) => {
    if (tempAiSuggestions) {
      generateSequenceMutation.mutate({ suggestions: tempAiSuggestions, classCount: count });
    } else {
      showError("Faltan datos para generar las clases.");
    }
  };

  const isLoading = step1Mutation.isPending || step2Mutation.isPending || generateSequenceMutation.isPending || step3Mutation.isPending;

  const getStepDescription = () => {
    switch (step) {
      case 1: return 'Completa la información para que la IA genere una propuesta.';
      case 2: return 'Revisa y ajusta las sugerencias de la IA.';
      case 3: return 'Edita el borrador final de tus clases antes de guardar.';
      default: return '';
    }
  };

  return (
    <div className="container mx-auto space-y-6">
      <Link to="/dashboard/planificacion" className="flex items-center text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Volver al Planificador
      </Link>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Asistente de Planificación de Unidad</CardTitle>
          <CardDescription>Paso {step}/3: {getStepDescription()}</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="flex flex-col items-center justify-center text-center h-96">
              <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
              <p className="text-lg font-semibold">La IA está trabajando...</p>
              <p className="text-muted-foreground">Esto puede tardar unos segundos.</p>
            </div>
          )}

          {!isLoading && step === 1 && <Step1UnitConfig onFormSubmit={(data) => step1Mutation.mutate(data)} isLoading={step1Mutation.isPending} />}
          {!isLoading && step === 2 && aiSuggestions && <Step2ReviewSuggestions suggestions={aiSuggestions} onConfirm={(data) => step2Mutation.mutate(data)} isLoading={step2Mutation.isPending || generateSequenceMutation.isPending} />}
          {!isLoading && step === 3 && classSequence && <Step3ClassSequence classSequence={classSequence} onSave={(data) => step3Mutation.mutate(data)} isLoading={step3Mutation.isPending} />}
        </CardContent>
      </Card>
      <AskClassCountDialog
        isOpen={isAskCountDialogOpen}
        onClose={() => setIsAskCountDialogOpen(false)}
        onConfirm={handleGenerateWithManualCount}
      />
    </div>
  );
};

export default NewUnitPlan;