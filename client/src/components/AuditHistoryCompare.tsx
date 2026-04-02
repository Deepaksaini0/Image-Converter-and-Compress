import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import {
  CheckCircle, XCircle, AlertTriangle, TrendingUp, TrendingDown,
  Minus, Search, RefreshCw, BarChart3, GitCompare, Clock, Globe,
  Loader2, ArrowUpRight, ArrowDownRight, ChevronRight
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine
} from "recharts";

interface HistoryRow {
  id: number;
  url: string;
  domain: string;
  score: number;
  pageCount: number;
  createdAt: string;
}

interface PageAuditItem {
  name: string;
  status: "pass" | "warning" | "fail";
  message: string;
  severity: string;
}

interface PageAudit {
  url: string;
  score: number;
  checks: { category: string; items: PageAuditItem[] }[];
}

interface SnapshotDetail extends HistoryRow {
  pages: PageAudit[];
}

function scoreColor(s: number) {
  return s >= 80 ? "text-green-600" : s >= 60 ? "text-yellow-600" : "text-red-600";
}
function scoreBg(s: number) {
  return s >= 80 ? "bg-green-50 border-green-200" : s >= 60 ? "bg-yellow-50 border-yellow-200" : "bg-red-50 border-red-200";
}
function diffColor(diff: number) {
  if (diff > 0) return "text-green-600";
  if (diff < 0) return "text-red-500";
  return "text-muted-foreground";
}
function DiffIcon({ diff }: { diff: number }) {
  if (diff > 0) return <ArrowUpRight className="h-4 w-4 text-green-600" />;
  if (diff < 0) return <ArrowDownRight className="h-4 w-4 text-red-500" />;
  return <Minus className="h-4 w-4 text-muted-foreground" />;
}

export function AuditHistoryCompare() {
  const { toast } = useToast();
  const [domainInput, setDomainInput] = useState("");
  const [loadedDomain, setLoadedDomain] = useState("");
  const [history, setHistory] = useState<HistoryRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<number[]>([]);
  const [snapA, setSnapA] = useState<SnapshotDetail | null>(null);
  const [snapB, setSnapB] = useState<SnapshotDetail | null>(null);
  const [comparing, setComparing] = useState(false);

  const loadHistory = async () => {
    const raw = domainInput.trim().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
    if (!raw) return;
    setLoading(true);
    setHistory([]);
    setSelected([]);
    setSnapA(null);
    setSnapB(null);
    try {
      const r = await fetch(`/api/seo/audit-history?domain=${encodeURIComponent(raw)}`);
      const d = await r.json();
      if (d.error) throw new Error(d.error);
      setHistory(d.history);
      setLoadedDomain(raw);
      if (!d.history.length) toast({ title: "No audits found", description: `No audit history for ${raw} yet.` });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally { setLoading(false); }
  };

  const fetchSnap = async (id: number): Promise<SnapshotDetail | null> => {
    const r = await fetch(`/api/seo/audit-snapshot/${id}`);
    const d = await r.json();
    if (d.error) throw new Error(d.error);
    return d;
  };

  const runCompare = async () => {
    if (selected.length !== 2) return;
    setComparing(true);
    try {
      const [a, b] = await Promise.all([fetchSnap(selected[0]), fetchSnap(selected[1])]);
      // newer = B, older = A
      const aDate = new Date(a!.createdAt);
      const bDate = new Date(b!.createdAt);
      if (aDate > bDate) { setSnapA(b); setSnapB(a); }
      else { setSnapA(a); setSnapB(b); }
    } catch (e: any) {
      toast({ title: "Error loading snapshots", description: e.message, variant: "destructive" });
    } finally { setComparing(false); }
  };

  const toggleSelect = (id: number) => {
    setSelected(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id);
      if (prev.length >= 2) return [prev[1], id];
      return [...prev, id];
    });
    setSnapA(null); setSnapB(null);
  };

  const chartData = [...history].reverse().map(r => ({
    date: new Date(r.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    score: r.score,
    pages: r.pageCount,
  }));

  // ── category-level compare ──
  const compareCategories = () => {
    if (!snapA || !snapB) return [];
    const catMap: Record<string, { aPass: number; aTotal: number; bPass: number; bTotal: number }> = {};
    const accum = (pages: PageAudit[], key: "a" | "b") => {
      pages.forEach(p => p.checks.forEach(c => {
        if (!catMap[c.category]) catMap[c.category] = { aPass: 0, aTotal: 0, bPass: 0, bTotal: 0 };
        c.items.forEach(it => {
          catMap[c.category][key === "a" ? "aTotal" : "bTotal"]++;
          if (it.status === "pass") catMap[c.category][key === "a" ? "aPass" : "bPass"]++;
        });
      }));
    };
    accum(snapA.pages, "a");
    accum(snapB.pages, "b");
    return Object.entries(catMap).map(([cat, v]) => {
      const aPct = v.aTotal ? Math.round((v.aPass / v.aTotal) * 100) : 0;
      const bPct = v.bTotal ? Math.round((v.bPass / v.bTotal) * 100) : 0;
      return { cat, aPct, bPct, diff: bPct - aPct };
    });
  };

  const catComparison = compareCategories();

  return (
    <div className="space-y-6">
      {/* Domain lookup */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Clock className="h-5 w-5 text-primary" /> Audit History &amp; Compare
          </CardTitle>
          <p className="text-sm text-muted-foreground">Every time you run a Site Audit, the result is saved automatically. Load your domain to see all past audits and compare any two.</p>
        </CardHeader>
        <CardContent className="p-6 pt-2">
          <div className="flex gap-3">
            <Input
              placeholder="example.com or https://example.com"
              value={domainInput}
              onChange={(e) => setDomainInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && loadHistory()}
              className="flex-1"
            />
            <Button onClick={loadHistory} disabled={loading || !domainInput.trim()} className="min-w-[130px]">
              {loading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Loading...</> : <><Search className="h-4 w-4 mr-2" />Load History</>}
            </Button>
          </div>
        </CardContent>
      </Card>

      {history.length > 0 && (
        <>
          {/* Score trend chart */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" />
                Score Trend — <span className="font-mono text-primary">{loadedDomain}</span>
                <Badge variant="outline" className="text-xs">{history.length} audits</Badge>
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={loadHistory} className="gap-1 text-xs">
                <RefreshCw className="h-3 w-3" />Refresh
              </Button>
            </CardHeader>
            <CardContent>
              {chartData.length >= 2 ? (
                <div className="h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 8, right: 10, bottom: 0, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `${v}`} />
                      <Tooltip
                        contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }}
                        formatter={(v: any, name: string) => [name === "score" ? `${v}/100` : `${v} pages`, name === "score" ? "SEO Score" : "Pages"]}
                      />
                      <ReferenceLine y={80} stroke="#22c55e" strokeDasharray="4 2" label={{ value: "Good", fill: "#22c55e", fontSize: 10 }} />
                      <ReferenceLine y={60} stroke="#f59e0b" strokeDasharray="4 2" label={{ value: "Fair", fill: "#f59e0b", fontSize: 10 }} />
                      <Line type="monotone" dataKey="score" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={{ r: 5, fill: "hsl(var(--primary))" }} activeDot={{ r: 7 }} name="score" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-24 flex items-center justify-center text-muted-foreground text-sm">Run at least 2 audits to see the trend chart.</div>
              )}
            </CardContent>
          </Card>

          {/* History table */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base">
                All Snapshots
                {selected.length > 0 && <span className="text-primary text-sm font-normal ml-2">({selected.length}/2 selected)</span>}
              </CardTitle>
              <Button
                onClick={runCompare}
                disabled={selected.length !== 2 || comparing}
                className="gap-2 text-sm"
              >
                {comparing ? <Loader2 className="h-4 w-4 animate-spin" /> : <GitCompare className="h-4 w-4" />}
                Compare Selected
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-72">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-muted/80 backdrop-blur-sm">
                    <tr className="border-b">
                      <th className="text-left p-3 font-semibold w-10">Pick</th>
                      <th className="text-left p-3 font-semibold">Date</th>
                      <th className="text-left p-3 font-semibold">URL Audited</th>
                      <th className="text-center p-3 font-semibold">Pages</th>
                      <th className="text-center p-3 font-semibold">Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((row, i) => {
                      const isSelected = selected.includes(row.id);
                      const scoreChange = i < history.length - 1 ? row.score - history[i + 1].score : null;
                      return (
                        <tr
                          key={row.id}
                          className={`border-b last:border-0 cursor-pointer transition-colors ${isSelected ? "bg-primary/10 border-l-2 border-l-primary" : "hover:bg-muted/30"}`}
                          onClick={() => toggleSelect(row.id)}
                        >
                          <td className="p-3">
                            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${isSelected ? "bg-primary border-primary" : "border-muted-foreground/30"}`}>
                              {isSelected && <CheckCircle className="h-3.5 w-3.5 text-white" />}
                            </div>
                          </td>
                          <td className="p-3 text-muted-foreground text-xs whitespace-nowrap">
                            {new Date(row.createdAt).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                          </td>
                          <td className="p-3 text-xs text-primary truncate max-w-[200px]">{row.url}</td>
                          <td className="p-3 text-center font-mono text-sm">{row.pageCount}</td>
                          <td className="p-3 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <span className={`font-black text-lg ${scoreColor(row.score)}`}>{row.score}</span>
                              {scoreChange !== null && (
                                <span className={`text-xs font-semibold flex items-center gap-0.5 ${diffColor(scoreChange)}`}>
                                  <DiffIcon diff={scoreChange} />
                                  {scoreChange > 0 ? `+${scoreChange}` : scoreChange}
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </ScrollArea>
              <div className="p-3 border-t bg-muted/20 text-xs text-muted-foreground text-center">
                Click any two rows to select them, then click Compare. Newest audits are shown first.
              </div>
            </CardContent>
          </Card>

          {/* Side-by-side comparison */}
          {snapA && snapB && (
            <div className="space-y-6">
              {/* Header cards */}
              <div className="grid grid-cols-2 gap-4">
                {[{ snap: snapA, label: "Earlier" }, { snap: snapB, label: "Later" }].map(({ snap, label }) => (
                  <Card key={snap.id} className={`p-5 ${scoreBg(snap.score)}`}>
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="outline" className="text-xs">{label}</Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(snap.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </span>
                    </div>
                    <p className={`text-5xl font-black ${scoreColor(snap.score)}`}>{snap.score}<span className="text-lg font-normal">/100</span></p>
                    <p className="text-xs text-muted-foreground mt-1 truncate">{snap.url}</p>
                    <p className="text-xs text-muted-foreground">{snap.pageCount} pages audited</p>
                  </Card>
                ))}
              </div>

              {/* Overall change banner */}
              <Card className={`p-5 border-2 ${snapB.score - snapA.score > 0 ? "border-green-300 bg-green-50" : snapB.score - snapA.score < 0 ? "border-red-300 bg-red-50" : "border-muted"}`}>
                <div className="flex items-center gap-4">
                  <DiffIcon diff={snapB.score - snapA.score} />
                  <div>
                    <p className={`text-2xl font-black ${diffColor(snapB.score - snapA.score)}`}>
                      {snapB.score - snapA.score > 0 ? `+${snapB.score - snapA.score}` : snapB.score - snapA.score} points
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Score changed from <strong>{snapA.score}</strong> → <strong>{snapB.score}</strong> between these two audits
                    </p>
                  </div>
                </div>
              </Card>

              {/* Category breakdown */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <GitCompare className="h-4 w-4 text-primary" /> Category Comparison
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 pt-2 space-y-3">
                  {catComparison.map(({ cat, aPct, bPct, diff }) => (
                    <div key={cat} className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{cat}</span>
                        <div className="flex items-center gap-3 text-xs">
                          <span className="text-muted-foreground">{aPct}%</span>
                          <ChevronRight className="h-3 w-3 text-muted-foreground" />
                          <span className={`font-bold ${scoreColor(bPct)}`}>{bPct}%</span>
                          <span className={`flex items-center gap-0.5 font-semibold ${diffColor(diff)}`}>
                            <DiffIcon diff={diff} />
                            {diff > 0 ? `+${diff}` : diff}%
                          </span>
                        </div>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden relative">
                        <div className="h-full bg-muted-foreground/30 rounded-full" style={{ width: `${aPct}%` }} />
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden relative -mt-1">
                        <div
                          className={`h-full rounded-full transition-all ${bPct >= aPct ? "bg-green-500" : "bg-red-400"}`}
                          style={{ width: `${bPct}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Page-level comparison */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Page-Level Scores</CardTitle>
                  <p className="text-xs text-muted-foreground">Pages present in both audits, sorted by biggest change</p>
                </CardHeader>
                <CardContent className="p-0">
                  <ScrollArea className="h-80">
                    <table className="w-full text-sm">
                      <thead className="sticky top-0 bg-muted/80 backdrop-blur-sm">
                        <tr className="border-b">
                          <th className="text-left p-3 font-semibold">Page URL</th>
                          <th className="text-center p-3 font-semibold w-20">Earlier</th>
                          <th className="text-center p-3 font-semibold w-20">Later</th>
                          <th className="text-center p-3 font-semibold w-20">Change</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(() => {
                          const aMap = Object.fromEntries(snapA.pages.map(p => [p.url, p.score]));
                          const bMap = Object.fromEntries(snapB.pages.map(p => [p.url, p.score]));
                          const allUrls = Array.from(new Set([...Object.keys(aMap), ...Object.keys(bMap)]));
                          return allUrls
                            .map(url => ({ url, a: aMap[url] ?? null, b: bMap[url] ?? null, diff: (bMap[url] ?? 0) - (aMap[url] ?? 0) }))
                            .sort((x, y) => Math.abs(y.diff) - Math.abs(x.diff))
                            .map(({ url, a, b, diff }) => (
                              <tr key={url} className="border-b last:border-0 hover:bg-muted/20">
                                <td className="p-3 text-xs text-primary truncate max-w-[280px]">{url}</td>
                                <td className="p-3 text-center">
                                  {a !== null ? <span className={`font-bold ${scoreColor(a)}`}>{a}%</span> : <span className="text-muted-foreground text-xs">New</span>}
                                </td>
                                <td className="p-3 text-center">
                                  {b !== null ? <span className={`font-bold ${scoreColor(b)}`}>{b}%</span> : <span className="text-muted-foreground text-xs">Removed</span>}
                                </td>
                                <td className="p-3 text-center">
                                  <span className={`flex items-center justify-center gap-0.5 font-semibold text-sm ${diffColor(diff)}`}>
                                    <DiffIcon diff={diff} />
                                    {diff > 0 ? `+${diff}` : diff !== 0 ? diff : "—"}
                                  </span>
                                </td>
                              </tr>
                            ));
                        })()}
                      </tbody>
                    </table>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          )}
        </>
      )}

      {!loading && history.length === 0 && loadedDomain && (
        <Card className="p-10 text-center text-muted-foreground space-y-2">
          <Globe className="h-10 w-10 mx-auto text-muted-foreground/30" />
          <p className="font-medium">No audit history found for <span className="text-primary">{loadedDomain}</span></p>
          <p className="text-sm">Run a Site Audit first — every audit is automatically saved.</p>
        </Card>
      )}

      {!loadedDomain && (
        <Card className="p-10 text-center text-muted-foreground space-y-2">
          <BarChart3 className="h-10 w-10 mx-auto text-muted-foreground/30" />
          <p className="font-medium">Enter your domain above to load audit history</p>
          <p className="text-sm">Every Site Audit you run is saved and available for trend analysis and comparison.</p>
        </Card>
      )}
    </div>
  );
}
