import { useLocation, Link } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";
import { useEffect, useState } from "react";

export interface BreadcrumbItem {
  title: string;
  path?: string;
}

export default function Breadcrumbs() {
  const location = useLocation();
  const pathnames = location.pathname.split("/").filter((x) => x);
  const [customTitles, setCustomTitles] = useState<Record<string, string>>({});
  const [customTrails, setCustomTrails] = useState<Record<string, BreadcrumbItem[]>>({});

  useEffect(() => {
    const handleSetTitle = (e: Event) => {
      const customEvent = e as CustomEvent<{ path: string; title: string }>;
      setCustomTitles((prev) => ({
        ...prev,
        [customEvent.detail.path]: customEvent.detail.title,
      }));
    };

    const handleSetTrail = (e: Event) => {
      const customEvent = e as CustomEvent<{ path: string; items: BreadcrumbItem[] }>;
      setCustomTrails((prev) => ({
        ...prev,
        [customEvent.detail.path]: customEvent.detail.items,
      }));
    };

    document.addEventListener("set-breadcrumb-title", handleSetTitle);
    document.addEventListener("set-breadcrumb-trail", handleSetTrail);
    return () => {
      document.removeEventListener("set-breadcrumb-title", handleSetTitle);
      document.removeEventListener("set-breadcrumb-trail", handleSetTrail);
    };
  }, []);

  // Define custom mapping for breadcrumb names to ensure they look pretty
  const formatName = (name: string) => {
    return name
      .replace(/-/g, " ")
      .split(" ")
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  // Don't show breadcrumbs on the dashboard (root)
  if (pathnames.length === 0) {
    return null;
  }

  const activeTrail = customTrails[location.pathname];

  return (
    <nav className="flex items-center text-sm text-muted-foreground mb-6 overflow-x-auto whitespace-nowrap pt-1 pb-2 scrollbar-none min-h-[36px]">
      <Link 
        to="/" 
        className="flex items-center hover:text-foreground transition-colors"
        title="Home"
      >
        <Home className="h-4 w-4" />
      </Link>
      
      {activeTrail ? (
        activeTrail.map((item, index) => {
          const isLast = index === activeTrail.length - 1;
          return (
            <div key={item.title + index} className="flex items-center">
              <ChevronRight className="h-4 w-4 mx-1 opacity-50 shrink-0" />
              {isLast || !item.path ? (
                <span className={isLast ? "font-semibold text-foreground" : "text-muted-foreground"} aria-current={isLast ? "page" : undefined}>
                  {item.title}
                </span>
              ) : (
                <Link 
                  to={item.path} 
                  className="hover:text-foreground hover:underline underline-offset-4 transition-colors"
                >
                  {item.title}
                </Link>
              )}
            </div>
          );
        })
      ) : (
        pathnames.map((value, index) => {
          const to = `/${pathnames.slice(0, index + 1).join("/")}`;
          const isLast = index === pathnames.length - 1;

          return (
            <div key={to} className="flex items-center">
              <ChevronRight className="h-4 w-4 mx-1 opacity-50 shrink-0" />
              {isLast ? (
                <span className="font-semibold text-foreground" aria-current="page">
                  {customTitles[to] || formatName(value)}
                </span>
              ) : (
                <Link 
                  to={to} 
                  className="hover:text-foreground hover:underline underline-offset-4 transition-colors"
                >
                  {customTitles[to] || formatName(value)}
                </Link>
              )}
            </div>
          );
        })
      )}
    </nav>
  );
}
