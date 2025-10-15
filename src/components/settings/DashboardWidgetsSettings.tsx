import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { updateDashboardWidgetsPrefs } from '@/api/settingsApi';
import { showSuccess, showError } from '@/utils/toast';
import { Loader2 } from 'lucide-react';
import { ALL_DASHBOARD_WIDGETS } from '@/config/dashboardWidgets';
import { useMutation, useQueryClient } from '@tanstack/react-query';

const schema = z.object({
  visible: z.record(z.boolean()),
});

type FormData = z.infer<typeof schema>;

interface DashboardWidgetsSettingsProps {
  userId: string;
  currentPrefs: { order: string[], visible: Record<string, boolean> };
  onUpdate: () => void;
}

const DashboardWidgetsSettings: React.FC<DashboardWidgetsSettingsProps> = ({ userId, currentPrefs, onUpdate }) => {
  const queryClient = useQueryClient();
  const { control, handleSubmit } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      visible: currentPrefs.visible,
    },
  });

  const mutation = useMutation({
    mutationFn: (newPrefs: { order: string[], visible: Record<string, boolean> }) => updateDashboardWidgetsPrefs(userId, newPrefs),
    onSuccess: () => {
      showSuccess("Preferencias del dashboard actualizadas.");
      queryClient.invalidateQueries({ queryKey: ['userProfile', userId] });
      onUpdate();
    },
    onError: (error: any) => {
      showError(error.message);
    },
  });

  const onSubmit = (data: FormData) => {
    const newPrefs = { ...currentPrefs, visible: data.visible };
    mutation.mutate(newPrefs);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Personalizar Dashboard</CardTitle>
        <CardDescription>Selecciona los widgets que quieres ver en tu panel de inicio. Puedes reordenarlos arrastrándolos directamente en el dashboard.</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            {ALL_DASHBOARD_WIDGETS.map(widget => (
              <div key={widget.id} className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                <div className="space-y-0.5">
                  <Label className="text-base">{widget.title}</Label>
                  <p className="text-sm text-muted-foreground">{widget.description}</p>
                </div>
                <Controller
                  name={`visible.${widget.id}`}
                  control={control}
                  render={({ field }) => (
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  )}
                />
              </div>
            ))}
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Guardar Preferencias
            </Button>
          </div>
        </CardContent>
      </form>
    </Card>
  );
};

export default DashboardWidgetsSettings;