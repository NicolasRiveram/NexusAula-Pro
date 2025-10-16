import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { updateClassLog } from '@/api/planningApi';
import { showSuccess, showError } from '@/utils/toast';
import { AgendaClase } from '@/api/dashboardApi';
import { useMutation, useQueryClient } from '@tanstack/react-query';

const schema = z.object({
  contenido: z.string().min(1, "Debes describir el contenido cubierto."),
  observaciones: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface ClassLogDialogProps {
  isOpen: boolean;
  onClose: () => void;
  clase: AgendaClase | null;
}

const ClassLogDialog: React.FC<ClassLogDialogProps> = ({ isOpen, onClose, clase }) => {
  const queryClient = useQueryClient();
  const { control, handleSubmit, formState: { errors }, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  React.useEffect(() => {
    if (!isOpen) {
      reset({ contenido: '', observaciones: '' });
    }
  }, [isOpen, reset]);

  const mutation = useMutation({
    mutationFn: (data: FormData) => {
      if (!clase) throw new Error("No class selected for logging.");
      return updateClassLog(clase.id, data.contenido, data.observaciones || '');
    },
    onSuccess: () => {
      showSuccess("Bitácora guardada exitosamente.");
      queryClient.invalidateQueries({ queryKey: ['dailyAgenda'] });
      queryClient.invalidateQueries({ queryKey: ['pendingLogs'] });
      onClose();
    },
    onError: (error: any) => {
      showError(`Error al guardar: ${error.message}`);
    }
  });

  const onSubmit = (data: FormData) => {
    mutation.mutate(data);
  };

  if (!clase) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Bitácora de Clase</DialogTitle>
          <DialogDescription>
            Registra lo sucedido en la clase de <span className="font-semibold">{clase.titulo}</span> para el <span className="font-semibold">{clase.curso_info.nivel} {clase.curso_info.nombre}</span>.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div>
            <Label htmlFor="contenido">Contenido Cubierto</Label>
            <Controller
              name="contenido"
              control={control}
              render={({ field }) => <Textarea id="contenido" rows={4} {...field} />}
            />
            {errors.contenido && <p className="text-red-500 text-sm mt-1">{errors.contenido.message}</p>}
          </div>
          <div>
            <Label htmlFor="observaciones">Observaciones (Opcional)</Label>
            <Controller
              name="observaciones"
              control={control}
              render={({ field }) => <Textarea id="observaciones" rows={3} placeholder="Dificultades, logros, anécdotas, etc." {...field} />}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Guardando...' : 'Guardar Bitácora'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ClassLogDialog;