import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { saveNivel, Nivel, NivelData } from '@/api/superAdminApi';
import { showSuccess, showError } from '@/utils/toast';

const schema = z.object({
  nombre: z.string().min(3, "El nombre es requerido."),
  orden: z.coerce.number().int("El orden debe ser un número entero."),
});

type FormData = z.infer<typeof schema>;

interface NivelEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  nivel?: Nivel | null;
}

const NivelEditDialog: React.FC<NivelEditDialogProps> = ({ isOpen, onClose, onSaved, nivel }) => {
  const { control, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (isOpen) {
      if (nivel) {
        reset({ nombre: nivel.nombre, orden: nivel.orden });
      } else {
        reset({ nombre: '', orden: 0 });
      }
    }
  }, [isOpen, nivel, reset]);

  const onSubmit = async (data: FormData) => {
    try {
      const nivelData: NivelData = {
        nombre: data.nombre,
        orden: data.orden,
      };
      await saveNivel(nivelData, nivel?.id);
      showSuccess(`Nivel ${nivel ? 'actualizado' : 'creado'} correctamente.`);
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
          <DialogTitle>{nivel ? 'Editar' : 'Crear'} Nivel Educativo</DialogTitle>
          <DialogDescription>
            Define un nivel educativo y su orden de aparición en las listas.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div>
            <Label htmlFor="nombre">Nombre del Nivel</Label>
            <Controller name="nombre" control={control} render={({ field }) => <Input id="nombre" {...field} />} />
            {errors.nombre && <p className="text-red-500 text-sm mt-1">{errors.nombre.message}</p>}
          </div>
          <div>
            <Label htmlFor="orden">Orden</Label>
            <Controller name="orden" control={control} render={({ field }) => <Input id="orden" type="number" {...field} />} />
            {errors.orden && <p className="text-red-500 text-sm mt-1">{errors.orden.message}</p>}
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

export default NivelEditDialog;