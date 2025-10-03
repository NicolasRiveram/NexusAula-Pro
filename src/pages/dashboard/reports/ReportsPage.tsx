import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useEstablishment } from '@/contexts/EstablishmentContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, Loader2 } from 'lucide-react';
import { fetchReports, Report } from '@/api/reportsApi';
import { showError } from '@/utils/toast';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

const ReportsPage = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const { activeEstablishment } = useEstablishment();

  useEffect(() => {
    const loadReports = async () => {
      if (!activeEstablishment) {
        setReports([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        try {
          const data = await fetchReports(user.id, activeEstablishment.id);
          setReports(data);
        } catch (err: any) {
          showError(`Error al cargar informes: ${err.message}`);
        }
      }
      setLoading(false);
    };
    loadReports();
  }, [activeEstablishment]);

  return (
    <div className="container mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Informes Pedagógicos</h1>
          <p className="text-muted-foreground">Genera y consulta informes de rendimiento de tus estudiantes.</p>
        </div>
        <Button asChild disabled={!activeEstablishment}>
          <Link to="/dashboard/informes/generar">
            <PlusCircle className="mr-2 h-4 w-4" /> Generar Nuevo Informe
          </Link>
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>
      ) : !activeEstablishment ? (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <h3 className="text-xl font-semibold">Selecciona un establecimiento</h3>
          <p className="text-muted-foreground mt-2">Elige un establecimiento para gestionar tus informes.</p>
        </div>
      ) : reports.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reports.map(report => (
            <Link to={`/dashboard/informes/${report.id}`} key={report.id}>
              <Card className="h-full hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle>Informe de {report.perfiles.nombre_completo}</CardTitle>
                  <CardDescription>
                    Generado el {format(parseISO(report.created_at), "d 'de' LLLL, yyyy", { locale: es })}
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <h3 className="text-xl font-semibold">No tienes informes generados</h3>
          <p className="text-muted-foreground mt-2">
            Crea tu primer informe para este establecimiento.
          </p>
        </div>
      )}
    </div>
  );
};

export default ReportsPage;