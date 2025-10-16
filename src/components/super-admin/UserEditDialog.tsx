import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { updateUserGlobalRole, GlobalUser } from '@/api/superAdminApi';
import { showError, showSuccess } from '@/utils/toast';
import { useMutation } from '@tanstack/react-query';

const schema = z.object({
  rol: z.string().min(1, "Debes seleccionar un rol."),
});

type FormData = z.infer<typeof schema>;

interface UserEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  user: GlobalUser | null;
  onSaved: () => void;
}

const UserEditDialog: React.FC<UserEditDialogProps> = ({ isOpen, onClose, user, onSaved }) => {
  const { control, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (user) {
      reset({ rol: user.rol });
    }
  }, [user, reset]);

  const mutation = useMutation({
    mutationFn: (data: FormData) => {
      if (!user) throw new Error("No user selected.");
      return updateUserGlobalRole(user.id, data.rol);
    },
    onSuccess: () => {
      showSuccess(`El rol de ${user?.nombre_completo} ha sido actualizado.`);
      onSaved();
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
          <DialogTitle>Editar Rol Global de Usuario</DialogTitle>
          <DialogDescription>
            Cambia el rol de <span className="font-semibold">{user?.nombre_completo}</span> en toda la plataforma.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div>
            <Label htmlFor="rol">Nuevo Rol Global</Label>
            <Controller
              name="rol"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger><SelectValue placeholder="Selecciona un rol" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="estudiante">Estudiante</SelectItem>
                    <SelectItem value="docente">Docente</SelectItem>
                    <SelectItem value="coordinador">Coordinador</SelectItem>
                    <SelectItem value="super_administrador">Super Administrador</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {errors.rol && <p className="text-red-500 text-sm mt-1">{errors.rol.message}</p>}
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

export default UserEditDialog;