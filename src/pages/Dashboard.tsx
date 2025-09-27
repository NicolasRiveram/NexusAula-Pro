import React from 'react';
import { useEstablishment } from '@/contexts/EstablishmentContext';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { showSuccess, showError } from '@/utils/toast';

const Dashboard = () => {
  const { activeEstablishment, userEstablishments, setActiveEstablishment, loadingEstablishments } = useEstablishment();
  const navigate = useNavigate();

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      showError('Error al cerrar sesión: ' + error.message);
    } else {
      showSuccess('Sesión cerrada correctamente.');
      navigate('/login');
    }
  };

  if (loadingEstablishments) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-xl text-gray-600">Cargando establecimientos...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
      <div className="text-center bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-4xl font-bold mb-4 text-gray-800">Bienvenido al Dashboard</h1>
        {activeEstablishment ? (
          <p className="text-xl text-gray-700 mb-4">
            Establecimiento activo: <span className="font-semibold">{activeEstablishment.nombre}</span>
          </p>
        ) : (
          <p className="text-xl text-gray-700 mb-4">
            No hay establecimiento activo seleccionado.
          </p>
        )}

        {userEstablishments.length > 1 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">Tus Establecimientos:</h3>
            <select
              className="p-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              value={activeEstablishment?.id || ''}
              onChange={(e) => {
                const selected = userEstablishments.find(est => est.id === e.target.value);
                setActiveEstablishment(selected || null);
              }}
            >
              <option value="">Selecciona un establecimiento</option>
              {userEstablishments.map((est) => (
                <option key={est.id} value={est.id}>
                  {est.nombre}
                </option>
              ))}
            </select>
          </div>
        )}

        <Button onClick={handleLogout} className="mt-4">
          Cerrar Sesión
        </Button>
      </div>
    </div>
  );
};

export default Dashboard;