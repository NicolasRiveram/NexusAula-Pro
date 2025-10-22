import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { updateEstablishmentSubscription, EstablishmentSubscription } from '@/api/superAdminApi';
import { showError, showSuccess } from '@/utils/toast';

const schema = z.object({
  plan_type: z.enum(['prueba', 'pro', 'establecimiento']),
});

type FormData = z.infer<typeof schema>;

interface EstablishmentSubscriptionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  establishmentId: string | null;
  establishmentName: string | null;
  currentSubscription: EstablishmentSubscription | null;
}

const EstablishmentSubscriptionDialog: React.FC<EstablishmentSubscriptionDialogProps> = ({ isOpen, onClose, onSaved, establishmentId, establishmentName, currentSubscription }) => {
  const { control, handleSubmit, reset, formState: { isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (isOpen) {
      reset({ plan_type: currentSubscription?.plan_type || 'prueba' });
    }
  }, [isOpen, currentSubscription, reset]);

  const onSubmit = async (data: FormData) => {
    if (!establishmentId) return;
    try {
      await updateEstablishmentSubscription(establishmentId, data.plan_type);
      showSuccess(`Suscripción de ${establishmentName} actualizada.`);
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
          <DialogTitle>Gestionar Suscripción</DialogTitle>
          <DialogDescription>
            Cambia el plan para <span className="font-semibold">{establishmentName}</span>. La fecha de expiración se calculará automáticamente.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div>
            <Label htmlFor="plan_type">Plan de Suscripción</Label>
            <Controller
              name="plan_type"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger><SelectValue placeholder="Selecciona un plan" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="prueba">Prueba (7 días)</SelectItem>
                    <SelectItem value="pro">Pro (1 mes)</SelectItem>
                    <SelectItem value="establecimiento">Establecimiento (1 año)</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Guardando...' : 'Guardar Cambios'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EstablishmentSubscriptionDialog;