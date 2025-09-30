import React from 'react';
import PendingRequests from '@/components/dashboard/admin/PendingRequests';

const AdminDashboard = () => {
  return (
    <div className="container mx-auto space-y-6">
      <h1 className="text-3xl font-bold">Panel de Administración</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="lg:col-span-2">
          <PendingRequests />
        </div>
        {/* Aquí se pueden añadir más componentes de administración en el futuro */}
      </div>
    </div>
  );
};

export default AdminDashboard;