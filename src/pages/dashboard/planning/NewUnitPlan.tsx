import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import Step1UnitConfig from './Step1_UnitConfig';

const NewUnitPlan = () => {
  const [step, setStep] = useState(1);
  const [unitData, setUnitData] = useState(null);

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
            Paso {step}: Completa la información para que la IA genere una propuesta de planificación.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === 1 && <Step1UnitConfig />}
          {/* Los siguientes pasos se implementarán a continuación */}
        </CardContent>
      </Card>
    </div>
  );
};

export default NewUnitPlan;