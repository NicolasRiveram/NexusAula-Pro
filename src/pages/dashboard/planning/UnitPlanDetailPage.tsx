import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ArrowLeft, Loader2, BookOpen, Target, Lightbulb, MessageSquare } from 'lucide-react';
import { fetchUnitPlanDetails, UnitPlanDetail, ScheduledClass } from '@/api/planningApi';
import { showError } from '@/utils/toast';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

const UnitPlanDetailPage = () => {
  const { planId } = useParams<{ planId: string }>();
  const [plan, setPlan] = useState<UnitPlanDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (planId) {
      setLoading(true);
      fetchUnitPlanDetails(planId)
        .then(setPlan)
        .catch(err => showError(`Error al cargar el plan: ${err.message}`))
        .finally(() => setLoading(false));
    }
  }, [planId]);

  const groupClassesByCourse = (classes: ScheduledClass[]) => {
    return classes.reduce((acc, cls) => {
      const courseName = `${cls.curso_info.nivel} ${cls.curso_info.nombre}`;
      if (!acc[courseName]) {
        acc[courseName] = [];
      }
      acc[courseName].push(cls);
      return acc;
    }, {} as Record<string, ScheduledClass[]>);
  };

  if (loading) {
    return (
      <div className="container mx-auto flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="container mx-auto text-center">
        <p>No se pudo encontrar el plan de unidad.</p>
        <Link to="/dashboard/planificacion" className="text-primary hover:underline mt-4 inline-block">
          Volver al Planificador
        </Link>
      </div>
    );
  }

  const groupedClasses = groupClassesByCourse(plan.clases);

  return (
    <div className="container mx-auto space-y-6">
      <Link to="/dashboard/planificacion" className="flex items-center text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Volver al Planificador
      </Link>

      <Card>
        <CardHeader>
          <CardTitle className="text-3xl">{plan.titulo}</CardTitle>
          <CardDescription>
            {format(parseISO(plan.fecha_inicio), "d 'de' LLLL", { locale: es })} - {format(parseISO(plan.fecha_fin), "d 'de' LLLL, yyyy", { locale: es })}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <section>
            <h2 className="text-xl font-semibold mb-2 flex items-center"><BookOpen className="mr-2 h-5 w-5" /> Resumen de la Unidad</h2>
            <p className="text-muted-foreground">{plan.descripcion_contenidos}</p>
          </section>

          {plan.sugerencias_ia && (
            <section className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center"><Target className="mr-2 h-5 w-5" /> Objetivos Sugeridos</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    {plan.sugerencias_ia.objetivos.map((oa, i) => <li key={i}>{oa}</li>)}
                  </ul>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center"><Lightbulb className="mr-2 h-5 w-5" /> Proyecto ABP Sugerido</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p><strong className="font-medium">Título:</strong> {plan.sugerencias_ia.proyectoABP.titulo}</p>
                  <p><strong className="font-medium">Descripción:</strong> {plan.sugerencias_ia.proyectoABP.descripcion}</p>
                  <p><strong className="font-medium">Producto Final:</strong> {plan.sugerencias_ia.proyectoABP.productoFinal}</p>
                </CardContent>
              </Card>
            </section>
          )}

          <section>
            <h2 className="text-xl font-semibold mb-4">Secuencia de Clases Programadas</h2>
            {Object.keys(groupedClasses).length > 0 ? (
              <Accordion type="single" collapsible className="w-full">
                {Object.entries(groupedClasses).map(([courseName, classes]) => (
                  <AccordionItem key={courseName} value={courseName}>
                    <AccordionTrigger className="text-lg">{courseName}</AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-6 pl-4 border-l-2 border-primary">
                        {classes.map((cls) => (
                          <div key={cls.id} className="relative">
                            <div className="absolute -left-[23px] top-1 h-4 w-4 rounded-full bg-primary" />
                            <p className="font-semibold text-md">{format(parseISO(cls.fecha), "EEEE d 'de' LLLL", { locale: es })} - {cls.titulo}</p>
                            <div className="mt-2 space-y-3 text-sm text-muted-foreground">
                              <p><strong>Objetivo Docente:</strong> {cls.objetivos_clase}</p>
                              {(cls.bitacora_contenido_cubierto || cls.bitacora_observaciones) && (
                                <Card className="mt-4 bg-amber-50 border-amber-200">
                                  <CardHeader className="p-3">
                                    <CardTitle className="text-base flex items-center"><MessageSquare className="mr-2 h-4 w-4" /> Bitácora de Clase</CardTitle>
                                  </CardHeader>
                                  <CardContent className="p-3 pt-0 text-sm">
                                    {cls.bitacora_contenido_cubierto && <p><strong>Contenido Cubierto:</strong> {cls.bitacora_contenido_cubierto}</p>}
                                    {cls.bitacora_observaciones && <p className="mt-2"><strong>Observaciones:</strong> {cls.bitacora_observaciones}</p>}
                                  </CardContent>
                                </Card>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            ) : (
              <p className="text-muted-foreground">No se encontraron clases programadas para esta unidad.</p>
            )}
          </section>
        </CardContent>
      </Card>
    </div>
  );
};

export default UnitPlanDetailPage;