import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Lightbulb, FileText, BarChart, BrainCircuit } from 'lucide-react';

const features = [
  {
    icon: <Lightbulb className="h-8 w-8 text-primary" />,
    title: 'Planificación Inteligente',
    description: 'Crea unidades didácticas completas en minutos con la ayuda de la IA, desde los objetivos hasta la secuencia de clases.',
  },
  {
    icon: <FileText className="h-8 w-8 text-primary" />,
    title: 'Generador de Evaluaciones',
    description: 'Genera pruebas y guías de trabajo a partir de tus propios contenidos, textos, o simplemente describiendo los temas a evaluar.',
  },
  {
    icon: <BarChart className="h-8 w-8 text-primary" />,
    title: 'Analíticas de Rendimiento',
    description: 'Visualiza el progreso de tus estudiantes, identifica fortalezas y áreas de mejora con gráficos claros y concisos.',
  },
  {
    icon: <BrainCircuit className="h-8 w-8 text-primary" />,
    title: 'Adaptación Curricular',
    description: 'Adapta preguntas y materiales para estudiantes con necesidades educativas especiales (PIE) con un solo clic.',
  },
];

const FeaturesSection = () => {
  return (
    <section className="py-20 sm:py-32">
      <div className="container">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Todo lo que necesitas en un solo lugar</h2>
          <p className="mt-4 text-lg text-muted-foreground">
            NexusAula integra herramientas poderosas para simplificar tu trabajo y potenciar el aprendizaje.
          </p>
        </div>
        <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, index) => (
            <Card key={index} className="text-center">
              <CardHeader>
                <div className="flex justify-center mb-4">{feature.icon}</div>
                <CardTitle>{feature.title}</CardTitle>
                <CardDescription className="pt-2">{feature.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;