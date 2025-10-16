import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export interface AISuggestions {
  objetivos: string[];
  proposito: string;
  proyectoABP: {
    titulo: string;
    descripcion: string;
    productoFinal: string;
  };
}

interface Step2ReviewSuggestionsProps {
  suggestions: AISuggestions;
  onConfirm: (data: AISuggestions) => void;
  isLoading: boolean;
}

const Step2ReviewSuggestions: React.FC<Step2ReviewSuggestionsProps> = ({ suggestions, onConfirm, isLoading }) => {
  const { control, handleSubmit } = useForm<AISuggestions>({
    defaultValues: suggestions,
  });

  return (
    <form onSubmit={handleSubmit(onConfirm)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Objetivos de Aprendizaje (OA) Sugeridos</CardTitle>
          <CardDescription>Estos son los OA que la IA considera más relevantes. Puedes editarlos.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {suggestions.objetivos.map((oa, index) => (
            <Controller
              key={index}
              name={`objetivos.${index}`}
              control={control}
              render={({ field }) => <Input {...field} />}
            />
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Propósito de la Unidad</CardTitle>
        </CardHeader>
        <CardContent>
          <Controller
            name="proposito"
            control={control}
            render={({ field }) => <Textarea {...field} rows={3} />}
          />
        </CardContent>
      </Card>

      <Card className="border-primary">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Proyecto ABP Sugerido</CardTitle>
            <Badge>ABP</Badge>
          </div>
          <CardDescription>Una idea de proyecto para aplicar los conocimientos de la unidad.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Título del Proyecto</Label>
            <Controller
              name="proyectoABP.titulo"
              control={control}
              render={({ field }) => <Input {...field} />}
            />
          </div>
          <div>
            <Label>Descripción</Label>
            <Controller
              name="proyectoABP.descripcion"
              control={control}
              render={({ field }) => <Textarea {...field} rows={4} />}
            />
          </div>
          <div>
            <Label>Producto Final</Label>
            <Controller
              name="proyectoABP.productoFinal"
              control={control}
              render={({ field }) => <Input {...field} />}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Generando...' : 'Confirmar y Generar Secuencia de Clases'}
        </Button>
      </div>
    </form>
  );
};

export default Step2ReviewSuggestions;