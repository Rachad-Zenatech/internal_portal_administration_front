import { useState, useEffect } from "react";
import { apiClient as api } from "@/services/apiClient";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { format } from "date-fns";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "../../components/ui/sheet";
import { Badge } from "../../components/ui/badge";

export default function SystemLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEntity, setSelectedEntity] = useState<{type: string, id: string} | null>(null);
  const [entityHistory, setEntityHistory] = useState<any[]>([]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await api.get<any>("/logs?limit=100");
      setLogs(res.items || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleRowClick = async (log: any) => {
    setSelectedEntity({ type: log.entity_type, id: log.entity_id });
    try {
      const res = await api.get<any>(`/logs?limit=100&entity_type=${log.entity_type}&entity_id=${log.entity_id}`);
      setEntityHistory(res.items || []);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col pb-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">System Audit Logs</h1>
        <p className="text-muted-foreground">View all system actions and their history</p>
      </div>

      <div className="border rounded-md bg-card flex-1 overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Time</TableHead>
              <TableHead>Entity</TableHead>
              <TableHead>ID</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>User's User ID</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map((log) => (
              <TableRow key={log.id} onClick={() => handleRowClick(log)} className="cursor-pointer hover:bg-muted/50">
                <TableCell>{log.created_at ? format(new Date(log.created_at), 'MMM d, yyyy h:mm:ss a') : ''}</TableCell>
                <TableCell><Badge variant="outline">{log.entity_type}</Badge></TableCell>
                <TableCell>{log.entity_id}</TableCell>
                <TableCell>{log.action}</TableCell>
                <TableCell className="text-xs">{log.user_id}</TableCell>
              </TableRow>
            ))}
            {logs.length === 0 && !loading && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  No logs found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Sheet open={!!selectedEntity} onOpenChange={(o) => !o && setSelectedEntity(null)}>
        <SheetContent className="sm:max-w-[400px] w-full flex flex-col p-0">
          <div className="p-6 flex-1 overflow-y-auto">
            <SheetHeader className="mb-6 pr-8">
              <SheetTitle>Entity History</SheetTitle>
              <p className="text-sm text-muted-foreground">
              History for <span className="font-semibold text-foreground">{selectedEntity?.type}</span> ({selectedEntity?.id})
            </p>
          </SheetHeader>
          
          <div className="space-y-4 relative before:absolute before:inset-0 before:ml-[0.625rem] before:-translate-x-px before:h-full before:w-0.5 before:bg-muted">
            {entityHistory.map((h: any) => (
              <div key={h.id} className="relative flex items-start gap-4">
                <div className="flex items-center justify-center w-5 h-5 rounded-full bg-primary z-10 shrink-0 mt-1 shadow-sm" />
                <div className="flex-1 p-3 rounded bg-card border shadow-sm text-sm">
                  <p className="font-medium">{h.action}</p>
                  <time className="block text-xs text-muted-foreground mt-1">{h.created_at ? format(new Date(h.created_at), 'MMM d, h:mm a') : ''}</time>
                  {h.changes && (
                    <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-x-auto">
                      {JSON.stringify(JSON.parse(h.changes), null, 2)}
                    </pre>
                  )}
                </div>
              </div>
            ))}
          </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
