import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Upload, Loader2, TrendingUp, TrendingDown, Zap, AlertTriangle,
  CheckCircle, FileText, BarChart2, ExternalLink, Info, Target
} from "lucide-react";

interface GSCRow {
  keyword: string;
  page: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

interface GSCResult {
  total: number;
  totalClicks: number;
  totalImpressions: number;
  avgPosition: string;
  top20: GSCRow[];
  quickWins: GSCRow[];
  lowCtr: GSCRow[];
  bands: { top3: number; p4to10: number; p11to20: number; p21plus: number };
  isPageReport: boolean;
}

function PositionBadge({ pos }: { pos: number }) {
  const color = pos <= 3 ? "bg-green-100 text-green-700 border-green-300 dark:bg-green-950/30 dark:text-green-400"
              : pos <= 10 ? "bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-950/30 dark:text-blue-400"
              : pos <= 20 ? "bg-yellow-100 text-yellow-700 border-yellow-300 dark:bg-yellow-950/30 dark:text-yellow-400"
              : "bg-muted text-muted-foreground border";
  return <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${color}`}>#{pos.toFixed(1)}</span>;
}

function StatCard({ label, value, sub, icon, color }: { label: string; value: string | number; sub?: string; icon: React.ReactNode; color: string }) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-1">{icon}<span className="text-xs text-muted-foreground font-medium">{label}</span></div>
      <p className={`text-xl font-black ${color}`}>{typeof value === "number" ? value.toLocaleString() : value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
    </Card>
  );
}

export function GSCImporter() {
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GSCResult | null>(null);
  const [fileName, setFileName] = useState("");
  const [activeTab, setActiveTab] = useState<"wins"|"lowctr"|"top">("wins");

  const handleFile = async (file: File) => {
    if (!file.name.endsWith(".csv")) {
      toast({ title: "Please upload a CSV file", variant: "destructive" }); return;
    }
    setFileName(file.name);
    setLoading(true); setResult(null);
    const fd = new FormData();
    fd.append("file", file);
    try {
      const r = await fetch("/api/seo/gsc-import", { method: "POST", body: fd });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setResult(d);
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally { setLoading(false); }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const displayRow = (r: GSCRow, i: number) => (
    <div key={i} className="border rounded-lg p-3 space-y-1.5 hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between gap-2 flex-wrap">
        <p className="font-medium text-sm truncate max-w-[60%]" title={r.keyword}>{r.keyword || r.page}</p>
        <PositionBadge pos={r.position} />
      </div>
      <div className="flex gap-3 text-xs text-muted-foreground flex-wrap">
        <span className="flex items-center gap-1"><TrendingUp className="h-3 w-3 text-blue-400" />{r.clicks.toLocaleString()} clicks</span>
        <span>{r.impressions.toLocaleString()} impr.</span>
        <span className={r.ctr < 2 && r.position <= 10 ? "text-red-500 font-semibold" : ""}>{r.ctr.toFixed(1)}% CTR</span>
        {r.page && <a href={r.page} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-0.5 truncate max-w-[180px]"><ExternalLink className="h-2.5 w-2.5" />{r.page.replace(/^https?:\/\/[^/]+/, "") || "/"}</a>}
      </div>
    </div>
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <Card className="border-primary/20 bg-gradient-to-br from-green-500/5 to-teal-500/5">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingUp className="h-5 w-5 text-green-500" /> Google Search Console Import
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Export your performance data from GSC as CSV, upload it here, and we'll find quick wins,
            low-CTR pages, and ranking band breakdowns.
          </p>
        </CardHeader>
        <CardContent className="pt-0 space-y-4">
          {/* How to export tip */}
          <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800 flex gap-2.5">
            <Info className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
            <div className="text-xs text-blue-700 dark:text-blue-300 space-y-0.5">
              <p className="font-semibold">How to export from Google Search Console:</p>
              <p>Go to <strong>Search Console → Performance → Search Results</strong> → set your date range → click <strong>Export → Download CSV</strong>.</p>
              <p>Works with both the <em>Queries</em> view and the <em>Pages</em> view.</p>
            </div>
          </div>

          {/* Drop zone */}
          <div
            className="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-all"
            onDragOver={e => e.preventDefault()}
            onDrop={onDrop}
            onClick={() => fileRef.current?.click()}
          >
            <Upload className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
            <p className="font-medium text-muted-foreground">
              {fileName ? fileName : "Drop your GSC CSV here, or click to browse"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Supports Queries & Pages reports · Max 10 MB</p>
            <input ref={fileRef} type="file" accept=".csv" className="hidden"
              onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
          </div>

          {loading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Parsing CSV and running analysis…
            </div>
          )}
        </CardContent>
      </Card>

      {result && (
        <div className="space-y-4">
          {/* Stats row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard label="Total keywords" value={result.total} icon={<FileText className="h-4 w-4 text-blue-500" />} color="text-blue-600" />
            <StatCard label="Total clicks"   value={result.totalClicks} icon={<TrendingUp className="h-4 w-4 text-green-500" />} color="text-green-600" />
            <StatCard label="Impressions"    value={result.totalImpressions} icon={<BarChart2 className="h-4 w-4 text-purple-500" />} color="text-purple-600" />
            <StatCard label="Avg. position"  value={`#${result.avgPosition}`} icon={<Target className="h-4 w-4 text-orange-500" />} color="text-orange-600" />
          </div>

          {/* Position band chart */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Ranking Distribution</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-2">
              {[
                { label: "Top 3 (featured)", count: result.bands.top3,    pct: result.total, color: "bg-green-500",  text: "text-green-600" },
                { label: "Positions 4–10",   count: result.bands.p4to10,  pct: result.total, color: "bg-blue-500",   text: "text-blue-600" },
                { label: "Positions 11–20",  count: result.bands.p11to20, pct: result.total, color: "bg-yellow-400", text: "text-yellow-600" },
                { label: "Position 21+",     count: result.bands.p21plus, pct: result.total, color: "bg-muted-foreground/30", text: "text-muted-foreground" },
              ].map(({ label, count, pct, color, text }) => (
                <div key={label} className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground w-36 shrink-0">{label}</span>
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min((count / pct) * 100, 100)}%` }} />
                  </div>
                  <span className={`text-xs font-bold min-w-[48px] text-right ${text}`}>{count.toLocaleString()}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Tab buttons */}
          <div className="flex gap-2 flex-wrap">
            {[
              { key: "wins",   label: `Quick Wins (${result.quickWins.length})`,   icon: <Zap className="h-3.5 w-3.5" />,          desc: "Pos 4–20 with high impressions" },
              { key: "lowctr", label: `Low CTR (${result.lowCtr.length})`,         icon: <AlertTriangle className="h-3.5 w-3.5" />, desc: "Top 10 but CTR under 2%" },
              { key: "top",    label: `Top by Impressions (${result.top20.length})`,icon: <BarChart2 className="h-3.5 w-3.5" />,    desc: "Most visible keywords" },
            ].map(({ key, label, icon }) => (
              <Button key={key} size="sm"
                variant={activeTab === key ? "default" : "outline"}
                onClick={() => setActiveTab(key as any)}
                className="gap-1.5 text-xs">
                {icon}{label}
              </Button>
            ))}
          </div>

          {/* Tab content */}
          {activeTab === "wins" && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                <Zap className="h-4 w-4 text-green-600 shrink-0" />
                <p className="text-xs text-green-700 dark:text-green-300 font-medium">
                  These keywords rank on page 1–2 with decent impressions — a little optimisation can push them to the top 3.
                </p>
              </div>
              {result.quickWins.length === 0
                ? <p className="text-sm text-muted-foreground text-center py-4">No quick wins found — try a broader date range.</p>
                : result.quickWins.map((r, i) => displayRow(r, i))}
            </div>
          )}

          {activeTab === "lowctr" && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <AlertTriangle className="h-4 w-4 text-yellow-600 shrink-0" />
                <p className="text-xs text-yellow-700 dark:text-yellow-300 font-medium">
                  These pages rank in the top 10 but have low click-through rates — better title tags and meta descriptions can fix this.
                </p>
              </div>
              {result.lowCtr.length === 0
                ? <p className="text-sm text-muted-foreground text-center py-4">No low-CTR issues found in top 10.</p>
                : result.lowCtr.map((r, i) => displayRow(r, i))}
            </div>
          )}

          {activeTab === "top" && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <BarChart2 className="h-4 w-4 text-blue-600 shrink-0" />
                <p className="text-xs text-blue-700 dark:text-blue-300 font-medium">
                  Your highest-impression keywords — prioritise these in your content and internal linking strategy.
                </p>
              </div>
              {result.top20.map((r, i) => displayRow(r, i))}
            </div>
          )}
        </div>
      )}

      {!result && !loading && (
        <Card className="border-dashed">
          <CardContent className="p-8 text-center space-y-2">
            <TrendingUp className="h-10 w-10 mx-auto text-muted-foreground/30" />
            <p className="font-medium text-muted-foreground">Upload your Search Console CSV to see keyword insights</p>
            <p className="text-sm text-muted-foreground">Identifies quick wins, low-CTR pages, and ranking distribution — no login required.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
