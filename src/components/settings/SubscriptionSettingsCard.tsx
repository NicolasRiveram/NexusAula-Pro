import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { showError } from '@/utils/toast';
import { Loader2 } from 'lucide-react';
import { format, parseISO, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';
import MercadoPagoSubscriptionButton from './MercadoPagoSubscriptionButton';
import { useQuery } from '@tanstack/react-query';

interface SubscriptionManagerProps {
  userId: string;
}

const SubscriptionManager: React.FC<SubscriptionManagerProps> = ({ userId }) => {
  const { data: profile, isLoading: loading } = useQuery({
    queryKey: ['subscriptionProfile', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('perfiles')
        .select('subscription_plan, subscription_status, trial_ends_at, subscription_ends_at')
        .eq('id', userId)
        .single();
      if (error) throw new Error("Error al cargar la información de suscripción.");
      return data;
    },
    enabled: !!userId,
    onError: (error: any) => showError(error.message),
  });

  const renderPlanDetails = () => {
    if (!profile) return null;

    const daysLeft = profile.trial_ends_at ? differenceInDays(parseISO(profile.trial_ends_at), new Date()) : 0;

    if (profile.subscription_plan === 'prueba') {
      return (
        <>
          <p className="text-muted-foreground">
            Estás en el período de prueba. Te quedan <span className="font-bold">{daysLeft > 0 ? daysLeft : 0} días</span>.
          </p>
          <MercadoPagoSubscriptionButton userId={userId} />
        </>
      );
    }

    if (profile.subscription_plan === 'pro') {
      return (
        <p className="text-muted-foreground">
          Tu plan se renueva el {profile.subscription_ends_at ? format(parseISO(profile.subscription_ends_at), 'd LLLL, yyyy', { locale: es }) : 'N/A'}.
        </p>
      );
    }
    
    if (profile.subscription_plan === 'establecimiento') {
      return (
        <p className="text-muted-foreground">
          Tu cuenta está cubierta por el plan de tu establecimiento.
        </p>
      );
    }

    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Suscripción</CardTitle>
        <CardDescription>Gestiona tu plan y facturación.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? <Loader2 className="animate-spin" /> : (
          <div className="flex justify-between items-center p-4 border rounded-md">
            <div>
              <p className="font-semibold">Plan Actual</p>
              <div>
                <Badge variant="secondary" className="capitalize">{profile?.subscription_plan || 'Desconocido'}</Badge>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              {renderPlanDetails()}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default SubscriptionManager;