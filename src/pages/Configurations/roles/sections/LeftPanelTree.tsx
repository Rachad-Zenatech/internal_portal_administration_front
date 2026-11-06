import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Shield, Power, Ban, FolderOpen, Key, Loader2, Save, X } from "lucide-react";
import type { Role } from "@/lib/AuthContext";
import { Link } from "react-router-dom";
import { TreeNode } from "../components/TreeNode";
import type { RolesState } from "../hooks/useRoles";

export function LeftPanelTree({ s }: { s: RolesState }) {
  const { selectedRole, flatRoles, updateMutation, createMutation, setSelectedRole, setIsEditing, formData, setFormData, handleSubmit, isEditing, setIsDeleteDialogOpen, setIsDeactivateDialogOpen, hasPermission, startEdit, handleAddChild, handleMoveRole, setIsRootDragOver, isRootDragOver, draggingId, setDraggingId, toggleNode, expandedNodes, optimisticTree, isLoadingRoles, handleAddRoot, hasPendingMoves, bulkSaveHierarchyMutation, setPendingMoves } = s;
  return (
    <div className="flex-1 min-h-0 flex flex-col md:flex-row gap-6">
        {/* Left Panel: Tree */}
        <div className="w-full md:w-1/3 flex flex-col rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-sm h-full">
          <div className="p-4 border-b border-slate-200 dark:border-zinc-800 flex justify-between items-center bg-slate-50/50 dark:bg-zinc-950/50">
            <h3 className="font-semibold text-slate-800 dark:text-zinc-200">Role Hierarchy</h3>
            <div className="flex items-center gap-2">
              {hasPendingMoves && (
                <div className="flex gap-2 mr-2">
                   <Button size="sm" variant="outline" className="h-8 px-2" onClick={() => setPendingMoves({})}>
                     <X className="h-3.5 w-3.5" />
                   </Button>
                   <Button size="sm" className="h-8 bg-green-600 hover:bg-green-700 text-white" onClick={() => bulkSaveHierarchyMutation.mutate()} disabled={bulkSaveHierarchyMutation.isPending}>
                     {bulkSaveHierarchyMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Save className="h-3.5 w-3.5 mr-1" />}
                     Save
                   </Button>
                </div>
              )}
              {!hasPendingMoves && hasPermission("CONFIG_ROLES_CREATE") && (
                <Button size="sm" variant="outline" onClick={handleAddRoot} className="h-8 text-xs">
                  <Plus className="mr-1 h-3 w-3" /> Root
                </Button>
              )}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-2 relative">
            {isLoadingRoles ? (
              <div className="p-4 text-center text-slate-500 text-sm">Loading tree...</div>
            ) : optimisticTree && optimisticTree.length > 0 ? (
              <div className="min-h-full flex flex-col relative">
                <div className="relative z-10 flex flex-col">
                  {optimisticTree.map(rootRole => (
                    <TreeNode 
                      key={rootRole.id} 
                      role={rootRole} 
                      level={0}
                      selectedRole={selectedRole}
                      onSelect={(r) => { setSelectedRole(r); setIsEditing(false); }}
                      expandedNodes={expandedNodes}
                      toggleNode={toggleNode}
                      onMoveRole={(draggedId, targetId) => handleMoveRole(draggedId, targetId)}
                      setDraggingId={setDraggingId}
                    />
                  ))}
                </div>

                <div
                  className={`flex-1 min-h-[120px] mt-4 mx-2 rounded-xl border-2 border-dashed flex items-center justify-center transition-all duration-200 ${
                    draggingId 
                      ? 'opacity-100 pointer-events-auto' 
                      : 'opacity-0 pointer-events-none h-0 min-h-0 mt-0 overflow-hidden'
                  } ${
                    isRootDragOver 
                      ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:border-blue-700 dark:text-blue-400' 
                      : 'border-slate-300 bg-slate-50 text-slate-500 dark:border-zinc-700 dark:bg-zinc-800/50 dark:text-zinc-400'
                  }`}
                  onDragEnter={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsRootDragOver(true);
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    e.dataTransfer.dropEffect = "move";
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsRootDragOver(false);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsRootDragOver(false);
                    const draggedId = e.dataTransfer.getData("text/plain");
                    if (draggedId) handleMoveRole(draggedId, null);
                  }}
                >
                  <span className="text-sm font-medium">Drop here to move to root level</span>
                </div>
              </div>
            ) : (
              <div className="p-4 text-center text-slate-500 text-sm">No roles found.</div>
            )}
          </div>
        </div>

        {/* Right Panel: Details / Editor */}
        <div className="w-full md:w-2/3 flex flex-col rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-sm h-full">
          {!selectedRole ? (
            <div className="flex-1 flex items-center justify-center text-slate-400 dark:text-zinc-500 p-8 text-center flex-col">
              <Shield className="w-12 h-12 mb-4 opacity-20" />
              <p className="text-lg font-medium text-slate-600 dark:text-zinc-300">No Role Selected</p>
              <p className="text-sm max-w-sm mt-2">Select a role from the hierarchy to view its details, or create a new root role to get started.</p>
            </div>
          ) : (
            <div className="flex flex-col h-full overflow-hidden">
              <div className="p-6 border-b border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/50 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-zinc-100">
                      {isEditing && selectedRole.id === "new" ? "Create New Role" : selectedRole.name}
                    </h2>
                    {!isEditing && selectedRole.id !== "new" && (
                      <Badge variant={selectedRole.is_active ? "default" : "secondary"} className={selectedRole.is_active ? "bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400" : ""}>
                        {selectedRole.is_active ? "Active" : "Inactive"}
                      </Badge>
                    )}
                  </div>
                  {!isEditing && selectedRole.id !== "new" && (
                    <div className="flex items-center text-sm text-slate-500 dark:text-zinc-400 gap-4">
                      <span className="flex items-center"><Key className="w-4 h-4 mr-1.5" /> Code: {selectedRole.code}</span>
                      {selectedRole.is_system_role && <span className="flex items-center text-purple-600 dark:text-purple-400 font-medium"><Shield className="w-4 h-4 mr-1.5" /> System Role</span>}
                    </div>
                  )}
                </div>
                
                {!isEditing && selectedRole.id !== "new" && (
                  <div className="flex flex-wrap items-center gap-2">
                    {hasPermission("CONFIG_ROLES_CREATE") && (
                       <Button variant="outline" size="sm" onClick={handleAddChild} className="bg-white dark:bg-zinc-900">
                         <Plus className="w-4 h-4 mr-2" /> Add Child
                       </Button>
                    )}
                    {hasPermission("CONFIG_ROLES_UPDATE") && !selectedRole.is_system_role && (
                      <Button variant="outline" size="sm" onClick={startEdit} className="bg-white dark:bg-zinc-900 text-blue-600 border-blue-200 hover:bg-blue-50 hover:text-blue-700 dark:border-blue-900 dark:text-blue-400 dark:hover:bg-blue-900/20">
                        <Edit className="w-4 h-4 mr-2" /> Edit
                      </Button>
                    )}
                    {hasPermission("CONFIG_ROLES_DELETE") && !selectedRole.is_system_role && (
                      selectedRole.is_active ? (
                        <Button variant="outline" size="sm" onClick={() => setIsDeactivateDialogOpen(true)} className="bg-white dark:bg-zinc-900 text-orange-600 border-orange-200 hover:bg-orange-50 hover:text-orange-700 dark:border-orange-900 dark:text-orange-400 dark:hover:bg-orange-900/20">
                          <Ban className="w-4 h-4 mr-2" /> Deactivate
                        </Button>
                      ) : (
                        <Button variant="outline" size="sm" onClick={() => setIsDeleteDialogOpen(true)} className="bg-white dark:bg-zinc-900 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-900/20">
                          <Trash2 className="w-4 h-4 mr-2" /> Delete
                        </Button>
                      )
                    )}
                  </div>
                )}
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                {isEditing ? (
                  <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl animate-in fade-in">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700 dark:text-zinc-300">Role Name <span className="text-red-500">*</span></label>
                        <Input 
                          required 
                          value={formData.name} 
                          onChange={e => setFormData({...formData, name: e.target.value})} 
                          placeholder="e.g. Senior Accountant"
                          className="bg-white dark:bg-zinc-950"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700 dark:text-zinc-300">Role Code <span className="text-red-500">*</span></label>
                        <Input 
                          required 
                          value={formData.code} 
                          onChange={e => setFormData({...formData, code: e.target.value.toUpperCase()})} 
                          placeholder="e.g. SNR_ACCT"
                          className="bg-white dark:bg-zinc-950 uppercase"
                        />
                        <p className="text-[11px] text-slate-500">Unique identifier used for system mapping.</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700 dark:text-zinc-300">Description</label>
                      <Textarea 
                        value={formData.description} 
                        onChange={e => setFormData({...formData, description: e.target.value})} 
                        placeholder="Describe the responsibilities and access level of this role..."
                        rows={3}
                        className="bg-white dark:bg-zinc-950 resize-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700 dark:text-zinc-300">Parent Role</label>
                        <select 
                          value={formData.parent_role_id}
                          onChange={e => setFormData({...formData, parent_role_id: e.target.value})}
                          className="w-full h-10 px-3 py-2 rounded-md border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-slate-900 dark:text-zinc-100 text-sm"
                        >
                          <option value="">-- None (Root Role) --</option>
                          {flatRoles?.filter(r => {
                            if (r.id === selectedRole?.id) return false;
                            if (selectedRole && selectedRole.id !== "new") {
                              let curr = r;
                              while (curr) {
                                if (curr.parent_role_id === selectedRole.id) return false;
                                if (!curr.parent_role_id) break;
                                curr = flatRoles.find(parent => parent.id === curr.parent_role_id) as Role;
                              }
                            }
                            return true;
                          }).map(r => (
                            <option key={r.id} value={r.id}>{r.name}</option>
                          ))}
                        </select>
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700 dark:text-zinc-300">Department</label>
                        <Input 
                          value={formData.department} 
                          onChange={e => setFormData({...formData, department: e.target.value})} 
                          placeholder="e.g. Finance"
                          className="bg-white dark:bg-zinc-950"
                        />
                      </div>
                    </div>

                    <div className="pt-6 mt-6 border-t border-slate-100 dark:border-zinc-800 flex justify-end gap-3">
                      <Button type="button" variant="ghost" onClick={() => {
                        setIsEditing(false);
                        if (selectedRole?.id === "new") setSelectedRole(null);
                      }}>
                        Cancel
                      </Button>
                      <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white min-w-[120px]" disabled={createMutation.isPending || updateMutation.isPending}>
                        {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Role
                      </Button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-8 animate-in fade-in">
                    <div>
                      <h4 className="text-sm font-semibold text-slate-900 dark:text-zinc-100 mb-3 flex items-center">
                        <FolderOpen className="w-4 h-4 mr-2 text-slate-400" /> Role Information
                      </h4>
                      <div className="bg-slate-50 dark:bg-zinc-950/50 rounded-xl p-5 border border-slate-100 dark:border-zinc-800/50 space-y-4">
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <p className="text-xs font-medium text-slate-500 dark:text-zinc-500 uppercase tracking-wider mb-1">Department</p>
                            <p className="text-sm text-slate-900 dark:text-zinc-300">{selectedRole.department || "—"}</p>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-slate-500 dark:text-zinc-500 uppercase tracking-wider mb-1">Parent Role</p>
                            <p className="text-sm text-slate-900 dark:text-zinc-300">
                              {selectedRole.parent_role_id ? flatRoles?.find(r => r.id === selectedRole.parent_role_id)?.name || "Unknown" : "None (Root)"}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-slate-500 dark:text-zinc-500 uppercase tracking-wider mb-1">System Status</p>
                            <p className="text-sm text-slate-900 dark:text-zinc-300">{selectedRole.is_system_role ? "System Managed" : "Custom Role"}</p>
                          </div>
                        </div>
                        
                        {selectedRole.description && (
                          <div className="pt-4 mt-4 border-t border-slate-200 dark:border-zinc-800/50">
                            <p className="text-xs font-medium text-slate-500 dark:text-zinc-500 uppercase tracking-wider mb-2">Description</p>
                            <p className="text-sm text-slate-700 dark:text-zinc-400 leading-relaxed">{selectedRole.description}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       <Link 
                         to={`/configurations/role-group-permissions?roleId=${selectedRole.id}`}
                         className="flex items-start p-4 rounded-xl border border-slate-200 dark:border-zinc-800 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-md transition-all bg-white dark:bg-zinc-900 group"
                       >
                         <div className="p-2.5 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 mr-4 group-hover:scale-110 transition-transform">
                           <Shield className="w-5 h-5" />
                         </div>
                         <div>
                           <h5 className="font-semibold text-slate-900 dark:text-zinc-100 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">Permissions</h5>
                           <p className="text-xs text-slate-500 mt-1">Configure which modules and actions this role can access.</p>
                         </div>
                       </Link>

                       <Link 
                         to={`/configurations/role-mcp-tool-permissions?roleId=${selectedRole.id}`}
                         className="flex items-start p-4 rounded-xl border border-slate-200 dark:border-zinc-800 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-md transition-all bg-white dark:bg-zinc-900 group"
                       >
                         <div className="p-2.5 rounded-lg bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 mr-4 group-hover:scale-110 transition-transform">
                           <Power className="w-5 h-5" />
                         </div>
                         <div>
                           <h5 className="font-semibold text-slate-900 dark:text-zinc-100 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">AI Tool Access</h5>
                           <p className="text-xs text-slate-500 mt-1">Manage which MCP tools are available to this role.</p>
                         </div>
                       </Link>
                    </div>

                    {selectedRole.is_system_role && (
                      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-xl p-4 flex gap-3 text-amber-800 dark:text-amber-400">
                        <Shield className="w-5 h-5 shrink-0" />
                        <div className="text-sm">
                          <p className="font-semibold mb-1">System Role</p>
                          <p className="opacity-90">This role is managed by the system and cannot be renamed or deleted. You can still modify its permissions and assign it to users.</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
  );
}
