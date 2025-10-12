import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { MercadoPagoConfig, Payment } from 'npm:mercadopago@2.0.11';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response("Method Not Allowed", { status: 405 });
  }

  try {
    const notification = await req.json();

    // Solo procesamos notificaciones de tipo 'payment'
    if (notification.type === 'payment') {
      const paymentId = notification.data.id;

      const accessToken = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN");
      if (!accessToken) throw new Error("MERCADO_PAGO_ACCESS_TOKEN no está configurado.");

      const client = new MercadoPagoConfig({ accessToken });
      const payment = new Payment(client);

      const paymentInfo = await payment.get({ id: paymentId });

      if (paymentInfo && paymentInfo.status === 'approved' && paymentInfo.external_reference) {
        const userId = paymentInfo.external_reference;

        // Usamos el cliente de admin para poder modificar la tabla de perfiles
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
          // Aún así devolvemos 200 para que Mercado Pago no siga reintentando.
          // El error queda registrado en los logs de Supabase para revisión.
        }
      }
    }

    // Respondemos a Mercado Pago con un 200 OK para que sepa que recibimos la notificación.
    return new Response("Notification received", { status: 200 });

  } catch (error) {
    console.error("Error en el webhook de Mercado Pago:", error);
    // Devolvemos un error 500 si algo falla, para que Mercado Pago pueda reintentar.
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});