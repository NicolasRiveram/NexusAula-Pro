import { Toaster } from "@/components/ui/toaster";
    import { Toaster as Sonner } from "@/components/ui/sonner";
    import { TooltipProvider } from "@/components/ui/tooltip";
    import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
    import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
    import { useState, useEffect } from "react";
    import { Session } from "@supabase/supabase-js";
    import { supabase } from "@/integrations/supabase/client";
    import Index from "./pages/Index";
    import Login from "./pages/Login";
    import Dashboard from "./pages/Dashboard";
    import ProfileSetup from "./pages/ProfileSetup"; // Importar la nueva página de configuración
    import NotFound from "./pages/NotFound";
    import { EstablishmentProvider } from "./contexts/EstablishmentContext";

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          refetchOnWindowFocus: false, // Desactivar refetch en foco
        },
      },
    });

    const AppContent = () => {
      const [session, setSession] = useState<Session | null>(null);
      const [loading, setLoading] = useState(true);
      const [profileComplete, setProfileComplete] = useState<boolean | null>(null);
      const navigate = useNavigate();

      useEffect(() => {
        const checkUserAndProfile = async (currentSession: Session | null) => {
          if (currentSession) {
            const { data: profileData, error: profileError } = await supabase
              .from('perfiles')
              .select('perfil_completo, rol')
              .eq('id', currentSession.user.id)
              .single();

            if (profileError && profileError.code !== 'PGRST116') { // PGRST116 means no rows found (profile not yet created by trigger)
              console.error("Error fetching profile for redirection:", profileError);
              setProfileComplete(false); // Asumir incompleto si hay error
            } else if (profileData) {
              setProfileComplete(profileData.perfil_completo);
              if (!profileData.perfil_completo) {
                navigate('/configurar-perfil');
              } else {
                navigate('/dashboard');
              }
            } else {
              // Profile not found, likely new user, redirect to setup
              setProfileComplete(false);
              navigate('/configurar-perfil');
            }
          } else {
            setProfileComplete(null); // No session, no profile status
            navigate('/login');
          }
          setLoading(false);
        };

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, currentSession) => {
          setSession(currentSession);
          if (_event === 'SIGNED_IN' || _event === 'USER_UPDATED') {
            checkUserAndProfile(currentSession);
          } else if (_event === 'SIGNED_OUT') {
            setProfileComplete(null);
            navigate('/login');
            setLoading(false);
          }
        });

        // Obtener la sesión inicial y verificar el perfil
        supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
          setSession(initialSession);
          checkUserAndProfile(initialSession);
        });

        return () => subscription.unsubscribe();
      }, [navigate]);

      if (loading) {
        return (
          <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <p className="text-xl text-gray-600">Cargando aplicación...</p>
          </div>
        );
      }

      return (
        <EstablishmentProvider session={session}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/configurar-perfil" element={<ProfileSetup />} />

            {session && profileComplete !== null ? (
              profileComplete ? (
                <>
                  <Route path="/" element={<Index />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  {/* ADD ALL CUSTOM PROTECTED ROUTES HERE */}
                  <Route path="*" element={<NotFound />} />
                </>
              ) : (
                // Si el perfil no está completo, cualquier ruta protegida redirige a configurar-perfil
                <Route path="*" element={<ProfileSetup />} />
              )
            ) : (
              // Si no hay sesión o el estado del perfil aún no se ha determinado, redirigir a login
              <Route path="*" element={<Login />} />
            )}
          </Routes>
        </EstablishmentProvider>
      );
    };

    const App = () => (
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AppContent />
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    );

    export default App;