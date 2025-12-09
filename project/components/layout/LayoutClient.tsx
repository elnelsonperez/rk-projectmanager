'use client';

import { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Sheet, SheetContent } from '../ui/sheet';
import { Button } from '../ui/button';
import { useProjectStore } from '../../store/projectStore';

export default function LayoutClient({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const currentProject = useProjectStore((state) => state.currentProject);

  return (
    <div className="h-screen flex flex-col">
      {/* Header - visible on all screens */}
      <header className="border-b p-4 flex items-center">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            // On mobile, toggle the drawer
            if (window.innerWidth < 768) {
              setSidebarOpen(true);
            } else {
              // On desktop, toggle collapse state
              setSidebarCollapsed(!sidebarCollapsed);
            }
          }}
          aria-label="Toggle Menu"
          className="flex-shrink-0"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-5 w-5"
          >
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </Button>
        <h1 className="text-xl font-bold ml-2">
          {currentProject ? currentProject.name : 'Gestor de Proyectos'}
        </h1>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Mobile sidebar (drawer) */}
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetContent
            side="left"
            className="w-[280px] sm:w-[350px] p-0"
            onClose={() => setSidebarOpen(false)}
          >
            <Sidebar />
          </SheetContent>
        </Sheet>

        {/* Desktop sidebar */}
        <div
          className={`hidden md:block ${
            sidebarCollapsed ? 'w-16' : 'w-64'
          } border-r overflow-y-auto transition-all duration-300`}
        >
          <Sidebar collapsed={sidebarCollapsed} />
        </div>

        {/* Main content */}
        <div className="flex-1 overflow-auto">
          <div className="container mx-auto px-6 py-4 sm:py-6 max-w-[1600px]">{children}</div>
        </div>
      </div>
    </div>
  );
}
