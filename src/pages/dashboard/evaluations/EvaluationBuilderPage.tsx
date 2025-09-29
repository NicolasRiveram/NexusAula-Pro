import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import Step1GeneralInfo from '@/components/evaluations/builder/Step1_GeneralInfo';

const EvaluationBuilderPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);

  const handleStep1Submit = (data: any) => {
    console.log("Step 1 Data:", data);
    // Lógica para guardar y pasar al siguiente paso
    setStep(2);
  };

  const getStepDescription = () => {
    switch (step) {
      case 1: return 'Define la información general de tu evaluación.';
      case 2: return 'Añade bloques de contenido para contextualizar la IA.';
      case 3: return 'Genera, revisa y edita las preguntas para cada bloque.';
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
          {/* Aquí se renderizarán los siguientes pasos */}
        </CardContent>
      </Card>
    </div>
  );
};

export default EvaluationBuilderPage;