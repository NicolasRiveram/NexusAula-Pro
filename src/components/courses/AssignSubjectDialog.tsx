import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useEstablishment } from '@/contexts/EstablishmentContext';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { fetchCursosPorEstablecimiento, fetchDocenteAsignaturas, asignarAsignatura, CursoBase, Asignatura } from '@/api/coursesApi';
import { showSuccess, showError, showLoading, dismissToast } from '@/utils/toast';

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
  const [cursos, setCursos] = useState<CursoBase[]>([]);
  const [asignaturas, setAsignaturas] = useState<Asignatura[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { control, handleSubmit, formState: { errors }, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (isOpen && activeEstablishment) {
      const loadData = async () => {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) {
            showError("No se pudo identificar al usuario.");
            return;
          }

          const [cursosData, asignaturasData] = await Promise.all([
            fetchCursosPorEstablecimiento(activeEstablishment.id),
            fetchDocenteAsignaturas(user.id),
          ]);
          setCursos(cursosData);
          setAsignaturas(asignaturasData);
        } catch (error: any) {
          showError(`Error al cargar datos: ${error.message}`);
        }
      };
      loadData();
    } else {
      reset({ cursoId: undefined, asignaturaId: undefined });
    }
  }, [isOpen, activeEstablishment, reset]);

  const onSubmit = async (data: FormData) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      showError("No se pudo identificar al usuario.");
      return;
    }

    setIsSubmitting(true);
    const toastId = showLoading("Asignando asignatura...");

    try {
      await asignarAsignatura(data.cursoId, data.asignaturaId, user.id);
      dismissToast(toastId);
      showSuccess("Asignatura asignada correctamente.");
      onSubjectAssigned();
      onClose();
    } catch (error: any) {
      dismissToast(toastId);
      showError(`Error al asignar: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
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
                    {cursos.map(curso => (
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
                    {asignaturas.length > 0 ? (
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
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Asignando...' : 'Asignar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AssignSubjectDialog;