import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Link2, Loader2, Copy, CheckCircle, Sparkles, RefreshCw } from "lucide-react";

interface SlugResult {
  label: string;
  slug: string;
}

export function URLSlugGenerator() {
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [slugs, setSlugs] = useState<SlugResult[]>([]);
  const [copied, setCopied] = useState("");
  const [baseUrl, setBaseUrl] = useState("https://example.com");

  const generate = async () => {
    if (!title.trim()) { toast({ title: "Enter a blog post title", variant: "destructive" }); return; }
    setLoading(true); setSlugs([]);
    try {
      const r = await fetch("/api/seo/slug-generator", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim() }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setSlugs(d.slugs);
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally { setLoading(false); }
  };

  const copy = (slug: string) => {
    const full = `${baseUrl.replace(/\/$/, "")}/${slug}`;
    navigator.clipboard.writeText(full);
    setCopied(slug);
    setTimeout(() => setCopied(""), 2000);
    toast({ title: "Copied!", description: full });
  };

  const copySlug = (slug: string) => {
    navigator.clipboard.writeText(slug);
    setCopied(slug + "-slug");
    setTimeout(() => setCopied(""), 2000);
    toast({ title: "Slug copied!" });
  };

  const cleanBase = baseUrl.replace(/\/$/, "");

  return (
    <div className="space-y-5">
      <Card className="border-primary/20 bg-gradient-to-br from-green-500/5 to-teal-500/5">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Link2 className="h-5 w-5 text-green-500" /> URL Slug Generator
          </CardTitle>
          <p className="text-sm text-muted-foreground">Type your blog post or page title — get 5 SEO-friendly slug variations with the primary keyword front-loaded.</p>
        </CardHeader>
        <CardContent className="pt-0 space-y-4">
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="font-semibold text-sm">Page / Post Title</Label>
              <Input
                placeholder="e.g. 10 Best SEO Tools for Small Businesses in 2026"
                value={title}
                onChange={e => setTitle(e.target.value)}
                onKeyDown={e => e.key === "Enter" && !loading && generate()}
                disabled={loading}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="font-semibold text-sm">Base URL (optional)</Label>
              <Input
                placeholder="https://example.com"
                value={baseUrl}
                onChange={e => setBaseUrl(e.target.value)}
                className="font-mono text-sm"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={generate} disabled={loading || !title.trim()} className="gap-2">
              {loading ? <><Loader2 className="h-4 w-4 animate-spin" />Generating…</> : <><Sparkles className="h-4 w-4" />Generate Slugs</>}
            </Button>
            {slugs.length > 0 && (
              <Button variant="outline" onClick={() => { setSlugs([]); setTitle(""); }} className="gap-1.5">
                <RefreshCw className="h-4 w-4" /> Reset
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {slugs.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground font-medium">
            5 slug suggestions for: <span className="text-foreground font-semibold">"{title}"</span>
          </p>
          {slugs.map(({ label, slug }, i) => {
            const fullUrl = `${cleanBase}/${slug}`;
            const isCopied = copied === slug;
            const isSlugCopied = copied === slug + "-slug";
            return (
              <Card key={i} className="overflow-hidden hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs shrink-0">#{i + 1}</Badge>
                      <span className="text-sm font-semibold text-muted-foreground">{label}</span>
                    </div>
                    <div className="flex gap-1.5 shrink-0">
                      <Button variant="outline" size="sm" onClick={() => copySlug(slug)} className="gap-1 h-7 text-xs">
                        {isSlugCopied ? <CheckCircle className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                        Slug only
                      </Button>
                      <Button size="sm" onClick={() => copy(slug)} className="gap-1 h-7 text-xs">
                        {isCopied ? <CheckCircle className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                        Full URL
                      </Button>
                    </div>
                  </div>

                  {/* Full URL preview */}
                  <div className="font-mono text-sm p-3 bg-muted/40 rounded-lg border flex items-center gap-1 flex-wrap">
                    <span className="text-muted-foreground">{cleanBase}/</span>
                    <span className="text-primary font-semibold break-all">{slug}</span>
                  </div>

                  {/* Slug metrics */}
                  <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                    <span>{slug.split("-").length} words</span>
                    <span>{slug.length} chars</span>
                    {slug.length <= 60 ? (
                      <span className="text-green-600 flex items-center gap-1"><CheckCircle className="h-3 w-3" />Good length</span>
                    ) : (
                      <span className="text-yellow-600 flex items-center gap-1"><span>⚠</span>Slightly long — consider shortening</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {/* Tips */}
          <Card className="border-dashed">
            <CardContent className="p-4 space-y-1.5">
              <p className="text-xs font-semibold">SEO Slug Best Practices</p>
              <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                <li>Keep slugs under 60 characters — shorter is easier to share and remember.</li>
                <li>Use hyphens, not underscores — Google treats hyphens as word separators.</li>
                <li>Include your primary keyword near the start of the slug.</li>
                <li>Avoid stop words (the, a, an, and, or) unless needed for readability.</li>
                <li>Never change a live slug — it breaks existing links and loses ranking.</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      )}

      {!slugs.length && !loading && (
        <Card className="border-dashed">
          <CardContent className="p-8 text-center space-y-2">
            <Link2 className="h-10 w-10 mx-auto text-muted-foreground/30" />
            <p className="font-medium text-muted-foreground">Enter a title to generate SEO-friendly URL slugs</p>
            <p className="text-sm text-muted-foreground">Each variation prioritises the primary keyword and follows Google's URL best practices.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
