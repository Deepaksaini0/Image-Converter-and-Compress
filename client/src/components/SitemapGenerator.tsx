import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import {
  Globe, FileCode, Download, Copy, Loader2, CheckCircle,
  Layers, BookOpen, FolderOpen, Sparkles, Search, RefreshCw,
  AlertCircle, ExternalLink
} from "lucide-react";

// ── XML builder ───────────────────────────────────────────────────────────────
interface CrawlResult {
  domain: string;
  today: string;
  total: number;
  pages: string[];
  blogs: string[];
  categories: string[];
}

function buildXml(data: CrawlResult): string {
  const { today, pages, blogs, categories } = data;
  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

  const entry = (url: string, freq: string, priority: string) =>
    `<url>\n<loc>${url}</loc>\n<lastmod>${today}</lastmod>\n<changefreq>${freq}</changefreq>\n<priority>${priority}</priority>\n</url>\n`;

  if (pages.length) {
    xml += `\n<!-- Here are pages -->\n`;
    pages.forEach(u => {
      const isHome = u === data.domain || u === data.domain + "/";
      xml += entry(u, isHome ? "daily" : "monthly", isHome ? "1.0" : "0.8");
    });
  }

  if (blogs.length) {
    xml += `\n<!-- Here are blog posts -->\n`;
    blogs.forEach(u => { xml += entry(u, "weekly", "0.7"); });
  }

  if (categories.length) {
    xml += `\n<!-- Here are category pages -->\n`;
    categories.forEach(u => { xml += entry(u, "weekly", "0.6"); });
  }

  xml += `\n</urlset>`;
  return xml;
}

// ── Syntax-highlighted XML line ───────────────────────────────────────────────
function XmlLine({ line }: { line: string }) {
  const isComment = line.trim().startsWith("<!--");
  const isLoc     = line.includes("<loc>");
  const isDecl    = line.startsWith("<?") || line.startsWith("<urlset") || line.startsWith("</urlset>");
  const isTag     = line.trim().startsWith("<") && !isComment && !isDecl;

  const cls = isComment ? "text-amber-500 font-semibold" :
              isLoc     ? "text-blue-500" :
              isDecl    ? "text-purple-500" :
              isTag     ? "text-muted-foreground" : "";
  return <div className={cls}>{line}</div>;
}

// ── Main component ────────────────────────────────────────────────────────────
export function SitemapGenerator() {
  const { toast } = useToast();
  const [urlInput, setUrlInput]       = useState("");
  const [crawling, setCrawling]       = useState(false);
  const [crawlData, setCrawlData]     = useState<CrawlResult | null>(null);
  const [xml, setXml]                 = useState("");
  const [error, setError]             = useState("");
  const resultRef = useRef<HTMLDivElement>(null);

  const run = async () => {
    const raw = urlInput.trim();
    if (!raw) {
      toast({ title: "Enter a URL first", variant: "destructive" });
      return;
    }
    setError("");
    setCrawlData(null);
    setXml("");
    setCrawling(true);

    try {
      const res  = await fetch("/api/sitemap/discover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: raw }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Crawl failed");

      setCrawlData(data);
      const generated = buildXml(data);
      setXml(generated);
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 150);
    } catch (e: any) {
      setError(e.message);
      toast({ title: "Crawl failed", description: e.message, variant: "destructive" });
    } finally {
      setCrawling(false);
    }
  };

  const copyXml = () => {
    navigator.clipboard.writeText(xml);
    toast({ title: "Copied to clipboard!" });
  };

  const downloadXml = () => {
    const blob = new Blob([xml], { type: "application/xml" });
    const a    = document.createElement("a");
    a.href     = URL.createObjectURL(blob);
    a.download = "sitemap.xml";
    a.click();
    URL.revokeObjectURL(a.href);
    toast({ title: "Downloaded sitemap.xml" });
  };

  const reset = () => {
    setCrawlData(null);
    setXml("");
    setError("");
    setUrlInput("");
  };

  return (
    <div className="space-y-5">

      {/* ── Input card ── */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-blue-500/5">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Globe className="h-5 w-5 text-primary" />
            XML Sitemap Generator
            <Badge className="text-xs">Auto Crawl</Badge>
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Enter your website URL — we crawl every internal link and build a complete sitemap with pages, blog posts, and categories automatically.
          </p>
        </CardHeader>
        <CardContent className="pt-0 space-y-4">
          <div className="space-y-1.5">
            <Label className="font-semibold text-sm">Website URL</Label>
            <div className="flex gap-3">
              <Input
                placeholder="https://example.com"
                value={urlInput}
                onChange={e => setUrlInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && !crawling && run()}
                className="font-mono text-sm flex-1"
                disabled={crawling}
              />
              {crawlData && (
                <Button variant="outline" size="icon" onClick={reset} title="Start over" disabled={crawling}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
              )}
              <Button onClick={run} disabled={crawling || !urlInput.trim()} className="gap-2 min-w-[190px]">
                {crawling
                  ? <><Loader2 className="h-4 w-4 animate-spin" />Crawling…</>
                  : <><Search className="h-4 w-4" />Crawl &amp; Generate Sitemap</>
                }
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Supports any public website. No URL limit — all internal links are discovered automatically.
            </p>
          </div>

          {/* Crawling status */}
          {crawling && (
            <div className="flex items-center gap-3 p-4 rounded-lg bg-primary/10 border border-primary/20">
              <Loader2 className="h-5 w-5 animate-spin text-primary shrink-0" />
              <div>
                <p className="text-sm font-semibold text-primary">Crawling website…</p>
                <p className="text-xs text-muted-foreground">Following all internal links. This may take 30–90 seconds for large sites.</p>
              </div>
            </div>
          )}

          {/* Error */}
          {error && !crawling && (
            <div className="flex items-start gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/20">
              <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-destructive">Crawl failed</p>
                <p className="text-xs text-muted-foreground">{error}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Stats cards ── */}
      {crawlData && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Total URLs",  value: crawlData.total,            icon: <Sparkles className="h-4 w-4 text-primary" />,    color: "text-primary" },
            { label: "Pages",       value: crawlData.pages.length,      icon: <Layers    className="h-4 w-4 text-blue-500" />,   color: "text-blue-600" },
            { label: "Blog Posts",  value: crawlData.blogs.length,      icon: <BookOpen  className="h-4 w-4 text-green-500" />,  color: "text-green-600" },
            { label: "Categories",  value: crawlData.categories.length, icon: <FolderOpen className="h-4 w-4 text-orange-500" />, color: "text-orange-600" },
          ].map(({ label, value, icon, color }) => (
            <Card key={label} className="p-4">
              <div className="flex items-center gap-2 mb-1">
                {icon}
                <span className="text-xs text-muted-foreground font-medium">{label}</span>
              </div>
              <p className={`text-2xl font-black ${color}`}>{value}</p>
            </Card>
          ))}
        </div>
      )}

      {/* ── Section previews ── */}
      {crawlData && (
        <div className="grid md:grid-cols-3 gap-4">
          {[
            { label: "Pages",      urls: crawlData.pages,      icon: <Layers     className="h-4 w-4" />, color: "blue" },
            { label: "Blog Posts", urls: crawlData.blogs,      icon: <BookOpen   className="h-4 w-4" />, color: "green" },
            { label: "Categories", urls: crawlData.categories, icon: <FolderOpen className="h-4 w-4" />, color: "orange" },
          ].map(({ label, urls, icon, color }) => (
            <Card key={label}>
              <CardHeader className="py-3 px-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    {icon} {label}
                  </div>
                  <Badge variant="secondary" className="text-xs">{urls.length}</Badge>
                </div>
              </CardHeader>
              {urls.length > 0 ? (
                <CardContent className="p-0">
                  <ScrollArea className="h-44">
                    <div className="px-4 pb-3 space-y-1">
                      {urls.map((u, i) => (
                        <div key={i} className="flex items-center gap-1.5 group">
                          <span className="text-xs font-mono text-primary truncate flex-1" title={u}>
                            {u.replace(crawlData.domain, "") || "/"}
                          </span>
                          <a href={u} target="_blank" rel="noopener noreferrer"
                             className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <ExternalLink className="h-3 w-3 text-muted-foreground" />
                          </a>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              ) : (
                <CardContent className="px-4 pb-4">
                  <p className="text-xs text-muted-foreground text-center py-3 border-2 border-dashed rounded">
                    None found
                  </p>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* ── XML output ── */}
      {xml && (
        <div ref={resultRef}>
          <Card className="border-green-300 dark:border-green-800">
            <CardHeader className="pb-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  Generated Sitemap
                  <Badge variant="secondary">{crawlData?.total ?? 0} URLs</Badge>
                </CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={copyXml} className="gap-1.5">
                    <Copy className="h-4 w-4" /> Copy XML
                  </Button>
                  <Button size="sm" onClick={downloadXml} className="gap-1.5">
                    <Download className="h-4 w-4" /> Download sitemap.xml
                  </Button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Upload <span className="font-mono font-semibold">sitemap.xml</span> to your website root, then submit <span className="font-mono">{crawlData?.domain}/sitemap.xml</span> to Google Search Console.
              </p>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[480px] rounded-b-lg">
                <pre className="text-xs font-mono p-5 leading-relaxed bg-muted/20">
                  {xml.split("\n").map((line, i) => (
                    <XmlLine key={i} line={line} />
                  ))}
                </pre>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── How it works ── */}
      {!crawlData && !crawling && (
        <Card className="border-dashed">
          <CardContent className="p-6">
            <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
              <FileCode className="h-4 w-4 text-primary" /> How it works
            </h3>
            <div className="grid md:grid-cols-3 gap-4">
              {[
                { step: "1", title: "Enter your URL", desc: "Paste any website URL — the homepage or any page on your site.", icon: <Globe className="h-5 w-5 text-primary" /> },
                { step: "2", title: "Auto-crawl",     desc: "Every internal link is followed. Pages, blog posts, and categories are detected and grouped automatically. No limit.", icon: <Search className="h-5 w-5 text-blue-500" /> },
                { step: "3", title: "Download & submit", desc: "Download sitemap.xml, upload it to your server root, and submit the URL to Google Search Console.", icon: <Download className="h-5 w-5 text-green-500" /> },
              ].map(({ step, title, desc, icon }) => (
                <div key={step} className="flex gap-3">
                  <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 font-bold text-primary text-sm">{step}</div>
                  <div>
                    <div className="flex items-center gap-1.5 mb-1">{icon}<p className="font-semibold text-sm">{title}</p></div>
                    <p className="text-xs text-muted-foreground">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
