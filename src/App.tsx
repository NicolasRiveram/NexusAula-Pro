import { Toaster } from "@/components/ui/toaster";
    import { Toaster as Sonner } from "@/components/ui/sonner";
    import { TooltipProvider } from "@/components/ui/tooltip";
    import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
    import { BrowserRouter, Routes, Route, useNavigate, Outlet } from "react-router-dom";
    import { useState, useEffect } from "react";
    import { Session } from "@supabase/supabase-js";
    import { supabase } from "@/integrations/supabase/client";
    import Index from "./pages/Index";
    import Login from "./pages/Login";
    import Dashboard from "./pages/Dashboard"; 
    import TeacherDashboard from "./pages/dashboard/TeacherDashboard";
    import ProfileSetup from "./pages/ProfileSetup";
    import NotFound from "./pages/NotFound";
    import { EstablishmentProvider } from "./contexts/EstablishmentContext";

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          refetchOnWindowFocus: false,
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

            if (profileError && profileError.code !== 'PGRST116') {
              console.error("Error fetching profile for redirection:", profileError);
              setProfileComplete(false);
            } else if (profileData) {
              setProfileComplete(profileData.perfil_completo);
              if (!profileData.perfil_completo) {
                navigate('/configurar-perfil');
              } else {
                // Perfil completo, redirigir al dashboard principal
                if (window.location.pathname === '/login' || window.location.pathname === '/') {
                  navigate('/dashboard');
                }
              }
            } else {
              setProfileComplete(false);
              navigate('/configurar-perfil');
            }
          } else {
            setProfileComplete(null);
            navigate('/login');
          }
          setLoading(false);
        };

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, currentSession) => {
          setSession(currentSession);
          if (_event === 'SIGNED_IN' || _event === 'INITIAL_SESSION') {
            checkUserAndProfile(currentSession);
          } else if (_event === 'SIGNED_OUT') {
            setProfileComplete(null);
            navigate('/login');
            setLoading(false);
          }
        });

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

            {session && profileComplete ? (
              <Route path="/dashboard" element={<Dashboard />}>
                <Route index element={<TeacherDashboard />} />
                {/* Aquí se agregarán más rutas del dashboard, ej: /dashboard/cursos */}
              </Route>
            ) : (
              <Route path="*" element={<Login />} />
            )}
            
            <Route path="/" element={<Index />} />
            <Route path="*" element={<NotFound />} />
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