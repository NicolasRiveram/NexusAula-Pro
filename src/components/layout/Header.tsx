import React from 'react';
import { useEstablishment } from '@/contexts/EstablishmentContext';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { LogOut, ChevronsUpDown, Check, Menu, School } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from '@/lib/utils';
import { getLogoPublicUrl } from '@/api/settingsApi';
import { useDesign } from '@/contexts/DesignContext';
import { ThemeToggle } from '../theme-toggle';
import NavLinks from './NavLinks';
import { useQueryClient } from '@tanstack/react-query';
import { showError } from '@/utils/toast';

interface HeaderProps {
  profile: {
    nombre_completo: string;
    rol: string;
  };
}

const Header: React.FC<HeaderProps> = ({ profile }) => {
  const { 
    activeEstablishment, 
    setActiveEstablishment, 
    userEstablishments, 
    loadingEstablishments 
  } = useEstablishment();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const today = new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const [openPopover, setOpenPopover] = React.useState(false);
  const [openSheet, setOpenSheet] = React.useState(false);
  const logoUrl = activeEstablishment?.logo_url ? getLogoPublicUrl(activeEstablishment.logo_url) : null;
  const { settings } = useDesign();
  const headerLogoUrl = settings['dashboard_header_logo_url'];

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    // We will ignore the AuthSessionMissingError, as it means the user is already logged out.
    if (error && error.name !== 'AuthSessionMissingError') {
      console.error('Error logging out:', error);
      showError('Error al cerrar sesión.');
    } else {
      queryClient.clear();
      // For a clean state reset, a full page navigation is best for logout.
      window.location.href = '/login';
    }
  };

  const EstablishmentSelector = () => {
    if (loadingEstablishments) {
      return (
        <Button variant="outline" disabled className="w-full sm:w-[250px] justify-between">
          Cargando...
        </Button>
      );
    }

    if (userEstablishments.length === 0) {
      return (
        <Button variant="outline" disabled className="w-full sm:w-[250px] justify-between">
          Sin establecimientos
        </Button>
      );
    }

    return (
      <Popover open={openPopover} onOpenChange={setOpenPopover}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={openPopover}
            className="w-full sm:w-[250px] justify-between"
            data-tour="establishment-selector"
          >
            {activeEstablishment
              ? activeEstablishment.nombre
              : "Seleccionar"}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[250px] p-0">
          <Command>
            <CommandInput placeholder="Buscar establecimiento..." />
            <CommandList>
              <CommandEmpty>No se encontraron establecimientos.</CommandEmpty>
              <CommandGroup>
                {userEstablishments.map((establishment) => (
                  <CommandItem
                    key={establishment.id}
                    value={establishment.nombre}
                    onSelect={() => {
                      setActiveEstablishment(establishment);
                      setOpenPopover(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        activeEstablishment?.id === establishment.id
                          ? "opacity-100"
                          : "opacity-0"
                      )}
                    />
                    {establishment.nombre}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    );
  };

  return (
    <header className="h-24 bg-card dark:bg-card-dark border-b dark:border-gray-700 flex items-center justify-between px-4 sm:px-8">
      <div className="flex items-center gap-4">
        {/* Mobile Menu */}
        <Sheet open={openSheet} onOpenChange={setOpenSheet}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="md:hidden">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Abrir menú</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="flex flex-col p-4">
            <SheetHeader>
              <div className="flex items-center mb-4 px-2">
                <School className="text-primary text-3xl" />
                <span className="text-2xl font-bold ml-2 text-foreground">NexusAula</span>
              </div>
            </SheetHeader>
            <NavLinks onLinkClick={() => setOpenSheet(false)} />
          </SheetContent>
        </Sheet>

        <div className="hidden sm:block">
          <h1 className="text-xl md:text-3xl font-bold text-foreground">Hola, {profile.nombre_completo} 👋</h1>
          <p className="text-muted-foreground capitalize text-xs md:text-base">{today}</p>
        </div>
      </div>
      <div className="flex items-center space-x-2 sm:space-x-4">
        <div className="hidden sm:block">
          <EstablishmentSelector />
        </div>
        {logoUrl && (
          <img src={logoUrl} alt={activeEstablishment?.nombre} className="h-10 object-contain hidden lg:block" />
        )}
        {headerLogoUrl && (
          <img src={headerLogoUrl} alt="Decoración" className="h-10 object-contain hidden lg:block" />
        )}
        <ThemeToggle />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full">
              <Avatar className="h-10 w-10">
                <AvatarImage src="/placeholder.svg" alt={profile.nombre_completo} />
                <AvatarFallback>{profile.nombre_completo.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{profile.nombre_completo}</p>
                <p className="text-xs leading-none text-muted-foreground capitalize">{profile.rol.replace(/_/g, ' ')}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Cerrar sesión</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default Header;