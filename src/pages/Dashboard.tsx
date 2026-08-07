// src/pages/Dashboard.tsx
import { useAuth } from "@/lib/AuthContext";
import { usePurchasingSummary } from "@/hooks/usePurchasing";
import { formatMoney } from "@/pages/Purchasing/purchasingMeta";
import { ShoppingCart, Clock, FileWarning, CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function Dashboard() {
  const { user } = useAuth();
  const { data: summary } = usePurchasingSummary();

  return (
    <div className="w-full space-y-6 flex flex-col h-full animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out p-6 lg:p-8">
      <header className="flex flex-col gap-4 border-b border-slate-200/60 pb-6">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Welcome back, {user?.full_name || "Admin"}
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          This is your central administrative dashboard.
        </p>
      </header>
      
      {summary && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="shadow-sm">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
                <ShoppingCart className="w-6 h-6" />
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-bold leading-none mb-1">{summary.open_requests}</span>
                <span className="text-xs text-muted-foreground font-medium">Open Requests</span>
              </div>
            </CardContent>
          </Card>
          
          <Card className="shadow-sm">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400">
                <Clock className="w-6 h-6" />
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-bold leading-none mb-1">{summary.awaiting_approval}</span>
                <span className="text-xs text-muted-foreground font-medium">Awaiting Approval</span>
              </div>
            </CardContent>
          </Card>
          
          <Card className="shadow-sm">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-fuchsia-50 text-fuchsia-600 dark:bg-fuchsia-900/20 dark:text-fuchsia-400">
                <FileWarning className="w-6 h-6" />
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-bold leading-none mb-1">{summary.unpaid_invoices}</span>
                <span className="text-xs text-muted-foreground font-medium">Unpaid Invoices<br/>{formatMoney(summary.unpaid_amount)}</span>
              </div>
            </CardContent>
          </Card>
          
          <Card className="shadow-sm">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-bold leading-none mb-1">{summary.completed}</span>
                <span className="text-xs text-muted-foreground font-medium">Completed</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mt-6">
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
          <h3 className="font-semibold leading-none tracking-tight mb-2">Getting Started</h3>
          <p className="text-sm text-muted-foreground">
            Use the sidebar to navigate through system configurations, user management, and settings.
          </p>
        </div>
      </div>
    </div>
  );
}
