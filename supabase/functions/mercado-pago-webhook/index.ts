import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response("Method Not Allowed", { status: 405 });
  }

  try {
    const notification = await req.json();

    if (notification.type === 'payment') {
      const paymentId = notification.data.id;

      const accessToken = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN");
      if (!accessToken) throw new Error("MERCADO_PAGO_ACCESS_TOKEN no está configurado.");

      // Fetch payment details directly from Mercado Pago API
      const paymentResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      const paymentInfo = await paymentResponse.json();

      if (!paymentResponse.ok) {
        console.error("Error fetching payment info from Mercado Pago:", paymentInfo);
        // Still return 200 so MP doesn't retry for a failed payment lookup
        return new Response("Error fetching payment info, but notification acknowledged.", { status: 200 });
      }

      if (paymentInfo && paymentInfo.status === 'approved' && paymentInfo.external_reference) {
        const userId = paymentInfo.external_reference;

        const supabaseAdmin = createClient(
          Deno.env.get('SUPABASE_URL') ?? '',
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
          { auth: { autoRefreshToken: false, persistSession: false } }
        );

        const subscriptionEndDate = new Date();
        subscriptionEndDate.setMonth(subscriptionEndDate.getMonth() + 1);

        const { error } = await supabaseAdmin
          .from('perfiles')
          .update({
            subscription_plan: 'pro',
            subscription_status: 'active',
            subscription_ends_at: subscriptionEndDate.toISOString(),
            payment_provider_customer_id: paymentInfo.payer?.id?.toString(),
            payment_provider_subscription_id: paymentInfo.id?.toString(),
          })
          .eq('id', userId);

        if (error) {
          console.error(`Error al actualizar el perfil del usuario ${userId}:`, error);
        }
      }
    }

    return new Response("Notification received", { status: 200 });

  } catch (error) {
    console.error("Error en el webhook de Mercado Pago:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});