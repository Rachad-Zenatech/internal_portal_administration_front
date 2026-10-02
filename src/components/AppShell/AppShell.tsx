import type { ReactNode } from "react";
import { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import Breadcrumbs from "./Breadcrumbs";

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
    <div className="flex h-screen w-full min-w-0 overflow-hidden bg-background text-foreground print:h-auto print:overflow-visible print:bg-white print:block">
      <div className="print:hidden">
        <Sidebar
          isOpen={isSidebarOpen}
          onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        />
      </div>

      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative print:h-auto print:overflow-visible print:block print:w-full">
        <div className="print:hidden">
          <TopBar onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
        </div>
        <main
          className="flex-1 overflow-y-auto overflow-x-hidden p-2.5 sm:p-3.5 md:p-4 bg-background print:overflow-visible print:p-0 print:m-0 print:bg-white print:block print:w-full"
        >
          <div className="print:hidden">
            <Breadcrumbs />
          </div>
          <div className="w-full pb-8 print:pb-0 print:w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
