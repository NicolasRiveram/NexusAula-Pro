import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { createContentBlock, updateContentBlock, EvaluationContentBlock } from '@/api/evaluationsApi';
import { showSuccess, showError, showLoading, dismissToast } from '@/utils/toast';

const schema = z.object({
  title: z.string().optional(),
  geogebraId: z.string().min(5, "El ID del material de GeoGebra es requerido."),
});

type FormData = z.infer<typeof schema>;

interface AddGeoGebraBlockDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  evaluationId: string;
  currentOrder: number;
  blockToEdit?: EvaluationContentBlock | null;
}

const AddGeoGebraBlockDialog: React.FC<AddGeoGebraBlockDialogProps> = ({ isOpen, onClose, onSave, evaluationId, currentOrder, blockToEdit }) => {
  const isEditMode = !!blockToEdit;
  const { control, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  React.useEffect(() => {
    if (isOpen) {
      if (isEditMode && blockToEdit) {
        reset({
          title: blockToEdit.title || '',
          geogebraId: blockToEdit.content.geogebraId || '',
        });
      } else {
        reset({ geogebraId: '', title: '' });
      }
    }
  }, [isOpen, isEditMode, blockToEdit, reset]);

  const onSubmit = async (data: FormData) => {
    const toastId = showLoading(isEditMode ? "Actualizando bloque..." : "Añadiendo bloque de GeoGebra...");
    try {
      if (isEditMode && blockToEdit) {
        await updateContentBlock(blockToEdit.id, {
          title: data.title,
          content: { geogebraId: data.geogebraId },
        });
        showSuccess("Bloque de GeoGebra actualizado.");
      } else {
        await createContentBlock(evaluationId, 'geogebra', { geogebraId: data.geogebraId }, currentOrder, data.title);
        showSuccess("Bloque de GeoGebra añadido.");
      }
      onSave();
      onClose();
    } catch (error: any) {
      showError(`Error: ${error.message}`);
    } finally {
      dismissToast(toastId);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Editar' : 'Añadir'} Bloque de GeoGebra</DialogTitle>
          <DialogDescription>
            Pega el ID del material de GeoGebra que quieres incrustar. Puedes encontrarlo en la URL de la actividad.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div>
            <Label htmlFor="title">Título del Bloque (Opcional)</Label>
            <Controller
              name="title"
              control={control}
              render={({ field }) => <Input id="title" placeholder="Ej: Gráfico de funciones cuadráticas" {...field} />}
            />
          </div>
          <div>
            <Label htmlFor="geogebraId">ID del Material de GeoGebra</Label>
            <Controller
              name="geogebraId"
              control={control}
              render={({ field }) => <Input id="geogebraId" placeholder="Ej: m6a7s5d3" {...field} />}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Si la URL es `geogebra.org/m/m6a7s5d3`, el ID es `m6a7s5d3`.
            </p>
            {errors.geogebraId && <p className="text-red-500 text-sm mt-1">{errors.geogebraId.message}</p>}
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Guardando...' : 'Guardar Bloque'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddGeoGebraBlockDialog;