import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const CallToActionSection = () => {
  return (
    <section className="py-20 sm:py-32 bg-muted/40">
      <div className="container text-center">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
          ¿Listo para transformar tu aula?
        </h2>
        <p className="mt-4 text-lg text-muted-foreground">
          Únete a la comunidad de docentes que están innovando en la educación.
        </p>
        <div className="mt-8">
          <Button size="lg" asChild>
            <Link to="/start">Comienza Gratis Ahora</Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default CallToActionSection;