import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useEstablishment } from '@/contexts/EstablishmentContext';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { fetchNiveles, crearCurso, Nivel, CursoBase } from '@/api/coursesApi';
import { updateCourse } from '@/api/adminApi';
import { showSuccess, showError } from '@/utils/toast';
import { useQuery, useMutation } from '@tanstack/react-query';

const schema = z.object({
  nivelId: z.string().uuid("Debes seleccionar un nivel."),
  nombre: z.string().min(1, "El nombre o letra del curso es requerido."),
  anio: z.number().int().min(2020, "El año debe ser válido."),
});

type FormData = z.infer<typeof schema>;

interface CourseEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  course?: CursoBase & { nivel: { id: string } };
}

const CourseEditDialog: React.FC<CourseEditDialogProps> = ({ isOpen, onClose, onSaved, course }) => {
  const { activeEstablishment } = useEstablishment();
  
  const { data: niveles = [], isLoading: isLoadingNiveles } = useQuery({
    queryKey: ['niveles'],
    queryFn: fetchNiveles,
  });

  const { control, handleSubmit, formState: { errors }, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (isOpen) {
      if (course) {
        reset({
          nombre: course.nombre,
          anio: course.anio,
          nivelId: course.nivel.id,
        });
      } else {
        reset({ anio: new Date().getFullYear() });
      }
    }
  }, [isOpen, course, reset]);

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      if (!activeEstablishment) throw new Error("No hay un establecimiento activo.");
      if (course) {
        await updateCourse(course.id, data.nombre, data.nivelId, data.anio);
      } else {
        await crearCurso(data.nombre, data.nivelId, data.anio, activeEstablishment.id);
      }
    },
    onSuccess: () => {
      showSuccess(course ? "Curso actualizado." : "Curso creado.");
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
          <DialogTitle>{course ? 'Editar' : 'Crear'} Curso</DialogTitle>
          <DialogDescription>Define los detalles del curso para tu establecimiento.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div>
            <Label htmlFor="nivelId">Nivel</Label>
            <Controller name="nivelId" control={control} render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger><SelectValue placeholder={isLoadingNiveles ? "Cargando..." : "Selecciona un nivel"} /></SelectTrigger>
                <SelectContent>{niveles.map(n => <SelectItem key={n.id} value={n.id}>{n.nombre}</SelectItem>)}</SelectContent>
              </Select>
            )} />
            {errors.nivelId && <p className="text-red-500 text-sm mt-1">{errors.nivelId.message}</p>}
          </div>
          <div>
            <Label htmlFor="nombre">Nombre/Letra</Label>
            <Controller name="nombre" control={control} render={({ field }) => <Input id="nombre" {...field} />} />
            {errors.nombre && <p className="text-red-500 text-sm mt-1">{errors.nombre.message}</p>}
          </div>
          <div>
            <Label htmlFor="anio">Año</Label>
            <Controller name="anio" control={control} render={({ field }) => <Input id="anio" type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10))} />} />
            {errors.anio && <p className="text-red-500 text-sm mt-1">{errors.anio.message}</p>}
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

export default CourseEditDialog;