import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { School } from 'lucide-react';

const Header = () => {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center justify-between">
        <Link to="/" className="flex items-center">
          <School className="h-6 w-6 text-primary" />
          <span className="ml-2 font-bold">NexusAula</span>
        </Link>
        <div className="flex items-center space-x-2">
          <Button variant="ghost" asChild>
            <Link to="/start">Iniciar Sesión</Link>
          </Button>
          <Button asChild>
            <Link to="/start">Registrarse</Link>
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;