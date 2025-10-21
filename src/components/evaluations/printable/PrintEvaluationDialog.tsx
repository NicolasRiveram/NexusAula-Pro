import React from 'react';
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
  fontSize: z.enum(['text-sm', 'text-base', 'text-lg']),
});

export type PrintFormData = z.infer<typeof schema>;

interface PrintEvaluationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: PrintFormData) => void;
  isPrinting: boolean;
}

const PrintEvaluationDialog: React.FC<PrintEvaluationDialogProps> = ({ isOpen, onClose, onConfirm, isPrinting }) => {
  const { control, handleSubmit, formState: { errors } } = useForm<PrintFormData>({
    resolver: zodResolver(schema),
    defaultValues: { rows: 1, seed: 'nexus-2024', fontSize: 'text-base' },
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Configurar Impresión de Evaluación</DialogTitle>
          <DialogDescription>
            Selecciona las opciones para generar la evaluación impresa. Puedes crear múltiples "filas" (versiones) con orden aleatorio de preguntas y/o alternativas.
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
                    {[1, 2].map(num => <SelectItem key={num} value={String(num)}>{num} Fila{num > 1 ? 's' : ''}</SelectItem>)}
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
              Esta palabra actúa como un código. Al usar la misma palabra, te aseguras de que el orden para cada 'Fila' sea siempre idéntico, ideal si necesitas reimprimir una versión.
            </p>
            {errors.seed && <p className="text-red-500 text-sm mt-1">{errors.seed.message}</p>}
          </div>
          <div>
            <Label htmlFor="fontSize">Tamaño de la letra</Label>
            <Controller
              name="fontSize"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger id="fontSize"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text-sm">Pequeño</SelectItem>
                    <SelectItem value="text-base">Normal</SelectItem>
                    <SelectItem value="text-lg">Grande</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
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

export default PrintEvaluationDialog;