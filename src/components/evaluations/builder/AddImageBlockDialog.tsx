import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createContentBlock, uploadEvaluationImage } from '@/api/evaluationsApi';
import { showSuccess, showError, showLoading, dismissToast } from '@/utils/toast';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

const schema = z.object({
  image: z
    .any()
    .refine((files) => files?.length == 1, "Debes seleccionar una imagen.")
    .refine((files) => files?.[0]?.size <= MAX_FILE_SIZE, `El tamaño máximo es 5MB.`)
    .refine(
      (files) => ACCEPTED_IMAGE_TYPES.includes(files?.[0]?.type),
      "Solo se aceptan formatos .jpg, .jpeg, .png y .webp."
    ),
});

type FormData = z.infer<typeof schema>;

interface AddImageBlockDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onBlockCreated: () => void;
  evaluationId: string;
  currentOrder: number;
}

const AddImageBlockDialog: React.FC<AddImageBlockDialogProps> = ({ isOpen, onClose, onBlockCreated, evaluationId, currentOrder }) => {
  const [preview, setPreview] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset, watch } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const imageFile = watch("image");

  React.useEffect(() => {
    if (imageFile && imageFile.length > 0) {
      const file = imageFile[0];
      const objectUrl = URL.createObjectURL(file);
      setPreview(objectUrl);
      return () => URL.revokeObjectURL(objectUrl);
    }
    setPreview(null);
  }, [imageFile]);

  const onSubmit = async (data: FormData) => {
    const toastId = showLoading("Subiendo imagen...");
    try {
      const imagePath = await uploadEvaluationImage(evaluationId, data.image[0]);
      dismissToast(toastId);
      
      const blockToastId = showLoading("Añadiendo bloque...");
      await createContentBlock(evaluationId, 'image', { imageUrl: imagePath }, currentOrder);
      dismissToast(blockToastId);

      showSuccess("Bloque de imagen añadido.");
      onBlockCreated();
      onClose();
    } catch (error: any) {
      dismissToast(toastId);
      showError(`Error: ${error.message}`);
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
          <DialogTitle>Añadir Bloque de Imagen</DialogTitle>
          <DialogDescription>
            Sube una imagen que servirá de base para generar preguntas.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div>
            <Label htmlFor="image">Archivo de Imagen</Label>
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
              {isSubmitting ? 'Añadiendo...' : 'Añadir Bloque'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddImageBlockDialog;