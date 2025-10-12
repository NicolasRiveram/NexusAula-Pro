import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const HeroSection = () => {
  return (
    <section className="relative h-[90vh] flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-background to-transparent dark:from-background dark:to-transparent opacity-50"></div>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))]"></div>
      <div className="container relative z-10 text-center animate-fade-in-up">
        <h1 className="text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
          Potencia la Enseñanza con Inteligencia Artificial
        </h1>
        <p className="mt-6 text-lg text-muted-foreground sm:text-xl max-w-3xl mx-auto">
          Planifica, evalúa y analiza el progreso de tus estudiantes de forma inteligente y eficiente.
        </p>
        <div className="mt-10">
          <Button size="lg" asChild>
            <Link to="/start">Comienza Gratis</Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;