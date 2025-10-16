import React from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

export interface ClassPlan {
  id: string;
  fecha: string; // This will be an empty string initially
  titulo: string;
  objetivos_clase: string;
  objetivo_estudiante: string;
  aporte_proyecto: string;
  actividades_inicio: string;
  actividades_desarrollo: string;
  actividades_cierre: string;
  recursos: string;
  objetivo_aprendizaje_texto: string;
  habilidades: string;
  vinculo_interdisciplinario: string;
  aspectos_valoricos_actitudinales: string;
}

interface Step3ClassSequenceProps {
  classSequence: ClassPlan[];
  onSave: (data: { classes: ClassPlan[] }) => void;
  isLoading: boolean;
}

const Step3ClassSequence: React.FC<Step3ClassSequenceProps> = ({ classSequence, onSave, isLoading }) => {
  const { control, handleSubmit } = useForm<{ classes: ClassPlan[] }>({
    defaultValues: { classes: classSequence },
  });

  const { fields } = useFieldArray({
    control,
    name: 'classes',
  });

  return (
    <form onSubmit={handleSubmit(onSave)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Secuencia de Clases Sugerida</CardTitle>
          <CardDescription>
            Este es el borrador de tu unidad. Puedes editar cualquier campo antes de guardar y programar las clases. Las fechas se asignarán automáticamente según tu horario.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          {fields.map((field, index) => (
            <div key={field.id}>
              <h3 className="text-xl font-semibold mb-4">
                Clase {index + 1}
              </h3>
              <div className="space-y-4 p-4 border rounded-md">
                <div>
                  <Label>Título de la Clase</Label>
                  <Controller name={`classes.${index}.titulo`} control={control} render={({ field }) => <Input {...field} />} />
                </div>
                <div>
                  <Label>Objetivo de Aprendizaje (OA)</Label>
                  <Controller name={`classes.${index}.objetivo_aprendizaje_texto`} control={control} render={({ field }) => <Textarea {...field} rows={2} placeholder="Ej: OA 6: Explicar que la energía es necesaria para que los objetos cambien y los seres vivos realicen sus procesos..." />} />
                </div>
                <div>
                  <Label>Habilidades a Desarrollar</Label>
                  <Controller name={`classes.${index}.habilidades`} control={control} render={({ field }) => <Input {...field} placeholder="Ej: Observar, formular preguntas, analizar, comunicar." />} />
                </div>
                <div>
                  <Label>Objetivo de la Clase (para el docente)</Label>
                  <Controller name={`classes.${index}.objetivos_clase`} control={control} render={({ field }) => <Textarea {...field} rows={2} />} />
                </div>
                 <div>
                  <Label>Objetivo para el Estudiante</Label>
                  <Controller name={`classes.${index}.objetivo_estudiante`} control={control} render={({ field }) => <Input {...field} placeholder="¡Hoy descubriremos cómo...!" />} />
                </div>
                <div>
                  <Label>Aporte al Proyecto</Label>
                  <Controller name={`classes.${index}.aporte_proyecto`} control={control} render={({ field }) => <Input {...field} placeholder="Esta clase nos ayuda a..." />} />
                </div>
                <div>
                  <Label>Actividades de Inicio</Label>
                  <Controller name={`classes.${index}.actividades_inicio`} control={control} render={({ field }) => <Textarea {...field} rows={3} />} />
                </div>
                <div>
                  <Label>Actividades de Desarrollo</Label>
                  <Controller name={`classes.${index}.actividades_desarrollo`} control={control} render={({ field }) => <Textarea {...field} rows={5} />} />
                </div>
                <div>
                  <Label>Actividades de Cierre</Label>
                  <Controller name={`classes.${index}.actividades_cierre`} control={control} render={({ field }) => <Textarea {...field} rows={3} />} />
                </div>
                <div>
                  <Label>Recursos</Label>
                  <Controller name={`classes.${index}.recursos`} control={control} render={({ field }) => <Input {...field} />} />
                </div>
                <div>
                  <Label>Vínculo Interdisciplinario</Label>
                  <Controller name={`classes.${index}.vinculo_interdisciplinario`} control={control} render={({ field }) => <Input {...field} placeholder="Ej: Conexión con Artes Visuales al dibujar ecosistemas." />} />
                </div>
                <div>
                  <Label>Aspectos Valóricos y Actitudinales</Label>
                  <Controller name={`classes.${index}.aspectos_valoricos_actitudinales`} control={control} render={({ field }) => <Input {...field} placeholder="Ej: Fomentar el trabajo en equipo y el respeto por el medio ambiente." />} />
                </div>
              </div>
              {index < fields.length - 1 && <Separator className="my-8" />}
            </div>
          ))}
        </CardContent>
      </Card>
      <div className="flex justify-end">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Guardando...' : 'Guardar y Programar Clases'}
        </Button>
      </div>
    </form>
  );
};

export default Step3ClassSequence;