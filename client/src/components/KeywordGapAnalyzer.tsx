import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Search, Loader2, Globe, TrendingUp, Lightbulb, CheckCircle,
  AlertTriangle, ArrowRight, Zap, Target, BarChart2
} from "lucide-react";

interface GapItem {
  keyword: string;
  competitorPages: number;
  opportunity: string;
  difficulty: "Low" | "Medium" | "High";
  intent: "Informational" | "Commercial" | "Transactional";
}

interface GapResult {
  siteA: { domain: string; topTopics: string[] };
  siteB: { domain: string; topTopics: string[] };
  gaps: GapItem[];
  sharedTopics: string[];
  quickWins: string[];
  summary: string;
}

const DIFFICULTY_COLORS: Record<string, string> = {
  Low:    "bg-green-100 text-green-700 border-green-300 dark:bg-green-950/30 dark:text-green-400 dark:border-green-700",
  Medium: "bg-yellow-100 text-yellow-700 border-yellow-300 dark:bg-yellow-950/30 dark:text-yellow-400 dark:border-yellow-700",
  High:   "bg-red-100 text-red-700 border-red-300 dark:bg-red-950/30 dark:text-red-400 dark:border-red-700",
};

const INTENT_COLORS: Record<string, string> = {
  Informational:  "bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-950/30 dark:text-blue-400",
  Commercial:     "bg-purple-100 text-purple-700 border-purple-300 dark:bg-purple-950/30 dark:text-purple-400",
  Transactional:  "bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-950/30 dark:text-orange-400",
};

export function KeywordGapAnalyzer() {
  const { toast } = useToast();
  const [domain1, setDomain1] = useState("");
  const [domain2, setDomain2] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GapResult | null>(null);
  const [phase, setPhase] = useState("");

  const analyse = async () => {
    if (!domain1.trim() || !domain2.trim()) {
      toast({ title: "Enter both domains", variant: "destructive" }); return;
    }
    setLoading(true); setResult(null);
    setPhase("Crawling both websites…");
    setTimeout(() => setPhase("Extracting headings & keywords…"), 6000);
    setTimeout(() => setPhase("AI is analysing keyword gaps…"), 14000);

    try {
      const r = await fetch("/api/seo/keyword-gap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain1: domain1.trim(), domain2: domain2.trim() }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setResult(d);
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally { setLoading(false); setPhase(""); }
  };

  const displayDomain = (d: string) => d.replace(/^https?:\/\//, "").replace(/\/$/, "");

  return (
    <div className="space-y-5">
      {/* Input card */}
      <Card className="border-primary/20 bg-gradient-to-br from-purple-500/5 to-blue-500/5">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <BarChart2 className="h-5 w-5 text-purple-500" /> Competitor Keyword Gap
            <Badge className="text-xs">AI-powered</Badge>
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Enter your domain and a competitor's — we crawl both sites, extract topics and headings,
            then AI identifies what keywords your competitor covers that you don't.
          </p>
        </CardHeader>
        <CardContent className="pt-0 space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="font-semibold text-sm flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-blue-500 text-white text-[10px] flex items-center justify-center font-bold">A</span>
                Your Domain
              </Label>
              <Input placeholder="https://yoursite.com" value={domain1}
                onChange={e => setDomain1(e.target.value)} disabled={loading} className="font-mono text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="font-semibold text-sm flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-bold">B</span>
                Competitor's Domain
              </Label>
              <Input placeholder="https://competitor.com" value={domain2}
                onChange={e => setDomain2(e.target.value)} disabled={loading} className="font-mono text-sm" />
            </div>
          </div>
          <Button onClick={analyse} disabled={loading || !domain1.trim() || !domain2.trim()} className="gap-2">
            {loading
              ? <><Loader2 className="h-4 w-4 animate-spin" />{phase || "Analysing…"}</>
              : <><Search className="h-4 w-4" />Analyse Keyword Gap</>}
          </Button>
          {loading && (
            <p className="text-xs text-muted-foreground">This takes 30–60 seconds — we're crawling both sites and running AI analysis.</p>
          )}
        </CardContent>
      </Card>

      {result && (
        <div className="space-y-4">
          {/* Summary */}
          <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-800">
            <CardContent className="p-4 flex gap-3">
              <Lightbulb className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-1">Analysis Summary</p>
                <p className="text-sm text-blue-700 dark:text-blue-400">{result.summary}</p>
              </div>
            </CardContent>
          </Card>

          {/* Topic overview — side by side */}
          <div className="grid sm:grid-cols-2 gap-3">
            {[
              { site: result.siteA, color: "blue",  label: "A", title: "Your Site Topics" },
              { site: result.siteB, color: "red",   label: "B", title: "Competitor Topics" },
            ].map(({ site, color, label, title }) => (
              <Card key={label}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <span className={`w-5 h-5 rounded-full bg-${color}-500 text-white text-[10px] flex items-center justify-center font-bold`}>{label}</span>
                    <span className="truncate">{displayDomain(site.domain)}</span>
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">{title}</p>
                </CardHeader>
                <CardContent className="pt-0 flex flex-wrap gap-1.5">
                  {site.topTopics.map((t, i) => (
                    <span key={i} className="px-2 py-1 bg-muted rounded-full text-xs font-medium">{t}</span>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Keyword gaps — the main result */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Target className="h-4 w-4 text-red-500" />
                Keyword Gaps — {result.gaps.length} opportunities
                <Badge variant="destructive" className="text-xs ml-auto">{result.siteB.domain.replace(/^https?:\/\//,"").split("/")[0]} covers these, you don't</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
              {result.gaps.map((g, i) => (
                <div key={i} className="border rounded-lg p-4 space-y-2 hover:shadow-sm transition-shadow">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-muted-foreground">#{i + 1}</span>
                      <span className="font-semibold text-sm">{g.keyword}</span>
                    </div>
                    <div className="flex gap-1.5 flex-wrap">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${DIFFICULTY_COLORS[g.difficulty] || ""}`}>
                        {g.difficulty} difficulty
                      </span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${INTENT_COLORS[g.intent] || ""}`}>
                        {g.intent}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{g.opportunity}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Quick wins */}
          <Card className="border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Zap className="h-4 w-4 text-green-600" /> Quick Wins & Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-2">
              {result.quickWins.map((w, i) => (
                <div key={i} className="flex gap-2.5 items-start">
                  <CheckCircle className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                  <p className="text-sm text-green-800 dark:text-green-300">{w}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Shared topics */}
          {result.sharedTopics.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-blue-500" /> Topics Both Sites Cover
                </CardTitle>
                <p className="text-xs text-muted-foreground">These are already in your content strategy — make sure they're stronger than your competitor's.</p>
              </CardHeader>
              <CardContent className="pt-0 flex flex-wrap gap-2">
                {result.sharedTopics.map((t, i) => (
                  <span key={i} className="px-3 py-1 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 rounded-full text-xs font-medium">{t}</span>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {!result && !loading && (
        <Card className="border-dashed">
          <CardContent className="p-8 text-center space-y-2">
            <BarChart2 className="h-10 w-10 mx-auto text-muted-foreground/30" />
            <p className="font-medium text-muted-foreground">Enter two domains to discover keyword gaps</p>
            <p className="text-sm text-muted-foreground">We crawl both sites and use AI to find topics your competitor covers that you're missing.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
