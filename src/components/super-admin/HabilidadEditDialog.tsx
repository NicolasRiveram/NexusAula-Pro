import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { saveHabilidad, Habilidad } from '@/api/superAdminApi';
import { showSuccess, showError } from '@/utils/toast';

const schema = z.object({
  nombre: z.string().min(3, "El nombre es requerido."),
  descripcion: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface HabilidadEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  habilidad?: Habilidad | null;
}

const HabilidadEditDialog: React.FC<HabilidadEditDialogProps> = ({ isOpen, onClose, onSaved, habilidad }) => {
  const { control, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (isOpen) {
      if (habilidad) {
        reset({ nombre: habilidad.nombre, descripcion: habilidad.descripcion || '' });
      } else {
        reset({ nombre: '', descripcion: '' });
      }
    }
  }, [isOpen, habilidad, reset]);

  const onSubmit = async (data: FormData) => {
    try {
      await saveHabilidad({
        nombre: data.nombre,
        descripcion: data.descripcion || null,
      }, habilidad?.id);
      showSuccess(`Habilidad ${habilidad ? 'actualizada' : 'creada'} correctamente.`);
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
          <DialogTitle>{habilidad ? 'Editar' : 'Crear'} Habilidad</DialogTitle>
          <DialogDescription>
            Define una habilidad curricular y una descripción opcional.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div>
            <Label htmlFor="nombre">Nombre de la Habilidad</Label>
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

export default HabilidadEditDialog;