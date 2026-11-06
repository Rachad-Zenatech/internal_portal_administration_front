import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../ui/tabs";
import { Button } from "../../../ui/button";
import { Badge } from "../../../ui/badge";
import { Textarea } from "../../../ui/textarea";
import { apiClient as api } from "@/services/apiClient";
import { format } from "date-fns";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Trash2, Edit2, Paperclip } from "lucide-react";
import { formatActivityAction, formatActivityValue } from "@/pages/Purchasing/utils/purchasingMeta";
import type { TaskDetailPanelViewState } from "../hooks/useTaskDetailPanelTail";

export function NotesActivityTabsColumn({ v }: { v: TaskDetailPanelViewState }) {
  const { task, handleAddNote, setNote, note, readOnly, handleEditNote, setEditingNoteId, setEditNoteText, editNoteText, editingNoteId, handleDeleteNote, isDragging, handleDrop, handleDragLeave, handleDragOver } = v;
  return (
    <div className="lg:col-span-5 space-y-4">
              <Tabs defaultValue="notes" className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-slate-100 dark:bg-zinc-800 p-1">
                  <TabsTrigger value="notes" className="data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-900 font-medium">
                    Notes ({task.notes?.length || 0})
                  </TabsTrigger>
                  <TabsTrigger value="history" className="data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-900 font-medium">
                    Activity ({task.history?.length || 0})
                  </TabsTrigger>
                </TabsList>

                {/* Notes Tab Content */}
                <TabsContent value="notes" className="relative outline-none mt-3">
                  <Card className="border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
                    <CardContent className="p-4 space-y-4">
                      <div
                        className={`relative rounded-lg p-2 -mx-2 transition-colors ${isDragging ? 'bg-primary/5 ring-2 ring-primary/20 border-dashed' : ''}`}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                      >
                        {isDragging && (
                          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm border-2 border-dashed border-primary rounded-lg text-primary pointer-events-none">
                            <p className="font-semibold text-sm">Drop file to attach</p>
                          </div>
                        )}

                        <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                          {task.notes?.map((n: any) => (
                            <div key={n.id} className="bg-slate-50 dark:bg-zinc-800/60 p-3 rounded-lg border border-slate-200/60 dark:border-zinc-700/60 text-sm group relative">
                              <div className="flex justify-between items-start mb-1.5">
                                {n.user_name && (
                                  <div className="flex items-center gap-2">
                                    <div className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold">
                                      {n.user_name.split(" ").map((x: string) => x[0]).join("").substring(0, 2).toUpperCase()}
                                    </div>
                                    <span className="font-medium text-xs text-slate-800 dark:text-zinc-200">{n.user_name}</span>
                                  </div>
                                )}
                                {!readOnly && (
                                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-foreground" onClick={() => { setEditingNoteId(n.id); setEditNoteText(n.note_text); }}>
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
                                      <p className="whitespace-pre-wrap text-slate-700 dark:text-zinc-300">{renderText(displayText)}</p>
                                      <div className="text-[11px] text-muted-foreground mt-2 flex items-center gap-2">
                                        {n.created_at ? format(new Date(n.created_at), 'MMM d, yyyy h:mm a') : ''}
                                        {isEdited && (
                                          <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 font-medium text-muted-foreground">Edited</Badge>
                                        )}
                                      </div>
                                    </>
                                  );
                                })()
                              )}
                            </div>
                          ))}
                          {(!task.notes || task.notes.length === 0) && (
                            <p className="text-sm text-muted-foreground italic py-6 text-center">No notes yet.</p>
                          )}
                        </div>

                        {!readOnly && (
                          <div className="flex gap-2 pt-3 border-t border-slate-100 dark:border-zinc-800 mt-2">
                            <Textarea
                              placeholder="Add a note... (or drag & drop files here)"
                              value={note}
                              onChange={(e) => setNote(e.target.value)}
                              className="min-h-[70px] text-sm"
                            />
                            <Button onClick={handleAddNote} className="self-end shrink-0">Post</Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Activity History Tab Content */}
                <TabsContent value="history" className="outline-none mt-3">
                  <Card className="border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
                    <CardContent className="p-4">
                      <div className="space-y-4 max-h-[460px] overflow-y-auto pr-1 relative before:absolute before:inset-0 before:ml-[0.625rem] before:-translate-x-px before:h-full before:w-0.5 before:bg-slate-200 dark:before:bg-zinc-800">
                        {task.history?.map((h: any) => (
                          <div key={h.id} className="relative flex items-start gap-3.5">
                            <div className="flex items-center justify-center w-5 h-5 rounded-full bg-primary z-10 shrink-0 mt-1 shadow-sm ring-4 ring-white dark:ring-zinc-900" />
                            <div className="flex-1 p-3 rounded-lg bg-slate-50 dark:bg-zinc-800/60 border border-slate-200/60 dark:border-zinc-700/60 shadow-xs text-xs space-y-1">
                              {h.changed_by_name && (
                                <div className="flex items-center gap-1.5 mb-1 text-slate-500 dark:text-zinc-400 font-medium">
                                  <span>{h.changed_by_name}</span>
                                </div>
                              )}
                              <p className="font-semibold text-slate-900 dark:text-zinc-100 text-xs">{formatActivityAction(h.action)}</p>
                              {h.old_value && h.new_value && (
                                <p className="text-muted-foreground text-[11px] font-medium flex items-center gap-1.5"><Badge variant="outline" className="text-[10px] px-1.5 py-0">{formatActivityValue(h.old_value)}</Badge> <span>&rarr;</span> <Badge variant="outline" className="text-[10px] px-1.5 py-0">{formatActivityValue(h.new_value)}</Badge></p>
                              )}
                              {!h.old_value && h.new_value && (
                                <p className="text-muted-foreground text-[11px] font-medium"><Badge variant="outline" className="text-[10px] px-1.5 py-0">{formatActivityValue(h.new_value)}</Badge></p>
                              )}
                              {h.comment && (
                                <p className="mt-1 bg-white dark:bg-zinc-900 p-1.5 rounded border border-slate-200/60 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 italic">{h.comment}</p>
                              )}
                              <time className="block text-[10px] text-slate-400 dark:text-zinc-500 pt-1">
                                {h.created_at ? format(new Date(h.created_at), 'MMM d, yyyy h:mm a') : ''}
                              </time>
                            </div>
                          </div>
                        ))}
                        {(!task.history || task.history.length === 0) && (
                          <p className="text-sm text-muted-foreground italic py-6 text-center">No activity history recorded.</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
  );
}
