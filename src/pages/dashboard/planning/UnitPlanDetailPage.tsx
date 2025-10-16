import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ArrowLeft, Loader2, BookOpen, Target, Lightbulb, Calendar } from 'lucide-react';
import { fetchUnitPlanDetails, updateClassStatus, updateClassDetails, UnitPlanDetail, ScheduledClass, UpdateClassPayload, updateMasterClassDetails } from '@/api/planningApi';
import { showError, showSuccess, showLoading, dismissToast } from '@/utils/toast';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import ClassCard from '@/components/planning/ClassCard';
import ClassDetailDialog from '@/components/planning/ClassDetailDialog';
import EditClassDialog from '@/components/planning/EditClassDialog';
import { Button } from '@/components/ui/button';

const UnitPlanDetailPage = () => {
  const { planId } = useParams<{ planId: string }>();
  const [plan, setPlan] = useState<UnitPlanDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState<ScheduledClass | null>(null);
  const [isDetailOpen, setDetailOpen] = useState(false);
  const [isEditOpen, setEditOpen] = useState(false);

  const loadPlan = useCallback(async () => {
    if (planId) {
      setLoading(true);
      fetchUnitPlanDetails(planId)
        .then(setPlan)
        .catch(err => showError(`Error al cargar el plan: ${err.message}`))
        .finally(() => setLoading(false));
    }
  }, [planId]);

  useEffect(() => {
    loadPlan();
  }, [loadPlan]);

  const handleStatusChange = async (classId: string, newStatus: 'realizada' | 'programada') => {
    const toastId = showLoading('Actualizando estado...');
    try {
      await updateClassStatus(classId, newStatus);
      showSuccess('Estado de la clase actualizado.');
      loadPlan();
      setDetailOpen(false);
    } catch (error: any) {
      showError(error.message);
    } finally {
      dismissToast(toastId);
    }
  };

  const handleSaveEdit = async (classId: string, data: UpdateClassPayload) => {
    const toastId = showLoading('Guardando cambios...');
    try {
      const classToEdit = plan?.clases.find(c => c.id === classId);
      if (!classToEdit) throw new Error("Clase no encontrada");

      if (classToEdit.estado === 'sin_programar') {
        await updateMasterClassDetails(classId, data);
      } else {
        await updateClassDetails(classId, data);
      }
      
      showSuccess('Clase actualizada correctamente.');
      setEditOpen(false);
      setDetailOpen(false);
      loadPlan();
    } catch (error: any) {
      showError(error.message);
    } finally {
      dismissToast(toastId);
    }
  };

  const handleCardClick = (clase: ScheduledClass) => {
    setSelectedClass(clase);
    setDetailOpen(true);
  };

  const handleEditClick = () => {
    setDetailOpen(false);
    setEditOpen(true);
  };

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

  const areClassesScheduled = plan.clases.length > 0 && plan.clases[0].fecha !== '';
  const groupedClasses = areClassesScheduled ? groupClassesByCourse(plan.clases) : {};

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

          {areClassesScheduled ? (
            <section>
              <h2 className="text-xl font-semibold mb-4">Secuencia de Clases Programadas</h2>
              <Accordion type="single" collapsible className="w-full" defaultValue={Object.keys(groupedClasses)[0]}>
                {Object.entries(groupedClasses).map(([courseName, classes]) => (
                  <AccordionItem key={courseName} value={courseName}>
                    <AccordionTrigger className="text-lg">{courseName}</AccordionTrigger>
                    <AccordionContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-2">
                        {classes.map((cls) => (
                          <ClassCard key={cls.id} clase={cls} onClick={() => handleCardClick(cls)} />
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </section>
          ) : (
            <section>
              <h2 className="text-xl font-semibold mb-4">Plantillas de Clase (Sin Programar)</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-2">
                {plan.clases.map((cls) => (
                  <ClassCard key={cls.id} clase={cls} onClick={() => handleCardClick(cls)} />
                ))}
              </div>
              <div className="text-center mt-6">
                  <p className="text-muted-foreground mb-2">Estas clases son plantillas. Para usarlas, debes programarlas en tu calendario.</p>
                  <Button asChild>
                      <Link to={`/dashboard/planificacion/editar/${plan.id}`}>
                          <Calendar className="mr-2 h-4 w-4" /> Ir a Programar
                      </Link>
                  </Button>
              </div>
            </section>
          )}
        </CardContent>
      </Card>

      <ClassDetailDialog
        isOpen={isDetailOpen}
        onOpenChange={setDetailOpen}
        clase={selectedClass}
        onStatusChange={handleStatusChange}
        onEdit={handleEditClick}
      />

      <EditClassDialog
        isOpen={isEditOpen}
        onOpenChange={setEditOpen}
        clase={selectedClass}
        onSave={handleSaveEdit}
      />
    </div>
  );
};

export default UnitPlanDetailPage;