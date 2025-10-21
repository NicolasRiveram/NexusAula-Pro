import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { establishment_id, emails, initial_password } = await req.json();
    if (!establishment_id || !emails || !Array.isArray(emails) || !initial_password) {
      throw new Error("establishment_id, emails (array), y initial_password son requeridos.");
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const results = { created: 0, linked: 0, errors: 0, details: [] as any[] };

    for (const email of emails) {
      try {
        let userId: string;
        let userStatus = 'existing_user';

        const { data: existingAuthUser, error: getAuthUserError } = await supabaseAdmin.auth.admin.getUserByEmail(email);
        
        if (getAuthUserError && getAuthUserError.message !== 'User not found') {
            throw getAuthUserError;
        }

        if (existingAuthUser?.user) {
          userId = existingAuthUser.user.id;
        } else {
          const { data: newUser, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
            email: email,
            password: initial_password,
            email_confirm: true,
            user_metadata: {
              full_name: email.split('@')[0],
              intended_role: 'docente',
            }
          });

          if (createUserError) throw createUserError;
          userId = newUser.user.id;
          results.created++;
          userStatus = 'created';
        }

        const { error: linkError } = await supabaseAdmin
          .from('perfil_establecimientos')
          .upsert({
            perfil_id: userId,
            establecimiento_id: establishment_id,
            rol_en_establecimiento: 'docente',
            estado: 'aprobado'
          }, { onConflict: 'perfil_id, establecimiento_id' });

        if (linkError) throw linkError;
        
        results.linked++;
        results.details.push({ email, status: `${userStatus}_linked` });

      } catch (error) {
        results.errors++;
        results.details.push({ email, status: 'error', message: error.message });
      }
    }

    return new Response(JSON.stringify(results), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error("Error en la función bulk-create-users:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});