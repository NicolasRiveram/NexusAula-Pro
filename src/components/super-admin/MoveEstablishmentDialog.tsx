import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { saveEstablishment, Establishment } from '@/api/superAdminApi';
import { showSuccess, showError } from '@/utils/toast';

const schema = z.object({
  parentId: z.string().uuid("Debes seleccionar un grupo de destino."),
});

type FormData = z.infer<typeof schema>;

interface MoveEstablishmentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  establishmentToMove: Establishment | null;
  potentialParents: Establishment[];
}

const MoveEstablishmentDialog: React.FC<MoveEstablishmentDialogProps> = ({ isOpen, onClose, onSaved, establishmentToMove, potentialParents }) => {
  const { control, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (!isOpen) {
      reset();
    }
  }, [isOpen, reset]);

  const onSubmit = async (data: FormData) => {
    if (!establishmentToMove) return;
    try {
      await saveEstablishment({ parent_id: data.parentId }, establishmentToMove.id);
      showSuccess(`"${establishmentToMove.nombre}" movido exitosamente.`);
      onSaved();
      onClose();
    } catch (error: any) {
      showError(error.message);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Mover Establecimiento</DialogTitle>
          <DialogDescription>
            Mover <span className="font-semibold">{establishmentToMove?.nombre}</span> a un grupo.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div>
            <Label htmlFor="parentId">Seleccionar Grupo de Destino</Label>
            <Controller
              name="parentId"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger><SelectValue placeholder="Selecciona un grupo..." /></SelectTrigger>
                  <SelectContent>
                    {potentialParents.map(p => <SelectItem key={p.id} value={p.id}>{p.nombre}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.parentId && <p className="text-red-500 text-sm mt-1">{errors.parentId.message}</p>}
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Moviendo...' : 'Mover'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default MoveEstablishmentDialog;