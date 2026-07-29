import { useState, useEffect } from "react";
import { apiClient as api } from "@/services/apiClient";
import { Button } from "../../components/ui/button";
import { Plus } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import PlanEditor from "../../components/Notifications/PlanEditor";
import { format } from "date-fns";

export default function NotificationPlanPage() {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const res = await api.get<any>("/notification-plans");
      setPlans(res || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const handleCreate = () => {
    setSelectedPlan(null);
    setIsEditorOpen(true);
  };

  const handleEdit = (p: any) => {
    setSelectedPlan(p);
    setIsEditorOpen(true);
  };

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notification Plans</h1>
          <p className="text-muted-foreground">Manage groups of users to be notified on task updates</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Create Plan
        </Button>
      </div>

      <div className="border rounded-md bg-card flex-1 overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Plan Name</TableHead>
              <TableHead>Members Configured</TableHead>
              <TableHead>Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {plans.map((p) => (
              <TableRow key={p.id} onClick={() => handleEdit(p)} className="cursor-pointer hover:bg-muted/50">
                <TableCell className="font-medium">#{p.id}</TableCell>
                <TableCell>{p.plan_name}</TableCell>
                <TableCell>{p.members?.length || 0} Members</TableCell>
                <TableCell>{p.created_at ? format(new Date(p.created_at), 'MMM d, yyyy') : ''}</TableCell>
              </TableRow>
            ))}
            {plans.length === 0 && !loading && (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                  No notification plans configured.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <PlanEditor 
        open={isEditorOpen} 
        plan={selectedPlan} 
        onClose={() => setIsEditorOpen(false)} 
        onSuccess={() => {
          setIsEditorOpen(false);
          fetchPlans();
        }} 
      />
    </div>
  );
}
