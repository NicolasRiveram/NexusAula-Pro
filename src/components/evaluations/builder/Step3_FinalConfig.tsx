import React from 'react';
import { Control } from 'react-hook-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Controller } from 'react-hook-form';
import { EvaluationStep1Data } from './Step1_GeneralInfo'; // Reutilizamos parte del tipo

interface Step3FinalConfigProps {
  control: Control<any>; // Usamos 'any' para flexibilidad con los nuevos campos
}

const Step3FinalConfig: React.FC<Step3FinalConfigProps> = ({ control }) => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Opciones de Aleatorización</CardTitle>
          <CardDescription>
            Configura cómo se presentará la evaluación a los estudiantes para crear diferentes versiones.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="randomizar_preguntas" className="text-base">
                Aleatorizar Orden de Preguntas
              </Label>
              <p className="text-sm text-muted-foreground">
                Cada estudiante verá las preguntas en un orden diferente (crea "filas").
              </p>
            </div>
            <Controller
              name="randomizar_preguntas"
              control={control}
              render={({ field }) => (
                <Switch
                  id="randomizar_preguntas"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
          </div>
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="randomizar_alternativas" className="text-base">
                Aleatorizar Orden de Alternativas
              </Label>
              <p className="text-sm text-muted-foreground">
                Las alternativas de cada pregunta de selección múltiple se mostrarán en orden aleatorio.
              </p>
            </div>
            <Controller
              name="randomizar_alternativas"
              control={control}
              render={({ field }) => (
                <Switch
                  id="randomizar_alternativas"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Step3FinalConfig;