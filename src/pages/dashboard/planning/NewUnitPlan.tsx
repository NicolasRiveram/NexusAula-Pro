import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import Step1UnitConfig, { UnitPlanFormData } from './Step1_UnitConfig';
import Step2ReviewSuggestions, { AISuggestions } from './Step2_ReviewSuggestions';
import Step3ClassSequence, { ClassPlan } from './Step3_ClassSequence';
import { createUnitPlan, updateUnitPlanSuggestions } from '@/api/planningApi';
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';

// --- DATOS SIMULADOS ---
const simulatedAISuggestions: AISuggestions = {
  objetivos: ["OA-6: Explicar el movimiento de placas tectónicas.", "OA-7: Comunicar efectos de la actividad humana en océanos.", "OA-8: Analizar características de ecosistemas."],
  proposito: "Que los estudiantes comprendan la dinámica de la Tierra y el impacto humano en los ecosistemas, desarrollando conciencia crítica.",
  proyectoABP: {
    titulo: "Guardianes de Nuestro Entorno",
    descripcion: "Investigar un problema medioambiental local, analizar causas y diseñar una campaña de concienciación y solución.",
    productoFinal: "Campaña de concienciación (video, afiches) y propuesta de solución.",
  },
};

const simulatedClassSequence: ClassPlan[] = [
  { id: 'temp_1', fecha: '2024-08-05', titulo: 'Clase 1: Introducción a los Ecosistemas', objetivos_clase: 'Identificar componentes bióticos y abióticos.', actividades_inicio: 'Lluvia de ideas sobre "¿Qué es un ecosistema?".', actividades_desarrollo: 'Definición formal. Salida al patio para identificar componentes.', actividades_cierre: 'Puesta en común. Ticket de salida.', recursos: 'Imágenes, pizarra, patio escolar.' },
  { id: 'temp_2', fecha: '2024-08-07', titulo: 'Clase 2: Cadenas y Redes Tróficas', objetivos_clase: 'Construir modelos de redes tróficas.', actividades_inicio: 'Pregunta: "¿De dónde obtienen energía los seres vivos?".', actividades_desarrollo: 'Explicación de roles. Juego de roles con hilos para formar una red.', actividades_cierre: 'Dibujar la red formada. Reflexionar sobre eslabones perdidos.', recursos: 'Pizarra, ovillos de lana, tarjetas.' },
];
// --- FIN DATOS SIMULADOS ---

const NewUnitPlan = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  
  const [unitMasterId, setUnitMasterId] = useState<string | null>(null);
  const [aiSuggestions, setAiSuggestions] = useState<AISuggestions | null>(null);
  const [classSequence, setClassSequence] = useState<ClassPlan[] | null>(null);

  const handleStep1Submit = async (data: UnitPlanFormData) => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuario no autenticado.");

      const newUnitId = await createUnitPlan(data, user.id);
      setUnitMasterId(newUnitId);
      
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simular llamada a IA
      
      setAiSuggestions(simulatedAISuggestions);
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

      await new Promise(resolve => setTimeout(resolve, 2000)); // Simular generación de clases
      
      setClassSequence(simulatedClassSequence);
      showSuccess("Secuencia de clases generada.");
      setStep(3);
    } catch (error: any) {
      showError(`Error en el paso 2: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStep3Save = (data: { classes: ClassPlan[] }) => {
    console.log("Datos finales para guardar:", { unitMasterId, suggestions: aiSuggestions, classes: data.classes });
    // La lógica para guardar las clases en la tabla 'planificaciones_clase' se implementará aquí.
    // Esto incluirá el cálculo de fechas para cada curso vinculado.
    showSuccess("Planificación guardada exitosamente. Redirigiendo...");
    setTimeout(() => navigate('/dashboard/planificacion'), 1500);
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
          <CardDescription>Paso {step}: {getStepDescription()}</CardDescription>
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