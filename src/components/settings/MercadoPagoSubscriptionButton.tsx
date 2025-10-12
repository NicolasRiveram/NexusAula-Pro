import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

interface MercadoPagoSubscriptionButtonProps {
  userId: string;
}

const MercadoPagoSubscriptionButton: React.FC<MercadoPagoSubscriptionButtonProps> = ({ userId }) => {
  const [subscriptionUrl, setSubscriptionUrl] = useState<string | null>(null);

  useEffect(() => {
    if (userId) {
      const preapprovalPlanId = 'c8e2e5db5df44f7aaaae59b34f5e4dab';
      const url = `https://www.mercadopago.cl/subscriptions/checkout?preapproval_plan_id=${preapprovalPlanId}&external_reference=${userId}`;
      setSubscriptionUrl(url);
    }

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
  }, [userId]);

  if (!subscriptionUrl) {
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