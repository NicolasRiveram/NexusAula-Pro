import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { createContentBlock, updateContentBlock, EvaluationContentBlock } from '@/api/evaluations';
import { showSuccess, showError, showLoading, dismissToast } from '@/utils/toast';

const schema = z.object({
  title: z.string().optional(),
  text: z.string().min(10, "El contenido debe tener al menos 10 caracteres."),
});

type FormData = z.infer<typeof schema>;

interface AddTextBlockDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  evaluationId: string;
  currentOrder: number;
  blockToEdit?: EvaluationContentBlock | null;
}

const AddTextBlockDialog: React.FC<AddTextBlockDialogProps> = ({ isOpen, onClose, onSave, evaluationId, currentOrder, blockToEdit }) => {
  const isEditMode = !!blockToEdit;
  const { control, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  React.useEffect(() => {
    if (isOpen) {
      if (isEditMode && blockToEdit) {
        reset({
          title: blockToEdit.title || '',
          text: blockToEdit.content.text || '',
        });
      } else {
        reset({ text: '', title: '' });
      }
    }
  }, [isOpen, isEditMode, blockToEdit, reset]);

  const onSubmit = async (data: FormData) => {
    const toastId = showLoading(isEditMode ? "Actualizando bloque..." : "Añadiendo bloque...");
    try {
      if (isEditMode && blockToEdit) {
        await updateContentBlock(blockToEdit.id, {
          title: data.title,
          content: { text: data.text },
        });
        showSuccess("Bloque de texto actualizado.");
      } else {
        await createContentBlock(evaluationId, 'text', { text: data.text }, currentOrder, data.title);
        showSuccess("Bloque de texto añadido.");
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
          <DialogTitle>{isEditMode ? 'Editar' : 'Añadir'} Bloque de Temario/Texto</DialogTitle>
          <DialogDescription>
            {isEditMode ? 'Modifica el contenido del bloque.' : 'Escribe o pega el contenido que servirá de base para generar las preguntas.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div>
            <Label htmlFor="title">Título del Bloque (Opcional)</Label>
            <Controller
              name="title"
              control={control}
              render={({ field }) => <Input id="title" placeholder="Ej: Texto sobre la fotosíntesis" {...field} />}
            />
          </div>
          <div>
            <Label htmlFor="text">Contenido del Bloque</Label>
            <Controller
              name="text"
              control={control}
              render={({ field }) => <Textarea id="text" rows={10} {...field} />}
            />
            {errors.text && <p className="text-red-500 text-sm mt-1">{errors.text.message}</p>}
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

export default AddTextBlockDialog;