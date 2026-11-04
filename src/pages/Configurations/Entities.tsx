import { Building2, ShieldCheck, Layers, Plus, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useEntitiesPage } from "./entities/hooks/useEntitiesPage";
import { MainTableCard } from "./entities/sections/MainTableCard";
import { AddEntityDialog } from "./entities/sections/AddEntityDialog";
import { EditEntityDialog } from "./entities/sections/EditEntityDialog";

export default function Entities() {
  const s = useEntitiesPage();
  const { groups, activeCount, total, handleOpenCreate, isLoading, refetch } = s;
  return (
    <div className="flex h-full min-h-0 flex-col space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Operating Entities</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage legal entities, subsidiaries, and corporate divisions for purchasing, wire transfers, and accounting.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button size="sm" onClick={handleOpenCreate} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Entity
          </Button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Entities</p>
              <p className="mt-1 text-2xl font-semibold text-foreground">{total}</p>
            </div>
            <Building2 className="h-5 w-5 text-muted-foreground" />
          </div>
        </Card>

        <Card className="rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Active Entities</p>
              <p className="mt-1 text-2xl font-semibold text-foreground">{activeCount}</p>
            </div>
            <ShieldCheck className="h-5 w-5 text-muted-foreground" />
          </div>
        </Card>

        <Card className="rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Entity Groups</p>
              <p className="mt-1 text-2xl font-semibold text-foreground">{groups.length}</p>
            </div>
            <Layers className="h-5 w-5 text-muted-foreground" />
          </div>
        </Card>
      </div>

      {/* Main Table Card */}
      <MainTableCard s={s} />

      {/* Add Entity Dialog */}
      <AddEntityDialog s={s} />

      {/* Edit Entity Dialog */}
      <EditEntityDialog s={s} />
    </div>
  );
}
