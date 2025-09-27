import { MadeWithDyad } from "@/components/made-with-dyad";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate('/dashboard'); // Redirigir a dashboard si ya está autenticado
      }
    };
    checkSession();
  }, [navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4 text-gray-800">Bienvenido a tu Aplicación</h1>
        <p className="text-xl text-gray-600">
          Inicia sesión o regístrate para comenzar.
        </p>
      </div>
      <MadeWithDyad />
    </div>
  );
};

export default Index;