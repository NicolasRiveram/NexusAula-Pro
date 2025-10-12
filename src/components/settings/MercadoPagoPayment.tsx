import React, { useState } from 'react';
import { initMercadoPago, Wallet } from '@mercadopago/sdk-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Loader2, Star } from 'lucide-react';
import { showError, showLoading, dismissToast } from '@/utils/toast';

// Initialize Mercado Pago with the Public Key
const publicKey = import.meta.env.VITE_MERCADO_PAGO_PUBLIC_KEY;
if (publicKey) {
  initMercadoPago(publicKey);
} else {
  console.error("VITE_MERCADO_PAGO_PUBLIC_KEY is not set in environment variables.");
}

const MercadoPagoPayment = () => {
  const [preferenceId, setPreferenceId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const createPreference = async () => {
    if (!publicKey) {
      showError("La clave pública de Mercado Pago no está configurada. No se puede iniciar el pago.");
      return;
    }
    setIsLoading(true);
    const toastId = showLoading("Preparando pago seguro...");
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("No se pudo identificar al usuario. Por favor, inicia sesión de nuevo.");
      }

      const { data, error } = await supabase.functions.invoke('create-payment-preference', {
        body: { userId: user.id },
      });
      if (error) throw error;
      
      if (data.preferenceId) {
        setPreferenceId(data.preferenceId);
      } else {
        throw new Error("No se pudo obtener la preferencia de pago desde el backend.");
      }
    } catch (error: any) {
      showError(`Error al preparar el pago: ${error.message}`);
      setIsLoading(false);
    } finally {
      dismissToast(toastId);
    }
  };

  if (preferenceId) {
    return (
      <Wallet
        initialization={{ preferenceId }}
        customization={{ texts: { valueProp: 'smart_option' } }}
        onReady={() => setIsLoading(false)}
      />
    );
  }

  return (
    <Button onClick={createPreference} disabled={isLoading}>
      {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Star className="mr-2 h-4 w-4" />}
      Mejorar a Plan Pro
    </Button>
  );
};

export default MercadoPagoPayment;