import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { showSuccess } from '@/utils/toast';

interface GeneratorResultsComponentProps {
  results: any;
}

const SectionCard = ({ title, children }: { title: string, children: React.ReactNode }) => (
  <Card>
    <CardHeader>
      <CardTitle>{title}</CardTitle>
    </CardHeader>
    <CardContent>{children}</CardContent>
  </Card>
);

const GeneratorResultsComponent: React.FC<GeneratorResultsComponentProps> = ({ results }) => {
  const handleFeedback = (feedback: 'adecuada' | 'insuficiente') => {
    showSuccess(`Feedback de respuesta '${feedback}' registrado.`);
    // En el futuro, aquí se podría guardar el feedback en la base de datos.
  };

  return (
    <div className="space-y-6">
      <Accordion type="multiple" defaultValue={Object.keys(results)} className="w-full space-y-4">
        {results.ejes && (
          <AccordionItem value="ejes">
            <AccordionTrigger className="text-lg font-semibold">Ejes</AccordionTrigger>
            <AccordionContent>
              <ul className="list-disc list-inside space-y-1">{results.ejes.map((item: string, i: number) => <li key={i}>{item}</li>)}</ul>
            </AccordionContent>
          </AccordionItem>
        )}
        {results.unidades_propuestas && (
          <AccordionItem value="unidades">
            <AccordionTrigger className="text-lg font-semibold">Propuesta de Unidades</AccordionTrigger>
            <AccordionContent className="space-y-3">
              {results.unidades_propuestas.map((item: { nombre: string, descripcion: string }, i: number) => (
                <div key={i} className="p-2 border-b">
                  <p className="font-semibold">{item.nombre}</p>
                  <p className="text-sm text-muted-foreground">{item.descripcion}</p>
                </div>
              ))}
            </AccordionContent>
          </AccordionItem>
        )}
        {results.objetivos_aprendizaje_clave && (
          <AccordionItem value="oas">
            <AccordionTrigger className="text-lg font-semibold">Objetivos de Aprendizaje Clave</AccordionTrigger>
            <AccordionContent className="space-y-3">
              {results.objetivos_aprendizaje_clave.map((item: { codigo: string, descripcion: string }, i: number) => (
                <div key={i} className="p-2 border-b">
                  <p className="font-semibold">{item.codigo}</p>
                  <p className="text-sm text-muted-foreground">{item.descripcion}</p>
                </div>
              ))}
            </AccordionContent>
          </AccordionItem>
        )}
        {results.habilidades_principales && (
          <AccordionItem value="habilidades">
            <AccordionTrigger className="text-lg font-semibold">Habilidades Principales</AccordionTrigger>
            <AccordionContent>
              <ul className="list-disc list-inside space-y-1">{results.habilidades_principales.map((item: string, i: number) => <li key={i}>{item}</li>)}</ul>
            </AccordionContent>
          </AccordionItem>
        )}
        {results.actitudes_a_fomentar && (
          <AccordionItem value="actitudes">
            <AccordionTrigger className="text-lg font-semibold">Actitudes a Fomentar</AccordionTrigger>
            <AccordionContent>
              <ul className="list-disc list-inside space-y-1">{results.actitudes_a_fomentar.map((item: string, i: number) => <li key={i}>{item}</li>)}</ul>
            </AccordionContent>
          </AccordionItem>
        )}
        {results.conocimientos_esenciales && (
          <AccordionItem value="conocimientos">
            <AccordionTrigger className="text-lg font-semibold">Conocimientos Esenciales</AccordionTrigger>
            <AccordionContent>
              <ul className="list-disc list-inside space-y-1">{results.conocimientos_esenciales.map((item: string, i: number) => <li key={i}>{item}</li>)}</ul>
            </AccordionContent>
          </AccordionItem>
        )}
        {results.ejemplos_indicadores && (
          <AccordionItem value="indicadores">
            <AccordionTrigger className="text-lg font-semibold">Ejemplos de Indicadores de Evaluación</AccordionTrigger>
            <AccordionContent>
              <ul className="list-disc list-inside space-y-1">{results.ejemplos_indicadores.map((item: string, i: number) => <li key={i}>{item}</li>)}</ul>
            </AccordionContent>
          </AccordionItem>
        )}
        {results.orientaciones_didacticas && (
          <AccordionItem value="orientaciones">
            <AccordionTrigger className="text-lg font-semibold">Orientaciones Didácticas</AccordionTrigger>
            <AccordionContent>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{results.orientaciones_didacticas}</p>
            </AccordionContent>
          </AccordionItem>
        )}
        {results.sugerencias_evaluacion && (
          <AccordionItem value="evaluacion">
            <AccordionTrigger className="text-lg font-semibold">Sugerencias de Evaluación</AccordionTrigger>
            <AccordionContent>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{results.sugerencias_evaluacion}</p>
            </AccordionContent>
          </AccordionItem>
        )}
        {results.oat_relevantes && (
          <AccordionItem value="oat">
            <AccordionTrigger className="text-lg font-semibold">Objetivos de Aprendizaje Transversales (OAT)</AccordionTrigger>
            <AccordionContent>
              <ul className="list-disc list-inside space-y-1">{results.oat_relevantes.map((item: string, i: number) => <li key={i}>{item}</li>)}</ul>
            </AccordionContent>
          </AccordionItem>
        )}
      </Accordion>

      <Card>
        <CardHeader>
          <CardTitle>Evaluar Respuesta de la IA</CardTitle>
          <CardDescription>
            Indica si la información generada es útil y adecuada para ser considerada en la base de datos curricular.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center gap-4">
          <Button variant="outline" onClick={() => handleFeedback('adecuada')}>
            <ThumbsUp className="mr-2 h-4 w-4 text-green-500" /> Respuesta Adecuada
          </Button>
          <Button variant="outline" onClick={() => handleFeedback('insuficiente')}>
            <ThumbsDown className="mr-2 h-4 w-4 text-red-500" /> Respuesta Insuficiente
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default GeneratorResultsComponent;