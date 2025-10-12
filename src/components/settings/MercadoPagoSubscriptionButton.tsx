import React, { useEffect } from 'react';

const MercadoPagoSubscriptionButton = () => {
  useEffect(() => {
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

  return (
    <a
      href="https://www.mercadopago.cl/subscriptions/checkout?preapproval_plan_id=c8e2e5db5df44f7aaaae59b34f5e4dab"
      className="bg-[#3483FA] hover:bg-[#2a68c8] text-white py-2.5 px-6 rounded-md inline-block text-base transition-colors no-underline"
    >
      Suscribirme
    </a>
  );
};

export default MercadoPagoSubscriptionButton;