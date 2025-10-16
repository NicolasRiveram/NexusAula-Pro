import React from 'react';
import { Loader2 } from 'lucide-react';
import { fetchDesignSettings } from '@/api/designApi';
import { showError } from '@/utils/toast';
import { useQuery } from '@tanstack/react-query';
import DesignZone from '@/components/super-admin/DesignZone';

const DesignManagementPage = () => {
  const { data: settings = [], isLoading: loading } = useQuery({
    queryKey: ['designSettings'],
    queryFn: fetchDesignSettings,
    onError: (error: any) => showError(error.message),
  });

  if (loading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <div className="container mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Gestión de Diseño</h1>
        <p className="text-muted-foreground">Personaliza la apariencia de la aplicación subiendo imágenes para diferentes zonas.</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {settings.map(setting => (
          <DesignZone key={setting.key} setting={setting} />
        ))}
      </div>
    </div>
  );
};

export default DesignManagementPage;