import { FolderKanban, MapPin, Phone, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "../../utils/purchasingMeta";
import { Field } from "../components/Field";
import { AssignedUsersField } from "../components/AssignedUsersField";
import type { RequestDetailViewState } from "../hooks/useRequestDetailTail";

export function TopDetailsGrid({ v }: { v: RequestDetailViewState }) {
  const { request, isRecurring, data, setIsProjectDialogOpen, setQuickProjectValue, canEditRequest, navigate } = v;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-4 gap-x-6 text-sm">
                    <Field label="Requester" value={`${request.requester || "Unknown"}${request.department ? ` (${request.department})` : ""}`} />
                    <AssignedUsersField label="Assigned To" value={request.assigned_user ?? "—"} />
                    <Field
                      label="Group Project"
                      value={
                        request.project_name ? (
                          <div className="flex items-center gap-1.5">
                            <Badge
                              variant="outline"
                              className="text-xs bg-indigo-50/80 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800 cursor-pointer hover:bg-indigo-100 dark:hover:bg-indigo-900/60"
                              onClick={() => navigate(`/purchasing/requests?project=${encodeURIComponent(request.project_name!)}`)}
                              title={`View all requests in project: ${request.project_name}`}
                            >
                              <FolderKanban className="h-3 w-3 mr-1 text-indigo-500" />
                              {request.project_name}
                            </Badge>
                            {canEditRequest && (
                              <button
                                type="button"
                                onClick={() => {
                                  setQuickProjectValue(request.project_name || "");
                                  setIsProjectDialogOpen(true);
                                }}
                                className="text-[11px] text-indigo-600 hover:underline dark:text-indigo-400"
                              >
                                Change
                              </button>
                            )}
                          </div>
                        ) : canEditRequest ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setQuickProjectValue("");
                              setIsProjectDialogOpen(true);
                            }}
                            className="h-6 px-1.5 text-xs text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-950/40 gap-1 font-normal"
                          >
                            <FolderKanban className="h-3 w-3" />
                            <span>+ Add to Project</span>
                          </Button>
                        ) : (
                          <span className="text-slate-400 italic">None</span>
                        )
                      }
                    />

                    <Field label="Requested Date" value={formatDate(request.request_date)} />
                    <Field label="Last Updated" value={formatDate(request.updated_at)} />
                    {(data?.wire_transfer || (request as any)?.wire_transfer || request.request_type === "ACCOUNTS_PAYABLE" || (request as any)?.payment_type) && (
                      <Field
                        label="Payment Type"
                        value={
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-200">
                            {data?.wire_transfer?.category || (data?.wire_transfer as any)?.payment_type || (request as any)?.wire_transfer?.category || (request as any)?.payment_type || "Others"}
                          </span>
                        }
                      />
                    )}
                    {(request.shipping_address || request.phone_number) && (
                      <>
                        {request.shipping_address && (
                          <Field
                            label="Shipping Address"
                            value={
                              <span className="flex items-start gap-1.5 font-medium text-slate-800 dark:text-zinc-200">
                                <MapPin className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                                <span>{request.shipping_address}</span>
                              </span>
                            }
                          />
                        )}
                        {request.phone_number && (
                          <Field
                            label="Contact Phone"
                            value={
                              <span className="flex items-center gap-1.5 font-medium text-slate-800 dark:text-zinc-200">
                                <Phone className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                <span>{request.phone_number}</span>
                              </span>
                            }
                          />
                        )}
                      </>
                    )}
                    {isRecurring && (
                      <Field
                        label="Next Due Date"
                        value={
                          request.due_date ? (
                            <span className="font-semibold text-slate-900 dark:text-zinc-100 flex items-center gap-1.5">
                              <Calendar className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                              {formatDate(request.due_date)}
                            </span>
                          ) : (
                            "—"
                          )
                        }
                      />
                    )}
                  </div>
  );
}
