import { MadeWithDyad } from "@/components/made-with-dyad";
    import { useEffect } from "react";
    import { useNavigate } from "react-router-dom";
    import { supabase } from "@/integrations/supabase/client";

    const Index = () => {
      const navigate = useNavigate();

      useEffect(() => {
        const checkSessionAndProfile = async () => {
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            const { data: profileData, error: profileError } = await supabase
              .from('perfiles')
              .select('perfil_completo')
              .eq('id', session.user.id)
              .single();

            if (profileError && profileError.code !== 'PGRST116') {
              console.error("Error fetching profile for Index redirection:", profileError);
              // Fallback: si hay error, asumir que necesita configurar o ir a login
              navigate('/login');
            } else if (profileData?.perfil_completo) {
              navigate('/dashboard'); // Redirigir a dashboard si ya está autenticado y perfil completo
            } else {
              navigate('/configurar-perfil'); // Redirigir a configuración si no está completo
            }
          } else {
            navigate('/login'); // Redirigir a login si no hay sesión
          }
        };
        checkSessionAndProfile();
      }, [navigate]);

      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4 text-gray-800">Bienvenido a tu Aplicación</h1>
            <p className="text-xl text-gray-600">
              Cargando tu experiencia...
            </p>
          </div>
          <MadeWithDyad />
        </div>
      );
    };

    export default Index;