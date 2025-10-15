import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { updateStudentProfile, Estudiante } from '@/api/coursesApi';
import { showSuccess, showError } from '@/utils/toast';
import { useMutation } from '@tanstack/react-query';

const schema = z.object({
  nombre_completo: z.string().min(3, "El nombre es requerido."),
  rut: z.string().optional(),
  email: z.string().email("Debe ser un correo válido.").optional().or(z.literal('')),
});

type FormData = z.infer<typeof schema>;

interface EditStudentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onStudentUpdated: () => void;
  student: Estudiante | null;
}

const EditStudentDialog: React.FC<EditStudentDialogProps> = ({ isOpen, onClose, onStudentUpdated, student }) => {
  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (student) {
      reset({
        nombre_completo: student.nombre_completo,
        rut: student.rut,
        email: student.email,
      });
    }
  }, [student, reset]);

  const mutation = useMutation({
    mutationFn: (data: FormData) => {
      if (!student) throw new Error("No se ha seleccionado un estudiante para editar.");
      return updateStudentProfile(student.id, data);
    },
    onSuccess: () => {
      showSuccess("Estudiante actualizado correctamente.");
      onStudentUpdated();
      onClose();
    },
    onError: (error: any) => {
      showError(`Error al actualizar: ${error.message}`);
    }
  });

  const onSubmit = (data: FormData) => {
    mutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar Estudiante</DialogTitle>
          <DialogDescription>
            Modifica la información del estudiante. Haz clic en guardar cuando termines.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="nombre_completo">Nombre Completo</Label>
            <Input id="nombre_completo" {...register('nombre_completo')} />
            {errors.nombre_completo && <p className="text-red-500 text-sm">{errors.nombre_completo.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="rut">RUT</Label>
            <Input id="rut" {...register('rut')} />
            {errors.rut && <p className="text-red-500 text-sm">{errors.rut.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" {...register('email')} />
            {errors.email && <p className="text-red-500 text-sm">{errors.email.message}</p>}
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditStudentDialog;