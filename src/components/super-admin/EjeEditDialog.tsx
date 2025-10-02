import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { saveEje, Eje, Asignatura } from '@/api/superAdminApi';
import { showSuccess, showError } from '@/utils/toast';

const schema = z.object({
  nombre: z.string().min(3, "El nombre es requerido."),
  descripcion: z.string().optional(),
  asignatura_id: z.string().uuid("Debes seleccionar una asignatura."),
});

type FormData = z.infer<typeof schema>;

interface EjeEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  eje?: Eje | null;
  asignaturas: Asignatura[];
}

const EjeEditDialog: React.FC<EjeEditDialogProps> = ({ isOpen, onClose, onSaved, eje, asignaturas }) => {
  const { control, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (isOpen) {
      if (eje) {
        reset({ nombre: eje.nombre, descripcion: eje.descripcion || '', asignatura_id: eje.asignatura_id });
      } else {
        reset({ nombre: '', descripcion: '', asignatura_id: undefined });
      }
    }
  }, [isOpen, eje, reset]);

  const onSubmit = async (data: FormData) => {
    try {
      await saveEje(data, eje?.id);
      showSuccess(`Eje ${eje ? 'actualizado' : 'creado'} correctamente.`);
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
          <DialogTitle>{eje ? 'Editar' : 'Crear'} Eje Temático</DialogTitle>
          <DialogDescription>
            Define un eje y vincúlalo a una asignatura.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div>
            <Label htmlFor="asignatura_id">Asignatura</Label>
            <Controller name="asignatura_id" control={control} render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger><SelectValue placeholder="Selecciona una asignatura" /></SelectTrigger>
                <SelectContent>{asignaturas.map(a => <SelectItem key={a.id} value={a.id}>{a.nombre}</SelectItem>)}</SelectContent>
              </Select>
            )} />
            {errors.asignatura_id && <p className="text-red-500 text-sm mt-1">{errors.asignatura_id.message}</p>}
          </div>
          <div>
            <Label htmlFor="nombre">Nombre del Eje</Label>
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

export default EjeEditDialog;