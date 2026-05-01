import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  FileSearch, Loader2, CheckCircle, XCircle, AlertTriangle,
  Globe, AlignLeft, RefreshCw, Copy, Info
} from "lucide-react";

interface MatchResult {
  text: string;
  score: number;
  matched: boolean;
}

interface MatchResponse {
  results: MatchResult[];
  matchPct: number;
  total: number;
  matched: number;
  pageSentences: string[];
}

function ScoreRing({ pct }: { pct: number }) {
  const color = pct >= 80 ? "#22c55e" : pct >= 50 ? "#f59e0b" : "#ef4444";
  const r = 32; const circ = 2 * Math.PI * r;
  const dash = circ * (1 - pct / 100);
  return (
    <div className="relative w-20 h-20">
      <svg viewBox="0 0 80 80" className="rotate-[-90deg]" width="80" height="80">
        <circle cx="40" cy="40" r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth="7" />
        <circle cx="40" cy="40" r={r} fill="none" stroke={color} strokeWidth="7"
          strokeDasharray={circ} strokeDashoffset={dash} strokeLinecap="round" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-black" style={{ color }}>{pct}%</span>
      </div>
    </div>
  );
}

export function ContentMatchTool() {
  const { toast } = useToast();
  const [url, setUrl] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<MatchResponse | null>(null);
  const [threshold, setThreshold] = useState(0.6);
  const [showPage, setShowPage] = useState(false);
  const textRef = useRef<HTMLTextAreaElement>(null);

  const analyse = async () => {
    if (!url.trim() || !content.trim()) {
      toast({ title: "Enter both a URL and your content", variant: "destructive" }); return;
    }
    setLoading(true); setResult(null);
    try {
      const r = await fetch("/api/seo/content-match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim(), content: content.trim() }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setResult(d);
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally { setLoading(false); }
  };

  const missing = result?.results.filter(r => !r.matched) ?? [];
  const matched = result?.results.filter(r => r.matched) ?? [];

  const copyMissing = () => {
    navigator.clipboard.writeText(missing.map(r => r.text).join("\n\n"));
    toast({ title: "Copied missing content!" });
  };

  return (
    <div className="space-y-5">
      {/* Input */}
      <Card className="border-primary/20 bg-gradient-to-br from-orange-500/5 to-rose-500/5">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileSearch className="h-5 w-5 text-orange-500" /> Content Match Checker
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Enter a page URL and paste your expected content. We'll highlight what's already on the page
            <span className="text-green-600 font-semibold"> (green)</span> and what's missing
            <span className="text-red-500 font-semibold"> (red)</span>.
          </p>
        </CardHeader>
        <CardContent className="pt-0 space-y-4">
          <div className="space-y-1.5">
            <Label className="font-semibold text-sm flex items-center gap-1.5"><Globe className="h-3.5 w-3.5" />Page URL to check</Label>
            <Input
              placeholder="https://example.com/about-us"
              value={url} onChange={e => setUrl(e.target.value)}
              disabled={loading} className="font-mono text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="font-semibold text-sm flex items-center gap-1.5">
              <AlignLeft className="h-3.5 w-3.5" />Your Expected Content
              {content && <Badge variant="secondary" className="text-xs ml-auto">{content.trim().split(/\s+/).length} words</Badge>}
            </Label>
            <Textarea
              ref={textRef}
              placeholder="Paste the content you expect to be on that page — headings, paragraphs, bullet points, key phrases…"
              value={content} onChange={e => setContent(e.target.value)}
              rows={9} className="resize-none text-sm leading-relaxed"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button onClick={analyse} disabled={loading || !url.trim() || !content.trim()} className="gap-2">
              {loading ? <><Loader2 className="h-4 w-4 animate-spin" />Checking…</> : <><FileSearch className="h-4 w-4" />Check Content Match</>}
            </Button>
            {result && (
              <Button variant="outline" onClick={() => { setResult(null); setContent(""); setUrl(""); }} className="gap-1.5">
                <RefreshCw className="h-4 w-4" /> Reset
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {result && (
        <div className="space-y-4">
          {/* Score overview */}
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-6 flex-wrap">
                <ScoreRing pct={result.matchPct} />
                <div className="space-y-1.5 flex-1">
                  <p className="font-bold text-lg">
                    {result.matchPct >= 80 ? "Great content coverage!" : result.matchPct >= 50 ? "Partial match — some content missing" : "Low match — most content is missing from the page"}
                  </p>
                  <div className="flex gap-4 text-sm flex-wrap">
                    <span className="flex items-center gap-1.5 text-green-600"><CheckCircle className="h-4 w-4" />{result.matched} sentences found</span>
                    <span className="flex items-center gap-1.5 text-red-500"><XCircle className="h-4 w-4" />{result.total - result.matched} sentences missing</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    A sentence is "found" when 60%+ of its key words appear on the page.
                  </p>
                </div>
                {missing.length > 0 && (
                  <Button variant="outline" size="sm" onClick={copyMissing} className="gap-1.5 self-start">
                    <Copy className="h-3.5 w-3.5" /> Copy missing
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Diff view */}
          <div className="grid lg:grid-cols-2 gap-4">
            {/* Missing content */}
            <Card className="border-red-200 dark:border-red-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-red-500" />
                  Missing from Page
                  <Badge variant="destructive" className="ml-auto text-xs">{missing.length}</Badge>
                </CardTitle>
                <p className="text-xs text-muted-foreground">These sentences from your content were NOT found on the page.</p>
              </CardHeader>
              <CardContent className="pt-0 max-h-[420px] overflow-y-auto space-y-2 pr-2">
                {missing.length === 0
                  ? <div className="flex flex-col items-center py-6 text-green-600 gap-2"><CheckCircle className="h-8 w-8" /><p className="text-sm font-medium">All content is present!</p></div>
                  : missing.map((r, i) => (
                    <div key={i} className="p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800">
                      <p className="text-sm text-red-700 dark:text-red-300 leading-relaxed">{r.text}</p>
                      <p className="text-[10px] text-red-400 mt-1">{Math.round(r.score * 100)}% word overlap</p>
                    </div>
                  ))}
              </CardContent>
            </Card>

            {/* Matched content */}
            <Card className="border-green-200 dark:border-green-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Found on Page
                  <Badge className="ml-auto text-xs bg-green-600 hover:bg-green-600">{matched.length}</Badge>
                </CardTitle>
                <p className="text-xs text-muted-foreground">These sentences from your content were found on the page.</p>
              </CardHeader>
              <CardContent className="pt-0 max-h-[420px] overflow-y-auto space-y-2 pr-2">
                {matched.length === 0
                  ? <div className="flex flex-col items-center py-6 text-muted-foreground gap-2"><AlertTriangle className="h-8 w-8" /><p className="text-sm">Nothing matched yet.</p></div>
                  : matched.map((r, i) => (
                    <div key={i} className="p-3 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
                      <p className="text-sm text-green-700 dark:text-green-300 leading-relaxed">{r.text}</p>
                      <p className="text-[10px] text-green-500 mt-1">{Math.round(r.score * 100)}% word overlap</p>
                    </div>
                  ))}
              </CardContent>
            </Card>
          </div>

          {/* Page content preview */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Globe className="h-4 w-4 text-blue-500" />
                  Content Found on Page
                  <Badge variant="secondary" className="text-xs">{result.pageSentences.length} elements</Badge>
                </CardTitle>
                <Button variant="ghost" size="sm" className="text-xs" onClick={() => setShowPage(p => !p)}>
                  {showPage ? "Hide" : "Show"} page content
                </Button>
              </div>
            </CardHeader>
            {showPage && (
              <CardContent className="pt-0 max-h-[300px] overflow-y-auto space-y-1.5">
                {result.pageSentences.map((s, i) => (
                  <p key={i} className="text-xs text-muted-foreground p-2 bg-muted/30 rounded border-l-2 border-border">{s}</p>
                ))}
              </CardContent>
            )}
          </Card>

          {/* Tip */}
          <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-800">
            <CardContent className="p-4 flex gap-2.5">
              <Info className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
              <p className="text-xs text-blue-700 dark:text-blue-300">
                <strong>Tip:</strong> Copy the missing sentences and add them to the page. Then re-run the check to confirm they're indexed correctly.
                A score above 80% means your page is well-aligned with the expected content.
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {!result && !loading && (
        <Card className="border-dashed">
          <CardContent className="p-8 text-center space-y-2">
            <FileSearch className="h-10 w-10 mx-auto text-muted-foreground/30" />
            <p className="font-medium text-muted-foreground">Enter a URL and paste your content to check what's missing</p>
            <p className="text-sm text-muted-foreground">Missing content shows in red, matched content in green.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
