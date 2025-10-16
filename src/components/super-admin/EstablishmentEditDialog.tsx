import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { saveEstablishment, Establishment, EstablishmentData } from '@/api/super-admin';
import { showSuccess, showError } from '@/utils/toast';
import { useMutation } from '@tanstack/react-query';

const schema = z.object({
  nombre: z.string().min(3, "El nombre es requerido."),
  direccion: z.string().optional(),
  comuna: z.string().optional(),
  region: z.string().optional(),
  telefono: z.string().optional(),
  email_contacto: z.string().email("Email inválido.").optional().or(z.literal('')),
});

type FormData = z.infer<typeof schema>;

interface EstablishmentEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  establishment?: Establishment | null;
}

const EstablishmentEditDialog: React.FC<EstablishmentEditDialogProps> = ({ isOpen, onClose, onSaved, establishment }) => {
  const { control, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (isOpen) {
      if (establishment) {
        reset({
          nombre: establishment.nombre,
          direccion: establishment.direccion || '',
          comuna: establishment.comuna || '',
          region: establishment.region || '',
          telefono: establishment.telefono || '',
          email_contacto: establishment.email_contacto || '',
        });
      } else {
        reset({
          nombre: '',
          direccion: '',
          comuna: '',
          region: '',
          telefono: '',
          email_contacto: '',
        });
      }
    }
  }, [isOpen, establishment, reset]);

  const mutation = useMutation({
    mutationFn: (data: FormData) => saveEstablishment(data, establishment?.id),
    onSuccess: () => {
      showSuccess(`Establecimiento ${establishment ? 'actualizado' : 'creado'} correctamente.`);
      onSaved();
      onClose();
    },
    onError: (error: any) => {
      showError(error.message);
    }
  });

  const onSubmit = (data: FormData) => {
    mutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{establishment ? 'Editar' : 'Crear'} Establecimiento</DialogTitle>
          <DialogDescription>
            Completa la información del establecimiento educativo.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div>
            <Label htmlFor="nombre">Nombre</Label>
            <Controller name="nombre" control={control} render={({ field }) => <Input id="nombre" {...field} />} />
            {errors.nombre && <p className="text-red-500 text-sm mt-1">{errors.nombre.message}</p>}
          </div>
          <div>
            <Label htmlFor="direccion">Dirección</Label>
            <Controller name="direccion" control={control} render={({ field }) => <Input id="direccion" {...field} />} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="comuna">Comuna</Label>
              <Controller name="comuna" control={control} render={({ field }) => <Input id="comuna" {...field} />} />
            </div>
            <div>
              <Label htmlFor="region">Región</Label>
              <Controller name="region" control={control} render={({ field }) => <Input id="region" {...field} />} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="telefono">Teléfono</Label>
              <Controller name="telefono" control={control} render={({ field }) => <Input id="telefono" {...field} />} />
            </div>
            <div>
              <Label htmlFor="email_contacto">Email de Contacto</Label>
              <Controller name="email_contacto" control={control} render={({ field }) => <Input id="email_contacto" type="email" {...field} />} />
              {errors.email_contacto && <p className="text-red-500 text-sm mt-1">{errors.email_contacto.message}</p>}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={mutation.isPending}>{mutation.isPending ? 'Guardando...' : 'Guardar'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EstablishmentEditDialog;