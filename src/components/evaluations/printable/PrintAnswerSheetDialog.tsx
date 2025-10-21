import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const schema = z.object({
  rows: z.coerce.number().min(1, "Debe haber al menos 1 fila.").max(2, "Máximo 2 filas."),
  seed: z.string().min(3, "La semilla debe tener al menos 3 caracteres."),
});

export type AnswerSheetFormData = z.infer<typeof schema>;

interface PrintAnswerSheetDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: AnswerSheetFormData) => void;
  isPrinting: boolean;
  evaluationId: string | null;
}

const PrintAnswerSheetDialog: React.FC<PrintAnswerSheetDialogProps> = ({ isOpen, onClose, onConfirm, isPrinting, evaluationId }) => {
  const { control, handleSubmit, formState: { errors }, reset } = useForm<AnswerSheetFormData>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (evaluationId) {
      reset({
        rows: 2,
        seed: `eval-${evaluationId.substring(0, 8)}`,
      });
    }
  }, [evaluationId, reset]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Generar Hojas de Respuesta</DialogTitle>
          <DialogDescription>
            Configura la generación de filas (versiones) para la evaluación. Se creará una hoja de respuesta para cada estudiante y una pauta de corrección para el docente.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onConfirm)} className="space-y-4 py-4">
          <div>
            <Label htmlFor="rows">Número de Filas (Versiones)</Label>
            <Controller
              name="rows"
              control={control}
              render={({ field }) => (
                <Select onValueChange={(val) => field.onChange(Number(val))} value={String(field.value)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 Fila</SelectItem>
                    <SelectItem value="2">2 Filas (A y B)</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {errors.rows && <p className="text-red-500 text-sm mt-1">{errors.rows.message}</p>}
          </div>
          <div>
            <Label htmlFor="seed">Palabra Clave (Semilla)</Label>
            <Controller
              name="seed"
              control={control}
              render={({ field }) => <Input id="seed" placeholder="Ej: lenguaje-unidad1-mayo" {...field} />}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Usa la misma palabra clave para la pauta de corrección. Esto garantiza que la cámara y la pauta sepan el orden correcto de las alternativas.
            </p>
            {errors.seed && <p className="text-red-500 text-sm mt-1">{errors.seed.message}</p>}
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={isPrinting}>
              {isPrinting ? 'Generando...' : 'Generar e Imprimir'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default PrintAnswerSheetDialog;