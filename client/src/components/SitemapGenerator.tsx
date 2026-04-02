import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  Globe, FileCode, Plus, Trash2, Download, Copy, RefreshCw,
  CheckCircle, ChevronDown, ChevronUp, Layers, BookOpen,
  FolderOpen, Sparkles, X, FileText, ExternalLink
} from "lucide-react";

type Freq = "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";

interface UrlEntry {
  id: string;
  path: string;       // just the path, e.g. /about
  lastmod: string;
  changefreq: Freq;
  priority: string;
}

interface Section {
  key: "pages" | "blogs" | "categories";
  label: string;
  comment: string;
  icon: React.ReactNode;
  defaultFreq: Freq;
  defaultPriority: string;
}

const SECTIONS: Section[] = [
  {
    key: "pages",
    label: "Pages",
    comment: "<!-- Here are pages -->",
    icon: <Layers className="h-4 w-4" />,
    defaultFreq: "monthly",
    defaultPriority: "0.8",
  },
  {
    key: "blogs",
    label: "Blog Posts",
    comment: "<!-- Here are blog posts -->",
    icon: <BookOpen className="h-4 w-4" />,
    defaultFreq: "weekly",
    defaultPriority: "0.7",
  },
  {
    key: "categories",
    label: "Categories",
    comment: "<!-- Here are category pages -->",
    icon: <FolderOpen className="h-4 w-4" />,
    defaultFreq: "weekly",
    defaultPriority: "0.6",
  },
];

const FREQ_OPTIONS: Freq[] = ["always", "hourly", "daily", "weekly", "monthly", "yearly", "never"];
const PRIORITY_OPTIONS = ["1.0", "0.9", "0.8", "0.7", "0.6", "0.5", "0.4", "0.3", "0.2", "0.1"];

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

function today() {
  return new Date().toISOString().split("T")[0];
}

function buildXml(baseUrl: string, entries: Record<string, UrlEntry[]>): string {
  const clean = baseUrl.replace(/\/$/, "");
  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

  for (const section of SECTIONS) {
    const list = entries[section.key] ?? [];
    if (!list.length) continue;
    xml += `\n${section.comment}\n`;
    for (const entry of list) {
      const path = entry.path.startsWith("/") ? entry.path : "/" + entry.path;
      const loc = clean + path;
      xml += `<url>\n`;
      xml += `<loc>${loc}</loc>\n`;
      xml += `<lastmod>${entry.lastmod}</lastmod>\n`;
      xml += `<changefreq>${entry.changefreq}</changefreq>\n`;
      xml += `<priority>${entry.priority}</priority>\n`;
      xml += `</url>\n`;
    }
  }

  xml += `\n</urlset>`;
  return xml;
}

function SectionPanel({
  section,
  entries,
  onChange,
}: {
  section: Section;
  entries: UrlEntry[];
  onChange: (list: UrlEntry[]) => void;
}) {
  const [pathInput, setPathInput] = useState("");
  const [bulkText, setBulkText] = useState("");
  const [showBulk, setShowBulk] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const add = () => {
    const raw = pathInput.trim();
    if (!raw) return;
    const path = raw.startsWith("/") ? raw : "/" + raw;
    onChange([...entries, { id: uid(), path, lastmod: today(), changefreq: section.defaultFreq, priority: section.defaultPriority }]);
    setPathInput("");
  };

  const addBulk = () => {
    const lines = bulkText.split("\n").map(l => l.trim()).filter(Boolean);
    const newEntries: UrlEntry[] = lines.map(line => ({
      id: uid(),
      path: line.startsWith("/") ? line : "/" + line,
      lastmod: today(),
      changefreq: section.defaultFreq,
      priority: section.defaultPriority,
    }));
    onChange([...entries, ...newEntries]);
    setBulkText("");
    setShowBulk(false);
  };

  const remove = (id: string) => onChange(entries.filter(e => e.id !== id));

  const update = (id: string, field: keyof UrlEntry, value: string) =>
    onChange(entries.map(e => e.id === id ? { ...e, [field]: value } : e));

  const clearAll = () => onChange([]);

  return (
    <Card className="overflow-hidden">
      <CardHeader
        className="py-3 px-5 cursor-pointer select-none flex flex-row items-center justify-between"
        onClick={() => setCollapsed(v => !v)}
      >
        <div className="flex items-center gap-2">
          {section.icon}
          <span className="font-semibold text-sm">{section.label}</span>
          <Badge variant="secondary" className="text-xs">{entries.length} URLs</Badge>
          <span className="text-xs text-muted-foreground font-mono">{section.comment}</span>
        </div>
        {collapsed ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronUp className="h-4 w-4 text-muted-foreground" />}
      </CardHeader>

      {!collapsed && (
        <CardContent className="p-5 pt-0 space-y-4">
          {/* Add single URL */}
          <div className="flex gap-2">
            <Input
              placeholder={`/${section.key === "blogs" ? "blog/my-post-title" : section.key === "categories" ? "category/seo" : "about"}`}
              value={pathInput}
              onChange={e => setPathInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && add()}
              className="font-mono text-sm"
            />
            <Button onClick={add} disabled={!pathInput.trim()} className="gap-1.5 whitespace-nowrap">
              <Plus className="h-4 w-4" /> Add URL
            </Button>
            <Button variant="outline" onClick={() => setShowBulk(v => !v)} className="gap-1.5 whitespace-nowrap">
              <FileText className="h-4 w-4" /> Bulk Add
            </Button>
          </div>

          {/* Bulk add */}
          {showBulk && (
            <div className="space-y-2 p-4 bg-muted/40 rounded-lg border border-dashed">
              <Label className="text-xs text-muted-foreground">Paste one URL path per line (e.g. /about, /blog/post-title)</Label>
              <Textarea
                rows={5}
                placeholder={"/about\n/contact\n/services\n/pricing"}
                value={bulkText}
                onChange={e => setBulkText(e.target.value)}
                className="font-mono text-xs"
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={addBulk} disabled={!bulkText.trim()} className="gap-1.5">
                  <Plus className="h-3.5 w-3.5" /> Add All
                </Button>
                <Button size="sm" variant="ghost" onClick={() => { setShowBulk(false); setBulkText(""); }}>
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* URL list */}
          {entries.length > 0 ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground font-medium">{entries.length} URL{entries.length !== 1 ? "s" : ""} added</span>
                <Button variant="ghost" size="sm" onClick={clearAll} className="text-xs text-destructive hover:text-destructive gap-1 h-7">
                  <Trash2 className="h-3 w-3" /> Clear all
                </Button>
              </div>
              <ScrollArea className="h-64">
                <div className="space-y-1.5 pr-3">
                  {entries.map(entry => (
                    <div key={entry.id} className="grid grid-cols-[1fr_120px_110px_90px_36px] gap-2 items-center p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                      <span className="font-mono text-xs text-primary truncate" title={entry.path}>{entry.path}</span>
                      <Input
                        type="date"
                        value={entry.lastmod}
                        onChange={e => update(entry.id, "lastmod", e.target.value)}
                        className="h-7 text-xs"
                      />
                      <Select value={entry.changefreq} onValueChange={v => update(entry.id, "changefreq", v as Freq)}>
                        <SelectTrigger className="h-7 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {FREQ_OPTIONS.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <Select value={entry.priority} onValueChange={v => update(entry.id, "priority", v)}>
                        <SelectTrigger className="h-7 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {PRIORITY_OPTIONS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => remove(entry.id)}>
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              <p className="text-xs text-muted-foreground">Each row: path · last modified · change frequency · priority</p>
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground text-sm border-2 border-dashed rounded-lg">
              No URLs added yet — type a path above or use Bulk Add
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

export function SitemapGenerator() {
  const { toast } = useToast();
  const [baseUrl, setBaseUrl] = useState("https://example.com");
  const [entries, setEntries] = useState<Record<string, UrlEntry[]>>({
    pages: [
      { id: uid(), path: "/", lastmod: today(), changefreq: "daily", priority: "1.0" },
      { id: uid(), path: "/about", lastmod: today(), changefreq: "monthly", priority: "0.8" },
      { id: uid(), path: "/contact", lastmod: today(), changefreq: "monthly", priority: "0.7" },
    ],
    blogs: [],
    categories: [],
  });
  const [xml, setXml] = useState("");
  const [generated, setGenerated] = useState(false);
  const outputRef = useRef<HTMLTextAreaElement>(null);

  const totalUrls = Object.values(entries).reduce((s, arr) => s + arr.length, 0);

  const generate = () => {
    if (!baseUrl.trim()) {
      toast({ title: "Base URL required", description: "Enter your website URL first.", variant: "destructive" });
      return;
    }
    if (totalUrls === 0) {
      toast({ title: "No URLs added", description: "Add at least one URL to generate the sitemap.", variant: "destructive" });
      return;
    }
    const result = buildXml(baseUrl.trim(), entries);
    setXml(result);
    setGenerated(true);
    setTimeout(() => outputRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
  };

  const reset = () => {
    setXml("");
    setGenerated(false);
    setEntries({ pages: [], blogs: [], categories: [] });
    setBaseUrl("https://example.com");
  };

  const copyXml = () => {
    navigator.clipboard.writeText(xml);
    toast({ title: "Copied!", description: "Sitemap XML copied to clipboard." });
  };

  const downloadXml = () => {
    const blob = new Blob([xml], { type: "application/xml" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "sitemap.xml";
    a.click();
    URL.revokeObjectURL(a.href);
    toast({ title: "Downloaded!", description: "sitemap.xml saved to your computer." });
  };

  const setSection = (key: string, list: UrlEntry[]) =>
    setEntries(prev => ({ ...prev, [key]: list }));

  return (
    <div className="space-y-5">
      {/* Header */}
      <Card className="bg-gradient-to-r from-primary/5 to-blue-500/5 border-primary/20">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Globe className="h-5 w-5 text-primary" />
            XML Sitemap Generator
            <Badge className="text-xs">SEO</Badge>
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Build a fully compliant XML sitemap with pages, blog posts, and category pages. Add URLs manually or paste in bulk — no limit.
          </p>
        </CardHeader>
        <CardContent className="pt-0 space-y-3">
          <div className="space-y-1.5">
            <Label className="font-semibold text-sm">Your Website Base URL</Label>
            <div className="flex gap-2">
              <Input
                placeholder="https://example.com"
                value={baseUrl}
                onChange={e => setBaseUrl(e.target.value)}
                className="font-mono text-sm"
              />
              <Button variant="outline" size="icon" onClick={reset} title="Reset everything">
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">This is prepended to every URL path — no trailing slash needed.</p>
          </div>

          <div className="flex items-center gap-3 pt-1">
            <div className="flex gap-4 text-xs text-muted-foreground">
              {SECTIONS.map(s => (
                <span key={s.key} className="flex items-center gap-1">
                  {s.icon}
                  <span className="font-semibold text-foreground">{entries[s.key]?.length ?? 0}</span> {s.label}
                </span>
              ))}
            </div>
            <div className="ml-auto flex items-center gap-2">
              <Badge variant="outline" className="text-xs">{totalUrls} total URLs</Badge>
              <Button onClick={generate} disabled={totalUrls === 0} className="gap-2">
                <Sparkles className="h-4 w-4" />
                Generate Sitemap
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section panels */}
      {SECTIONS.map(section => (
        <SectionPanel
          key={section.key}
          section={section}
          entries={entries[section.key] ?? []}
          onChange={list => setSection(section.key, list)}
        />
      ))}

      {/* Generated XML output */}
      {generated && xml && (
        <Card ref={outputRef as any} className="border-green-300 dark:border-green-700">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <CheckCircle className="h-5 w-5 text-green-500" />
                Generated Sitemap
                <Badge variant="secondary" className="text-xs">{totalUrls} URLs</Badge>
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
            <p className="text-xs text-muted-foreground mt-1">
              Upload <span className="font-mono font-semibold">sitemap.xml</span> to your website root, then submit the URL to Google Search Console.
            </p>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-96 rounded-b-lg">
              <pre className="text-xs font-mono p-5 whitespace-pre leading-relaxed bg-muted/30">
                {xml.split("\n").map((line, i) => {
                  const isComment = line.trim().startsWith("<!--");
                  const isTag = line.trim().startsWith("<") && !isComment;
                  const isLoc = line.includes("<loc>");
                  return (
                    <div
                      key={i}
                      className={
                        isComment ? "text-amber-600 dark:text-amber-400 font-semibold" :
                        isLoc ? "text-blue-600 dark:text-blue-400" :
                        isTag ? "text-muted-foreground" : ""
                      }
                    >
                      {line}
                    </div>
                  );
                })}
              </pre>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* How to use */}
      {!generated && (
        <Card className="border-dashed">
          <CardContent className="p-6">
            <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
              <FileCode className="h-4 w-4 text-primary" /> How it works
            </h3>
            <ol className="space-y-2 text-sm text-muted-foreground list-decimal list-inside">
              <li>Enter your website base URL above (e.g. <span className="font-mono text-foreground">https://example.com</span>)</li>
              <li>Add URL paths to each section — Pages, Blog Posts, and Categories</li>
              <li>Use <strong>Bulk Add</strong> to paste many URLs at once (one per line)</li>
              <li>Adjust <span className="font-mono text-foreground">lastmod</span>, <span className="font-mono text-foreground">changefreq</span>, and <span className="font-mono text-foreground">priority</span> per URL</li>
              <li>Click <strong>Generate Sitemap</strong> — preview, copy, or download the XML</li>
              <li>Upload <span className="font-mono text-foreground">sitemap.xml</span> to your website root and submit to Google Search Console</li>
            </ol>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
