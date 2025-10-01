import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { createContentBlock, EvaluationContentBlock } from '@/api/evaluationsApi';
import { showSuccess, showError, showLoading, dismissToast } from '@/utils/toast';

const schema = z.object({
  title: z.string().optional(),
  text: z.string().min(10, "El contenido debe tener al menos 10 caracteres."),
});

type FormData = z.infer<typeof schema>;

interface AddTextBlockDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onBlockCreated: (newBlock: EvaluationContentBlock) => void;
  evaluationId: string;
  currentOrder: number;
}

const AddTextBlockDialog: React.FC<AddTextBlockDialogProps> = ({ isOpen, onClose, onBlockCreated, evaluationId, currentOrder }) => {
  const { control, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  React.useEffect(() => {
    if (!isOpen) {
      reset({ title: '', text: '' });
    }
  }, [isOpen, reset]);

  const onSubmit = async (data: FormData) => {
    const toastId = showLoading("Añadiendo bloque...");
    try {
      const newBlock = await createContentBlock(evaluationId, 'text', { text: data.text }, currentOrder, data.title || null);
      dismissToast(toastId);
      showSuccess("Bloque de texto añadido.");
      onBlockCreated(newBlock);
      onClose();
    } catch (error: any) {
      dismissToast(toastId);
      showError(`Error al añadir bloque: ${error.message}`);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Añadir Bloque de Temario/Texto</DialogTitle>
          <DialogDescription>
            Escribe o pega el contenido que servirá de base para generar las preguntas.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div>
            <Label htmlFor="title">Título del Bloque (Opcional)</Label>
            <Controller
              name="title"
              control={control}
              render={({ field }) => <Input id="title" placeholder="Ej: Texto 1 - El Ecosistema" {...field} />}
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
              {isSubmitting ? 'Añadiendo...' : 'Añadir Bloque'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddTextBlockDialog;