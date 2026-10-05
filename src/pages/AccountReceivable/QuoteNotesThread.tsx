import React, { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Building2,
  Download,
  File,
  FileText,
  Loader2,
  Paperclip,
  Send,
  User,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  arQuoteService,
} from "@/services/arQuoteService";
import type {
  ARQuoteAttachment,
  ARQuoteNote,
} from "@/services/arQuoteService";

interface QuoteNotesThreadProps {
  quoteId?: string;
  token?: string;
  authorType: "SALES" | "CUSTOMER";
  defaultAuthorName?: string;
  defaultAuthorEmail?: string;
  className?: string;
}

export function QuoteNotesThread({
  quoteId,
  token,
  authorType,
  defaultAuthorName = "",
  defaultAuthorEmail = "",
  className = "",
}: QuoteNotesThreadProps) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [message, setMessage] = useState("");
  const [authorName, setAuthorName] = useState(defaultAuthorName);
  const [pendingAttachments, setPendingAttachments] = useState<ARQuoteAttachment[]>([]);
  const [isUploadingFiles, setIsUploadingFiles] = useState(false);

  const isSales = authorType === "SALES";

  // Query notes for either staff (quoteId) or customer (token)
  const { data: notes = [], isLoading, refetch } = useQuery<ARQuoteNote[]>({
    queryKey: ["ar-quote-notes", quoteId || token],
    queryFn: async () => {
      if (token) {
        return arQuoteService.getPublicQuoteNotes(token);
      }
      if (quoteId) {
        return arQuoteService.getQuoteNotes(quoteId);
      }
      return [];
    },
    enabled: !!quoteId || !!token,
    refetchInterval: 10000, // Light polling for active thread updates
  });

  // Mutation to add note
  const addNoteMutation = useMutation({
    mutationFn: async () => {
      if (!message.trim() && pendingAttachments.length === 0) {
        throw new Error("Message or attachment required.");
      }

      if (token) {
        return arQuoteService.addPublicQuoteNote(token, {
          message: message.trim(),
          author_name: authorName.trim() || defaultAuthorName || "Customer",
          attachments: pendingAttachments,
        });
      }

      if (quoteId) {
        return arQuoteService.addQuoteNote(quoteId, {
          message: message.trim(),
          author_name: authorName.trim() || defaultAuthorName || "Sales Team",
          author_email: defaultAuthorEmail,
          attachments: pendingAttachments,
        });
      }
      throw new Error("No quote ID or token provided.");
    },
    onSuccess: () => {
      setMessage("");
      setPendingAttachments([]);
      queryClient.invalidateQueries({ queryKey: ["ar-quote-notes", quoteId || token] });
      if (quoteId) {
        queryClient.invalidateQueries({ queryKey: ["ar-quote-audit", quoteId] });
      }
      refetch();
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploadingFiles(true);
    const readPromises: Promise<ARQuoteAttachment>[] = [];

    Array.from(files).forEach((file) => {
      const p = new Promise<ARQuoteAttachment>((resolve) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          resolve({
            name: file.name,
            url: (event.target?.result as string) || "",
            file_size: file.size,
            content_type: file.type,
          });
        };
        reader.readAsDataURL(file);
      });
      readPromises.push(p);
    });

    Promise.all(readPromises).then((loaded) => {
      setPendingAttachments((prev) => [...prev, ...loaded]);
      setIsUploadingFiles(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    });
  };

  const removePendingAttachment = (index: number) => {
    setPendingAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className={`bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col overflow-hidden ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Documents Required &amp; Messages
            </h3>
            <p className="text-[11px] text-slate-400">
              Direct communication and document attachment thread
            </p>
          </div>
        </div>
        <Badge variant="outline" className="text-[10px] px-2 py-0.5">
          {notes.length} {notes.length === 1 ? "entry" : "entries"}
        </Badge>
      </div>

      {/* Messages List */}
      <div className="p-4 space-y-3.5 max-h-[380px] overflow-y-auto min-h-[140px] bg-slate-50/40 dark:bg-slate-950/20">
        {isLoading ? (
          <div className="flex items-center justify-center py-8 text-xs text-slate-400 gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Loading discussion thread...</span>
          </div>
        ) : notes.length === 0 ? (
          <div className="text-center py-8 px-4 space-y-1 text-slate-400">
            <FileText className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-700 stroke-[1.5]" />
            <p className="text-xs font-medium">No messages or documents attached yet.</p>
            <p className="text-[11px]">
              {isSales
                ? "Request required documentation (tax forms, POs) or post notes for the client."
                : "Ask questions or upload required documents for the sales team."}
            </p>
          </div>
        ) : (
          notes.map((note) => {
            const isNoteFromSales = note.author_type === "SALES";
            return (
              <div
                key={note.id}
                className={`p-3.5 rounded-xl border text-xs space-y-2 transition-all ${
                  isNoteFromSales
                    ? "bg-amber-50/50 dark:bg-amber-950/20 border-amber-200/70 dark:border-amber-900/40 mr-4"
                    : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 ml-4 shadow-xs"
                }`}
              >
                {/* Author Info Bar */}
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    {isNoteFromSales ? (
                      <div className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 flex items-center justify-center">
                        <User className="w-3 h-3" />
                      </div>
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-700 dark:text-sky-300 flex items-center justify-center">
                        <Building2 className="w-3 h-3" />
                      </div>
                    )}
                    <span className="font-bold text-slate-900 dark:text-white">
                      {note.author_name}
                    </span>
                    <Badge
                      className={`text-[9px] px-1.5 py-0 ${
                        isNoteFromSales
                          ? "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300 border-amber-200"
                          : "bg-sky-100 text-sky-800 dark:bg-sky-900/50 dark:text-sky-300 border-sky-200"
                      }`}
                    >
                      {isNoteFromSales ? "SALES" : "CUSTOMER"}
                    </Badge>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {new Date(note.created_at).toLocaleString([], {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </span>
                </div>

                {/* Message Body */}
                {note.message && (
                  <p className="text-slate-800 dark:text-zinc-200 whitespace-pre-line leading-relaxed">
                    {note.message}
                  </p>
                )}

                {/* Attachments */}
                {note.attachments && note.attachments.length > 0 && (
                  <div className="pt-1.5 border-t border-slate-100 dark:border-slate-800/80 space-y-1.5">
                    <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <Paperclip className="w-3 h-3" />
                      <span>Attachments ({note.attachments.length})</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {note.attachments.map((att, idx) => (
                        <a
                          key={idx}
                          href={att.url}
                          download={att.name}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-amber-400 hover:bg-amber-50/50 dark:hover:bg-slate-700/80 text-[11px] text-slate-700 dark:text-slate-200 transition-colors group"
                        >
                          <File className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          <span className="font-medium truncate max-w-[140px]">{att.name}</span>
                          {att.file_size && (
                            <span className="text-[9.5px] text-slate-400 font-mono">
                              ({formatFileSize(att.file_size)})
                            </span>
                          )}
                          <Download className="w-3 h-3 text-slate-400 group-hover:text-amber-600 shrink-0 ml-1" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Composer Section */}
      <div className="p-4 border-t border-slate-100 dark:border-slate-800 space-y-3 bg-white dark:bg-slate-900">
        {!isSales && (
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-500 font-medium">Posting as:</span>
            <Input
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              placeholder="Your Name (e.g. Jasper O.)"
              className="h-7 text-xs w-48 rounded-lg"
            />
          </div>
        )}

        {/* Selected Pending Attachments */}
        {pendingAttachments.length > 0 && (
          <div className="flex flex-wrap gap-1.5 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
            {pendingAttachments.map((att, idx) => (
              <div
                key={idx}
                className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[11px]"
              >
                <Paperclip className="w-3 h-3 text-amber-600" />
                <span className="truncate max-w-[150px] font-medium">{att.name}</span>
                <span className="text-[9px] text-slate-400 font-mono">({formatFileSize(att.file_size)})</span>
                <button
                  type="button"
                  onClick={() => removePendingAttachment(idx)}
                  className="text-slate-400 hover:text-rose-600 p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={
            isSales
              ? "Write a note or specify required documents from the customer..."
              : "Type a message or reply to the sales team regarding your quote..."
          }
          className="text-xs min-h-[72px] resize-none rounded-xl"
        />

        <div className="flex items-center justify-between gap-2">
          <div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              multiple
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingFiles || addNoteMutation.isPending}
              className="h-8 text-xs rounded-xl border-slate-200 dark:border-slate-800 gap-1.5 cursor-pointer text-slate-700 dark:text-slate-300 hover:bg-slate-50"
            >
              <Paperclip className="w-3.5 h-3.5 text-amber-600" />
              <span>{isUploadingFiles ? "Reading Files..." : "Attach Document(s)"}</span>
            </Button>
          </div>

          <Button
            size="sm"
            onClick={() => addNoteMutation.mutate()}
            disabled={
              addNoteMutation.isPending ||
              isUploadingFiles ||
              (!message.trim() && pendingAttachments.length === 0)
            }
            className="h-8 text-xs bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-xl gap-1.5 shadow-xs cursor-pointer"
          >
            {addNoteMutation.isPending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
            <span>{isSales ? "Post Note / Request" : "Send Message"}</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
