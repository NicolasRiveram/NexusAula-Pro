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
import Dashboard from "./pages/Dashboard"; // Importar la nueva página Dashboard
import NotFound from "./pages/NotFound";
import { EstablishmentProvider } from "./contexts/EstablishmentContext"; // Importar el proveedor de contexto

const queryClient = new QueryClient();

const AppContent = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession);
      setLoading(false);

      if (_event === 'SIGNED_IN' || _event === 'USER_UPDATED') {
        if (currentSession) {
          navigate('/dashboard'); // Redirigir a dashboard si está autenticado
        }
      } else if (_event === 'SIGNED_OUT') {
        navigate('/login'); // Redirigir a login si cierra sesión
      }
    });

    // Obtener la sesión inicial al cargar la aplicación
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      setSession(initialSession);
      setLoading(false);
      if (!initialSession) {
        navigate('/login');
      } else {
        navigate('/dashboard');
      }
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
        {session ? (
          <>
            <Route path="/" element={<Index />} /> {/* Index puede ser una página de bienvenida o redirigir */}
            <Route path="/dashboard" element={<Dashboard />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          </>
        ) : (
          // Si no hay sesión, redirigir cualquier ruta protegida al login
          <Route path="*" element={<Login />} />
        )}
        <Route path="*" element={<NotFound />} /> {/* Catch-all para rutas no encontradas si hay sesión */}
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