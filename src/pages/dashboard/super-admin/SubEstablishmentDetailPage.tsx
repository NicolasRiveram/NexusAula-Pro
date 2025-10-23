import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Establishment, fetchAllEstablishments } from '@/api/superAdminApi';
import { showError } from '@/utils/toast';
import BulkUserCreator from '@/components/super-admin/BulkUserCreator';
import FeatureFlagManager from '@/components/super-admin/FeatureFlagManager';
import EstablishmentUserList from '@/components/super-admin/EstablishmentUserList';
import EstablishmentLogoForm from '@/components/super-admin/EstablishmentLogoForm';

const SubEstablishmentDetailPage = () => {
  const { establishmentId } = useParams<{ establishmentId: string }>();
  const [establishment, setEstablishment] = useState<Establishment | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (establishmentId) {
      // No need to set loading to true here if we want a silent refresh
      fetchAllEstablishments()
        .then(all => {
          const found = all.find(e => e.id === establishmentId);
          setEstablishment(found || null);
        })
        .catch(err => showError(err.message))
        .finally(() => setLoading(false));
    }
  }, [establishmentId]);

  useEffect(() => {
    setLoading(true);
    loadData();
  }, [loadData]);

  if (loading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  if (!establishment) {
    return <p>Establecimiento no encontrado.</p>;
  }

  return (
    <div className="space-y-6">
      <Link to="/dashboard/super-admin/establishments" className="flex items-center text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Volver a la Gestión de Establecimientos
      </Link>
      
      <h1 className="text-3xl font-bold">Gestionar: {establishment.nombre}</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <BulkUserCreator establishmentId={establishment.id} />
        <FeatureFlagManager establishmentId={establishment.id} />
        <EstablishmentLogoForm establishment={establishment} onUpdate={loadData} />
      </div>

      <EstablishmentUserList establishmentId={establishment.id} />
    </div>
  );
};

export default SubEstablishmentDetailPage;