import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { showError } from '@/utils/toast';
import { Loader2 } from 'lucide-react';
import { format, parseISO, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';
import MercadoPagoPayment from './MercadoPagoPayment';

interface SubscriptionProfile {
  subscription_plan: string;
  subscription_status: string;
  trial_ends_at: string | null;
  subscription_ends_at: string | null;
}

const SubscriptionManager = () => {
    const [profile, setProfile] = useState<SubscriptionProfile | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchProfile = async () => {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const { data, error } = await supabase
                .from('perfiles')
                .select('subscription_plan, subscription_status, trial_ends_at, subscription_ends_at')
                .eq('id', user.id)
                .single();
            if (error) {
                showError("Error al cargar la información de suscripción.");
            } else {
                setProfile(data);
            }
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchProfile();
    }, []);

    const renderPlanDetails = () => {
        if (!profile) return null;

        const daysLeft = profile.trial_ends_at ? differenceInDays(parseISO(profile.trial_ends_at), new Date()) : 0;

        if (profile.subscription_plan === 'prueba') {
            return (
                <>
                    <p className="text-muted-foreground">
                        Estás en el período de prueba. Te quedan <span className="font-bold">{daysLeft > 0 ? daysLeft : 0} días</span>.
                    </p>
                    <MercadoPagoPayment />
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