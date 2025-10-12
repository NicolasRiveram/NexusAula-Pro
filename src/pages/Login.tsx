import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/integrations/supabase/client';
import { useDesign } from '@/contexts/DesignContext';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function Login() {
  const { settings } = useDesign();
  const navigate = useNavigate();
  const backgroundImageUrl = settings['login_background_url'];

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        const { data: profileData, error: profileError } = await supabase
          .from('perfiles')
          .select('perfil_completo')
          .eq('id', session.user.id)
          .single();

        if (profileError && profileError.code !== 'PGRST116') {
          console.error("Error fetching profile after login:", profileError);
          // Stay on login page on error, user can retry.
        } else if (profileData?.perfil_completo) {
          navigate('/dashboard');
        } else {
          navigate('/configurar-perfil');
        }
      }
    });

    // Also check if user is already logged in when visiting /login
    const checkInitialSession = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            const { data: profileData, error: profileError } = await supabase
              .from('perfiles')
              .select('perfil_completo')
              .eq('id', session.user.id)
              .single();

            if (profileError && profileError.code !== 'PGRST116') {
              // Do nothing, let them try to log in again.
            } else if (profileData?.perfil_completo) {
              navigate('/dashboard');
            } else if (profileData) {
              navigate('/configurar-perfil');
            }
        }
    };
    checkInitialSession();

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  const backgroundStyle = backgroundImageUrl
    ? { backgroundImage: `url(${backgroundImageUrl})` }
    : {};

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-gray-50 p-4 bg-cover bg-center"
      style={backgroundStyle}
    >
      <div className="relative w-full max-w-lg rounded-lg shadow-md bg-white/90 backdrop-blur-sm pt-24">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <img src="/nexuslogo.png" alt="NexusAula Logo" className="h-48 w-48" />
        </div>
        <div className="p-8 pt-0">
          <Auth
            supabaseClient={supabase}
            providers={[]} // Solo email/contraseña por ahora
            appearance={{
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: 'hsl(var(--primary))',
                    brandAccent: 'hsl(var(--primary-foreground))',
                  },
                },
              },
            }}
            theme="light"
            localization={{
              variables: {
                sign_in: {
                  email_label: 'Correo electrónico',
                  password_label: 'Contraseña',
                  email_input_placeholder: 'Tu correo electrónico',
                  password_input_placeholder: 'Tu contraseña',
                  button_label: 'Iniciar sesión',
                  social_provider_text: 'O inicia sesión con',
                  link_text: '¿Ya tienes una cuenta? Inicia sesión',
                },
                sign_up: {
                  email_label: 'Correo electrónico',
                  password_label: 'Contraseña',
                  email_input_placeholder: 'Tu correo electrónico',
                  password_input_placeholder: 'Tu contraseña',
                  button_label: 'Registrarse',
                  social_provider_text: 'O regístrate con',
                  link_text: '¿No tienes una cuenta? Regístrate',
                },
                forgotten_password: {
                  email_label: 'Correo electrónico',
                  button_label: 'Enviar instrucciones de restablecimiento',
                  link_text: '¿Olvidaste tu contraseña?',
                  email_input_placeholder: 'Tu correo electrónico',
                },
                update_password: {
                  password_label: 'Nueva contraseña',
                  password_input_placeholder: 'Tu nueva contraseña',
                  button_label: 'Actualizar contraseña',
                },
              },
            }}
          />
        </div>
      </div>
    </div>
  );
}

export default Login;