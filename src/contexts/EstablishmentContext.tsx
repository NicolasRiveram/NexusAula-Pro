import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import { ALL_FEATURES } from '@/config/features';

// Tipos para el establecimiento
export interface Establishment {
  id: string;
  nombre: string;
  direccion?: string;
  comuna?: string;
  region?: string;
  telefono?: string;
  email_contacto?: string;
  logo_url?: string;
}

// Tipos para el contexto
interface EstablishmentContextType {
  activeEstablishment: Establishment | null;
  setActiveEstablishment: (establishment: Establishment | null) => void;
  userEstablishments: Establishment[];
  loadingEstablishments: boolean;
  features: string[];
}

const EstablishmentContext = createContext<EstablishmentContextType | undefined>(undefined);

interface EstablishmentProviderProps {
  children: ReactNode;
}

export const EstablishmentProvider = ({ children }: EstablishmentProviderProps) => {
  const { session, profile } = useAuth();
  const [activeEstablishment, setActiveEstablishment] = useState<Establishment | null>(null);
  const [userEstablishments, setUserEstablishments] = useState<Establishment[]>([]);
  const [loadingEstablishments, setLoadingEstablishments] = useState(true);
  const [features, setFeatures] = useState<string[]>([]);

  useEffect(() => {
    const loadEstablishments = async () => {
      setLoadingEstablishments(true);
      if (session?.user) {
        const { data, error } = await supabase
          .from('perfil_establecimientos')
          .select('establecimientos(*)')
          .eq('perfil_id', session.user.id)
          .eq('estado', 'aprobado'); // Solo establecimientos aprobados

        if (error) {
          console.error('Error fetching user establishments:', error);
          setUserEstablishments([]);
        } else {
          const establishments = data.map((pe: any) => pe.establecimientos).filter(Boolean) as Establishment[];
          setUserEstablishments(establishments);

          // Intentar cargar el establecimiento activo desde localStorage
          const storedActiveId = localStorage.getItem('activeEstablishmentId');
          const storedActive = establishments.find(est => est.id === storedActiveId);

          if (storedActive) {
            setActiveEstablishment(storedActive);
          } else if (establishments.length === 1) {
            // Si solo hay un establecimiento, establecerlo como activo por defecto
            setActiveEstablishment(establishments[0]);
            localStorage.setItem('activeEstablishmentId', establishments[0].id);
          } else {
            setActiveEstablishment(null);
            localStorage.removeItem('activeEstablishmentId');
          }
        }
      } else {
        setUserEstablishments([]);
        setActiveEstablishment(null);
        localStorage.removeItem('activeEstablishmentId');
      }
      setLoadingEstablishments(false);
    };

    loadEstablishments();
  }, [session]);

  useEffect(() => {
    const loadFeatures = async () => {
      if (profile?.rol === 'super_administrador') {
        setFeatures(ALL_FEATURES.map(f => f.key));
        return;
      }

      if (activeEstablishment) {
        try {
          const { data, error } = await supabase
            .from('establishment_features')
            .select('feature_key, is_enabled')
            .eq('establishment_id', activeEstablishment.id);

          if (error) throw error;

          if (!data || data.length === 0) {
            // Si no hay configuraciones de features para este establecimiento, se habilitan todas por defecto.
            setFeatures(ALL_FEATURES.map(f => f.key));
          } else {
            // Si hay configuraciones, se usan solo las habilitadas.
            const enabledFeatures = data
              .filter(f => f.is_enabled)
              .map(f => f.feature_key);
            setFeatures(enabledFeatures);
          }
        } catch (error) {
          console.error('Error fetching establishment features:', error);
          setFeatures([]);
        }
      } else {
        setFeatures([]);
      }
    };

    loadFeatures();
  }, [activeEstablishment, profile?.rol]);

  // Persistir el establecimiento activo en localStorage
  useEffect(() => {
    if (activeEstablishment) {
      localStorage.setItem('activeEstablishmentId', activeEstablishment.id);
    } else {
      localStorage.removeItem('activeEstablishmentId');
    }
  }, [activeEstablishment]);

  const contextValue = {
    activeEstablishment,
    setActiveEstablishment,
    userEstablishments,
    loadingEstablishments,
    features,
  };

  return (
    <EstablishmentContext.Provider value={contextValue}>
      {children}
    </EstablishmentContext.Provider>
  );
};

export const useEstablishment = () => {
  const context = useContext(EstablishmentContext);
  if (context === undefined) {
    throw new Error('useEstablishment must be used within an EstablishmentProvider');
  }
  return context;
};