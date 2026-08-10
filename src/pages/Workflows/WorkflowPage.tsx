import { useState, useEffect } from "react";
import HelpIcon from "@/components/ui/HelpIcon";
import { apiClient as api } from "@/services/apiClient";
import { Button } from "../../components/ui/button";
import { Plus } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import WorkflowEditor from "../../components/Workflows/WorkflowEditor";
import { format } from "date-fns";

export default function WorkflowPage() {
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWorkflow, setSelectedWorkflow] = useState<any>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  const fetchWorkflows = async () => {
    try {
      setLoading(true);
      const res = await api.get<any>("/workflows");
      setWorkflows(res || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkflows();
  }, []);

  const handleCreate = () => {
    setSelectedWorkflow(null);
    setIsEditorOpen(true);
  };

  const handleEdit = (w: any) => {
    setSelectedWorkflow(w);
    setIsEditorOpen(true);
  };

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <div>
          <div className="flex items-center gap-2"><h1 className="text-3xl font-bold tracking-tight">Approval Workflows</h1><HelpIcon text="Manage multi-tier approval workflows, including tiers, ordering, and transition rules." /></div>
          <p className="text-muted-foreground">Configure dynamic approval chains for tasks</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Create Workflow
        </Button>
      </div>

      <div className="border rounded-md bg-card flex-1 overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Stages</TableHead>
              <TableHead>Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {workflows.map((w) => (
              <TableRow key={w.id} onClick={() => handleEdit(w)} className="cursor-pointer hover:bg-muted/50">
                <TableCell className="font-medium">#{w.id}</TableCell>
                <TableCell>{w.name}</TableCell>
                <TableCell>{w.description}</TableCell>
                <TableCell>{w.tiers?.length || 0} Tiers</TableCell>
                <TableCell>{w.created_at ? format(new Date(w.created_at), 'MMM d, yyyy') : ''}</TableCell>
              </TableRow>
            ))}
            {workflows.length === 0 && !loading && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  No workflows configured.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <WorkflowEditor 
        open={isEditorOpen} 
        workflow={selectedWorkflow} 
        onClose={() => setIsEditorOpen(false)} 
        onSuccess={() => {
          setIsEditorOpen(false);
          fetchWorkflows();
        }} 
      />
    </div>
  );
}
