import React, { useEffect } from 'react';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Trash2 } from 'lucide-react';
import { EvaluationItem } from '@/api/evaluations';

const alternativeSchema = z.object({
  texto: z.string().min(1, "El texto no puede estar vacío."),
  es_correcta: z.boolean(),
  orden: z.number(),
});

const schema = z.object({
  enunciado: z.string().min(10, "El enunciado es muy corto."),
  puntaje: z.coerce.number().min(0, "El puntaje no puede ser negativo."),
  alternativas: z.array(alternativeSchema).min(2, "Debe haber al menos 2 alternativas."),
});

type FormData = z.infer<typeof schema>;

interface EditQuestionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: EvaluationItem, data: FormData) => void;
  item: EvaluationItem | null;
}

const EditQuestionDialog: React.FC<EditQuestionDialogProps> = ({ isOpen, onClose, onSave, item }) => {
  const { control, handleSubmit, reset, watch, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "alternativas",
  });

  const correctAlternativeIndex = watch('alternativas', []).findIndex(alt => alt.es_correcta);

  useEffect(() => {
    if (item) {
      reset({
        enunciado: item.enunciado,
        puntaje: item.puntaje,
        alternativas: item.item_alternativas.map(alt => ({ ...alt })),
      });
    }
  }, [item, reset]);

  const onSubmit = (data: FormData) => {
    if (item) {
      onSave(item, data);
    }
  };

  if (!item) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Editar Pregunta</DialogTitle>
          <DialogDescription>Modifica el enunciado, las alternativas y la respuesta correcta.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div>
            <Label htmlFor="enunciado">Enunciado</Label>
            <Controller name="enunciado" control={control} render={({ field }) => <Textarea id="enunciado" rows={3} {...field} />} />
            {errors.enunciado && <p className="text-red-500 text-sm mt-1">{errors.enunciado.message}</p>}
          </div>
          <div>
            <Label htmlFor="puntaje">Puntaje</Label>
            <Controller name="puntaje" control={control} render={({ field }) => <Input id="puntaje" type="number" {...field} />} />
            {errors.puntaje && <p className="text-red-500 text-sm mt-1">{errors.puntaje.message}</p>}
          </div>
          <div>
            <Label>Alternativas</Label>
            <RadioGroup
              value={correctAlternativeIndex.toString()}
              onValueChange={(value) => {
                const index = parseInt(value, 10);
                fields.forEach((field, i) => {
                  setValue(`alternativas.${i}.es_correcta`, i === index);
                });
              }}
            >
              <div className="space-y-2">
                {fields.map((field, index) => (
                  <div key={field.id} className="flex items-center gap-2">
                    <RadioGroupItem value={index.toString()} id={`alt-${index}`} />
                    <Controller
                      name={`alternativas.${index}.texto`}
                      control={control}
                      render={({ field }) => <Input placeholder={`Alternativa ${String.fromCharCode(97 + index)}`} {...field} />}
                    />
                    <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} disabled={fields.length <= 2}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            </RadioGroup>
            {errors.alternativas && <p className="text-red-500 text-sm mt-1">{errors.alternativas.message || errors.alternativas.root?.message}</p>}
          </div>
          <Button type="button" variant="outline" size="sm" onClick={() => append({ texto: '', es_correcta: false, orden: fields.length + 1 })}>
            Añadir Alternativa
          </Button>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Guardando...' : 'Guardar Cambios'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditQuestionDialog;