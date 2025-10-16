import React from 'react';
import { Link } from 'react-router-dom';
import { useEstablishment } from '@/contexts/EstablishmentContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { PlusCircle, Loader2 } from 'lucide-react';
import { fetchReports, Report } from '@/api/reports';
import { showError } from '@/utils/toast';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';

const ReportsPage = () => {
  const { activeEstablishment } = useEstablishment();
  const { profile, user } = useAuth();
  const isAdmin = profile?.rol === 'administrador_establecimiento' || profile?.rol === 'coordinador';

  const { data: reports = [], isLoading: loading } = useQuery({
    queryKey: ['reports', user?.id, activeEstablishment?.id, isAdmin],
    queryFn: () => fetchReports(user!.id, activeEstablishment!.id, isAdmin),
    enabled: !!user && !!activeEstablishment,
    onError: (err: any) => showError(`Error al cargar informes: ${err.message}`),
  });

  const groupedReports = reports.reduce((acc, report) => {
    const levelName = report.cursos?.niveles?.nombre || 'Sin Nivel Asignado';
    if (!acc[levelName]) {
      acc[levelName] = [];
    }
    acc[levelName].push(report);
    return acc;
  }, {} as Record<string, Report[]>);

  const sortedLevels = Object.keys(groupedReports).sort((a, b) => a.localeCompare(b));

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
        <Accordion type="multiple" className="w-full space-y-4">
          {sortedLevels.map((levelName) => (
            <AccordionItem key={levelName} value={levelName}>
              <AccordionTrigger className="text-xl font-semibold bg-muted/50 px-4 rounded-md">
                {levelName}
              </AccordionTrigger>
              <AccordionContent className="pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {groupedReports[levelName].map(report => (
                    <Link to={`/dashboard/informes/${report.id}`} key={report.id}>
                      <Card className="h-full hover:shadow-lg transition-shadow">
                        <CardHeader>
                          <CardTitle>Informe de {report.perfiles.nombre_completo}</CardTitle>
                          <CardDescription>
                            Curso: {report.cursos?.nombre || 'N/A'} <br />
                            Generado el {format(parseISO(report.created_at), "d 'de' LLLL, yyyy", { locale: es })}
                          </CardDescription>
                        </CardHeader>
                      </Card>
                    </Link>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
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