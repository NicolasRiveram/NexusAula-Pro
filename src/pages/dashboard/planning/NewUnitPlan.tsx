import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import Step1UnitConfig, { UnitPlanFormData } from './Step1_UnitConfig';
import Step2ReviewSuggestions, { AISuggestions } from './Step2_ReviewSuggestions';
import Step3ClassSequence, { ClassPlan } from './Step3_ClassSequence';
import { createUnitPlan, updateUnitPlanSuggestions, scheduleClassesFromUnitPlan, linkNewUnitsToProject } from '@/api/planningApi';
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';

const NewUnitPlan = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  
  const [unitMasterId, setUnitMasterId] = useState<string | null>(null);
  const [proyectoId, setProyectoId] = useState<string | null>(null);
  const [aiSuggestions, setAiSuggestions] = useState<AISuggestions | null>(null);
  const [classSequence, setClassSequence] = useState<ClassPlan[] | null>(null);

  const handleStep1Submit = async (data: UnitPlanFormData) => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuario no autenticado.");

      const newUnitId = await createUnitPlan(data, user.id);
      setUnitMasterId(newUnitId);
      
      if (data.proyectoId && data.proyectoId !== 'none') {
        setProyectoId(data.proyectoId);
      } else {
        setProyectoId(null);
      }
      
      // Call the Edge Function to get AI suggestions
      const { data: suggestions, error } = await supabase.functions.invoke('generate-unit-suggestions', {
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
      showError(`Error en el paso 1: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStep2Confirm = async (data: AISuggestions) => {
    if (!unitMasterId) {
      showError("No se encontró el ID de la unidad maestra.");
      return;
    }
    setIsLoading(true);
    try {
      await updateUnitPlanSuggestions(unitMasterId, data);
      setAiSuggestions(data);

      // Call the Edge Function to generate the class sequence
      const { data: sequence, error } = await supabase.functions.invoke('generate-class-sequence', {
        body: { suggestions: data, projectContext: proyectoId },
      });

      if (error) throw error;
      
      // The sequence from the function doesn't have IDs or dates, which is correct.
      // The backend RPC will handle scheduling. We add temporary IDs for the UI key prop.
      const sequenceWithTempIds = sequence.map((cls: Omit<ClassPlan, 'id' | 'fecha'>, index: number) => ({
        ...cls,
        id: `temp_${index}`,
        fecha: '', // The backend will assign this
      }));

      setClassSequence(sequenceWithTempIds);
      showSuccess("Secuencia de clases generada.");
      setStep(3);
    } catch (error: any) {
      showError(`Error en el paso 2: ${error.message}`);
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
      // Remove temporary IDs before sending to the backend
      const classesToSave = data.classes.map(({ id, fecha, ...rest }) => rest);
      await scheduleClassesFromUnitPlan(unitMasterId, classesToSave);
      
      if (proyectoId) {
        await linkNewUnitsToProject(unitMasterId, proyectoId);
      }
      
      showSuccess("¡Planificación guardada y clases programadas exitosamente!");
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
    </div>
  );
};

export default NewUnitPlan;