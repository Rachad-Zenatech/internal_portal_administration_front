import type { ReactNode } from "react";
import { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import Breadcrumbs from "./Breadcrumbs";
import SessionTimeout from "./SessionTimeout";

interface Props {
  children: ReactNode;
}

export default function AppShell({ children }: Props) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 992) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };
    
    // Set initial state
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="flex h-screen w-full min-w-0 overflow-hidden bg-background text-foreground">
      <Sidebar
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <TopBar onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
        <main
          className="flex-1 overflow-y-auto p-2.5 sm:p-3.5 md:p-4 bg-background flex flex-col min-h-0"
        >
          <Breadcrumbs />
          <div className="flex-1 flex flex-col min-h-0">
            {children}
          </div>
        </main>
      </div>

      <SessionTimeout />
    </div>
  );
}
