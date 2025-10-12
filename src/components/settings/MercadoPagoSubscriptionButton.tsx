import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

const MercadoPagoSubscriptionButton = () => {
  const [subscriptionUrl, setSubscriptionUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const createSubscriptionLink = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const preapprovalPlanId = 'c8e2e5db5df44f7aaaae59b34f5e4dab';
        // Añadimos el ID del usuario como external_reference
        const url = `https://www.mercadopago.cl/subscriptions/checkout?preapproval_plan_id=${preapprovalPlanId}&external_reference=${user.id}`;
        setSubscriptionUrl(url);
      }
      setLoading(false);
    };

    createSubscriptionLink();

    const scriptId = 'mp-sdk-script';
    if (document.getElementById(scriptId)) return;

    const script = document.createElement('script');
    script.id = scriptId;
    script.type = 'text/javascript';
    script.async = true;
    script.src = 'https://secure.mlstatic.com/mptools/render.js';
    document.body.appendChild(script);

    return () => {
      const existingScript = document.getElementById(scriptId);
      if (existingScript) {
        document.body.removeChild(existingScript);
      }
    };
  }, []);

  if (loading || !subscriptionUrl) {
    return (
      <div className="bg-[#3483FA] text-white py-2.5 px-6 rounded-md inline-flex items-center justify-center text-base">
        <Loader2 className="h-4 w-4 animate-spin" />
      </div>
    );
  }

  return (
    <a
      href={subscriptionUrl}
      className="bg-[#3483FA] hover:bg-[#2a68c8] text-white py-2.5 px-6 rounded-md inline-block text-base transition-colors no-underline"
    >
      Suscribirme
    </a>
  );
};

export default MercadoPagoSubscriptionButton;