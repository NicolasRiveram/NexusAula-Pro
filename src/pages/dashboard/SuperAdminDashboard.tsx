import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import EstablishmentsManagement from '@/components/super-admin/EstablishmentsManagement';
import CurriculumManagement from '@/components/super-admin/CurriculumManagement';

const SuperAdminDashboard = () => {
  return (
    <div className="container mx-auto space-y-6">
      <h1 className="text-3xl font-bold">Panel de Super Administrador</h1>
      
      <Tabs defaultValue="establishments" className="w-full">
        <TabsList>
          <TabsTrigger value="establishments">Establecimientos</TabsTrigger>
          <TabsTrigger value="curriculum">Currículum Base</TabsTrigger>
          <TabsTrigger value="users" disabled>Usuarios Globales</TabsTrigger>
        </TabsList>
        <TabsContent value="establishments" className="mt-4">
          <EstablishmentsManagement />
        </TabsContent>
        <TabsContent value="curriculum" className="mt-4">
          <CurriculumManagement />
        </TabsContent>
        <TabsContent value="users">
          {/* Placeholder for future global user management */}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SuperAdminDashboard;