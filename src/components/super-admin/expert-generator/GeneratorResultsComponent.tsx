import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { ThumbsUp, ThumbsDown, Save, Loader2 } from 'lucide-react';
import { showSuccess, showError, showLoading, dismissToast } from '@/utils/toast';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';

interface GeneratorResultsComponentProps {
  results: any;
  selection: {
    nivelId: string;
    asignaturaId: string;
  };
}

const EditableSection = ({ title, content, onSave, isSaving }: { title: string, content: string, onSave: (newContent: string) => void, isSaving: boolean }) => {
  const [text, setText] = useState(content);

  useEffect(() => {
    setText(content);
  }, [content]);

  return (
    <AccordionItem value={title}>
      <AccordionTrigger className="text-lg font-semibold">{title}</AccordionTrigger>
      <AccordionContent className="space-y-3">
        <Textarea value={text} onChange={(e) => setText(e.target.value)} rows={10} />
        <div className="flex justify-end">
          <Button onClick={() => onSave(text)} disabled={isSaving}>
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Guardar en Base de Datos
          </Button>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
};

const GeneratorResultsComponent: React.FC<GeneratorResultsComponentProps> = ({ results, selection }) => {
  const [isSaving, setIsSaving] = useState<Record<string, boolean>>({});

  const handleSave = async (section: string, content: string) => {
    setIsSaving(prev => ({ ...prev, [section]: true }));
    const toastId = showLoading(`Guardando ${section}...`);
    try {
      // Aquí iría la lógica para parsear el 'content' y llamar a la API de Supabase
      // Por ahora, simularemos el guardado.
      await new Promise(resolve => setTimeout(resolve, 1500));
      console.log(`Guardando ${section} para nivel ${selection.nivelId} y asignatura ${selection.asignaturaId}`, content);
      dismissToast(toastId);
      showSuccess(`${section} guardados exitosamente (simulación).`);
    } catch (error: any) {
      dismissToast(toastId);
      showError(error.message);
    } finally {
      setIsSaving(prev => ({ ...prev, [section]: false }));
    }
  };

  const formatArrayForTextarea = (arr: any[], formatter: (item: any) => string) => {
    return arr ? arr.map(formatter).join('\n') : '';
  };

  return (
    <div className="space-y-6">
      <Accordion type="multiple" defaultValue={Object.keys(results)} className="w-full space-y-4">
        <EditableSection
          title="Ejes, Habilidades, Actitudes y OAs"
          content={formatArrayForTextarea(results.ejes, (eje: any) => 
            `EJE: ${eje.nombre}\n` +
            `  HABILIDADES:\n${formatArrayForTextarea(eje.habilidades, (h: any) => `    - ${h.codigo}: ${h.descripcion}`)}\n` +
            `  ACTITUDES:\n${formatArrayForTextarea(eje.actitudes, (a: any) => `    - ${a.codigo}: ${a.descripcion}`)}\n` +
            `  OBJETIVOS:\n${formatArrayForTextarea(eje.objetivos_aprendizaje, (o: any) => `    - ${o.codigo}: ${o.descripcion}`)}`
          )}
          onSave={(content) => handleSave('Ejes y Contenidos Anidados', content)}
          isSaving={isSaving['Ejes y Contenidos Anidados']}
        />
        <EditableSection
          title="Unidades Propuestas"
          content={formatArrayForTextarea(results.unidades_propuestas, (u: any) => `- ${u.nombre}: ${u.descripcion}`)}
          onSave={(content) => handleSave('Unidades', content)}
          isSaving={isSaving['Unidades']}
        />
        <EditableSection
          title="Conocimientos Esenciales"
          content={formatArrayForTextarea(results.conocimientos_esenciales, (c: string) => `- ${c}`)}
          onSave={(content) => handleSave('Conocimientos', content)}
          isSaving={isSaving['Conocimientos']}
        />
        <EditableSection
          title="Ejemplos de Indicadores"
          content={formatArrayForTextarea(results.ejemplos_indicadores, (i: string) => `- ${i}`)}
          onSave={(content) => handleSave('Indicadores', content)}
          isSaving={isSaving['Indicadores']}
        />
        <EditableSection
          title="Orientaciones Didácticas"
          content={results.orientaciones_didacticas || ''}
          onSave={(content) => handleSave('Orientaciones', content)}
          isSaving={isSaving['Orientaciones']}
        />
        <EditableSection
          title="Sugerencias de Evaluación"
          content={results.sugerencias_evaluacion || ''}
          onSave={(content) => handleSave('Sugerencias', content)}
          isSaving={isSaving['Sugerencias']}
        />
        <EditableSection
          title="OATs Relevantes"
          content={formatArrayForTextarea(results.oat_relevantes, (oat: string) => `- ${oat}`)}
          onSave={(content) => handleSave('OATs', content)}
          isSaving={isSaving['OATs']}
        />
      </Accordion>

      <Card>
        <CardHeader>
          <CardTitle>Evaluar Respuesta de la IA</CardTitle>
          <CardDescription>
            Indica si la información generada es útil y adecuada para ser considerada en la base de datos curricular.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center gap-4">
          <Button variant="outline" onClick={() => showSuccess('Feedback registrado.')}>
            <ThumbsUp className="mr-2 h-4 w-4 text-green-500" /> Respuesta Adecuada
          </Button>
          <Button variant="outline" onClick={() => showSuccess('Feedback registrado.')}>
            <ThumbsDown className="mr-2 h-4 w-4 text-red-500" /> Respuesta Insuficiente
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default GeneratorResultsComponent;