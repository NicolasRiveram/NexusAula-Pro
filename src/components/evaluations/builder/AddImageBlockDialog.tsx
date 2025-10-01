import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { createContentBlock, uploadEvaluationImage } from '@/api/evaluations';
import { showSuccess, showError, showLoading, dismissToast } from '@/utils/toast';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

const schema = z.object({
  title: z.string().optional(),
  context: z.string().optional(),
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
  const { register, control, handleSubmit, formState: { errors, isSubmitting }, reset, watch } = useForm<FormData>({
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
      await createContentBlock(
        evaluationId,
        'image',
        { imageUrl: imagePath, context: data.context || null },
        currentOrder,
        data.title || null
      );
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
            Sube una imagen y añade contexto para generar preguntas relevantes.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div>
            <Label htmlFor="title">Título del Bloque (Opcional)</Label>
            <Controller
              name="title"
              control={control}
              render={({ field }) => <Input id="title" placeholder="Ej: Imagen 1 - Ciclo del Agua" {...field} />}
            />
          </div>
          <div>
            <Label htmlFor="image">Archivo de Imagen</Label>
            <Input id="image" type="file" accept="image/*" {...register("image")} />
            {errors.image && <p className="text-red-500 text-sm mt-1">{errors.image.message as string}</p>}
          </div>
          {preview && (
            <div className="mt-4">
              <Label>Vista Previa</Label>
              <img src={preview} alt="Vista previa de la imagen" className="mt-2 rounded-md max-h-40 w-full object-contain" />
            </div>
          )}
          <div>
            <Label htmlFor="context">Contexto para la IA (Opcional)</Label>
            <Controller
              name="context"
              control={control}
              render={({ field }) => <Textarea id="context" rows={3} placeholder="Describe qué se debe observar en la imagen para guiar a la IA. Ej: 'Observa las fases del ciclo del agua y sus nombres.'" {...field} />}
            />
          </div>
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