import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { ScheduledClass } from '@/api/planningApi';
import { showSuccess, showLoading, dismissToast, showError } from '@/utils/toast';
import { CheckCircle, Copy, Edit, XCircle, Download, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useEstablishment } from '@/contexts/EstablishmentContext';
import { generateStudentGuidePdf } from '@/utils/pdfUtils';

interface ClassDetailDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  clase: ScheduledClass | null;
  onStatusChange: (classId: string, newStatus: 'realizada' | 'programada') => void;
  onEdit: () => void;
}

const ClassDetailDialog: React.FC<ClassDetailDialogProps> = ({ isOpen, onOpenChange, clase, onStatusChange, onEdit }) => {
  const { profile } = useAuth();
  const { activeEstablishment } = useEstablishment();
  const [isGeneratingGuide, setIsGeneratingGuide] = useState(false);

  if (!clase) return null;

  const handleCopy = () => {
    const content = `
Título: ${clase.titulo}
Fecha: ${clase.fecha || 'Sin programar'}
---
Objetivo de Aprendizaje:
${clase.objetivo_aprendizaje_texto || 'No especificado'}
---
Habilidades:
${clase.habilidades || 'No especificado'}
---
Objetivo de la Clase (Docente):
${clase.objetivos_clase}
---
Objetivo para el Estudiante:
${clase.objetivo_estudiante || 'No especificado'}
---
Aporte al Proyecto:
${clase.aporte_proyecto || 'No especificado'}
---
Actividades de Inicio:
${clase.actividades_inicio}
---
Actividades de Desarrollo:
${clase.actividades_desarrollo}
---
Actividades de Cierre:
${clase.actividades_cierre}
---
Recursos:
${clase.recursos}
---
Vínculo Interdisciplinario:
${clase.vinculo_interdisciplinario || 'No especificado'}
---
Aspectos Valóricos y Actitudinales:
${clase.aspectos_valoricos_actitudinales || 'No especificado'}
    `;
    navigator.clipboard.writeText(content.trim());
    showSuccess('Contenido de la clase copiado al portapapeles.');
  };

  const handleDownloadGuide = async () => {
    if (!clase) return;
    setIsGeneratingGuide(true);
    const toastId = showLoading("Generando guía de estudio con IA...");
    try {
      const { data, error } = await supabase.functions.invoke('generate-student-guide', {
        body: { classId: clase.id },
      });
  
      if (error) throw error;
  
      await generateStudentGuidePdf(
        data,
        { title: clase.titulo, courseName: `${clase.curso_info.nivel} ${clase.curso_info.nombre}`, subjectName: clase.curso_info.asignatura },
        { name: activeEstablishment?.nombre || '', logoUrl: activeEstablishment?.logo_url || null },
        profile?.nombre_completo || ''
      );
  
      dismissToast(toastId);
    } catch (error: any) {
      dismissToast(toastId);
      showError(`Error al generar la guía: ${error.message}`);
    } finally {
      setIsGeneratingGuide(false);
    }
  };

  const DetailSection = ({ title, content }: { title: string; content?: string | null }) => (
    content ? (
      <div>
        <h4 className="font-semibold text-sm mb-1">{title}</h4>
        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{content}</p>
      </div>
    ) : null
  );

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{clase.titulo}</DialogTitle>
          <DialogDescription>
            {clase.curso_info.nombre 
              ? `Detalles de la clase para ${clase.curso_info.nivel} ${clase.curso_info.nombre} - ${clase.curso_info.asignatura}`
              : 'Detalles de la plantilla de clase (sin programar)'
            }
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-4 my-4">
            <DetailSection title="Objetivo de Aprendizaje (OA)" content={clase.objetivo_aprendizaje_texto} />
            <DetailSection title="Habilidades a Desarrollar" content={clase.habilidades} />
            <Separator />
            <DetailSection title="Objetivo de la Clase (Docente)" content={clase.objetivos_clase} />
            <DetailSection title="Objetivo para el Estudiante" content={clase.objetivo_estudiante} />
            <DetailSection title="Aporte al Proyecto" content={clase.aporte_proyecto} />
            <Separator />
            <DetailSection title="Actividades de Inicio" content={clase.actividades_inicio} />
            <DetailSection title="Actividades de Desarrollo" content={clase.actividades_desarrollo} />
            <DetailSection title="Actividades de Cierre" content={clase.actividades_cierre} />
            <Separator />
            <DetailSection title="Recursos" content={clase.recursos} />
            <DetailSection title="Vínculo Interdisciplinario" content={clase.vinculo_interdisciplinario} />
            <DetailSection title="Aspectos Valóricos y Actitudinales" content={clase.aspectos_valoricos_actitudinales} />
          </div>
        </ScrollArea>
        <DialogFooter className="sm:justify-between gap-2">
          <div>
            {clase.estado !== 'sin_programar' && (
              clase.estado === 'programada' ? (
                <Button variant="outline" onClick={() => onStatusChange(clase.id, 'realizada')}>
                  <CheckCircle className="mr-2 h-4 w-4" /> Marcar como Realizada
                </Button>
              ) : (
                <Button variant="outline" onClick={() => onStatusChange(clase.id, 'programada')}>
                  <XCircle className="mr-2 h-4 w-4" /> Marcar como Programada
                </Button>
              )
            )}
          </div>
          <div className="flex flex-wrap gap-2 justify-end">
            <Button variant="outline" onClick={handleDownloadGuide} disabled={isGeneratingGuide}>
              {isGeneratingGuide ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
              Guía de Estudio
            </Button>
            <Button variant="secondary" onClick={handleCopy}><Copy className="mr-2 h-4 w-4" /> Copiar</Button>
            <Button onClick={onEdit}><Edit className="mr-2 h-4 w-4" /> Editar</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ClassDetailDialog;