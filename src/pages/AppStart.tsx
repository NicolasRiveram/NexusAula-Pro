import { MadeWithDyad } from "@/components/made-with-dyad";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const AppStart = () => {
  const navigate = useNavigate();
  const { session, profile, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (session && profile) {
        if (profile.perfil_completo) {
          navigate('/dashboard');
        } else {
          navigate('/configurar-perfil');
        }
      } else {
        navigate('/login');
      }
    }
  }, [session, profile, loading, navigate]);

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

export default AppStart;