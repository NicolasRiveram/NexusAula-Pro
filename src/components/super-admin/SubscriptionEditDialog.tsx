import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { updateUserSubscriptionPlan, GlobalUser } from '@/api/superAdminApi';
import { showError, showSuccess } from '@/utils/toast';

const schema = z.object({
  subscription_plan: z.string().min(1, "Debes seleccionar un plan."),
});

type FormData = z.infer<typeof schema>;

interface SubscriptionEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  user: GlobalUser | null;
  onUserUpdated: () => void;
}

const SubscriptionEditDialog: React.FC<SubscriptionEditDialogProps> = ({ isOpen, onClose, user, onUserUpdated }) => {
  const { control, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (user) {
      reset({ subscription_plan: user.subscription_plan });
    }
  }, [user, reset]);

  const onSubmit = async (data: FormData) => {
    if (!user) return;
    try {
      await updateUserSubscriptionPlan(user.id, data.subscription_plan);
      showSuccess(`La suscripción de ${user.nombre_completo} ha sido actualizada.`);
      onUserUpdated();
      onClose();
    } catch (error: any) {
      showError(error.message);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cambiar Plan de Suscripción</DialogTitle>
          <DialogDescription>
            Modifica el plan de <span className="font-semibold">{user?.nombre_completo}</span>.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div>
            <Label htmlFor="subscription_plan">Nuevo Plan</Label>
            <Controller
              name="subscription_plan"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger><SelectValue placeholder="Selecciona un plan" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="prueba">Prueba</SelectItem>
                    <SelectItem value="pro">Pro</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {errors.subscription_plan && <p className="text-red-500 text-sm mt-1">{errors.subscription_plan.message}</p>}
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default SubscriptionEditDialog;