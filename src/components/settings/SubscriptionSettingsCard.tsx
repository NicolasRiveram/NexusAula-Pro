import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { showError, showSuccess, showLoading, dismissToast } from '@/utils/toast';
import { Loader2, Star } from 'lucide-react';
import { format, parseISO, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';

interface SubscriptionProfile {
  subscription_plan: string;
  subscription_status: string;
  trial_ends_at: string | null;
  subscription_ends_at: string | null;
}

const SubscriptionManager = () => {
    const [profile, setProfile] = useState<SubscriptionProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [isUpgrading, setIsUpgrading] = useState(false);

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

    const handleUpgradeToPro = async () => {
        setIsUpgrading(true);
        const toastId = showLoading("Simulando proceso de pago...");

        // SIMULACIÓN: En un caso real, aquí llamarías a tu Edge Function
        // que se comunica con Mercado Pago.
        await new Promise(resolve => setTimeout(resolve, 2000));

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Usuario no encontrado.");

            const newEndDate = new Date();
            newEndDate.setMonth(newEndDate.getMonth() + 1);

            const { error } = await supabase
                .from('perfiles')
                .update({
                    subscription_plan: 'pro',
                    subscription_status: 'active',
                    subscription_ends_at: newEndDate.toISOString(),
                })
                .eq('id', user.id);
            
            if (error) throw error;

            dismissToast(toastId);
            showSuccess("¡Felicidades! Tu plan ha sido actualizado a Pro.");
            await fetchProfile(); // Recargar la información
        } catch (error: any) {
            dismissToast(toastId);
            showError(`Error al actualizar el plan: ${error.message}`);
        } finally {
            setIsUpgrading(false);
        }
    };

    const renderPlanDetails = () => {
        if (!profile) return null;

        const daysLeft = profile.trial_ends_at ? differenceInDays(parseISO(profile.trial_ends_at), new Date()) : 0;

        if (profile.subscription_plan === 'prueba') {
            return (
                <>
                    <p className="text-muted-foreground">
                        Estás en el período de prueba. Te quedan <span className="font-bold">{daysLeft > 0 ? daysLeft : 0} días</span>.
                    </p>
                    <Button onClick={handleUpgradeToPro} disabled={isUpgrading}>
                        {isUpgrading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Star className="mr-2 h-4 w-4" />}
                        Mejorar a Plan Pro
                    </Button>
                </>
            );
        }

        if (profile.subscription_plan === 'pro') {
            return (
                <>
                    <p className="text-muted-foreground">
                        Tu plan se renueva el {profile.subscription_ends_at ? format(parseISO(profile.subscription_ends_at), 'd LLLL, yyyy', { locale: es }) : 'N/A'}.
                    </p>
                    <Button variant="outline" disabled>Gestionar Suscripción (Próximamente)</Button>
                </>
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
                            <p>
                                <Badge variant="secondary" className="capitalize">{profile?.subscription_plan || 'Desconocido'}</Badge>
                            </p>
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