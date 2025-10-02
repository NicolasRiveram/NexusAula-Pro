import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { saveAsignatura, Asignatura } from '@/api/superAdminApi';
import { showSuccess, showError } from '@/utils/toast';

const schema = z.object({
  nombre: z.string().min(3, "El nombre es requerido."),
  descripcion: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface AsignaturaEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  asignatura?: Asignatura | null;
}

const AsignaturaEditDialog: React.FC<AsignaturaEditDialogProps> = ({ isOpen, onClose, onSaved, asignatura }) => {
  const { control, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (isOpen) {
      if (asignatura) {
        reset({ nombre: asignatura.nombre, descripcion: asignatura.descripcion || '' });
      } else {
        reset({ nombre: '', descripcion: '' });
      }
    }
  }, [isOpen, asignatura, reset]);

  const onSubmit = async (data: FormData) => {
    try {
      await saveAsignatura(data, asignatura?.id);
      showSuccess(`Asignatura ${asignatura ? 'actualizada' : 'creada'} correctamente.`);
      onSaved();
      onClose();
    } catch (error: any) {
      showError(error.message);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{asignatura ? 'Editar' : 'Crear'} Asignatura</DialogTitle>
          <DialogDescription>
            Define una asignatura y una descripción opcional.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div>
            <Label htmlFor="nombre">Nombre de la Asignatura</Label>
            <Controller name="nombre" control={control} render={({ field }) => <Input id="nombre" {...field} />} />
            {errors.nombre && <p className="text-red-500 text-sm mt-1">{errors.nombre.message}</p>}
          </div>
          <div>
            <Label htmlFor="descripcion">Descripción (Opcional)</Label>
            <Controller name="descripcion" control={control} render={({ field }) => <Textarea id="descripcion" {...field} />} />
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Guardando...' : 'Guardar'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AsignaturaEditDialog;