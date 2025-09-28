import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import Step1UnitConfig, { UnitPlanFormData } from './Step1_UnitConfig';
import Step2ReviewSuggestions, { AISuggestions } from './Step2_ReviewSuggestions';
import { createUnitPlan } from '@/api/planningApi';
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';

// Datos simulados de la IA
const simulatedAISuggestions: AISuggestions = {
  objetivos: [
    "OA-6: Explicar, con apoyo de modelos, el movimiento de las placas tectónicas y sus consecuencias (sismos, tsunamis y erupciones volcánicas).",
    "OA-7: Investigar y comunicar los efectos de la actividad humana en los océanos, proponiendo acciones para protegerlos.",
    "OA-8: Analizar y comparar las características de los ecosistemas, reconociendo la importancia de la biodiversidad."
  ],
  proposito: "Que los estudiantes comprendan la dinámica de la Tierra y el impacto de la actividad humana en los ecosistemas, desarrollando una conciencia crítica y proponiendo soluciones sostenibles a problemas medioambientales locales.",
  proyectoABP: {
    titulo: "Guardianes de Nuestro Entorno",
    descripcion: "Los estudiantes investigarán un problema medioambiental en su comunidad (contaminación de un río, microbasurales, etc.), analizarán sus causas y consecuencias, y diseñarán una campaña de concienciación y una propuesta de solución viable para presentar a la comunidad escolar o autoridades locales.",
    productoFinal: "Campaña de concienciación (afiches, video, charla) y un informe con la propuesta de solución.",
  },
};

const NewUnitPlan = () => {
  const [step, setStep] = useState(1);
  const [unitData, setUnitData] = useState<UnitPlanFormData | null>(null);
  const [unitMasterId, setUnitMasterId] = useState<string | null>(null);
  const [aiSuggestions, setAiSuggestions] = useState<AISuggestions | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleStep1Submit = async (data: UnitPlanFormData) => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuario no autenticado.");

      const newUnitId = await createUnitPlan(data, user.id);
      setUnitMasterId(newUnitId);
      setUnitData(data);
      
      // Simulación de llamada a la IA
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setAiSuggestions(simulatedAISuggestions);
      showSuccess("Sugerencias generadas por la IA.");
      setStep(2);
    } catch (error: any) {
      showError(`Error al crear la unidad: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStep2Confirm = (data: AISuggestions) => {
    console.log("Sugerencias confirmadas:", data);
    // Lógica para el siguiente paso (generar clases)
    showSuccess("El siguiente paso (generación de clases) se implementará a continuación.");
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
          <CardDescription>
            Paso {step}: {step === 1 ? 'Completa la información para que la IA genere una propuesta.' : 'Revisa y ajusta las sugerencias de la IA.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="flex flex-col items-center justify-center text-center h-96">
              <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
              <p className="text-lg font-semibold">La IA está generando sugerencias...</p>
              <p className="text-muted-foreground">Esto puede tardar unos segundos.</p>
            </div>
          )}

          {!isLoading && step === 1 && (
            <Step1UnitConfig onFormSubmit={handleStep1Submit} isLoading={isLoading} />
          )}
          
          {!isLoading && step === 2 && aiSuggestions && (
            <Step2ReviewSuggestions suggestions={aiSuggestions} onConfirm={handleStep2Confirm} isLoading={false} />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default NewUnitPlan;