import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { fetchAvailableUnitsForProject, linkUnitsToProject } from '@/api/projectsApi';
import { showSuccess, showError, showLoading, dismissToast } from '@/utils/toast';
import { MultiSelect } from '@/components/MultiSelect';

const schema = z.object({
  unidadIds: z.array(z.string().uuid()).min(1, "Debes seleccionar al menos una unidad."),
});

type FormData = z.infer<typeof schema>;

interface LinkUnitDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onLinked: () => void;
  projectId: string;
}

const LinkUnitDialog: React.FC<LinkUnitDialogProps> = ({ isOpen, onClose, onLinked, projectId }) => {
  const [availableUnits, setAvailableUnits] = useState<any[]>([]);
  const { control, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    const loadUnits = async () => {
      if (isOpen) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          try {
            const units = await fetchAvailableUnitsForProject(projectId, user.id);
            setAvailableUnits(units);
          } catch (err: any) {
            showError(`Error al cargar unidades: ${err.message}`);
          }
        }
      }
    };
    loadUnits();
  }, [isOpen, projectId]);

  const onSubmit = async (data: FormData) => {
    const toastId = showLoading("Vinculando unidades...");
    try {
      await linkUnitsToProject(projectId, data.unidadIds);
      dismissToast(toastId);
      showSuccess("Unidades vinculadas al proyecto.");
      onLinked();
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
            <Button type="submit" disabled={isSubmitting || availableUnits.length === 0}>
              {isSubmitting ? 'Vinculando...' : 'Vincular Unidades'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default LinkUnitDialog;