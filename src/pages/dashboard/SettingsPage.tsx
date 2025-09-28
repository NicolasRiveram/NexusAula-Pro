import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const SettingsPage = () => {
  return (
    <div className="container mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Configuración</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Aquí podrás ajustar la configuración de tu cuenta, gestionar tus notificaciones y personalizar la apariencia de la plataforma.</p>
          {/* El contenido detallado de esta página se implementará a continuación. */}
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsPage;