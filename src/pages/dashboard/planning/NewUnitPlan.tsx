import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import Step1UnitConfig, { UnitPlanFormData } from './Step1_UnitConfig';
import Step2ReviewSuggestions, { AISuggestions } from './Step2_ReviewSuggestions';
import Step3ClassSequence, { ClassPlan } from './Step3_ClassSequence';
import { createUnitPlan, updateUnitPlanSuggestions, saveMasterPlanClasses, linkNewUnitsToProject } from '@/api/planningApi';
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError, showLoading, dismissToast } from '@/utils/toast';
import { FunctionsHttpError } from '@supabase/supabase-js';
import { useEstablishment } from '@/contexts/EstablishmentContext';
import { format } from 'date-fns';
import AskClassCountDialog from '@/components/planning/AskClassCountDialog';

const NewUnitPlan = () => {
  const navigate = useNavigate();
  const { activeEstablishment } = useEstablishment();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  
  const [unitMasterId, setUnitMasterId] = useState<string | null>(null);
  const [proyectoId, setProyectoId] = useState<string | null>(null);
  const [unitPlanData, setUnitPlanData] = useState<UnitPlanFormData | null>(null);
  const [aiSuggestions, setAiSuggestions] = useState<AISuggestions | null>(null);
  const [classSequence, setClassSequence] = useState<ClassPlan[] | null>(null);
  const [isAskCountDialogOpen, setIsAskCountDialogOpen] = useState(false);
  const [tempAiSuggestions, setTempAiSuggestions] = useState<AISuggestions | null>(null);

  const handleStep1Submit = async (data: UnitPlanFormData) => {
    setIsLoading(true);
    setUnitPlanData(data);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error("Usuario no autenticado.");

      const newUnitId = await createUnitPlan(data, session.user.id);
      setUnitMasterId(newUnitId);
      
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
      
      setAiSuggestions(suggestions);
      showSuccess("Sugerencias de Objetivos y Proyecto generadas.");
      setStep(2);
    } catch (error: any) {
      if (error instanceof FunctionsHttpError) {
        const errorMessage = await error.context.json();
        showError(`Error en el paso 1: ${errorMessage.error}`);
      } else {
        showError(`Error en el paso 1: ${error.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateWithManualCount = async (count: number) => {
    setIsAskCountDialogOpen(false);
    if (!unitMasterId || !tempAiSuggestions) {
      showError("Faltan datos para generar las clases.");
      return;
    }
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Usuario no autenticado.");

      const BATCH_SIZE = 8;
      const totalBatches = Math.ceil(count / BATCH_SIZE);
      let allSequences: ClassPlan[] = [];

      for (let i = 0; i < count; i += BATCH_SIZE) {
        const batchNumber = (i / BATCH_SIZE) + 1;
        const countInBatch = Math.min(BATCH_SIZE, count - i);
        const batchToastId = showLoading(`Generando clases ${i + 1} a ${i + countInBatch} (lote ${batchNumber}/${totalBatches})...`);

        const { data: sequence, error } = await supabase.functions.invoke('generate-class-sequence', {
          headers: { Authorization: `Bearer ${session.access_token}` },
          body: { 
            suggestions: tempAiSuggestions, 
            projectContext: proyectoId, 
            classCount: countInBatch,
            batchNumber,
            totalBatches,
          },
        });
        
        dismissToast(batchToastId);
        if (error) throw error;

        allSequences = [...allSequences, ...sequence];
      }
      
      const sequenceWithTempIds = allSequences.map((cls: Omit<ClassPlan, 'id' | 'fecha'>, index: number) => ({
        ...cls,
        id: `temp_${index}`,
        fecha: '',
      }));

      setClassSequence(sequenceWithTempIds);
      showSuccess("Secuencia de clases generada como plantillas.");
      setStep(3);
    } catch (error: any) {
      if (error instanceof FunctionsHttpError) {
        const errorMessage = await error.context.json();
        showError(`Error al generar secuencia: ${errorMessage.error}`);
      } else {
        showError(`Error al generar secuencia: ${error.message}`);
      }
    } finally {
      setIsLoading(false);
      setTempAiSuggestions(null);
    }
  };

  const handleStep2Confirm = async (data: AISuggestions) => {
    if (!unitMasterId || !unitPlanData || !activeEstablishment) {
      showError("Faltan datos de la unidad o del establecimiento.");
      return;
    }
    setIsLoading(true);
    try {
      await updateUnitPlanSuggestions(unitMasterId, data);
      setAiSuggestions(data);

      const { data: classCount, error: countError } = await supabase.rpc('calculate_class_slots', {
        p_start_date: format(unitPlanData.fechas.from, 'yyyy-MM-dd'),
        p_end_date: format(unitPlanData.fechas.to, 'yyyy-MM-dd'),
        p_curso_asignatura_ids: unitPlanData.cursoAsignaturaIds,
        p_establecimiento_id: activeEstablishment.id,
      });

      if (countError) throw countError;

      if (classCount > 0) {
        showSuccess(`Se generará una secuencia de ${classCount} clases.`);
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
              suggestions: data, 
              projectContext: proyectoId, 
              classCount: countInBatch,
              batchNumber,
              totalBatches,
            },
          });
          
          dismissToast(batchToastId);
          if (error) throw error;

          allSequences = [...allSequences, ...sequence];
        }
        
        const sequenceWithTempIds = allSequences.map((cls: Omit<ClassPlan, 'id' | 'fecha'>, index: number) => ({
          ...cls,
          id: `temp_${index}`,
          fecha: '',
        }));

        setClassSequence(sequenceWithTempIds);
        setStep(3);
      } else {
        setTempAiSuggestions(data);
        setIsAskCountDialogOpen(true);
      }
    } catch (error: any) {
      if (error instanceof FunctionsHttpError) {
        const errorMessage = await error.context.json();
        showError(`Error en el paso 2: ${errorMessage.error}`);
      } else {
        showError(`Error en el paso 2: ${error.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleStep3Save = async (data: { classes: ClassPlan[] }) => {
    if (!unitMasterId) {
      showError("Error: No se encontró el ID de la unidad para guardar.");
      return;
    }
    setIsLoading(true);
    try {
      const classesToSave = data.classes.map(({ id, fecha, ...rest }) => rest);
      await saveMasterPlanClasses(unitMasterId, classesToSave);
      
      showSuccess("¡Planificación guardada exitosamente! Ahora puedes programarla desde la página de edición.");
      setTimeout(() => navigate('/dashboard/planificacion'), 2000);
    } catch (error: any) {
      showError(`Error al guardar la planificación: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

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

          {!isLoading && step === 1 && <Step1UnitConfig onFormSubmit={handleStep1Submit} isLoading={isLoading} />}
          {!isLoading && step === 2 && aiSuggestions && <Step2ReviewSuggestions suggestions={aiSuggestions} onConfirm={handleStep2Confirm} isLoading={isLoading} />}
          {!isLoading && step === 3 && classSequence && <Step3ClassSequence classSequence={classSequence} onSave={handleStep3Save} isLoading={isLoading} />}
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