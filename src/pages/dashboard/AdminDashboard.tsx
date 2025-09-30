import React from 'react';
import PendingRequests from '@/components/dashboard/admin/PendingRequests';
import UserManagement from '@/components/dashboard/admin/UserManagement';

const AdminDashboard = () => {
  return (
    <div className="container mx-auto space-y-6">
      <h1 className="text-3xl font-bold">Panel de Administración</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PendingRequests />
        <UserManagement />
      </div>
    </div>
  );
};

export default AdminDashboard;