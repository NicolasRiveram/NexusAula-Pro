import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import FullPageLoader from '@/components/layout/FullPageLoader';

const ProtectedRoute = () => {
  const { session, profile, loading } = useAuth();

  if (loading) {
    return <FullPageLoader />;
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  if (profile && !profile.perfil_completo) {
    return <Navigate to="/configurar-perfil" replace />;
  }

  // If session exists and profile is complete, render the nested routes
  return <Outlet />;
};

export default ProtectedRoute;