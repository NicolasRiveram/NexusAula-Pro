import React from 'react';
import PendingRequestsManagement from '@/components/super-admin/PendingRequestsManagement';
import AIStatusCheck from '@/components/super-admin/AIStatusCheck';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Building, Users, BookCheck, Palette, FlaskConical } from 'lucide-react';

const SuperAdminDashboard = () => {
  return (
    <div className="container mx-auto space-y-6">
      <h1 className="text-3xl font-bold">Panel de Super Administrador</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Accesos Directos</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <Button asChild variant="outline"><Link to="/dashboard/super-admin/establishments"><Building className="mr-2 h-4 w-4" /> Establecimientos</Link></Button>
            <Button asChild variant="outline"><Link to="/dashboard/super-admin/users"><Users className="mr-2 h-4 w-4" /> Usuarios</Link></Button>
            <Button asChild variant="outline"><Link to="/dashboard/super-admin/curriculum"><BookCheck className="mr-2 h-4 w-4" /> Currículum</Link></Button>
            <Button asChild variant="outline"><Link to="/dashboard/super-admin/design"><Palette className="mr-2 h-4 w-4" /> Diseño</Link></Button>
            <Button asChild variant="outline" className="col-span-2"><Link to="/dashboard/super-admin/ai-tools"><FlaskConical className="mr-2 h-4 w-4" /> Herramientas IA</Link></Button>
          </CardContent>
        </Card>
        <div className="lg:col-span-2">
          <AIStatusCheck />
        </div>
      </div>

      <PendingRequestsManagement />
    </div>
  );
};

export default SuperAdminDashboard;