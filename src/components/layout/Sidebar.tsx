import React from 'react';
import { School } from 'lucide-react';
import NavLinks from './NavLinks';

interface SidebarProps {
  profile: {
    rol: string;
  };
}

const Sidebar: React.FC<SidebarProps> = ({ profile }) => {
  return (
    <aside className="hidden md:flex flex-col w-64 bg-card dark:bg-card-dark p-4 border-r border-gray-200 dark:border-gray-700">
      <div className="flex items-center mb-8 px-2">
        <School className="text-primary text-3xl" />
        <span className="text-2xl font-bold ml-2 text-foreground">NexusAula</span>
      </div>
      <NavLinks profile={profile} />
    </aside>
  );
};

export default Sidebar;