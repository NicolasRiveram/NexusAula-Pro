import React from 'react';
import { School } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="border-t">
      <div className="container flex flex-col items-center justify-between gap-4 py-10 md:h-24 md:flex-row md:py-0">
        <div className="flex items-center">
          <School className="h-6 w-6 text-primary" />
          <span className="ml-2 font-bold">NexusAula</span>
        </div>
        <p className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} NexusAula. Todos los derechos reservados.
        </p>
      </div>
    </footer>
  );
};

export default Footer;