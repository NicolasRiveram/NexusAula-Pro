import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import Step1GeneralInfo, { EvaluationStep1Data } from '@/components/evaluations/builder/Step1_GeneralInfo';
import Step2ContentBlocks from '@/components/evaluations/builder/Step2_ContentBlocks';
import { createEvaluation } from '@/api/evaluationsApi';
import { showSuccess, showError, showLoading, dismissToast } from '@/utils/toast';
import { format } from 'date-fns';

const EvaluationBuilderPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [evaluationId, setEvaluationId] = useState<string | null>(null);
  const [evaluationTitle, setEvaluationTitle] = useState<string>('');

  const handleStep1Submit = async (data: EvaluationStep1Data) => {
    const toastId = showLoading("Creando evaluación...");
    try {
      const newEvaluationId = await createEvaluation({
        titulo: data.titulo,
        tipo: data.tipo,
        descripcion: data.descripcion || '',
        fecha_aplicacion: format(data.fecha_aplicacion, 'yyyy-MM-dd'),
        cursoAsignaturaIds: data.cursoAsignaturaIds,
      });
      setEvaluationId(newEvaluationId);
      setEvaluationTitle(data.titulo);
      dismissToast(toastId);
      showSuccess("Información general guardada. Ahora añade contenido.");
      setStep(2);
    } catch (error: any) {
      dismissToast(toastId);
      showError(`Error al crear la evaluación: ${error.message}`);
    }
  };

  const handleNextFromContent = () => {
    // For now, this just navigates away. Later it will go to Step 3.
    showSuccess("Contenido y preguntas guardados. La revisión final estará disponible pronto.");
    navigate('/dashboard/evaluacion');
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
          <CardTitle className="text-2xl">Asistente de Creación de Evaluaciones</CardTitle>
          <CardDescription>Paso {step}/3: {getStepDescription()}</CardDescription>
        </CardHeader>
        <CardContent>
          {step === 1 && <Step1GeneralInfo onFormSubmit={handleStep1Submit} />}
          {step === 2 && evaluationId && (
            <Step2ContentBlocks 
              evaluationId={evaluationId} 
              evaluationTitle={evaluationTitle}
              onNextStep={handleNextFromContent}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EvaluationBuilderPage;