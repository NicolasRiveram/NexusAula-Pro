import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UserProfile, updateUserProfile } from '@/api/settingsApi';
import { showSuccess, showError } from '@/utils/toast';
import { Loader2 } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

const schema = z.object({
  nombre_completo: z.string().min(3, "El nombre es requerido."),
  email: z.string().email(),
});

type FormData = z.infer<typeof schema>;

interface ProfileSettingsFormProps {
  profile: UserProfile;
  userId: string;
  onProfileUpdate: () => void;
}

const ProfileSettingsForm: React.FC<ProfileSettingsFormProps> = ({ profile, userId, onProfileUpdate }) => {
  const queryClient = useQueryClient();
  const { control, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    reset(profile);
  }, [profile, reset]);

  const mutation = useMutation({
    mutationFn: (newName: string) => updateUserProfile(userId, newName),
    onSuccess: () => {
      showSuccess("Perfil actualizado exitosamente.");
      queryClient.invalidateQueries({ queryKey: ['userProfile', userId] });
      onProfileUpdate();
    },
    onError: (error: any) => {
      showError(error.message);
    },
  });

  const onSubmit = (data: FormData) => {
    mutation.mutate(data.nombre_completo);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Información Personal</CardTitle>
        <CardDescription>Actualiza tu nombre y correo electrónico.</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="nombre_completo">Nombre Completo</Label>
            <Controller name="nombre_completo" control={control} render={({ field }) => <Input id="nombre_completo" {...field} />} />
            {errors.nombre_completo && <p className="text-red-500 text-sm mt-1">{errors.nombre_completo.message}</p>}
          </div>
          <div>
            <Label htmlFor="email">Correo Electrónico</Label>
            <Controller name="email" control={control} render={({ field }) => <Input id="email" type="email" disabled {...field} />} />
            <p className="text-xs text-muted-foreground mt-1">El correo electrónico no se puede cambiar.</p>
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Guardar Cambios
            </Button>
          </div>
        </CardContent>
      </form>
    </Card>
  );
};

export default ProfileSettingsForm;