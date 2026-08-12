import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "../../components/ui/sheet";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "../../components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Textarea } from "../../components/ui/textarea";
import { useState } from "react";
import { apiClient as api } from "@/services/apiClient";
import { format } from "date-fns";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Trash2, UploadCloud, Edit2, Paperclip, ExternalLink } from "lucide-react";
import Stepper from "@/components/Stepper";
import {
  SPEND_FLOW,
  ADMIN_FLOW,
  RECURRING_FLOW,
  QUOTE_FLOW,
} from "@/pages/Purchasing/purchasingMeta";

interface TaskDetailPanelProps {
  task: any | null;
  onClose: () => void;
  onUpdate: () => void;
  readOnly?: boolean;
}

export default function TaskDetailPanel({ task, onClose, onUpdate, readOnly = false }: TaskDetailPanelProps) {
  const [note, setNote] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [deleteNoteId, setDeleteNoteId] = useState<number | null>(null);
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null);
  const [editNoteText, setEditNoteText] = useState("");
  

  if (!task) return null;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      // For simplicity in MVP, we just upload the first file
      const file = e.dataTransfer.files[0];
      const formData = new FormData();
      formData.append("file", file);
      
      try {
        await api.post(`/tasks/${task.id}/notes/upload`, formData);
        toast.success(`Attached file: ${file.name}`);
        onUpdate();
      } catch (err: any) {
        toast.error("Failed to upload attachment");
      }
    }
  };

  const handleAddNote = async () => {
    if (!note.trim()) return;
    try {
      await api.post<any>(`/tasks/${task.id}/notes`, { note_text: note });
      setNote("");
      toast.success("Note added successfully");
      onUpdate();
    } catch (e: any) {
      console.error("Failed to add note", e);
      toast.error(e.message || "Failed to add note");
    }
  };

  const handleEditNote = async (noteId: number) => {
    if (!editNoteText.trim()) return;
    try {
      await api.put(`/tasks/${task.id}/notes/${noteId}`, { note_text: editNoteText });
      toast.success("Note updated");
      setEditingNoteId(null);
      setEditNoteText("");
      onUpdate();
    } catch (e: any) {
      toast.error(e.message || "Failed to update note");
    }
  };

  const handleDeleteNote = (noteId: number) => {
    setDeleteNoteId(noteId);
  };

  const confirmDeleteNote = async () => {
    if (deleteNoteId === null) return;
    try {
      await api.delete(`/tasks/${task.id}/notes/${deleteNoteId}`);
      toast.success("Note deleted");
      onUpdate();
    } catch (e: any) {
      toast.error(e.message || "Failed to delete note");
    } finally {
      setDeleteNoteId(null);
    }
  };

  const handleApprove = async () => {
    try {
      await api.post<any>(`/tasks/${task.id}/approve`, { action: "APPROVE", comment: "" });
      toast.success("Task approved successfully");
      onUpdate();
      onClose();
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Failed to approve task");
    }
  };

  const handleReject = async () => {
    const reason = prompt("Enter rejection reason:");
    if (reason === null) return;
    try {
      await api.post<any>(`/tasks/${task.id}/approve`, { action: "REJECT", comment: reason });
      toast.success("Task rejected successfully");
      onUpdate();
      onClose();
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Failed to reject task");
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this order? This action cannot be undone.")) return;
    
    try {
      await api.delete(`/tasks/${task.id}`);
      toast.success("Order deleted successfully");
      onUpdate();
      onClose();
    } catch (e) {
      console.error(e);
      toast.error("Failed to delete order");
    }
  };

  // very simple permission check (MVP): if user belongs to tier role or is tier user
  // (In full version, this requires evaluating the role from the token/DB)
  const isHighValue = Number(task.amount) > 10000;
  const isInvoiceOrWire = task.payment_method?.toLowerCase() === 'invoice' || task.payment_method?.toLowerCase() === 'wire';
  const needsApproval = isHighValue || isInvoiceOrWire;
  
  const canApprove = task.current_tier_id != null && needsApproval; 

  return (
    <Sheet open={!!task} onOpenChange={(open) => !open && onClose()}>
      <SheetContent aria-describedby={undefined} className="!max-w-[75vw] !w-[75vw] flex flex-col p-0">
        <div className="p-6 flex-1 overflow-y-auto">
          <SheetHeader className="mb-6 pr-8">
            <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-3">
                <SheetTitle className="text-2xl">{task.product_name}</SheetTitle>
                {!readOnly && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    onClick={handleDelete}
                    title="Delete Order"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
              <div className="flex gap-2 mt-2">

                <Badge variant={task.priority?.toLowerCase() === 'high' ? 'destructive' : 'default'}>
                  {task.priority || 'Medium'}
                </Badge>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">${task.amount}</div>
              <div className="text-sm text-muted-foreground">{task.category}</div>
            </div>
          </div>
        </SheetHeader>

        {(() => {
          let flow = SPEND_FLOW;
          if (task.category === 'ADMIN' || task.request_type === 'ADMIN') flow = ADMIN_FLOW;
          else if (task.category === 'RECURRING' || task.request_type === 'RECURRING') flow = RECURRING_FLOW;
          else if (task.category === 'QUOTE' || task.request_type === 'QUOTE') flow = QUOTE_FLOW;

          return (
            <Card className="border border-slate-200 dark:border-zinc-800 mb-8 mx-1">
              <CardContent className="p-4 sm:p-5">
                <Stepper flow={flow} requestStatus={task.status} />
                {task.status?.toUpperCase() === 'REJECTED' && (
                  <p className="mt-3 text-sm font-medium text-red-600">This order was rejected.</p>
                )}
              </CardContent>
            </Card>
          );
        })()}

        <div className="space-y-8">
          <section>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Description</h3>
            <p className="text-sm">{task.description}</p>
            {task.item_url && (
              <div className="mt-4">
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Product / Website Link</h3>
                <a
                  href={task.item_url.startsWith("http") ? task.item_url : `https://${task.item_url}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800 transition-colors"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Open Product Page ({task.item_url})
                </a>
              </div>
            )}
            {task.assignee_name && (
              <div className="mt-4">
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Assignee</h3>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shadow-sm">
                    {task.assignee_name.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase()}
                  </div>
                  <span className="text-sm font-medium">{task.assignee_name}</span>
                </div>
              </div>
            )}
          </section>


          <Tabs defaultValue="notes" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="notes">Notes</TabsTrigger>
              <TabsTrigger value="history">Activity History</TabsTrigger>
            </TabsList>
            
            <TabsContent value="notes" className="relative outline-none">
              <div 
                className={`relative rounded-lg p-2 -mx-2 transition-colors ${isDragging ? 'bg-primary/5 ring-2 ring-primary/20 border-dashed' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                {isDragging && (
                  <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm border-2 border-dashed border-primary rounded-lg text-primary pointer-events-none">
                    <UploadCloud className="w-10 h-10 mb-2 animate-bounce" />
                    <p className="font-medium">Drop files to attach</p>
                  </div>
                )}
                
                <div className="space-y-4 mb-4 mt-2">
                  {task.notes?.map((n: any) => (
                    <div key={n.id} className="bg-muted p-3 rounded-md text-sm group relative">
                      <div className="flex justify-between items-start mb-2">
                        {n.user_name && (
                          <div className="flex items-center gap-2">
                            <div className="w-5 h-5 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center text-[10px] font-bold shadow-sm">
                              {n.user_name.split(" ").map((x: string) => x[0]).join("").substring(0, 2).toUpperCase()}
                            </div>
                            <span className="text-xs font-medium">{n.user_name}</span>
                          </div>
                        )}
                        {!readOnly && (
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-primary" onClick={() => {
                              setEditingNoteId(n.id);
                              setEditNoteText(n.note_text);
                            }}>
                              <Edit2 className="w-3 h-3" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive" onClick={() => handleDeleteNote(n.id)}>
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                      
                      {editingNoteId === n.id ? (
                        <div className="flex flex-col gap-2 mt-2">
                          <Textarea value={editNoteText} onChange={e => setEditNoteText(e.target.value)} className="min-h-[60px]" />
                          <div className="flex gap-2 justify-end">
                            <Button variant="outline" size="sm" onClick={() => setEditingNoteId(null)}>Cancel</Button>
                            <Button size="sm" onClick={() => handleEditNote(n.id)}>Save</Button>
                          </div>
                        </div>
                      ) : (
                        (() => {
                          const isEdited = (n.updated_at && n.updated_at !== n.created_at) || n.is_edited || n.note_text.endsWith('\n[Edited]');
                          const displayText = n.note_text.endsWith('\n[Edited]') ? n.note_text.slice(0, -9) : n.note_text;
                          
                          const renderText = (text: string) => {
                            const parts = text.split(/(\[Attached: .*?\])/g);
                            return parts.map((part, i) => {
                              const match = part.match(/^\[Attached: (.*?)\]$/);
                              if (match) {
                                return (
                                  <a
                                    key={i}
                                    href="#"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      api.downloadFile(`/tasks/notes/download/${encodeURIComponent(match[1])}`, match[1])
                                        .catch((err) => toast.error(err.message || "Failed to download file"));
                                    }}
                                    className="text-primary hover:underline font-medium inline-flex items-center bg-primary/10 px-2 py-1 rounded-md mt-1 mb-1"
                                  >
                                    <Paperclip className="w-3.5 h-3.5 mr-1.5 opacity-70" />
                                    <span className="underline decoration-primary/50 underline-offset-4">{match[1]}</span>
                                  </a>
                                );
                              }
                              return <span key={i}>{part}</span>;
                            });
                          };

                          return (
                            <>
                              <p className="whitespace-pre-wrap">{renderText(displayText)}</p>
                              <p className="text-xs text-muted-foreground mt-2 flex items-center gap-2">
                                {n.created_at ? format(new Date(n.created_at), 'MMM d, yyyy h:mm a') : ''}
                                {isEdited && (
                                  <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 font-medium text-muted-foreground">Edited</Badge>
                                )}
                              </p>
                            </>
                          );
                        })()
                      )}
                    </div>
                  ))}
                  {(!task.notes || task.notes.length === 0) && (
                    <p className="text-sm text-muted-foreground italic px-2">No notes yet.</p>
                  )}
                </div>
                {!readOnly && (
                  <div className="flex gap-2 relative z-10 px-2 pb-2">
                    <Textarea
                      placeholder="Add a note... (or drag files here)"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      className="min-h-[80px]"
                    />
                    <Button onClick={handleAddNote} className="self-end">Post</Button>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="history" className="outline-none">
              <div className="space-y-4 relative before:absolute before:inset-0 before:ml-[0.625rem] before:-translate-x-px before:h-full before:w-0.5 before:bg-muted mt-4">
                {task.history?.map((h: any) => (
                  <div key={h.id} className="relative flex items-start gap-4">
                    <div className="flex items-center justify-center w-5 h-5 rounded-full bg-primary z-10 shrink-0 mt-1 shadow-sm" />
                    <div className="flex-1 p-3 rounded bg-card border shadow-sm text-sm">
                      {h.changed_by_name && (
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-5 h-5 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center text-[10px] font-bold shadow-sm">
                            {h.changed_by_name.split(" ").map((x: string) => x[0]).join("").substring(0, 2).toUpperCase()}
                          </div>
                          <span className="text-xs font-medium">{h.changed_by_name}</span>
                        </div>
                      )}
                      <p className="font-medium">{h.action}</p>
                      {h.old_value && h.new_value && <p className="text-muted-foreground text-xs mt-1">{h.old_value} &rarr; {h.new_value}</p>}
                      {!h.old_value && h.new_value && <p className="text-muted-foreground text-xs mt-1">{h.new_value}</p>}
                      {h.comment && <p className="mt-2 bg-muted p-1.5 rounded">{h.comment}</p>}
                      <time className="block text-xs text-muted-foreground mt-2">{h.created_at ? format(new Date(h.created_at), 'MMM d, h:mm a') : ''}</time>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
        </div>

        {(canApprove || task.status === "Waiting Payment") && (
          <SheetFooter className="px-6 py-4 border-t bg-muted/20 flex-row sm:flex-row justify-center flex-wrap gap-4 sm:gap-6 mt-0 shadow-sm z-10">
            {canApprove && (
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-muted-foreground mr-1">Approval:</span>
                <Button onClick={handleReject} variant="outline" className="border-destructive/30 text-destructive hover:bg-destructive/10">Reject</Button>
                <Button onClick={handleApprove} className="bg-green-600 hover:bg-green-700 text-white shadow-sm">Approve</Button>
              </div>
            )}


          </SheetFooter>
        )}
      </SheetContent>
      
      <AlertDialog open={deleteNoteId !== null} onOpenChange={(open) => !open && setDeleteNoteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Note</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this note? This action cannot be undone.
              Any attached files will also be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteNote} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Sheet>
  );
}
