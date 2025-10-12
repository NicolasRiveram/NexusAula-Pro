import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response("Method Not Allowed", { status: 405 });
  }

  try {
    const notification = await req.json();
    const topic = notification.topic || notification.type;

    if (topic === 'preapproval') {
      const preapprovalId = notification.id || notification.data?.id;
      if (!preapprovalId) {
        console.error("No preapproval ID found in notification:", notification);
        return new Response("Notification acknowledged, but no ID found.", { status: 200 });
      }

      const accessToken = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN");
      if (!accessToken) throw new Error("MERCADO_PAGO_ACCESS_TOKEN no está configurado.");

      const preapprovalResponse = await fetch(`https://api.mercadopago.com/preapproval/${preapprovalId}`, {
        headers: { 'Authorization': `Bearer ${accessToken}` },
      });
      const preapprovalInfo = await preapprovalResponse.json();

      if (!preapprovalResponse.ok) {
        console.error("Error fetching preapproval info from Mercado Pago:", preapprovalInfo);
        return new Response("Error fetching preapproval info, but notification acknowledged.", { status: 200 });
      }

      if (preapprovalInfo && preapprovalInfo.status === 'authorized' && preapprovalInfo.external_reference) {
        const userId = preapprovalInfo.external_reference;
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
            payment_provider_customer_id: preapprovalInfo.payer_id?.toString(),
            payment_provider_subscription_id: preapprovalInfo.id?.toString(),
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