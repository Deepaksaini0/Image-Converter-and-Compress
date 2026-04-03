import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { FileText, Loader2, Globe, AlignLeft, Clock, CheckCircle, AlertTriangle, XCircle } from "lucide-react";

interface WordCountResult {
  wordCount: number;
  sentences: number;
  paragraphs: number;
  charCount: number;
  readingTime: number;
  recommendations: Record<string, { min: number; max: number; label: string }>;
}

const PAGE_TYPES = [
  { key: "blog",     icon: "📝", color: "blue" },
  { key: "landing",  icon: "🎯", color: "green" },
  { key: "product",  icon: "🛍️", color: "purple" },
  { key: "homepage", icon: "🏠", color: "orange" },
];

function statusForCount(count: number, min: number, max: number): "good" | "low" | "high" {
  if (count >= min && count <= max) return "good";
  if (count < min) return "low";
  return "high";
}

function StatusIcon({ s }: { s: "good" | "low" | "high" }) {
  if (s === "good") return <CheckCircle className="h-4 w-4 text-green-500" />;
  if (s === "low")  return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
  return <XCircle className="h-4 w-4 text-red-500" />;
}

export function WordCountChecker() {
  const { toast } = useToast();
  const [mode, setMode] = useState<"url" | "text">("text");
  const [urlInput, setUrlInput] = useState("");
  const [textInput, setTextInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<WordCountResult | null>(null);

  const analyse = async () => {
    const hasUrl = mode === "url" && urlInput.trim();
    const hasText = mode === "text" && textInput.trim();
    if (!hasUrl && !hasText) { toast({ title: "Enter a URL or paste text", variant: "destructive" }); return; }

    setLoading(true); setResult(null);
    try {
      const body = mode === "url" ? { url: urlInput.trim() } : { text: textInput.trim() };
      const r = await fetch("/api/seo/word-count", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setResult(d);
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally { setLoading(false); }
  };

  // Live word count for text mode
  const liveCount = textInput.trim() ? (textInput.match(/\b\w+\b/g) || []).length : 0;

  return (
    <div className="space-y-5">
      <Card className="border-primary/20 bg-gradient-to-br from-blue-500/5 to-cyan-500/5">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileText className="h-5 w-5 text-blue-500" /> Word Count Checker
          </CardTitle>
          <p className="text-sm text-muted-foreground">Paste text or enter a URL — get word count, reading time, and recommendations by page type.</p>
        </CardHeader>
        <CardContent className="pt-0 space-y-4">
          {/* Mode toggle */}
          <div className="flex gap-2">
            <Button size="sm" variant={mode === "text" ? "default" : "outline"} onClick={() => setMode("text")} className="gap-1.5">
              <AlignLeft className="h-3.5 w-3.5" /> Paste Text
            </Button>
            <Button size="sm" variant={mode === "url" ? "default" : "outline"} onClick={() => setMode("url")} className="gap-1.5">
              <Globe className="h-3.5 w-3.5" /> Fetch URL
            </Button>
          </div>

          {mode === "text" ? (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="font-semibold text-sm">Paste Your Content</Label>
                {liveCount > 0 && <Badge variant="secondary" className="text-xs">{liveCount} words</Badge>}
              </div>
              <Textarea
                placeholder="Paste your page content here…"
                value={textInput}
                onChange={e => setTextInput(e.target.value)}
                rows={8}
                className="resize-none text-sm"
              />
            </div>
          ) : (
            <div className="space-y-1.5">
              <Label className="font-semibold text-sm">Page URL</Label>
              <Input
                placeholder="https://example.com/blog/my-post"
                value={urlInput}
                onChange={e => setUrlInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && !loading && analyse()}
                disabled={loading}
                className="font-mono text-sm"
              />
            </div>
          )}

          <Button onClick={analyse} disabled={loading || (mode === "text" ? !textInput.trim() : !urlInput.trim())} className="gap-2 w-full sm:w-auto">
            {loading ? <><Loader2 className="h-4 w-4 animate-spin" />Analysing…</> : <><FileText className="h-4 w-4" />Analyse</>}
          </Button>
        </CardContent>
      </Card>

      {result && (
        <div className="space-y-4">
          {/* Stats row */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { label: "Words",       value: result.wordCount.toLocaleString(),  icon: <FileText className="h-4 w-4 text-blue-500" />,   color: "text-blue-600" },
              { label: "Sentences",   value: result.sentences.toLocaleString(),   icon: <AlignLeft className="h-4 w-4 text-green-500" />,  color: "text-green-600" },
              { label: "Paragraphs",  value: result.paragraphs.toLocaleString(),  icon: <AlignLeft className="h-4 w-4 text-purple-500" />, color: "text-purple-600" },
              { label: "Characters",  value: result.charCount.toLocaleString(),   icon: <FileText className="h-4 w-4 text-orange-500" />,  color: "text-orange-600" },
              { label: "Read time",   value: `${result.readingTime} min`,         icon: <Clock className="h-4 w-4 text-pink-500" />,       color: "text-pink-600" },
            ].map(({ label, value, icon, color }) => (
              <Card key={label} className="p-4">
                <div className="flex items-center gap-2 mb-1">{icon}<span className="text-xs text-muted-foreground font-medium">{label}</span></div>
                <p className={`text-xl font-black ${color}`}>{value}</p>
              </Card>
            ))}
          </div>

          {/* Page type recommendations */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Recommended Length by Page Type</CardTitle>
              <p className="text-xs text-muted-foreground">Your content has <strong>{result.wordCount.toLocaleString()} words</strong>. See how it compares for each page type:</p>
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
              {PAGE_TYPES.map(({ key, icon }) => {
                const rec = result.recommendations[key];
                const s = statusForCount(result.wordCount, rec.min, rec.max);
                const pct = Math.min((result.wordCount / rec.max) * 100, 110);
                const barColor = s === "good" ? "bg-green-500" : s === "low" ? "bg-yellow-400" : "bg-red-400";
                const msg = s === "good" ? "Perfect length" : s === "low" ? `Add ${rec.min - result.wordCount}+ words` : `${result.wordCount - rec.max} words over ideal`;
                return (
                  <div key={key} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <StatusIcon s={s} />
                        <span className="font-medium">{icon} {rec.label}</span>
                        <span className="text-xs text-muted-foreground">({rec.min}–{rec.max} words)</span>
                      </div>
                      <span className={`text-xs font-semibold ${s === "good" ? "text-green-600" : s === "low" ? "text-yellow-600" : "text-red-500"}`}>{msg}</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Tips */}
          <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-800">
            <CardContent className="p-4 space-y-1.5">
              <p className="text-xs font-semibold text-blue-700 dark:text-blue-300">Content Tips</p>
              <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1 list-disc list-inside">
                <li>Aim for 1 sentence every 20–25 words for readability.</li>
                <li>Use short paragraphs (3–5 sentences) to improve scan-ability.</li>
                <li>Blog posts over 1,500 words tend to rank higher and earn more backlinks.</li>
                <li>Product pages under 1,000 words convert better — keep them concise.</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      )}

      {!result && !loading && (
        <Card className="border-dashed">
          <CardContent className="p-8 text-center space-y-2">
            <FileText className="h-10 w-10 mx-auto text-muted-foreground/30" />
            <p className="font-medium text-muted-foreground">Paste content or enter a URL to analyse word count</p>
            <p className="text-sm text-muted-foreground">Get word count, reading time, and ideal length recommendations by page type.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
