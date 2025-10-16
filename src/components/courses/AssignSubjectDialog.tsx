import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useEstablishment } from '@/contexts/EstablishmentContext';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { fetchCursosPorEstablecimiento, fetchDocenteAsignaturas, asignarAsignatura } from '@/api/courses';
import { showSuccess, showError } from '@/utils/toast';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';

const schema = z.object({
  cursoId: z.string().uuid("Debes seleccionar un curso."),
  asignaturaId: z.string().uuid("Debes seleccionar una asignatura."),
});

type FormData = z.infer<typeof schema>;

interface AssignSubjectDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubjectAssigned: () => void;
}

const AssignSubjectDialog: React.FC<AssignSubjectDialogProps> = ({ isOpen, onClose, onSubjectAssigned }) => {
  const { activeEstablishment } = useEstablishment();
  const { user } = useAuth();

  const { control, handleSubmit, formState: { errors }, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const { data: cursos = [], isLoading: isLoadingCursos } = useQuery({
    queryKey: ['coursesForEstablishment', activeEstablishment?.id],
    queryFn: () => fetchCursosPorEstablecimiento(activeEstablishment!.id),
    enabled: isOpen && !!activeEstablishment,
  });

  const { data: asignaturas = [], isLoading: isLoadingAsignaturas } = useQuery({
    queryKey: ['teacherSubjects', user?.id],
    queryFn: () => fetchDocenteAsignaturas(user!.id),
    enabled: isOpen && !!user,
  });

  useEffect(() => {
    if (!isOpen) {
      reset({ cursoId: undefined, asignaturaId: undefined });
    }
  }, [isOpen, reset]);

  const mutation = useMutation({
    mutationFn: (data: FormData) => {
      if (!user) throw new Error("No se pudo identificar al usuario.");
      return asignarAsignatura(data.cursoId, data.asignaturaId, user.id);
    },
    onSuccess: () => {
      showSuccess("Asignatura asignada correctamente.");
      onSubjectAssigned();
      onClose();
    },
    onError: (error: any) => {
      showError(`Error al asignar: ${error.message}`);
    }
  });

  const onSubmit = (data: FormData) => {
    mutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Asignar Asignatura a Curso</DialogTitle>
          <DialogDescription>
            Selecciona un curso existente en tu establecimiento y una de tus asignaturas para vincularla.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="cursoId">Curso Existente</Label>
            <Controller
              name="cursoId"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger><SelectValue placeholder="Selecciona un curso" /></SelectTrigger>
                  <SelectContent>
                    {isLoadingCursos ? <SelectItem value="loading" disabled>Cargando...</SelectItem> : cursos.map(curso => (
                      <SelectItem key={curso.id} value={curso.id}>
                        {curso.nivel.nombre} {curso.nombre} ({curso.anio})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.cursoId && <p className="text-red-500 text-sm">{errors.cursoId.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="asignaturaId">Tu Asignatura</Label>
            <Controller
              name="asignaturaId"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger><SelectValue placeholder="Selecciona una de tus asignaturas" /></SelectTrigger>
                  <SelectContent>
                    {isLoadingAsignaturas ? <SelectItem value="loading" disabled>Cargando...</SelectItem> : asignaturas.length > 0 ? (
                      asignaturas.map(asig => <SelectItem key={asig.id} value={asig.id}>{asig.nombre}</SelectItem>)
                    ) : (
                      <SelectItem value="no-asignaturas" disabled>No tienes asignaturas en tu perfil</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.asignaturaId && <p className="text-red-500 text-sm">{errors.asignaturaId.message}</p>}
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Asignando...' : 'Asignar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AssignSubjectDialog;