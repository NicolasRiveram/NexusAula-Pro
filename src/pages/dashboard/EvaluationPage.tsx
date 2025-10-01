import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useOutletContext } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useEstablishment } from '@/contexts/EstablishmentContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, CheckCircle, Send } from 'lucide-react';
import { fetchEvaluations, Evaluation, fetchStudentEvaluations, StudentEvaluation } from '@/api/evaluations';
import { showError } from '@/utils/toast';
import { format, parseISO, isPast } from 'date-fns';
import { es } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatEvaluationType } from '@/utils/evaluationUtils';

interface DashboardContext {
  profile: { rol: string };
}

const EvaluationPage = () => {
  const navigate = useNavigate();
  const [teacherEvaluations, setTeacherEvaluations] = useState<Evaluation[]>([]);
  const [studentEvaluations, setStudentEvaluations] = useState<StudentEvaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const { activeEstablishment } = useEstablishment();
  const { profile } = useOutletContext<DashboardContext>();
  const isStudent = profile.rol === 'estudiante';

  useEffect(() => {
    const loadEvaluations = async () => {
      if (!activeEstablishment) {
        setTeacherEvaluations([]);
        setStudentEvaluations([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        try {
          if (isStudent) {
            const data = await fetchStudentEvaluations(user.id, activeEstablishment.id);
            setStudentEvaluations(data);
          } else {
            const data = await fetchEvaluations(user.id, activeEstablishment.id);
            setTeacherEvaluations(data);
          }
        } catch (err: any) {
          showError(`Error al cargar evaluaciones: ${err.message}`);
        }
      }
      setLoading(false);
    };
    loadEvaluations();
  }, [activeEstablishment, isStudent]);

  const renderTeacherView = () => {
    const groupEvaluationsByLevel = (evals: Evaluation[]): Record<string, Evaluation[]> => {
      const groups: Record<string, Evaluation[]> = {};
      evals.forEach(evaluation => {
        const levels = new Set<string>();
        evaluation.curso_asignaturas.forEach(ca => {
          if (ca.curso?.nivel?.nombre) {
            levels.add(ca.curso.nivel.nombre);
          }
        });

        levels.forEach(levelName => {
          if (!groups[levelName]) {
            groups[levelName] = [];
          }
          if (!groups[levelName].some(e => e.id === evaluation.id)) {
              groups[levelName].push(evaluation);
          }
        });
      });
      return groups;
    };

    const renderEvaluations = (filterType?: string) => {
      const filtered = filterType ? teacherEvaluations.filter(e => e.tipo === filterType) : teacherEvaluations;
      
      if (filtered.length === 0) {
        return (
          <div className="text-center py-12 border-2 border-dashed rounded-lg mt-4">
            <h3 className="text-xl font-semibold">No hay evaluaciones de este tipo</h3>
            <p className="text-muted-foreground mt-2">Crea una nueva evaluación para empezar.</p>
          </div>
        );
      }

      const grouped = groupEvaluationsByLevel(filtered);
      const sortedLevels = Object.keys(grouped).sort();

      return (
        <div className="space-y-8 mt-4">
          {sortedLevels.map(levelName => (
            <div key={levelName}>
              <h2 className="text-2xl font-bold mb-4 pb-2 border-b">{levelName}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {grouped[levelName].map(evaluation => (
                  <Card key={evaluation.id} className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate(`/dashboard/evaluacion/${evaluation.id}`)}>
                    <CardHeader>
                      <CardTitle>{evaluation.titulo}</CardTitle>
                      <CardDescription>
                        Aplicación: {format(parseISO(evaluation.fecha_aplicacion), "d 'de' LLLL, yyyy", { locale: es })}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <Badge variant="secondary" className="capitalize">{formatEvaluationType(evaluation.tipo)}</Badge>
                        <div className="flex flex-wrap gap-1">
                          {evaluation.curso_asignaturas.map((ca, index) => (
                            <Badge key={index} variant="outline">
                              {ca.curso.nivel.nombre} {ca.curso.nombre}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      );
    };

    return (
      <>
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Banco de Evaluaciones</h1>
            <p className="text-muted-foreground">Crea, gestiona y comparte tus instrumentos de evaluación.</p>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline" disabled={!activeEstablishment}>
              <Link to="/dashboard/rubricas/crear">
                <PlusCircle className="mr-2 h-4 w-4" /> Crear Rúbrica
              </Link>
            </Button>
            <Button asChild disabled={!activeEstablishment}>
              <Link to="/dashboard/evaluacion/crear">
                <PlusCircle className="mr-2 h-4 w-4" /> Crear Nueva Evaluación
              </Link>
            </Button>
          </div>
        </div>
        <Tabs defaultValue="todas" className="w-full">
          <TabsList>
            <TabsTrigger value="todas">Todas</TabsTrigger>
            <TabsTrigger value="prueba">Pruebas</TabsTrigger>
            <TabsTrigger value="guia_de_trabajo">Guías</TabsTrigger>
            <TabsTrigger value="disertacion">Disertaciones</TabsTrigger>
            <TabsTrigger value="otro">Otras</TabsTrigger>
          </TabsList>
          <TabsContent value="todas">{renderEvaluations()}</TabsContent>
          <TabsContent value="prueba">{renderEvaluations('prueba')}</TabsContent>
          <TabsContent value="guia_de_trabajo">{renderEvaluations('guia_de_trabajo')}</TabsContent>
          <TabsContent value="disertacion">{renderEvaluations('disertacion')}</TabsContent>
          <TabsContent value="otro">{renderEvaluations('otro')}</TabsContent>
        </Tabs>
      </>
    );
  };

  const renderStudentView = () => {
    const pending = studentEvaluations.filter(e => e.status === 'Pendiente' && !isPast(parseISO(e.fecha_aplicacion)));
    const completed = studentEvaluations.filter(e => e.status === 'Completado');

    return (
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
                      <p className="text-sm text-muted-foreground">Fecha de aplicación: {format(parseISO(e.fecha_aplicacion), "d 'de' LLLL", { locale: es })}</p>
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
    );
  };

  return (
    <div className="container mx-auto space-y-6">
      {loading ? (
        <p>Cargando evaluaciones...</p>
      ) : !activeEstablishment ? (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <h3 className="text-xl font-semibold">Selecciona un establecimiento</h3>
          <p className="text-muted-foreground mt-2">Elige un establecimiento para gestionar tus evaluaciones.</p>
        </div>
      ) : isStudent ? renderStudentView() : renderTeacherView()}
    </div>
  );
};

export default EvaluationPage;