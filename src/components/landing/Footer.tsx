import React from 'react';
import { School } from 'lucide-react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="border-t">
      <div className="container flex flex-col items-center justify-between gap-4 py-10 md:h-24 md:flex-row md:py-0">
        <div className="flex items-center">
          <School className="h-6 w-6 text-primary" />
          <span className="ml-2 font-bold">NexusAula</span>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} NexusAula. Todos los derechos reservados.
          </p>
          <div className="flex gap-6">
            <Link to="/terminos-de-servicio" className="text-sm text-muted-foreground hover:text-foreground">
              Términos de Servicio
            </Link>
            <Link to="/politica-de-privacidad" className="text-sm text-muted-foreground hover:text-foreground">
              Política de Privacidad
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;