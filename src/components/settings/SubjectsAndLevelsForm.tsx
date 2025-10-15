import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { UserPedagogicalProfile, updateUserPedagogicalProfile } from '@/api/settingsApi';
import { fetchAsignaturas, fetchNiveles, Asignatura, Nivel } from '@/api/coursesApi';
import { showSuccess, showError } from '@/utils/toast';
import { Loader2 } from 'lucide-react';
import { MultiSelect } from '@/components/MultiSelect';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const schema = z.object({
  asignaturaIds: z.array(z.string()).min(1, "Debes seleccionar al menos una asignatura."),
  nivelIds: z.array(z.string()).min(1, "Debes seleccionar al menos un nivel."),
});

type FormData = z.infer<typeof schema>;

interface SubjectsAndLevelsFormProps {
  pedagogicalProfile: UserPedagogicalProfile;
  userId: string;
}

const SubjectsAndLevelsForm: React.FC<SubjectsAndLevelsFormProps> = ({ pedagogicalProfile, userId }) => {
  const queryClient = useQueryClient();
  const { control, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const { data: allAsignaturas = [], isLoading: isLoadingAsignaturas } = useQuery({
    queryKey: ['allAsignaturas'],
    queryFn: fetchAsignaturas,
  });

  const { data: allNiveles = [], isLoading: isLoadingNiveles } = useQuery({
    queryKey: ['allNiveles'],
    queryFn: fetchNiveles,
  });

  useEffect(() => {
    if (pedagogicalProfile) {
      reset({
        asignaturaIds: pedagogicalProfile.asignaturas.map(a => a.id),
        nivelIds: pedagogicalProfile.niveles.map(n => n.id),
      });
    }
  }, [pedagogicalProfile, reset]);

  const mutation = useMutation({
    mutationFn: (data: { asignaturaIds: string[], nivelIds: string[] }) => updateUserPedagogicalProfile(userId, data.asignaturaIds, data.nivelIds),
    onSuccess: () => {
      showSuccess("Preferencias pedagógicas actualizadas.");
      queryClient.invalidateQueries({ queryKey: ['pedagogicalProfile', userId] });
    },
    onError: (error: any) => {
      showError(error.message);
    },
  });

  const onSubmit = (data: FormData) => {
    mutation.mutate(data);
  };

  if (isLoadingAsignaturas || isLoadingNiveles) {
    return <Card><CardContent className="flex justify-center items-center h-48"><Loader2 className="animate-spin" /></CardContent></Card>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Preferencias Pedagógicas</CardTitle>
        <CardDescription>Gestiona las asignaturas y niveles que impartes.</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          <div>
            <Label>Asignaturas</Label>
            <Controller
              name="asignaturaIds"
              control={control}
              render={({ field }) => (
                <MultiSelect
                  options={allAsignaturas.map(a => ({ value: a.id, label: a.nombre }))}
                  selected={field.value || []}
                  onValueChange={field.onChange}
                  placeholder="Selecciona tus asignaturas"
                />
              )}
            />
            {errors.asignaturaIds && <p className="text-red-500 text-sm mt-1">{errors.asignaturaIds.message}</p>}
          </div>
          <div>
            <Label>Niveles</Label>
            <Controller
              name="nivelIds"
              control={control}
              render={({ field }) => (
                <MultiSelect
                  options={allNiveles.map(n => ({ value: n.id, label: n.nombre }))}
                  selected={field.value || []}
                  onValueChange={field.onChange}
                  placeholder="Selecciona tus niveles"
                />
              )}
            />
            {errors.nivelIds && <p className="text-red-500 text-sm mt-1">{errors.nivelIds.message}</p>}
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

export default SubjectsAndLevelsForm;