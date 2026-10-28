import React, { useState } from "react";
import { format } from "date-fns";
import {
  MessageSquare,
  Send,
  Reply,
  Mail,
  AlertCircle,
  HelpCircle,
  Clock,
  Sparkles,
  Info,
  Check,
  Lock,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/AuthContext";
import { postRequestMessage } from "@/services/purchasingService";
import { RequestAccountDetailsDialog, SecureInfoRequestCard, looksLikeCredential } from "./SecureInfoRequest";
import type { RequestDetail, RequestMessageItem } from "@/types/purchasing";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";

interface RequestMessageThreadProps {
  data: RequestDetail;
  refetch: () => Promise<any>;
}

const TEMPLATE_PROMPTS = [
  "Please provide item specifications or quotes from alternate vendors.",
  "Please attach the official invoice or receipt for accounting verification.",
  "Please clarify the intended delivery location and onsite contact person.",
  "Please clarify the project code and GL account code for this purchase.",
  "I have provided the requested details and attachments as requested.",
];

export const RequestMessageThread: React.FC<RequestMessageThreadProps> = ({ data, refetch }) => {
  const { user, workflow_roles = [] } = useAuth();
  const request = data.request;
  const messages = data.messages || [];

  const isRequester = Boolean(user?.id && request.requester_id && user.id === request.requester_id);
  const isPurchasingAssociate = workflow_roles.some(
    (r) => typeof r === "string" && r.toUpperCase().includes("PURCHAS")
  );
  const currentRoleLabel = isRequester
    ? "Requester"
    : isPurchasingAssociate
    ? "Purchasing Associate"
    : "Reviewer / Staff";

  // Form state
  const [messageText, setMessageText] = useState("");
  const [subject, setSubject] = useState("");
  const [messageType, setMessageType] = useState<"REQUEST_INFO" | "REPLY" | "GENERAL">(
    isRequester ? "REPLY" : "REQUEST_INFO"
  );
  const [notifyEmail, setNotifyEmail] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [secureDialogOpen, setSecureDialogOpen] = useState(false);
  const [credentialWarningAck, setCredentialWarningAck] = useState(false);
  const showCredentialWarning = looksLikeCredential(messageText) && !credentialWarningAck;

  // Determine last message status for banner
  const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;
  const isAwaitingRequesterReply =
    lastMessage && lastMessage.message_type === "REQUEST_INFO" && lastMessage.sender_role !== "Requester";
  const isReplyReceived = lastMessage && lastMessage.message_type === "REPLY";

  const handleApplyTemplate = (prompt: string) => {
    setMessageText((prev) => (prev ? `${prev}\n\n${prompt}` : prompt));
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim()) {
      toast.error("Please enter a message before sending.");
      return;
    }
    if (showCredentialWarning) {
      toast.warning("This looks like it contains a password. Use the secure form instead, or click Send anyway.");
      return;
    }

    setIsSubmitting(true);
    try {
      await postRequestMessage(request.id, {
        message_text: messageText.trim(),
        message_type: messageType,
        subject: subject.trim() || undefined,
        notify_email: notifyEmail,
      });

      toast.success(
        messageType === "REQUEST_INFO"
          ? "Information request sent and emailed to requester."
          : "Message posted and notification delivered."
      );
      setMessageText("");
      setSubject("");
      setCredentialWarningAck(false);
      await refetch();
    } catch (err: unknown) {
      toast.error((err as Error)?.message || "Failed to post message to thread");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRoleBadge = (role?: string | null) => {
    const r = (role || "User").toLowerCase();
    if (r.includes("requester")) {
      return (
        <Badge
          variant="outline"
          className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 text-[10px] font-medium"
        >
          Requester
        </Badge>
      );
    }
    if (r.includes("purchasing")) {
      return (
        <Badge
          variant="outline"
          className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800 text-[10px] font-medium"
        >
          Purchasing Associate
        </Badge>
      );
    }
    if (r.includes("admin")) {
      return (
        <Badge
          variant="outline"
          className="bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800 text-[10px] font-medium"
        >
          Administrator
        </Badge>
      );
    }
    return (
      <Badge
        variant="outline"
        className="bg-slate-100 text-slate-700 border-slate-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700 text-[10px] font-medium"
      >
        {role || "Team Member"}
      </Badge>
    );
  };

  const getMessageTypeBadge = (type?: string) => {
    if (type === "SECURE_REQUEST") {
      return (
        <Badge className="bg-violet-100 hover:bg-violet-100 text-violet-800 dark:bg-violet-950/70 dark:text-violet-300 text-[10px] gap-1 border-none shadow-none font-medium">
          <Lock className="h-3 w-3 text-violet-600 dark:text-violet-400" />
          Secure Request
        </Badge>
      );
    }
    if (type === "REQUEST_INFO") {
      return (
        <Badge className="bg-amber-100 hover:bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 text-[10px] gap-1 border-none shadow-none font-medium">
          <HelpCircle className="h-3 w-3 text-amber-600 dark:text-amber-400" />
          More Info Requested
        </Badge>
      );
    }
    if (type === "REPLY") {
      return (
        <Badge className="bg-sky-100 hover:bg-sky-100 text-sky-800 dark:bg-sky-950/70 dark:text-sky-300 text-[10px] gap-1 border-none shadow-none font-medium">
          <Reply className="h-3 w-3 text-sky-600 dark:text-sky-400" />
          Response / Update
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="text-[10px] gap-1 font-normal text-slate-600 dark:text-zinc-400">
        <MessageSquare className="h-3 w-3" />
        Note
      </Badge>
    );
  };

  const getInitials = (name?: string) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  return (
    <Card className="border border-slate-200 dark:border-zinc-800 shadow-sm overflow-hidden">
      <CardHeader className="pb-3 border-b border-slate-100 dark:border-zinc-800/80 bg-slate-50/50 dark:bg-zinc-900/30">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300 shrink-0">
              <MessageSquare className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
                <span>Message Thread &amp; Information Requests</span>
                {messages.length > 0 && (
                  <Badge variant="secondary" className="text-xs px-2 py-0.5 font-semibold">
                    {messages.length}
                  </Badge>
                )}
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                Posting as <span className="font-semibold text-slate-700 dark:text-zinc-300">{currentRoleLabel}</span> on Request #{request.id}.
                Notifies the requester and purchasing associate by email when inquiries or replies are posted.
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {!isRequester && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSecureDialogOpen(true)}
                className="text-xs h-7 gap-1"
              >
                <Lock className="h-3 w-3 text-violet-600" />
                Request account details
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setMessageType("REQUEST_INFO");
                document.getElementById("request-message-textarea")?.focus();
              }}
              className="text-xs h-7 gap-1"
            >
              <HelpCircle className="h-3 w-3 text-amber-600" />
              Request Info
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setMessageType("REPLY");
                document.getElementById("request-message-textarea")?.focus();
              }}
              className="text-xs h-7 gap-1"
            >
              <Reply className="h-3 w-3 text-blue-600" />
              Reply
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-6 space-y-6">
        {/* Status Highlights */}
        {isAwaitingRequesterReply && (
          <div className="flex items-start gap-3 p-3.5 rounded-lg border border-amber-200 dark:border-amber-900/60 bg-amber-50/80 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200 text-xs">
            <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold">Action Required / More Information Requested:</span>
              <p className="mt-0.5 text-amber-800/90 dark:text-amber-300/90 leading-relaxed">
                The purchasing team or reviewer is awaiting additional clarification from the requester. Please review
                the inquiry below and post a reply.
              </p>
            </div>
          </div>
        )}

        {isReplyReceived && !isAwaitingRequesterReply && (
          <div className="flex items-start gap-3 p-3.5 rounded-lg border border-sky-200 dark:border-sky-900/60 bg-sky-50/80 dark:bg-sky-950/30 text-sky-900 dark:text-sky-200 text-xs">
            <Info className="h-4 w-4 text-sky-600 dark:text-sky-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold">Latest Update Received:</span>
              <p className="mt-0.5 text-sky-800/90 dark:text-sky-300/90 leading-relaxed">
                {lastMessage?.sender_name} has provided an update on this request. The purchasing associate and team
                have been notified.
              </p>
            </div>
          </div>
        )}

        {/* Message Thread Stream */}
        <div className="space-y-4">
          <div className="text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider flex items-center justify-between">
            <span>Thread Messages</span>
            <span className="text-[11px] font-normal normal-case text-slate-400">
              {messages.length === 1 ? "1 message" : `${messages.length} messages`}
            </span>
          </div>

          {messages.length === 0 ? (
            <div className="text-center py-10 px-4 rounded-xl border border-dashed border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/20">
              <div className="inline-flex p-3 rounded-full bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 mb-3">
                <MessageSquare className="h-6 w-6" />
              </div>
              <h4 className="text-sm font-semibold text-slate-800 dark:text-zinc-200">No messages yet</h4>
              <p className="text-xs text-slate-500 dark:text-zinc-400 max-w-md mx-auto mt-1 leading-relaxed">
                Need more information from the requester? Use the form below to ask for missing details, quotes, or
                attachments. An email notification will be delivered immediately.
              </p>
            </div>
          ) : (
            <div className="space-y-3.5">
              {messages.map((msg: RequestMessageItem, index: number) => {
                const isMsgRequester = msg.sender_role?.toLowerCase().includes("requester");
                const isMsgPurchasing = msg.sender_role?.toLowerCase().includes("purchas");

                return (
                  <div
                    key={msg.id || index}
                    className={`p-4 rounded-xl border transition-all duration-150 ${
                      msg.message_type === "REQUEST_INFO"
                        ? "bg-gradient-to-r from-amber-50/40 via-white to-transparent dark:from-amber-950/15 dark:via-zinc-900 dark:to-zinc-900 border-amber-200/80 dark:border-amber-900/40 shadow-xs"
                        : msg.message_type === "REPLY"
                        ? "bg-gradient-to-r from-sky-50/40 via-white to-transparent dark:from-sky-950/15 dark:via-zinc-900 dark:to-zinc-900 border-sky-200/80 dark:border-sky-900/40 shadow-xs"
                        : "bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 shadow-2xs"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        {/* Avatar */}
                        <div
                          className={`h-9 w-9 rounded-full shrink-0 flex items-center justify-center text-xs font-bold shadow-2xs ${
                            isMsgRequester
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                              : isMsgPurchasing
                              ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                              : "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300"
                          }`}
                        >
                          {getInitials(msg.sender_name)}
                        </div>

                        {/* Sender info */}
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-sm font-semibold text-slate-900 dark:text-zinc-100 truncate">
                              {msg.sender_name}
                            </span>
                            {getRoleBadge(msg.sender_role)}
                            {getMessageTypeBadge(msg.message_type)}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500 dark:text-zinc-400">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {format(new Date(msg.created_at), "MMM d, yyyy 'at' h:mm a")}
                            </span>
                            {msg.sender_email && (
                              <>
                                <span>&bull;</span>
                                <span className="truncate max-w-[200px]">{msg.sender_email}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Email Notification Status */}
                      <div className="shrink-0 flex items-center">
                        {msg.email_sent ? (
                          <div
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                            title={`Email delivered to: ${msg.recipient_emails?.join(", ") || "Recipients"}`}
                          >
                            <Mail className="h-2.5 w-2.5" />
                            <span>Emailed</span>
                            <Check className="h-2.5 w-2.5" />
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1 text-[10px] text-slate-400">
                            <span>Portal note</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Subject if any */}
                    {msg.subject && (
                      <div className="mt-2.5 text-xs font-semibold text-slate-800 dark:text-zinc-200">
                        {msg.subject}
                      </div>
                    )}

                    {/* Message Body (secure requests render as a card; the text holds no secrets either way) */}
                    {msg.secure_request ? (
                      <SecureInfoRequestCard requestId={request.id} summary={msg.secure_request} refetch={refetch} />
                    ) : (
                      <div className="mt-2 text-sm text-slate-700 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap break-words pl-12 sm:pl-12">
                        {msg.message_text}
                      </div>
                    )}

                    {/* Recipients Footer if emailed */}
                    {msg.recipient_emails && msg.recipient_emails.length > 0 && (
                      <div className="mt-3 pl-12 text-[11px] text-slate-400 dark:text-zinc-500 flex items-center gap-1">
                        <Mail className="h-3 w-3 shrink-0" />
                        <span>Sent notification to:</span>
                        <span className="font-mono text-slate-600 dark:text-zinc-400 truncate">
                          {msg.recipient_emails.join(", ")}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Message Composer Card */}
        <div className="pt-2 border-t border-slate-200 dark:border-zinc-800">
          <form onSubmit={handleSendMessage} className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="text-xs font-semibold text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" />
                <span>
                  {messageType === "REQUEST_INFO"
                    ? "Request More Information"
                    : messageType === "REPLY"
                    ? "Post Update / Reply"
                    : "Post Message"}
                </span>
              </div>

              {/* Message Type Selector Buttons */}
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-zinc-800 p-0.5 rounded-lg self-start">
                <button
                  type="button"
                  onClick={() => setMessageType("REQUEST_INFO")}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                    messageType === "REQUEST_INFO"
                      ? "bg-white dark:bg-zinc-900 text-amber-700 dark:text-amber-400 shadow-2xs"
                      : "text-slate-600 dark:text-zinc-400 hover:text-slate-900"
                  }`}
                >
                  Request Info
                </button>
                <button
                  type="button"
                  onClick={() => setMessageType("REPLY")}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                    messageType === "REPLY"
                      ? "bg-white dark:bg-zinc-900 text-sky-700 dark:text-sky-400 shadow-2xs"
                      : "text-slate-600 dark:text-zinc-400 hover:text-slate-900"
                  }`}
                >
                  Reply / Update
                </button>
                <button
                  type="button"
                  onClick={() => setMessageType("GENERAL")}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                    messageType === "GENERAL"
                      ? "bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-200 shadow-2xs"
                      : "text-slate-600 dark:text-zinc-400 hover:text-slate-900"
                  }`}
                >
                  General Note
                </button>
              </div>
            </div>

            {/* Template Quick Chips */}
            <div className="space-y-1.5">
              <div className="text-[11px] font-medium text-slate-400">Quick suggestions:</div>
              <div className="flex flex-wrap gap-1.5">
                {TEMPLATE_PROMPTS.map((prompt, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleApplyTemplate(prompt)}
                    className="text-[11px] px-2.5 py-1 rounded-md border border-slate-200 dark:border-zinc-800 bg-slate-50/80 hover:bg-slate-100 dark:bg-zinc-800/50 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 transition-colors text-left"
                  >
                    + {prompt}
                  </button>
                ))}
              </div>
            </div>

            {/* Optional Subject */}
            <div className="space-y-1">
              <Input
                placeholder="Subject (optional, e.g. Additional documentation required)"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="text-xs h-8"
              />
            </div>

            {/* Message Textarea */}
            <div className="space-y-1">
              <Textarea
                id="request-message-textarea"
                rows={4}
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder={
                  messageType === "REQUEST_INFO"
                    ? "Specify the exact information, documents, or clarification needed from the requester..."
                    : "Write your reply or update regarding this purchase request..."
                }
                className="text-sm resize-y min-h-[90px] focus-visible:ring-sky-500"
              />
              {showCredentialWarning && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-md border border-amber-200 dark:border-amber-900/60 bg-amber-50 dark:bg-amber-950/30 px-3 py-2 text-xs text-amber-900 dark:text-amber-200">
                  <span className="flex items-center gap-1.5">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    This looks like it contains a password. Messages aren't encrypted and are emailed.
                  </span>
                  <div className="flex gap-1.5 shrink-0">
                    {!isRequester && (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs"
                        onClick={() => setSecureDialogOpen(true)}
                      >
                        Use secure request
                      </Button>
                    )}
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="h-7 text-xs"
                      onClick={() => setCredentialWarningAck(true)}
                    >
                      Send anyway
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Controls: Email checkbox & Submit button */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="notify-email"
                  checked={notifyEmail}
                  onCheckedChange={(checked) => setNotifyEmail(Boolean(checked))}
                />
                <label htmlFor="notify-email" className="text-xs text-slate-600 dark:text-zinc-400 cursor-pointer">
                  Send automated email notification
                  <span className="block text-[11px] text-slate-400">
                    {messageType === "REQUEST_INFO"
                      ? `Will email the requester (${request.requester_email || request.requester})`
                      : "Will email the inquiring reviewer & the purchasing associate"}
                  </span>
                </label>
              </div>

              <Button
                type="submit"
                disabled={isSubmitting || !messageText.trim()}
                className="text-xs h-9 px-4 gap-2 bg-sky-600 hover:bg-sky-700 text-white font-medium"
              >
                {isSubmitting ? (
                  <>
                    <div className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <Send className="h-3.5 w-3.5" />
                    <span>
                      {messageType === "REQUEST_INFO"
                        ? "Send Information Request"
                        : messageType === "REPLY"
                        ? "Post Reply & Notify"
                        : "Post Message"}
                    </span>
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </CardContent>

      {!isRequester && (
        <RequestAccountDetailsDialog
          requestId={request.id}
          requesterLabel={request.requester_email || request.requester}
          open={secureDialogOpen}
          onOpenChange={setSecureDialogOpen}
          onCreated={refetch}
        />
      )}
    </Card>
  );
};
export default RequestMessageThread;
