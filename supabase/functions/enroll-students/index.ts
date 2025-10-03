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
    const { cursoId, estudiantesData } = await req.json();
    if (!cursoId || !estudiantesData) {
      throw new Error("cursoId and estudiantesData are required.");
    }

    // Create Supabase admin client to create users
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const results = [];

    for (const estudiante of estudiantesData) {
      const { nombre_completo, rut, email: providedEmail } = estudiante;
      let email = providedEmail;
      let perfilId = null;
      let userExists = false;

      // 1. Check for existing user by email or RUT
      if (email) {
        const { data: existingUser } = await supabaseAdmin.from('perfiles').select('id').eq('email', email).single();
        if (existingUser) {
          perfilId = existingUser.id;
          userExists = true;
        }
      }
      if (!perfilId && rut) {
        const { data: existingUser } = await supabaseAdmin.from('perfiles').select('id').eq('rut', rut).single();
        if (existingUser) {
          perfilId = existingUser.id;
          userExists = true;
        }
      }

      // 2. If user exists, enroll them. If not, create and enroll.
      if (userExists && perfilId) {
        const { data: existingEnrollment } = await supabaseAdmin
          .from('curso_estudiantes')
          .select('*')
          .eq('curso_id', cursoId)
          .eq('estudiante_perfil_id', perfilId)
          .maybeSingle();

        if (existingEnrollment) {
          results.push({ status: 'ya_inscrito', nombre_completo });
        } else {
          const { error: insertError } = await supabaseAdmin
            .from('curso_estudiantes')
            .insert({ curso_id: cursoId, estudiante_perfil_id: perfilId });
          if (insertError) throw insertError;
          results.push({ status: 'inscrito_existente', nombre_completo });
        }
      } else {
        // Create new user
        if (!email) {
          const baseEmailPart = (nombre_completo || 'estudiante').toLowerCase().replace(/[^a-z0-9]/g, '');
          let generatedEmail = `${baseEmailPart}@nexusaulapro.com`;
          let counter = 0;
          let emailTaken = true;
          while(emailTaken) {
            const { data: userCheck } = await supabaseAdmin.from('perfiles').select('id').eq('email', generatedEmail).single();
            if (!userCheck) {
              emailTaken = false;
            } else {
              counter++;
              generatedEmail = `${baseEmailPart}${counter}@nexusaulapro.com`;
            }
          }
          email = generatedEmail;
        }

        const password = rut ? rut.replace(/[.-]/g, '') : (nombre_completo.split(' ')[0] || 'nexus123').toLowerCase();

        const { data: newUser, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
          email: email,
          password: password,
          email_confirm: true, // Auto-confirm email
          user_metadata: {
            full_name: nombre_completo,
            rut: rut,
            intended_role: 'estudiante',
          }
        });

        if (createUserError) {
          results.push({ status: 'error', nombre_completo, mensaje: createUserError.message });
          continue; // Skip to next student
        }

        const newUserId = newUser.user.id;

        // Enroll in course
        const { error: enrollError } = await supabaseAdmin
          .from('curso_estudiantes')
          .insert({ curso_id: cursoId, estudiante_perfil_id: newUserId });

        if (enrollError) {
          // Rollback user creation if enrollment fails
          await supabaseAdmin.auth.admin.deleteUser(newUserId);
          results.push({ status: 'error', nombre_completo, mensaje: `Error al inscribir: ${enrollError.message}` });
          continue;
        }

        results.push({
          status: 'creado_e_inscrito',
          nombre_completo,
          generated_email: email,
          generated_password: password,
        });
      }
    }

    return new Response(JSON.stringify({ resultados: results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error("Error in enroll-students function:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})