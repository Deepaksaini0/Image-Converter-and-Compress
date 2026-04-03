import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, Copy, CheckCircle, AlertTriangle, Tag, FileText, Hash, Loader2, RefreshCw } from "lucide-react";

interface MetaResult {
  title: string;
  description: string;
  keywords: string[];
}

function CharBar({ value, max, good }: { value: number; max: number; good: number }) {
  const pct = Math.min((value / max) * 100, 100);
  const over = value > max;
  const close = value > good && value <= max;
  const color = over ? "bg-red-500" : close ? "bg-yellow-400" : "bg-green-500";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className={`text-xs font-mono font-semibold min-w-[48px] text-right ${over ? "text-red-500" : close ? "text-yellow-600" : "text-green-600"}`}>
        {value}/{max}
      </span>
      {over && <AlertTriangle className="h-3.5 w-3.5 text-red-500" />}
      {!over && value >= 1 && <CheckCircle className="h-3.5 w-3.5 text-green-500" />}
    </div>
  );
}

export function AIMetaTagGenerator() {
  const { toast } = useToast();
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<MetaResult | null>(null);
  const [copiedField, setCopiedField] = useState("");

  const generate = async () => {
    if (!topic.trim()) { toast({ title: "Enter a topic or URL", variant: "destructive" }); return; }
    setLoading(true);
    setResult(null);
    try {
      const r = await fetch("/api/seo/ai-meta-tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: topic.trim() }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setResult(d);
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally { setLoading(false); }
  };

  const copy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(""), 2000);
    toast({ title: "Copied!" });
  };

  const htmlSnippet = result
    ? `<title>${result.title}</title>\n<meta name="description" content="${result.description}">\n<meta name="keywords" content="${result.keywords.join(", ")}">`
    : "";

  return (
    <div className="space-y-5">
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-purple-500/5">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="h-5 w-5 text-primary" /> AI Meta Tag Generator
            <Badge className="text-xs">GPT-5.1</Badge>
          </CardTitle>
          <p className="text-sm text-muted-foreground">Enter a topic, page title, or URL — AI writes an SEO-optimized title tag (≤60 chars), meta description (≤160 chars), and keyword suggestions.</p>
        </CardHeader>
        <CardContent className="pt-0 space-y-4">
          <div className="space-y-1.5">
            <Label className="font-semibold text-sm">Topic, Page Title, or URL</Label>
            <div className="flex gap-3">
              <Input
                placeholder="e.g. Best SEO tools for small businesses  or  https://example.com/about"
                value={topic}
                onChange={e => setTopic(e.target.value)}
                onKeyDown={e => e.key === "Enter" && !loading && generate()}
                disabled={loading}
                className="flex-1"
              />
              {result && (
                <Button variant="outline" size="icon" onClick={() => { setResult(null); setTopic(""); }} title="Reset">
                  <RefreshCw className="h-4 w-4" />
                </Button>
              )}
              <Button onClick={generate} disabled={loading || !topic.trim()} className="gap-2 min-w-[140px]">
                {loading ? <><Loader2 className="h-4 w-4 animate-spin" />Generating…</> : <><Sparkles className="h-4 w-4" />Generate</>}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {result && (
        <div className="space-y-4">
          {/* Title tag */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2"><Tag className="h-4 w-4 text-blue-500" />Title Tag</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => copy(result.title, "title")} className="gap-1.5 h-7 text-xs">
                  {copiedField === "title" ? <CheckCircle className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                  {copiedField === "title" ? "Copied!" : "Copy"}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0 space-y-2">
              <p className="text-base font-semibold text-blue-600 dark:text-blue-400 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">{result.title}</p>
              <CharBar value={result.title.length} max={60} good={50} />
              <p className="text-xs text-muted-foreground">Ideal: 50–60 characters. Keyword should appear near the start.</p>
            </CardContent>
          </Card>

          {/* Meta description */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2"><FileText className="h-4 w-4 text-green-500" />Meta Description</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => copy(result.description, "desc")} className="gap-1.5 h-7 text-xs">
                  {copiedField === "desc" ? <CheckCircle className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                  {copiedField === "desc" ? "Copied!" : "Copy"}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0 space-y-2">
              <p className="text-sm p-3 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800 leading-relaxed">{result.description}</p>
              <CharBar value={result.description.length} max={160} good={140} />
              <p className="text-xs text-muted-foreground">Ideal: 140–160 characters. Include a clear call to action.</p>
            </CardContent>
          </Card>

          {/* Keywords */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2"><Hash className="h-4 w-4 text-purple-500" />Keyword Suggestions</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => copy(result.keywords.join(", "), "kw")} className="gap-1.5 h-7 text-xs">
                  {copiedField === "kw" ? <CheckCircle className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                  {copiedField === "kw" ? "Copied!" : "Copy all"}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex flex-wrap gap-2">
                {result.keywords.map((kw, i) => (
                  <button key={i} onClick={() => copy(kw, `kw-${i}`)}
                    className="px-3 py-1.5 bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-700 rounded-full text-sm font-medium hover:bg-purple-100 transition-colors cursor-pointer">
                    {kw}
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-3">Click any keyword to copy it. Use in your page content, alt text, and headings.</p>
            </CardContent>
          </Card>

          {/* HTML snippet */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2"><Tag className="h-4 w-4 text-muted-foreground" />Ready-to-paste HTML</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => copy(htmlSnippet, "html")} className="gap-1.5 h-7 text-xs">
                  {copiedField === "html" ? <CheckCircle className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                  {copiedField === "html" ? "Copied!" : "Copy HTML"}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <pre className="text-xs font-mono p-4 bg-muted/40 rounded-lg border leading-relaxed whitespace-pre-wrap break-all">{htmlSnippet}</pre>
              <p className="text-xs text-muted-foreground mt-2">Paste this inside the <span className="font-mono">&lt;head&gt;</span> section of your HTML.</p>
            </CardContent>
          </Card>
        </div>
      )}

      {!result && !loading && (
        <Card className="border-dashed">
          <CardContent className="p-8 text-center space-y-2">
            <Sparkles className="h-10 w-10 mx-auto text-muted-foreground/30" />
            <p className="font-medium text-muted-foreground">AI will generate a title tag, meta description, and keywords</p>
            <p className="text-sm text-muted-foreground">Enter any topic, page title, or URL above and click Generate.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
