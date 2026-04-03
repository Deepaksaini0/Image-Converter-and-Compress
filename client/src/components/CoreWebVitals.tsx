import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Zap, Loader2, Monitor, Smartphone, CheckCircle, AlertTriangle, XCircle, Info } from "lucide-react";

interface Vitals {
  score: number; lcp: number; tbt: number; cls: number; fcp: number; si: number; tti: number;
}

interface VitalsResult { mobile: Vitals; desktop: Vitals; }

// Thresholds from Google
const THRESHOLDS = {
  lcp:  { good: 2.5,  poor: 4.0,  unit: "s",  label: "LCP",  name: "Largest Contentful Paint",  desc: "How long until the main content is visible." },
  fcp:  { good: 1.8,  poor: 3.0,  unit: "s",  label: "FCP",  name: "First Contentful Paint",      desc: "How long until first content is painted." },
  tbt:  { good: 200,  poor: 600,  unit: "ms", label: "TBT",  name: "Total Blocking Time",          desc: "Proxy for FID — total time main thread was blocked." },
  cls:  { good: 0.1,  poor: 0.25, unit: "",   label: "CLS",  name: "Cumulative Layout Shift",      desc: "How much the page layout shifts unexpectedly." },
  si:   { good: 3.4,  poor: 5.8,  unit: "s",  label: "SI",   name: "Speed Index",                  desc: "How quickly content is visually populated." },
  tti:  { good: 3.8,  poor: 7.3,  unit: "s",  label: "TTI",  name: "Time to Interactive",           desc: "When the page is fully interactive." },
};

type MetricKey = keyof typeof THRESHOLDS;

function rating(val: number, t: { good: number; poor: number }) {
  if (val <= t.good) return "good";
  if (val <= t.poor) return "needs-improvement";
  return "poor";
}

function RatingBadge({ r }: { r: "good" | "needs-improvement" | "poor" }) {
  if (r === "good")             return <span className="flex items-center gap-1 text-green-600 text-xs font-semibold"><CheckCircle className="h-3.5 w-3.5" />Good</span>;
  if (r === "needs-improvement") return <span className="flex items-center gap-1 text-yellow-600 text-xs font-semibold"><AlertTriangle className="h-3.5 w-3.5" />Needs work</span>;
  return <span className="flex items-center gap-1 text-red-500 text-xs font-semibold"><XCircle className="h-3.5 w-3.5" />Poor</span>;
}

function ScoreRing({ score }: { score: number }) {
  const color = score >= 90 ? "#22c55e" : score >= 50 ? "#f59e0b" : "#ef4444";
  const r = 36; const circ = 2 * Math.PI * r;
  const dash = circ * (1 - score / 100);
  return (
    <div className="relative w-24 h-24 mx-auto">
      <svg viewBox="0 0 88 88" className="rotate-[-90deg]" width="88" height="88">
        <circle cx="44" cy="44" r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
        <circle cx="44" cy="44" r={r} fill="none" stroke={color} strokeWidth="8"
          strokeDasharray={circ} strokeDashoffset={dash} strokeLinecap="round" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-black" style={{ color }}>{score}</span>
        <span className="text-xs text-muted-foreground">/ 100</span>
      </div>
    </div>
  );
}

function MetricCard({ metricKey, value }: { metricKey: MetricKey; value: number }) {
  const t = THRESHOLDS[metricKey];
  const r = rating(value, t);
  const bgColor = r === "good" ? "bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800"
                : r === "needs-improvement" ? "bg-yellow-50 border-yellow-200 dark:bg-yellow-950/20 dark:border-yellow-800"
                : "bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800";
  const display = t.unit === "ms" ? `${value}${t.unit}` : t.unit === "s" ? `${value}${t.unit}` : `${value}`;
  return (
    <div className={`rounded-xl border p-4 ${bgColor}`}>
      <div className="flex items-start justify-between mb-2">
        <div>
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide">{t.label}</span>
          <p className="text-2xl font-black mt-0.5">{display}</p>
        </div>
        <RatingBadge r={r} />
      </div>
      <p className="text-xs font-semibold mb-0.5">{t.name}</p>
      <p className="text-xs text-muted-foreground">{t.desc}</p>
      <div className="mt-2 flex gap-3 text-xs text-muted-foreground">
        <span className="text-green-600 font-medium">Good: ≤{t.good}{t.unit}</span>
        <span className="text-red-500 font-medium">Poor: &gt;{t.poor}{t.unit}</span>
      </div>
    </div>
  );
}

export function CoreWebVitals() {
  const { toast } = useToast();
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VitalsResult | null>(null);
  const [view, setView] = useState<"mobile" | "desktop">("mobile");

  const check = async () => {
    let u = url.trim();
    if (!u) { toast({ title: "Enter a URL", variant: "destructive" }); return; }
    if (!u.startsWith("http")) u = "https://" + u;
    setLoading(true); setResult(null);
    try {
      const r = await fetch(`/api/seo/core-web-vitals?url=${encodeURIComponent(u)}`);
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setResult(d);
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally { setLoading(false); }
  };

  const vitals = result?.[view];

  return (
    <div className="space-y-5">
      <Card className="border-primary/20 bg-gradient-to-br from-orange-500/5 to-yellow-500/5">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Zap className="h-5 w-5 text-yellow-500" /> Core Web Vitals
            <Badge variant="outline" className="text-xs">Google PageSpeed</Badge>
          </CardTitle>
          <p className="text-sm text-muted-foreground">Check LCP, TBT, CLS, FCP, SI, and TTI scores for any URL — the key metrics Google uses to rank pages.</p>
        </CardHeader>
        <CardContent className="pt-0 space-y-4">
          <div className="space-y-1.5">
            <Label className="font-semibold text-sm">Website URL</Label>
            <div className="flex gap-3">
              <Input
                placeholder="https://example.com"
                value={url}
                onChange={e => setUrl(e.target.value)}
                onKeyDown={e => e.key === "Enter" && !loading && check()}
                disabled={loading}
                className="flex-1 font-mono text-sm"
              />
              <Button onClick={check} disabled={loading || !url.trim()} className="gap-2 min-w-[140px]">
                {loading ? <><Loader2 className="h-4 w-4 animate-spin" />Checking…</> : <><Zap className="h-4 w-4" />Check Vitals</>}
              </Button>
            </div>
            {loading && <p className="text-xs text-muted-foreground">Fetching scores from Google PageSpeed Insights — this takes 20–40 seconds…</p>}
          </div>
        </CardContent>
      </Card>

      {result && (
        <>
          {/* Toggle mobile/desktop */}
          <div className="flex gap-2 justify-center">
            {(["mobile", "desktop"] as const).map(s => (
              <Button key={s} variant={view === s ? "default" : "outline"} size="sm"
                onClick={() => setView(s)} className="gap-2">
                {s === "mobile" ? <Smartphone className="h-4 w-4" /> : <Monitor className="h-4 w-4" />}
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </Button>
            ))}
          </div>

          {vitals && (
            <>
              {/* Score ring */}
              <Card className="p-6 text-center space-y-2">
                <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  {view === "mobile" ? "Mobile" : "Desktop"} Performance Score
                </p>
                <ScoreRing score={vitals.score} />
                <p className="text-xs text-muted-foreground">
                  {vitals.score >= 90 ? "Excellent! Your page loads fast." : vitals.score >= 50 ? "Fair — some improvements needed." : "Poor — significant optimisation required."}
                </p>
                <div className="flex justify-center gap-4 text-xs pt-1">
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-green-500 inline-block" />90–100: Good</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-yellow-400 inline-block" />50–89: Needs work</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-500 inline-block" />0–49: Poor</span>
                </div>
              </Card>

              {/* Metrics grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {(Object.keys(THRESHOLDS) as MetricKey[]).map(k => (
                  <MetricCard key={k} metricKey={k} value={vitals[k as keyof Vitals] as number} />
                ))}
              </div>

              <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-800">
                <CardContent className="p-4 flex gap-3">
                  <Info className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    <strong>Note:</strong> TBT (Total Blocking Time) is used as a lab proxy for FID (First Input Delay). Real FID can only be measured with field data. Scores are fetched from the Google PageSpeed Insights API.
                  </p>
                </CardContent>
              </Card>
            </>
          )}
        </>
      )}

      {!result && !loading && (
        <Card className="border-dashed">
          <CardContent className="p-8 text-center space-y-2">
            <Zap className="h-10 w-10 mx-auto text-muted-foreground/30" />
            <p className="font-medium text-muted-foreground">Enter any public URL to check its Core Web Vitals</p>
            <p className="text-sm text-muted-foreground">Results come directly from Google's PageSpeed Insights — the same scores Google uses for ranking.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
