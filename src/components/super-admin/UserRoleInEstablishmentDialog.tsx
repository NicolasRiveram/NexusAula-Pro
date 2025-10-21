import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { superAdminUpdateUserRoleInEstablishment } from '@/api/superAdminApi';
import { showError, showSuccess } from '@/utils/toast';

const schema = z.object({
  newRole: z.string().min(1, "Debes seleccionar un rol."),
});

type FormData = z.infer<typeof schema>;

interface UserRoleInEstablishmentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  user: { perfil_id: string; nombre_completo: string; rol_en_establecimiento: string } | null;
  establishmentId: string;
  onUserUpdated: () => void;
}

const UserRoleInEstablishmentDialog: React.FC<UserRoleInEstablishmentDialogProps> = ({ isOpen, onClose, user, establishmentId, onUserUpdated }) => {
  const { control, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (user) {
      reset({ newRole: user.rol_en_establecimiento });
    }
  }, [user, reset]);

  const onSubmit = async (data: FormData) => {
    if (!user || !establishmentId) return;
    try {
      await superAdminUpdateUserRoleInEstablishment(user.perfil_id, establishmentId, data.newRole);
      showSuccess(`El rol de ${user.nombre_completo} ha sido actualizado.`);
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
          <DialogTitle>Editar Rol en Establecimiento</DialogTitle>
          <DialogDescription>
            Cambia el rol de <span className="font-semibold">{user?.nombre_completo}</span>.
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
                    <SelectItem value="coordinador">Coordinador</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {errors.newRole && <p className="text-red-500 text-sm mt-1">{errors.newRole.message}</p>}
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

export default UserRoleInEstablishmentDialog;