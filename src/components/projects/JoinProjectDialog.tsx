import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useEstablishment } from '@/contexts/EstablishmentContext';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { fetchCursosAsignaturasDocente, CursoAsignatura } from '@/api/coursesApi';
import { linkCoursesToProject } from '@/api/projectsApi';
import { showSuccess, showError, showLoading, dismissToast } from '@/utils/toast';
import { MultiSelect } from '@/components/MultiSelect';

const schema = z.object({
  cursoAsignaturaIds: z.array(z.string().uuid()).min(1, "Debes seleccionar al menos un curso para unirte."),
});

type FormData = z.infer<typeof schema>;

interface JoinProjectDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onJoined: () => void;
  projectId: string;
  alreadyLinkedIds: string[];
}

const JoinProjectDialog: React.FC<JoinProjectDialogProps> = ({ isOpen, onClose, onJoined, projectId, alreadyLinkedIds }) => {
  const { activeEstablishment } = useEstablishment();
  const [availableCourses, setAvailableCourses] = useState<CursoAsignatura[]>([]);
  const { control, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    const loadCourses = async () => {
      if (isOpen && activeEstablishment) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          try {
            const allCourses = await fetchCursosAsignaturasDocente(user.id, activeEstablishment.id);
            const unlinkedCourses = allCourses.filter(c => !alreadyLinkedIds.includes(c.id));
            setAvailableCourses(unlinkedCourses);
          } catch (err: any) {
            showError(`Error al cargar tus cursos: ${err.message}`);
          }
        }
      }
    };
    loadCourses();
  }, [isOpen, activeEstablishment, alreadyLinkedIds]);

  const onSubmit = async (data: FormData) => {
    const toastId = showLoading("Vinculando tus cursos...");
    try {
      await linkCoursesToProject(projectId, data.cursoAsignaturaIds);
      dismissToast(toastId);
      showSuccess("¡Te has unido al proyecto con tus cursos!");
      onJoined();
      onClose();
    } catch (error: any) {
      dismissToast(toastId);
      showError(error.message);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Unirse al Proyecto</DialogTitle>
          <DialogDescription>
            Selecciona los cursos que quieres vincular a este proyecto ABP.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div>
            <Label>Mis Cursos Disponibles</Label>
            <Controller
              name="cursoAsignaturaIds"
              control={control}
              render={({ field }) => (
                <MultiSelect
                  options={availableCourses.map(ca => ({ value: ca.id, label: `${ca.curso.nivel.nombre} ${ca.curso.nombre} - ${ca.asignatura.nombre}` }))}
                  selected={field.value || []}
                  onValueChange={field.onChange}
                  placeholder="Selecciona uno o más cursos"
                />
              )}
            />
            {errors.cursoAsignaturaIds && <p className="text-red-500 text-sm mt-1">{errors.cursoAsignaturaIds.message}</p>}
            {availableCourses.length === 0 && <p className="text-sm text-muted-foreground mt-2">No tienes más cursos para vincular a este proyecto.</p>}
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={isSubmitting || availableCourses.length === 0}>
              {isSubmitting ? 'Uniéndome...' : 'Unirme al Proyecto'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default JoinProjectDialog;