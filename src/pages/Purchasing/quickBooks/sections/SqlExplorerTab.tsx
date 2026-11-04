import { Loader2, Terminal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { TabsContent } from "@/components/ui/tabs";
import type { QuickBooksState } from "../hooks/useQuickBooks";

export function SqlExplorerTab({ s }: { s: QuickBooksState }) {
  const { queryResult, isQuerying, isConnected, handleExecuteQuery, setQueryInput, queryInput } = s;
  return (
    <TabsContent value="explorer" className="space-y-4 m-0">
          <Card className="border-border/70 shadow-2xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Terminal className="h-4 w-4 text-purple-600" />
                <span>QuickBooks Online API SQL Console</span>
              </CardTitle>
              <CardDescription className="text-xs">
                Run live read queries directly against your connected QuickBooks Online instance.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-muted-foreground mr-1">Quick Queries:</span>
                {[
                  { label: "Chart of Accounts", q: "SELECT * FROM Account MAXRESULTS 20" },
                  { label: "Vendors", q: "SELECT * FROM Vendor MAXRESULTS 20" },
                  { label: "Purchases (Expenses)", q: "SELECT * FROM Purchase MAXRESULTS 20" },
                  { label: "Bills", q: "SELECT * FROM Bill MAXRESULTS 20" },
                  { label: "Bank Accounts", q: "SELECT * FROM Account WHERE AccountType = 'Bank'" },
                  { label: "Departments (Locations)", q: "SELECT * FROM Department MAXRESULTS 20" },
                ].map((chip) => (
                  <Button
                    key={chip.label}
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setQueryInput(chip.q);
                      handleExecuteQuery(chip.q);
                    }}
                    className="h-7 text-[11px] font-mono"
                  >
                    {chip.label}
                  </Button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <Input
                  value={queryInput}
                  onChange={(e) => setQueryInput(e.target.value)}
                  placeholder="e.g. SELECT * FROM Account WHERE AccountType = 'Expense'"
                  className="h-9 text-xs font-mono bg-background"
                />
                <Button
                  onClick={() => handleExecuteQuery()}
                  disabled={isQuerying || !isConnected}
                  className="h-9 text-xs font-semibold gap-1.5 bg-purple-600 hover:bg-purple-500 text-white shadow-xs"
                >
                  {isQuerying ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Terminal className="h-3.5 w-3.5" />}
                  <span>Execute SQL</span>
                </Button>
              </div>

              {queryResult && (
                <div className="mt-4 border rounded-lg bg-zinc-950 text-zinc-100 p-4 font-mono text-xs overflow-x-auto max-h-[400px]">
                  <pre>{JSON.stringify(queryResult, null, 2)}</pre>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
  );
}
