import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { moveUserToEstablishment, GlobalUser, Establishment } from '@/api/superAdminApi';
import { showError, showSuccess } from '@/utils/toast';

const schema = z.object({
  destinationId: z.string().uuid("Debes seleccionar un establecimiento de destino."),
});

type FormData = z.infer<typeof schema>;

interface MoveUserDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onMoved: () => void;
  userToMove: GlobalUser | { id: string; nombre_completo: string } | null;
  fromEstablishment: { id: string; nombre: string } | null;
  allEstablishments: Establishment[];
}

const MoveUserDialog: React.FC<MoveUserDialogProps> = ({ isOpen, onClose, onMoved, userToMove, fromEstablishment, allEstablishments }) => {
  const { control, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (!isOpen) {
      reset();
    }
  }, [isOpen, reset]);

  const onSubmit = async (data: FormData) => {
    if (!userToMove || !fromEstablishment) return;
    try {
      await moveUserToEstablishment(userToMove.id, fromEstablishment.id, data.destinationId);
      showSuccess(`"${userToMove.nombre_completo}" ha sido movido exitosamente.`);
      onMoved();
      onClose();
    } catch (error: any) {
      showError(error.message);
    }
  };

  const potentialDestinations = allEstablishments.filter(est => est.id !== fromEstablishment?.id);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Mover Usuario y Contenido</DialogTitle>
          <DialogDescription>
            Mover a <span className="font-semibold">{userToMove?.nombre_completo}</span> desde <span className="font-semibold">{fromEstablishment?.nombre}</span> a un nuevo establecimiento.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div>
            <Label htmlFor="destinationId">Establecimiento de Destino</Label>
            <Controller
              name="destinationId"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger><SelectValue placeholder="Selecciona un destino..." /></SelectTrigger>
                  <SelectContent>
                    {potentialDestinations.map(est => <SelectItem key={est.id} value={est.id}>{est.nombre}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.destinationId && <p className="text-red-500 text-sm mt-1">{errors.destinationId.message}</p>}
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Moviendo...' : 'Confirmar Movimiento'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default MoveUserDialog;