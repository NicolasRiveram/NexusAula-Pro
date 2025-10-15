import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { fetchAvailableUnitsForProject } from '@/api/projectsApi';
import { MultiSelect } from '@/components/MultiSelect';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';

const schema = z.object({
  unidadIds: z.array(z.string().uuid()).min(1, "Debes seleccionar al menos una unidad."),
});

type FormData = z.infer<typeof schema>;

interface LinkUnitDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onLink: (unidadIds: string[]) => void;
  isLinking: boolean;
  projectId: string;
}

const LinkUnitDialog: React.FC<LinkUnitDialogProps> = ({ isOpen, onClose, onLink, isLinking, projectId }) => {
  const { user } = useAuth();
  const { control, handleSubmit, formState: { errors }, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const { data: availableUnits = [] } = useQuery({
    queryKey: ['availableUnitsForProject', projectId, user?.id],
    queryFn: () => fetchAvailableUnitsForProject(projectId, user!.id),
    enabled: isOpen && !!user,
  });

  useEffect(() => {
    if (!isOpen) {
      reset({ unidadIds: [] });
    }
  }, [isOpen, reset]);

  const onSubmit = (data: FormData) => {
    onLink(data.unidadIds);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Vincular Plan de Unidad</DialogTitle>
          <DialogDescription>
            Selecciona las unidades de tus cursos que quieres asociar a este proyecto.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div>
            <Label>Unidades Disponibles</Label>
            <Controller
              name="unidadIds"
              control={control}
              render={({ field }) => (
                <MultiSelect
                  options={availableUnits.map(u => ({ value: u.id, label: `${u.nombre} (${u.curso_asignaturas.cursos.niveles.nombre} ${u.curso_asignaturas.cursos.nombre})` }))}
                  selected={field.value || []}
                  onValueChange={field.onChange}
                  placeholder="Selecciona una o más unidades"
                />
              )}
            />
            {errors.unidadIds && <p className="text-red-500 text-sm mt-1">{errors.unidadIds.message}</p>}
            {availableUnits.length === 0 && <p className="text-sm text-muted-foreground mt-2">No tienes más unidades disponibles para vincular en los cursos asociados a este proyecto.</p>}
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={isLinking || availableUnits.length === 0}>
              {isLinking ? 'Vinculando...' : 'Vincular Unidades'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default LinkUnitDialog;