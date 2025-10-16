import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { updateQuickActionsPrefs } from '@/api/settingsApi';
import { showSuccess, showError } from '@/utils/toast';
import { Loader2 } from 'lucide-react';
import { MultiSelect } from '@/components/MultiSelect';
import { ALL_QUICK_ACTIONS } from '@/config/quickActions';

const schema = z.object({
  selectedActions: z.array(z.string()).min(1, "Debes seleccionar al menos un acceso directo.").max(6, "Puedes seleccionar un máximo de 6 accesos directos."),
});

type FormData = z.infer<typeof schema>;

interface QuickActionsSettingsProps {
  userId: string;
  currentPrefs: string[];
  onUpdate: () => void;
}

const QuickActionsSettings: React.FC<QuickActionsSettingsProps> = ({ userId, currentPrefs, onUpdate }) => {
  const { control, handleSubmit, formState: { isSubmitting, errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      selectedActions: currentPrefs,
    },
  });

  const onSubmit = async (data: FormData) => {
    try {
      await updateQuickActionsPrefs(userId, data.selectedActions);
      showSuccess("Accesos directos actualizados.");
      onUpdate();
    } catch (error: any) {
      showError(error.message);
    }
  };

  const options = ALL_QUICK_ACTIONS.map(action => ({
    value: action.id,
    label: action.label,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Personalizar Accesos Directos</CardTitle>
        <CardDescription>Selecciona hasta 6 acciones rápidas que aparecerán en tu panel de inicio.</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          <div>
            <Label>Accesos Directos</Label>
            <Controller
              name="selectedActions"
              control={control}
              render={({ field }) => (
                <MultiSelect
                  options={options}
                  selected={field.value}
                  onValueChange={field.onChange}
                  placeholder="Selecciona tus accesos directos"
                />
              )}
            />
            {errors.selectedActions && <p className="text-red-500 text-sm mt-1">{errors.selectedActions.message}</p>}
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Guardar Preferencias
            </Button>
          </div>
        </CardContent>
      </form>
    </Card>
  );
};

export default QuickActionsSettings;