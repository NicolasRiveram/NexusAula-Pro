import React from 'react';
import { Link } from 'react-router-dom';
import { useEstablishment } from '@/contexts/EstablishmentContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Send } from 'lucide-react';
import { fetchStudentEvaluations, StudentEvaluation } from '@/api/evaluationsApi';
import { format, parseISO, isPast } from 'date-fns';
import { es } from 'date-fns/locale';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';

const StudentEvaluationPage = () => {
  const { activeEstablishment } = useEstablishment();
  const { user } = useAuth();

  const { data: studentEvaluations = [], isLoading: loading } = useQuery({
    queryKey: ['evaluations', user?.id, activeEstablishment?.id, 'student'],
    queryFn: () => fetchStudentEvaluations(user!.id, activeEstablishment!.id),
    enabled: !!user && !!activeEstablishment,
  });

  const pending = studentEvaluations.filter(e => e.status === 'Pendiente' && e.fecha_aplicacion && !isPast(parseISO(e.fecha_aplicacion)));
  const completed = studentEvaluations.filter(e => e.status === 'Completado');

  return (
    <div className="container mx-auto space-y-6">
      {loading ? (
        <p>Cargando evaluaciones...</p>
      ) : !activeEstablishment ? (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <h3 className="text-xl font-semibold">Selecciona un establecimiento</h3>
          <p className="text-muted-foreground mt-2">Elige un establecimiento para ver tus evaluaciones.</p>
        </div>
      ) : (
        <>
          <div>
            <h1 className="text-3xl font-bold">Mis Evaluaciones</h1>
            <p className="text-muted-foreground">Aquí encontrarás tus evaluaciones pendientes y completadas.</p>
          </div>
          <Tabs defaultValue="pendientes" className="w-full">
            <TabsList>
              <TabsTrigger value="pendientes">Pendientes ({pending.length})</TabsTrigger>
              <TabsTrigger value="completadas">Completadas ({completed.length})</TabsTrigger>
            </TabsList>
            <TabsContent value="pendientes">
              {pending.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
                  {pending.map(e => (
                    <Card key={e.id}>
                      <CardHeader>
                        <CardTitle>{e.titulo}</CardTitle>
                        <CardDescription>{e.asignatura_nombre} - {e.curso_nombre}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">Fecha de aplicación: {e.fecha_aplicacion ? format(parseISO(e.fecha_aplicacion), "d 'de' LLLL", { locale: es }) : 'Sin fecha'}</p>
                        <Button asChild className="w-full mt-4">
                          <Link to={`/dashboard/evaluacion/${e.id}/responder`}>
                            <Send className="mr-2 h-4 w-4" /> Responder
                          </Link>
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : <p className="text-center text-muted-foreground py-12">¡Genial! No tienes evaluaciones pendientes.</p>}
            </TabsContent>
            <TabsContent value="completadas">
              {completed.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
                  {completed.map(e => (
                    <Card key={e.id} className="bg-muted/50">
                      <CardHeader>
                        <CardTitle>{e.titulo}</CardTitle>
                        <CardDescription>{e.asignatura_nombre} - {e.curso_nombre}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center text-green-600">
                          <CheckCircle className="mr-2 h-4 w-4" />
                          <span>Completado</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : <p className="text-center text-muted-foreground py-12">Aún no has completado ninguna evaluación.</p>}
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
};

export default StudentEvaluationPage;