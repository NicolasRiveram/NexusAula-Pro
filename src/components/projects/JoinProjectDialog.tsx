import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useEstablishment } from '@/contexts/EstablishmentContext';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { fetchCursosAsignaturasDocente, CursoAsignatura } from '@/api/courses';
import { showError } from '@/utils/toast';
import { MultiSelect } from '@/components/MultiSelect';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';

const schema = z.object({
  cursoAsignaturaIds: z.array(z.string().uuid()).min(1, "Debes seleccionar al menos un curso para unirte."),
});

type FormData = z.infer<typeof schema>;

interface JoinProjectDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onJoin: (cursoAsignaturaIds: string[]) => void;
  isJoining: boolean;
  projectId: string;
  alreadyLinkedIds: string[];
}

const JoinProjectDialog: React.FC<JoinProjectDialogProps> = ({ isOpen, onClose, onJoin, isJoining, projectId, alreadyLinkedIds }) => {
  const { activeEstablishment } = useEstablishment();
  const { user } = useAuth();
  const { control, handleSubmit, formState: { errors }, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const { data: availableCourses = [] } = useQuery({
    queryKey: ['availableCoursesForProject', user?.id, activeEstablishment?.id, projectId],
    queryFn: async () => {
      const allCourses = await fetchCursosAsignaturasDocente(user!.id, activeEstablishment!.id);
      return allCourses.filter(c => !alreadyLinkedIds.includes(c.id));
    },
    enabled: isOpen && !!user && !!activeEstablishment,
  });

  useEffect(() => {
    if (!isOpen) {
      reset({ cursoAsignaturaIds: [] });
    }
  }, [isOpen, reset]);

  const onSubmit = (data: FormData) => {
    onJoin(data.cursoAsignaturaIds);
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
            <Button type="submit" disabled={isJoining || availableCourses.length === 0}>
              {isJoining ? 'Uniéndome...' : 'Unirme al Proyecto'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default JoinProjectDialog;