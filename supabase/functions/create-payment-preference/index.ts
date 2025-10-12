import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { MercadoPagoConfig, Preference } from 'npm:mercadopago@2.0.11';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const accessToken = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN");
    if (!accessToken) {
      throw new Error("MERCADO_PAGO_ACCESS_TOKEN no está configurado en los secretos de Supabase.");
    }

    const client = new MercadoPagoConfig({ accessToken });
    const preference = new Preference(client);

    const preferenceResponse = await preference.create({
      body: {
        items: [
          {
            id: 'pro-plan-01',
            title: 'NexusAula - Plan Pro',
            quantity: 1,
            unit_price: 10000, // Precio de ejemplo: 10.000 CLP. Ajusta esto según tu precio real.
            currency_id: 'CLP',
          },
        ],
        back_urls: {
          success: `${req.headers.get('origin')}/dashboard/payment/success`,
          failure: `${req.headers.get('origin')}/dashboard/payment/failure`,
          pending: `${req.headers.get('origin')}/dashboard/payment/pending`,
        },
        auto_return: 'approved',
        // Esta es la URL que Mercado Pago notificará cuando un pago se complete.
        // La crearemos en el siguiente paso.
        notification_url: `https://axkfetfkdzybczngysjx.supabase.co/functions/v1/mercado-pago-webhook`,
      },
    });

    return new Response(JSON.stringify({ preferenceId: preferenceResponse.id }), {
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