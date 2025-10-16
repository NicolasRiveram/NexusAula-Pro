import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { fetchDesignSettings, getDesignAssetUrl } from '@/api/design';

interface DesignContextType {
  settings: Record<string, string | null>;
  loading: boolean;
}

const DesignContext = createContext<DesignContextType | undefined>(undefined);

export const DesignProvider = ({ children }: { children: ReactNode }) => {
  const [settings, setSettings] = useState<Record<string, string | null>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const data = await fetchDesignSettings();
        const settingsMap = data.reduce((acc, setting) => {
          acc[setting.key] = setting.value ? getDesignAssetUrl(setting.value) : null;
          return acc;
        }, {} as Record<string, string | null>);
        setSettings(settingsMap);
      } catch (error) {
        console.error("Failed to load design settings:", error);
      } finally {
        setLoading(false);
      }
    };
    loadSettings();
  }, []);

  return (
    <DesignContext.Provider value={{ settings, loading }}>
      {children}
    </DesignContext.Provider>
  );
};

export const useDesign = () => {
  const context = useContext(DesignContext);
  if (context === undefined) {
    throw new Error('useDesign must be used within a DesignProvider');
  }
  return context;
};