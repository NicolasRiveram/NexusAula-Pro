import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createContentBlock, uploadEvaluationImage, EvaluationContentBlock, getPublicImageUrl, updateContentBlock } from '@/api/evaluationsApi';
import { showSuccess, showError, showLoading, dismissToast } from '@/utils/toast';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

const createSchema = (isEditMode: boolean) => z.object({
  title: z.string().optional(),
  image: z
    .any()
    .refine((files) => isEditMode || (files && files.length === 1), "Debes seleccionar una imagen.")
    .refine((files) => !files || files.length === 0 || files[0].size <= MAX_FILE_SIZE, `El tamaño máximo es 5MB.`)
    .refine(
      (files) => !files || files.length === 0 || ACCEPTED_IMAGE_TYPES.includes(files[0].type),
      "Solo se aceptan formatos .jpg, .jpeg, .png y .webp."
    ),
});

type FormData = z.infer<ReturnType<typeof createSchema>>;

interface AddImageBlockDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  evaluationId: string;
  currentOrder: number;
  blockToEdit?: EvaluationContentBlock | null;
}

const AddImageBlockDialog: React.FC<AddImageBlockDialogProps> = ({ isOpen, onClose, onSave, evaluationId, currentOrder, blockToEdit }) => {
  const isEditMode = !!blockToEdit;
  const [preview, setPreview] = useState<string | null>(null);
  const { register, handleSubmit, control, formState: { errors, isSubmitting }, reset, watch } = useForm<FormData>({
    resolver: zodResolver(createSchema(isEditMode)),
  });

  const imageFile = watch("image");

  React.useEffect(() => {
    if (imageFile && imageFile.length > 0) {
      const file = imageFile[0];
      const objectUrl = URL.createObjectURL(file);
      setPreview(objectUrl);
      return () => URL.revokeObjectURL(objectUrl);
    } else if (!isEditMode) {
      setPreview(null);
    }
  }, [imageFile, isEditMode]);

  React.useEffect(() => {
    if (isOpen) {
      if (isEditMode && blockToEdit) {
        reset({ title: blockToEdit.title || '' });
        setPreview(getPublicImageUrl(blockToEdit.content.imageUrl));
      } else {
        reset({ title: '', image: undefined });
        setPreview(null);
      }
    }
  }, [isOpen, isEditMode, blockToEdit, reset]);

  const onSubmit = async (data: FormData) => {
    const toastId = showLoading("Guardando bloque de imagen...");
    try {
      if (isEditMode && blockToEdit) {
        let imageUrl = blockToEdit.content.imageUrl;
        if (data.image && data.image.length > 0) {
          imageUrl = await uploadEvaluationImage(evaluationId, data.image[0]);
        }
        await updateContentBlock(blockToEdit.id, {
          title: data.title,
          content: { imageUrl },
        });
        showSuccess("Bloque de imagen actualizado.");
      } else {
        const imageUrl = await uploadEvaluationImage(evaluationId, data.image[0]);
        await createContentBlock(evaluationId, 'image', { imageUrl }, currentOrder, data.title);
        showSuccess("Bloque de imagen añadido.");
      }
      onSave();
      onClose();
    } catch (error: any) {
      showError(`Error: ${error.message}`);
    } finally {
      dismissToast(toastId);
    }
  };

  const handleClose = () => {
    reset();
    setPreview(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Editar' : 'Añadir'} Bloque de Imagen</DialogTitle>
          <DialogDescription>
            {isEditMode ? 'Puedes cambiar el título o subir una nueva imagen para reemplazar la actual.' : 'Sube una imagen que servirá de base para generar preguntas.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div>
            <Label htmlFor="title">Título del Bloque (Opcional)</Label>
            <Controller
              name="title"
              control={control}
              render={({ field }) => <Input id="title" placeholder="Ej: Esquema del ciclo del agua" {...field} />}
            />
          </div>
          <div>
            <Label htmlFor="image">{isEditMode ? 'Reemplazar Imagen (Opcional)' : 'Archivo de Imagen'}</Label>
            <Input id="image" type="file" accept="image/*" {...register("image")} />
            {errors.image && <p className="text-red-500 text-sm mt-1">{errors.image.message as string}</p>}
          </div>
          {preview && (
            <div className="mt-4">
              <Label>Vista Previa</Label>
              <img src={preview} alt="Vista previa de la imagen" className="mt-2 rounded-md max-h-60 w-full object-contain" />
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={handleClose}>Cancelar</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Guardando...' : 'Guardar Bloque'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddImageBlockDialog;