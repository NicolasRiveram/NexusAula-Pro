import React from 'react';
import { useEstablishment } from '@/contexts/EstablishmentContext';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { LogOut, Bell, ChevronsUpDown, Check } from 'lucide-react';
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from '@/lib/utils';
import { getLogoPublicUrl } from '@/api/settingsApi';
import { useDesign } from '@/contexts/DesignContext';

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
  const today = new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const [openPopover, setOpenPopover] = React.useState(false);
  const logoUrl = activeEstablishment?.logo_url ? getLogoPublicUrl(activeEstablishment.logo_url) : null;
  const { settings } = useDesign();
  const headerLogoUrl = settings['dashboard_header_logo_url'];

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const EstablishmentSelector = () => {
    if (loadingEstablishments) {
      return (
        <Button variant="outline" disabled className="w-[250px]">
          Cargando establecimientos...
        </Button>
      );
    }

    if (userEstablishments.length === 0) {
      return (
        <Button variant="outline" disabled className="w-[250px]">
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
            className="w-[250px] justify-between"
          >
            {activeEstablishment
              ? activeEstablishment.nombre
              : "Seleccionar establecimiento"}
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
    <header className="h-16 bg-white dark:bg-gray-800 border-b dark:border-gray-700 flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <EstablishmentSelector />
        {logoUrl && (
          <img src={logoUrl} alt={activeEstablishment?.nombre} className="h-8 object-contain" />
        )}
        {headerLogoUrl && (
          <img src={headerLogoUrl} alt="Decoración" className="h-8 object-contain" />
        )}
        <p className="hidden sm:block text-sm text-gray-500 dark:text-gray-400 capitalize">{today}</p>
      </div>
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="icon">
          <Bell className="h-5 w-5" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
              <Avatar className="h-9 w-9">
                <AvatarImage src="/placeholder.svg" alt={profile.nombre_completo} />
                <AvatarFallback>{profile.nombre_completo.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{profile.nombre_completo}</p>
                <p className="text-xs leading-none text-muted-foreground capitalize">{profile.rol}</p>
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