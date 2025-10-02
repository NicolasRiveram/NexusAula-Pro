import React from 'react';
import { Controller, Control } from 'react-hook-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { EvaluationDetail } from '@/api/evaluationsApi';

interface Step3FinalReviewProps {
  control: Control<any>;
  evaluation: EvaluationDetail;
}

const Step3FinalReview: React.FC<Step3FinalReviewProps> = ({ control, evaluation }) => {
  const totalPreguntas = evaluation.evaluation_content_blocks.reduce((acc, block) => acc + block.evaluacion_items.length, 0);
  const totalPuntaje = evaluation.evaluation_content_blocks.reduce((acc, block) => {
    return acc + block.evaluacion_items.reduce((itemAcc, item) => itemAcc + item.puntaje, 0);
  }, 0);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Resumen de la Evaluación</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-sm text-muted-foreground">Título</p>
            <p className="font-semibold">{evaluation.titulo}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">N° de Preguntas</p>
            <p className="font-semibold">{totalPreguntas}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Puntaje Total</p>
            <p className="font-semibold">{totalPuntaje}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Opciones de Aplicación</CardTitle>
          <CardDescription>Configura cómo se presentará la evaluación a los estudiantes.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
            <div className="space-y-0.5">
              <Label>Aleatorizar orden de las preguntas</Label>
              <p className="text-xs text-muted-foreground">
                Cada estudiante verá las preguntas en un orden diferente.
              </p>
            </div>
            <Controller
              name="randomizar_preguntas"
              control={control}
              render={({ field }) => (
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
          </div>
          <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
            <div className="space-y-0.5">
              <Label>Aleatorizar orden de las alternativas</Label>
              <p className="text-xs text-muted-foreground">
                Las alternativas de cada pregunta se mostrarán en un orden diferente.
              </p>
            </div>
            <Controller
              name="randomizar_alternativas"
              control={control}
              render={({ field }) => (
                <Switch
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

export default Step3FinalReview;