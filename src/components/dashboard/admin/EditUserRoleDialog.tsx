import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useEstablishment } from '@/contexts/EstablishmentContext';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { updateUserRole, EstablishmentUser } from '@/api/adminApi';
import { showError, showSuccess } from '@/utils/toast';
import { useMutation } from '@tanstack/react-query';

const schema = z.object({
  newRole: z.string().min(1, "Debes seleccionar un rol."),
});

type FormData = z.infer<typeof schema>;

interface EditUserRoleDialogProps {
  isOpen: boolean;
  onClose: () => void;
  user: EstablishmentUser | null;
  onUserUpdated: () => void;
}

const EditUserRoleDialog: React.FC<EditUserRoleDialogProps> = ({ isOpen, onClose, user, onUserUpdated }) => {
  const { activeEstablishment } = useEstablishment();

  const { control, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (user) {
      reset({ newRole: user.rol_en_establecimiento });
    }
  }, [user, reset]);

  const mutation = useMutation({
    mutationFn: (data: FormData) => {
      if (!user || !activeEstablishment) throw new Error("Datos insuficientes para actualizar el rol.");
      return updateUserRole(user.perfil_id, activeEstablishment.id, data.newRole);
    },
    onSuccess: () => {
      showSuccess(`El rol de ${user?.nombre_completo} ha sido actualizado.`);
      onUserUpdated();
      onClose();
    },
    onError: (error: any) => {
      showError(error.message);
    }
  });

  const onSubmit = (data: FormData) => {
    mutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar Rol de Usuario</DialogTitle>
          <DialogDescription>
            Cambia el rol de <span className="font-semibold">{user?.nombre_completo}</span> en el establecimiento.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div>
            <Label htmlFor="newRole">Nuevo Rol</Label>
            <Controller
              name="newRole"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger><SelectValue placeholder="Selecciona un rol" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="docente">Docente</SelectItem>
                    <SelectItem value="estudiante">Estudiante</SelectItem>
                    <SelectItem value="administrador_establecimiento">Administrador</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {errors.newRole && <p className="text-red-500 text-sm mt-1">{errors.newRole.message}</p>}
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditUserRoleDialog;