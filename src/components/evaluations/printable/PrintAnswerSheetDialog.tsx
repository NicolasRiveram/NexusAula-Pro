import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

const schema = z.object({
  rows: z.coerce.number().min(1, "Debe haber al menos 1 fila.").max(2, "Máximo 2 filas."),
  includeStudentName: z.boolean().default(true),
});

export type AnswerSheetFormData = z.infer<typeof schema>;

interface PrintAnswerSheetDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: AnswerSheetFormData) => void;
  isPrinting: boolean;
}

const PrintAnswerSheetDialog: React.FC<PrintAnswerSheetDialogProps> = ({ isOpen, onClose, onConfirm, isPrinting }) => {
  const { control, handleSubmit, formState: { errors }, reset } = useForm<AnswerSheetFormData>({
    resolver: zodResolver(schema),
    defaultValues: { rows: 2, includeStudentName: true },
  });

  useEffect(() => {
    if (!isOpen) {
      reset({ rows: 2, includeStudentName: true });
    }
  }, [isOpen, reset]);

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
          <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
            <div className="space-y-0.5">
              <Label htmlFor="includeStudentName">Incluir Nombre del Estudiante</Label>
              <p className="text-xs text-muted-foreground">
                Desactiva esto para generar hojas de respuesta anónimas.
              </p>
            </div>
            <Controller
              name="includeStudentName"
              control={control}
              render={({ field }) => (
                <Switch
                  id="includeStudentName"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
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

export default PrintAnswerSheetDialog;