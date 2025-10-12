import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId } = await req.json();
    if (!userId) {
      throw new Error("El ID de usuario es requerido para crear una preferencia de pago.");
    }

    const accessToken = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN");
    if (!accessToken) {
      throw new Error("MERCADO_PAGO_ACCESS_TOKEN no está configurado en los secretos de Supabase.");
    }

    const preferenceBody = {
      items: [
        {
          id: 'pro-plan-01',
          title: 'NexusAula - Plan Pro',
          quantity: 1,
          unit_price: 10000,
          currency_id: 'CLP',
        },
      ],
      external_reference: userId,
      back_urls: {
        success: `${req.headers.get('origin')}/dashboard/payment/success`,
        failure: `${req.headers.get('origin')}/dashboard/payment/failure`,
        pending: `${req.headers.get('origin')}/dashboard/payment/pending`,
      },
      auto_return: 'approved',
      notification_url: `https://axkfetfkdzybczngysjx.supabase.co/functions/v1/mercado-pago-webhook`,
    };

    const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify(preferenceBody),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Error from Mercado Pago API:", data);
      throw new Error(data.message || 'Error al comunicarse con Mercado Pago.');
    }

    return new Response(JSON.stringify({ preferenceId: data.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error("Error creating payment preference:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});