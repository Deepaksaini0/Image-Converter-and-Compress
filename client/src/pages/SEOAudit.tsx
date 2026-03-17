import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { motion } from "framer-motion";
import {
  ArrowLeft, Search, FileCode, BarChart3, Loader2, Globe, Share2,
  Link2, Star, BookOpen, CheckCircle, XCircle, AlertTriangle, TrendingUp,
  Code2, Tag, ArrowRight, Server, Zap, FileText, MonitorSmartphone,
  TrendingDown, Trophy, RefreshCw, AlertCircle, Loader, Building2,
  Image
} from "lucide-react";
import { Link } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";

interface PageAudit {
  url: string; score: number;
  checks: { category: string; items: { name: string; status: "pass" | "warning" | "fail"; message: string; severity: "critical" | "warning" | "info" }[] }[];
  recommendations: string[];
}
interface AuditResult {
  url: string; score: number; timestamp: string; pages: PageAudit[]; recommendations: string[];
}

export default function SEOAuditDashboard() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  // ── Site Audit ──
  const [auditUrl, setAuditUrl] = useState("");
  const [auditResult, setAuditResult] = useState<AuditResult | null>(null);
  const [auditLoading, setAuditLoading] = useState(false);

  // ── Sitemap ──
  const [sitemapXml, setSitemapXml] = useState("");
  const [sitemapResult, setSitemapResult] = useState<{ count: number; urls: string[] } | null>(null);

  // ── Keyword Density ──
  const [keywordText, setKeywordText] = useState("");
  const [keywordResult, setKeywordResult] = useState<{ totalWords: number; density: { word: string; count: number; percentage: string }[] } | null>(null);

  // ── Robots.txt ──
  const [robotsSitemap, setRobotsSitemap] = useState("");
  const [robotsRules, setRobotsRules] = useState([{ agent: "*", allow: true, path: "/" }]);
  const [generatedRobots, setGeneratedRobots] = useState("");

  // ── Social Preview ──
  const [previewUrl, setPreviewUrl] = useState("");
  const [socialData, setSocialData] = useState<{ title: string; description: string; image: string; site_name: string; url: string } | null>(null);

  // ── Keyword Suggest ──
  const [targetTitle, setTargetTitle] = useState("");
  const [suggestedKeywords, setSuggestedKeywords] = useState<string[]>([]);

  // ── Broken Links ──
  const [linkCheckUrl, setLinkCheckUrl] = useState("");
  const [linkResults, setLinkResults] = useState<{ total: number; brokenCount: number; results: { url: string; status: number; broken: boolean; type: string; error?: string }[] } | null>(null);

  // ── SERP ──
  const [serpTitle, setSerpTitle] = useState("");
  const [serpDesc, setSerpDesc] = useState("");
  const [serpUrl, setSerpUrl] = useState("");
  const [serpRating, setSerpRating] = useState(4.5);
  const [serpReviews, setSerpReviews] = useState(128);
  const [serpShowRating, setSerpShowRating] = useState(false);

  // ── Readability ──
  const [readabilityText, setReadabilityText] = useState("");
  const [readabilityResult, setReadabilityResult] = useState<{ wordCount: number; sentenceCount: number; syllableCount: number; avgWordsPerSentence: number; avgSyllablesPerWord: number; fleschEase: number; fleschKincaidGrade: number; level: string; levelColor: string; suggestions: string[] } | null>(null);

  // ── Meta Tags ──
  const [metaTitle, setMetaTitle] = useState(""); const [metaDesc, setMetaDesc] = useState(""); const [metaUrl, setMetaUrl] = useState(""); const [metaImage, setMetaImage] = useState(""); const [metaAuthor, setMetaAuthor] = useState(""); const [metaKeywords, setMetaKeywords] = useState(""); const [generatedMeta, setGeneratedMeta] = useState("");

  // ── Schema ──
  const [schemaType, setSchemaType] = useState("Article");
  const [schemaFields, setSchemaFields] = useState<Record<string, string>>({});
  const [generatedSchema, setGeneratedSchema] = useState("");

  // ── HTTP Headers ──
  const [headerUrl, setHeaderUrl] = useState("");
  const [headerResult, setHeaderResult] = useState<{ status: number; statusText: string; headers: { key: string; value: string; important: boolean }[] } | null>(null);

  // ── Redirects ──
  const [redirectUrl, setRedirectUrl] = useState("");
  const [redirectChain, setRedirectChain] = useState<{ chain: { url: string; status: number; statusText: string }[]; redirectCount: number } | null>(null);

  // ── Page Speed ──
  const [pageSpeedUrl, setPageSpeedUrl] = useState("");
  const [pageSpeedResult, setPageSpeedResult] = useState<{ url: string; ttfb: number; htmlSize: number; htmlSizeKb: number; status: number; isCompressed: boolean; hasCache: boolean; cacheControl: string; isHttps: boolean; hasHsts: boolean; server: string; scriptCount: number; styleCount: number; imageCount: number; iframeCount: number; hasViewport: boolean; title: string | null; description: string | null; canonical: string | null; h1Count: number; score: number; issues: { type: "error" | "warning" | "info"; message: string; impact: string }[] } | null>(null);

  // ── Rank Tracker ──
  const [rankUrl, setRankUrl] = useState(""); const [rankKeyword, setRankKeyword] = useState(""); const [rankResult, setRankResult] = useState<{ url: string; keyword: string; position: number | null; checkedAt: string; totalScanned: number } | null>(null); const [rankHistory, setRankHistory] = useState<{ id: number; url: string; keyword: string; position: number | null; checkedAt: string }[]>([]);

  const schemaTypes: Record<string, { label: string; fields: { key: string; label: string; placeholder: string }[] }> = {
    Article: { label: "Article / Blog Post", fields: [{ key: "headline", label: "Headline", placeholder: "Your article title" }, { key: "author", label: "Author Name", placeholder: "John Doe" }, { key: "datePublished", label: "Date Published", placeholder: "2024-01-15" }, { key: "dateModified", label: "Date Modified", placeholder: "2024-06-01" }, { key: "description", label: "Description", placeholder: "Brief description..." }, { key: "url", label: "Article URL", placeholder: "https://example.com/article" }, { key: "image", label: "Featured Image URL", placeholder: "https://example.com/img.jpg" }] },
    Product: { label: "Product", fields: [{ key: "name", label: "Product Name", placeholder: "Amazing Widget Pro" }, { key: "description", label: "Description", placeholder: "Product description..." }, { key: "price", label: "Price", placeholder: "29.99" }, { key: "currency", label: "Currency", placeholder: "USD" }, { key: "availability", label: "Availability", placeholder: "InStock" }, { key: "brand", label: "Brand", placeholder: "Your Brand" }, { key: "sku", label: "SKU", placeholder: "PROD-001" }, { key: "url", label: "Product URL", placeholder: "https://example.com/product" }, { key: "image", label: "Product Image", placeholder: "https://example.com/img.jpg" }] },
    FAQ: { label: "FAQ Page", fields: [{ key: "q1", label: "Question 1", placeholder: "What is your product?" }, { key: "a1", label: "Answer 1", placeholder: "Our product is..." }, { key: "q2", label: "Question 2", placeholder: "How does shipping work?" }, { key: "a2", label: "Answer 2", placeholder: "We ship within 2-3 days..." }, { key: "q3", label: "Question 3", placeholder: "Do you offer refunds?" }, { key: "a3", label: "Answer 3", placeholder: "Yes, we offer 30-day refunds..." }] },
    LocalBusiness: { label: "Local Business", fields: [{ key: "name", label: "Business Name", placeholder: "My Local Shop" }, { key: "description", label: "Description", placeholder: "We sell amazing things..." }, { key: "telephone", label: "Phone", placeholder: "+1-555-123-4567" }, { key: "email", label: "Email", placeholder: "hello@mybusiness.com" }, { key: "address", label: "Street Address", placeholder: "123 Main St" }, { key: "city", label: "City", placeholder: "New York" }, { key: "state", label: "State/Region", placeholder: "NY" }, { key: "zip", label: "Postal Code", placeholder: "10001" }, { key: "country", label: "Country", placeholder: "US" }, { key: "url", label: "Website", placeholder: "https://mybusiness.com" }] },
  };

  const api = async (path: string, body: object) => {
    const r = await fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const d = await r.json();
    if (d.error) throw new Error(d.error);
    return d;
  };

  const handleAudit = async () => {
    if (!auditUrl.trim()) return;
    setAuditLoading(true);
    setAuditResult(null);
    try {
      const data = await api("/api/seo-audit", { url: auditUrl.trim() });
      setAuditResult(data);
      toast({ title: "Audit Complete", description: `SEO Score: ${data.score}/100` });
    } catch { toast({ title: "Error", description: "Failed to audit. Please try again.", variant: "destructive" }); }
    finally { setAuditLoading(false); }
  };

  const handleSitemapParse = async () => {
    if (!sitemapXml.trim()) return;
    setIsLoading(true);
    try { const d = await api("/api/seo/parse-sitemap", { xml: sitemapXml }); setSitemapResult(d); toast({ title: `Found ${d.count} URLs` }); }
    catch (e: any) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
    finally { setIsLoading(false); }
  };

  const handleKeywordDensity = async () => {
    if (!keywordText.trim()) return;
    setIsLoading(true);
    try { const d = await api("/api/seo/keyword-density", { text: keywordText }); setKeywordResult(d); }
    catch (e: any) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
    finally { setIsLoading(false); }
  };

  const generateRobots = () => {
    let c = ""; robotsRules.forEach(r => { c += `User-agent: ${r.agent}\n${r.allow ? "Allow" : "Disallow"}: ${r.path}\n\n`; });
    if (robotsSitemap) c += `Sitemap: ${robotsSitemap}\n`;
    setGeneratedRobots(c.trim()); toast({ title: "Generated!" });
  };

  const fetchSocialPreview = async () => {
    if (!previewUrl) return; setIsLoading(true);
    try { const d = await api("/api/seo/social-preview", { url: previewUrl }); setSocialData(d); }
    catch (e: any) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
    finally { setIsLoading(false); }
  };

  const generateKeywords = async () => {
    if (!targetTitle) return; setIsLoading(true);
    try { const d = await api("/api/seo/suggest-keywords", { title: targetTitle }); setSuggestedKeywords(d.keywords); toast({ title: "Keywords Generated" }); }
    catch (e: any) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
    finally { setIsLoading(false); }
  };

  const checkBrokenLinks = async () => {
    if (!linkCheckUrl) return; setIsLoading(true); setLinkResults(null);
    try { const d = await api("/api/seo/broken-links", { url: linkCheckUrl }); setLinkResults(d); toast({ title: `Found ${d.brokenCount} broken links of ${d.total}` }); }
    catch (e: any) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
    finally { setIsLoading(false); }
  };

  const analyzeReadability = async () => {
    if (!readabilityText.trim()) return; setIsLoading(true);
    try { const d = await api("/api/seo/readability", { text: readabilityText }); setReadabilityResult(d); }
    catch (e: any) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
    finally { setIsLoading(false); }
  };

  const generateMetaTags = () => {
    if (!metaTitle && !metaDesc) return;
    const tags = [`<!-- Primary Meta Tags -->`, metaTitle ? `<title>${metaTitle}</title>` : "", metaDesc ? `<meta name="description" content="${metaDesc}" />` : "", metaKeywords ? `<meta name="keywords" content="${metaKeywords}" />` : "", metaAuthor ? `<meta name="author" content="${metaAuthor}" />` : "", `<meta name="robots" content="index, follow" />`, ``, `<!-- Open Graph / Facebook -->`, `<meta property="og:type" content="website" />`, metaUrl ? `<meta property="og:url" content="${metaUrl}" />` : "", metaTitle ? `<meta property="og:title" content="${metaTitle}" />` : "", metaDesc ? `<meta property="og:description" content="${metaDesc}" />` : "", metaImage ? `<meta property="og:image" content="${metaImage}" />` : "", ``, `<!-- Twitter Card -->`, `<meta name="twitter:card" content="summary_large_image" />`, metaUrl ? `<meta name="twitter:url" content="${metaUrl}" />` : "", metaTitle ? `<meta name="twitter:title" content="${metaTitle}" />` : "", metaDesc ? `<meta name="twitter:description" content="${metaDesc}" />` : "", metaImage ? `<meta name="twitter:image" content="${metaImage}" />` : "", ``, metaUrl ? `<link rel="canonical" href="${metaUrl}" />` : ""].filter(Boolean).join("\n");
    setGeneratedMeta(tags); toast({ title: "Meta Tags Generated!" });
  };

  const generateSchema = () => {
    const f = schemaFields; let schema: any = { "@context": "https://schema.org" };
    if (schemaType === "Article") schema = { ...schema, "@type": "Article", headline: f.headline, author: { "@type": "Person", name: f.author }, datePublished: f.datePublished, dateModified: f.dateModified, description: f.description, url: f.url, image: f.image };
    else if (schemaType === "Product") schema = { ...schema, "@type": "Product", name: f.name, description: f.description, brand: { "@type": "Brand", name: f.brand }, sku: f.sku, url: f.url, image: f.image, offers: { "@type": "Offer", price: f.price, priceCurrency: f.currency || "USD", availability: `https://schema.org/${f.availability || "InStock"}` } };
    else if (schemaType === "FAQ") { const qas = []; for (let i = 1; i <= 5; i++) if (f[`q${i}`] && f[`a${i}`]) qas.push({ "@type": "Question", name: f[`q${i}`], acceptedAnswer: { "@type": "Answer", text: f[`a${i}`] } }); schema = { ...schema, "@type": "FAQPage", mainEntity: qas }; }
    else if (schemaType === "LocalBusiness") schema = { ...schema, "@type": "LocalBusiness", name: f.name, description: f.description, telephone: f.telephone, email: f.email, url: f.url, address: { "@type": "PostalAddress", streetAddress: f.address, addressLocality: f.city, addressRegion: f.state, postalCode: f.zip, addressCountry: f.country } };
    setGeneratedSchema(JSON.stringify(schema, null, 2)); toast({ title: "Schema Generated!" });
  };

  const checkHeaders = async () => {
    if (!headerUrl) return; setIsLoading(true); setHeaderResult(null);
    try { const r = await fetch("/api/seo/http-headers", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: headerUrl }) }); const d = await r.json(); if (d.error) throw new Error(d.error); setHeaderResult(d); }
    catch (e: any) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
    finally { setIsLoading(false); }
  };

  const checkRedirects = async () => {
    if (!redirectUrl) return; setIsLoading(true); setRedirectChain(null);
    try { const r = await fetch("/api/seo/redirect-chain", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: redirectUrl }) }); const d = await r.json(); if (d.error) throw new Error(d.error); setRedirectChain(d); }
    catch (e: any) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
    finally { setIsLoading(false); }
  };

  const analyzePageSpeed = async () => {
    if (!pageSpeedUrl) return; setIsLoading(true); setPageSpeedResult(null);
    try { const r = await fetch("/api/seo/page-speed", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: pageSpeedUrl }) }); const d = await r.json(); if (d.error) throw new Error(d.error); setPageSpeedResult(d); }
    catch (e: any) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
    finally { setIsLoading(false); }
  };

  const fetchRankHistory = async (url: string, keyword: string) => {
    try { const r = await fetch(`/api/seo/rank-history?url=${encodeURIComponent(url)}&keyword=${encodeURIComponent(keyword)}`); const d = await r.json(); if (d.history) setRankHistory(d.history); } catch {}
  };

  const checkRanking = async () => {
    if (!rankUrl || !rankKeyword) return; setIsLoading(true); setRankResult(null);
    try { const r = await fetch("/api/seo/rank-check", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: rankUrl, keyword: rankKeyword }) }); const d = await r.json(); if (d.error) throw new Error(d.error); setRankResult(d); await fetchRankHistory(d.url, d.keyword); toast({ title: d.position ? `Ranked #${d.position}` : "Not found in top results" }); }
    catch (e: any) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
    finally { setIsLoading(false); }
  };

  const getScoreColor = (s: number) => s >= 80 ? "text-green-600" : s >= 60 ? "text-yellow-600" : "text-red-600";
  const getStatusBadge = (status: number, broken: boolean) => !broken ? <Badge className="bg-green-100 text-green-700 text-xs">{status} OK</Badge> : status === 0 ? <Badge variant="destructive" className="text-xs">Error</Badge> : <Badge variant="destructive" className="text-xs">{status}</Badge>;
  const getStatusColor = (s: number) => s >= 200 && s < 300 ? "bg-green-50 border-green-200" : s >= 300 && s < 400 ? "bg-yellow-50 border-yellow-200" : "bg-red-50 border-red-200";
  const getStatusIcon = (s: number) => s >= 200 && s < 300 ? <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" /> : s >= 300 && s < 400 ? <ArrowRight className="h-4 w-4 text-yellow-500 flex-shrink-0" /> : <XCircle className="h-4 w-4 text-red-500 flex-shrink-0" />;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Agency Dashboard Header */}
      <div className="border-b bg-card shadow-sm">
        <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/"><Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button></Link>
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center"><Building2 className="h-5 w-5 text-white" /></div>
              <div>
                <h1 className="text-xl font-bold leading-none">SEO Agency Dashboard</h1>
                <p className="text-xs text-muted-foreground mt-0.5">All-in-one SEO management suite</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs hidden sm:flex">15 Tools</Badge>
            <Badge className="bg-green-100 text-green-700 text-xs hidden sm:flex">Live</Badge>
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-6">
        <Tabs defaultValue="site-audit" className="w-full">
          <TabsList className="flex flex-wrap h-auto gap-1 mb-8 bg-muted p-1 rounded-xl">
            <TabsTrigger value="site-audit" className="flex items-center gap-1.5 text-xs font-medium"><Globe className="h-3 w-3" />Site Audit</TabsTrigger>
            <TabsTrigger value="sitemap" className="flex items-center gap-1.5 text-xs"><FileCode className="h-3 w-3" />Sitemap</TabsTrigger>
            <TabsTrigger value="keyword" className="flex items-center gap-1.5 text-xs"><BarChart3 className="h-3 w-3" />Keywords</TabsTrigger>
            <TabsTrigger value="robots" className="flex items-center gap-1.5 text-xs"><Globe className="h-3 w-3" />Robots.txt</TabsTrigger>
            <TabsTrigger value="social" className="flex items-center gap-1.5 text-xs"><Share2 className="h-3 w-3" />Social</TabsTrigger>
            <TabsTrigger value="keywords-gen" className="flex items-center gap-1.5 text-xs"><Search className="h-3 w-3" />Keyword AI</TabsTrigger>
            <TabsTrigger value="broken-links" className="flex items-center gap-1.5 text-xs"><Link2 className="h-3 w-3" />Broken Links</TabsTrigger>
            <TabsTrigger value="serp" className="flex items-center gap-1.5 text-xs"><Star className="h-3 w-3" />SERP</TabsTrigger>
            <TabsTrigger value="readability" className="flex items-center gap-1.5 text-xs"><BookOpen className="h-3 w-3" />Readability</TabsTrigger>
            <TabsTrigger value="meta-tags" className="flex items-center gap-1.5 text-xs"><Tag className="h-3 w-3" />Meta Tags</TabsTrigger>
            <TabsTrigger value="schema" className="flex items-center gap-1.5 text-xs"><Code2 className="h-3 w-3" />Schema</TabsTrigger>
            <TabsTrigger value="http-headers" className="flex items-center gap-1.5 text-xs"><Server className="h-3 w-3" />Headers</TabsTrigger>
            <TabsTrigger value="redirects" className="flex items-center gap-1.5 text-xs"><ArrowRight className="h-3 w-3" />Redirects</TabsTrigger>
            <TabsTrigger value="page-speed" className="flex items-center gap-1.5 text-xs"><Zap className="h-3 w-3" />Page Speed</TabsTrigger>
            <TabsTrigger value="rank-tracker" className="flex items-center gap-1.5 text-xs"><Trophy className="h-3 w-3" />Rank Tracker</TabsTrigger>
          </TabsList>

          {/* ── Site Audit ── */}
          <TabsContent value="site-audit">
            <div className="space-y-6">
              {!auditResult ? (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <Card className="p-8 max-w-2xl space-y-6">
                    <div>
                      <h2 className="text-2xl font-bold mb-1">Full Website Audit</h2>
                      <p className="text-muted-foreground text-sm">We crawl up to 5 internal pages and generate a detailed SEO report for each.</p>
                    </div>
                    <div className="space-y-2">
                      <Label className="font-semibold">Website URL</Label>
                      <div className="flex gap-3">
                        <Input placeholder="https://example.com" value={auditUrl} onChange={(e) => setAuditUrl(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleAudit()} className="flex-1" />
                        <Button onClick={handleAudit} disabled={auditLoading || !auditUrl.trim()} className="px-8">
                          {auditLoading ? <><Loader className="h-4 w-4 mr-2 animate-spin" />Auditing...</> : "Audit Website"}
                        </Button>
                      </div>
                    </div>
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                      <h3 className="font-semibold text-blue-900 mb-2">What we check</h3>
                      <div className="grid grid-cols-2 gap-2 text-sm text-blue-800">
                        <div className="flex items-center gap-1.5"><CheckCircle className="h-3.5 w-3.5" />Title Tag &amp; Meta Data</div>
                        <div className="flex items-center gap-1.5"><CheckCircle className="h-3.5 w-3.5" />H1 Tag Verification</div>
                        <div className="flex items-center gap-1.5"><CheckCircle className="h-3.5 w-3.5" />Image ALT Text</div>
                        <div className="flex items-center gap-1.5"><CheckCircle className="h-3.5 w-3.5" />Multi-page Crawling</div>
                        <div className="flex items-center gap-1.5"><CheckCircle className="h-3.5 w-3.5" />Link Analysis</div>
                        <div className="flex items-center gap-1.5"><CheckCircle className="h-3.5 w-3.5" />Performance Hints</div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ) : (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                  <Card className={`p-6 ${auditResult.score >= 80 ? "bg-green-50 border-green-200" : auditResult.score >= 60 ? "bg-yellow-50 border-yellow-200" : "bg-red-50 border-red-200"}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1 uppercase tracking-wide">Overall SEO Score</p>
                        <p className={`text-6xl font-black ${getScoreColor(auditResult.score)}`}>{auditResult.score}<span className="text-2xl font-normal">/100</span></p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground mb-1">Audited</p>
                        <p className="font-bold break-all max-w-xs">{auditResult.url}</p>
                        <p className="text-xs text-muted-foreground mt-1">{new Date(auditResult.timestamp).toLocaleString()}</p>
                      </div>
                    </div>
                  </Card>
                  <h2 className="text-xl font-bold">Page-by-Page Results</h2>
                  <Accordion type="single" collapsible className="space-y-3">
                    {auditResult.pages.map((page, idx) => (
                      <AccordionItem key={idx} value={`page-${idx}`} className="border-none">
                        <Card className="overflow-hidden">
                          <AccordionTrigger className="px-6 py-4 hover:no-underline">
                            <div className="flex items-center justify-between w-full pr-4">
                              <div className="text-left">
                                <p className="text-sm font-medium text-primary truncate max-w-md">{page.url}</p>
                                <p className="text-xs text-muted-foreground mt-0.5">Page {idx + 1}</p>
                              </div>
                              <span className={`text-xl font-bold ${getScoreColor(page.score)}`}>{page.score}%</span>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="px-6 pb-6 pt-2">
                            <div className="space-y-6">
                              {page.checks.map((cat, ci) => (
                                <div key={ci} className="space-y-3">
                                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{cat.category}</h4>
                                  <div className="grid gap-2">
                                    {cat.items.map((item, ii) => (
                                      <div key={ii} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                                        {item.status === "pass" ? <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" /> : <AlertCircle className={`h-4 w-4 mt-0.5 flex-shrink-0 ${item.severity === "critical" ? "text-red-600" : "text-yellow-600"}`} />}
                                        <div><p className="text-sm font-semibold">{item.name}</p><p className="text-xs text-muted-foreground">{item.message}</p></div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </AccordionContent>
                        </Card>
                      </AccordionItem>
                    ))}
                  </Accordion>
                  <div className="flex gap-3">
                    <Button variant="outline" onClick={() => setAuditResult(null)} className="flex-1">New Audit</Button>
                    <Button className="flex-1" onClick={() => {
                      let csv = `SEO Audit: ${auditResult.url}\nScore: ${auditResult.score}/100\n\n`;
                      auditResult.pages.forEach((p, i) => { csv += `PAGE ${i + 1}: ${p.url}\nScore: ${p.score}/100\n`; p.checks.forEach(c => c.items.forEach(it => { csv += `"${c.category}","${it.name}","${it.status.toUpperCase()}","${it.message}"\n`; })); csv += "\n"; });
                      const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" })); a.download = `seo-audit-${Date.now()}.csv`; a.click();
                    }}>Download CSV Report</Button>
                  </div>
                </motion.div>
              )}
            </div>
          </TabsContent>

          {/* ── Sitemap ── */}
          <TabsContent value="sitemap">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="flex flex-col h-[600px]">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-lg">Paste Sitemap XML</CardTitle>
                  <Button onClick={handleSitemapParse} disabled={isLoading || !sitemapXml}>{isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Search className="h-4 w-4 mr-2" />}Parse</Button>
                </CardHeader>
                <CardContent className="flex-1 p-0"><Textarea placeholder='<?xml version="1.0"?>...' className="h-full w-full resize-none border-0 rounded-none focus-visible:ring-0 p-4 font-mono text-sm" value={sitemapXml} onChange={(e) => setSitemapXml(e.target.value)} /></CardContent>
              </Card>
              <Card className="flex flex-col h-[600px]">
                <CardHeader><CardTitle className="text-lg">Parsed URLs {sitemapResult && `(${sitemapResult.count})`}</CardTitle></CardHeader>
                <CardContent className="flex-1 p-0"><ScrollArea className="h-full"><div className="p-4 space-y-2">{sitemapResult ? sitemapResult.urls.map((u, i) => <div key={i} className="p-2 bg-muted/50 rounded text-sm break-all border">{u}</div>) : <p className="text-muted-foreground italic text-center py-8">Parsed URLs appear here...</p>}</div></ScrollArea></CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ── Keyword Density ── */}
          <TabsContent value="keyword">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="flex flex-col h-[600px]">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-lg">Content to Analyze</CardTitle>
                  <Button onClick={handleKeywordDensity} disabled={isLoading || !keywordText}>{isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <BarChart3 className="h-4 w-4 mr-2" />}Analyze</Button>
                </CardHeader>
                <CardContent className="flex-1 p-0"><Textarea placeholder="Paste your article or page content..." className="h-full w-full resize-none border-0 rounded-none focus-visible:ring-0 p-4 text-sm" value={keywordText} onChange={(e) => setKeywordText(e.target.value)} /></CardContent>
              </Card>
              <Card className="flex flex-col h-[600px]">
                <CardHeader><CardTitle className="text-lg">Keyword Density {keywordResult && `(${keywordResult.totalWords} words)`}</CardTitle></CardHeader>
                <CardContent className="flex-1 p-0"><ScrollArea className="h-full"><div className="p-4 space-y-3">{keywordResult ? keywordResult.density.map((it, i) => <div key={i} className="flex items-center justify-between p-3 bg-muted/50 rounded border"><span className="font-medium text-primary">{it.word}</span><div className="flex gap-4 text-sm text-muted-foreground"><span>{it.count}×</span><span className="font-bold">{it.percentage}%</span></div></div>) : <p className="text-muted-foreground italic text-center py-8">Analysis will appear here...</p>}</div></ScrollArea></CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ── Robots.txt ── */}
          <TabsContent value="robots">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="flex flex-col h-[600px]">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-lg">Configure Rules</CardTitle>
                  <Button onClick={generateRobots}>Generate</Button>
                </CardHeader>
                <CardContent className="p-6 space-y-4 overflow-y-auto">
                  <div className="space-y-2"><Label>Sitemap URL</Label><Input placeholder="https://example.com/sitemap.xml" value={robotsSitemap} onChange={(e) => setRobotsSitemap(e.target.value)} /></div>
                  {robotsRules.map((rule, idx) => (
                    <div key={idx} className="p-4 border rounded-lg space-y-3 relative bg-muted/30">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1"><Label className="text-xs">User Agent</Label><Input value={rule.agent} onChange={(e) => { const n = [...robotsRules]; n[idx].agent = e.target.value; setRobotsRules(n); }} /></div>
                        <div className="space-y-1"><Label className="text-xs">Path</Label><Input value={rule.path} onChange={(e) => { const n = [...robotsRules]; n[idx].path = e.target.value; setRobotsRules(n); }} /></div>
                      </div>
                      <div className="flex items-center gap-2"><Checkbox id={`allow-${idx}`} checked={rule.allow} onCheckedChange={(c) => { const n = [...robotsRules]; n[idx].allow = !!c; setRobotsRules(n); }} /><Label htmlFor={`allow-${idx}`} className="text-sm">Allow Access</Label></div>
                      <Button variant="ghost" size="sm" className="absolute top-2 right-2 h-7 w-7 p-0" onClick={() => setRobotsRules(robotsRules.filter((_, i) => i !== idx))}>×</Button>
                    </div>
                  ))}
                  <Button variant="outline" className="w-full" onClick={() => setRobotsRules([...robotsRules, { agent: "*", allow: false, path: "/admin" }])}>+ Add Rule</Button>
                </CardContent>
              </Card>
              <Card className="flex flex-col h-[600px]">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-lg">Generated robots.txt</CardTitle>
                  <Button variant="outline" size="sm" disabled={!generatedRobots} onClick={() => { navigator.clipboard.writeText(generatedRobots); toast({ title: "Copied!" }); }}>Copy</Button>
                </CardHeader>
                <CardContent className="flex-1 p-0"><Textarea className="h-full w-full resize-none border-0 rounded-none focus-visible:ring-0 p-4 font-mono text-sm bg-muted/20" value={generatedRobots} readOnly /></CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ── Social Preview ── */}
          <TabsContent value="social">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-lg">Fetch Social Preview</CardTitle>
                  <Button onClick={fetchSocialPreview} disabled={isLoading || !previewUrl}>{isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}Preview</Button>
                </CardHeader>
                <CardContent className="p-6 space-y-3"><Label>Page URL</Label><Input placeholder="https://example.com" value={previewUrl} onChange={(e) => setPreviewUrl(e.target.value)} /></CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="text-lg">Facebook / OG Preview</CardTitle></CardHeader>
                <CardContent className="p-6">{socialData ? (<div className="border rounded-xl overflow-hidden shadow-sm bg-white text-black max-w-[500px] mx-auto">{socialData.image ? <img src={socialData.image} alt="og" className="w-full h-auto border-b" /> : <div className="w-full h-40 bg-muted flex items-center justify-center border-b text-sm text-muted-foreground">No Image</div>}<div className="p-3 bg-[#f2f3f5]"><p className="text-xs text-gray-500 uppercase font-semibold">{socialData.site_name || new URL(socialData.url).hostname}</p><h4 className="font-bold text-lg leading-tight mt-1 line-clamp-1">{socialData.title}</h4><p className="text-sm text-gray-600 mt-1 line-clamp-2">{socialData.description}</p></div></div>) : <p className="text-muted-foreground italic text-center py-8">Fetch a URL to see the preview</p>}</CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ── Keyword AI ── */}
          <TabsContent value="keywords-gen">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-lg">AI Keyword Suggest</CardTitle>
                  <Button onClick={generateKeywords} disabled={isLoading || !targetTitle}>{isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}Generate</Button>
                </CardHeader>
                <CardContent className="p-6 space-y-3"><Label>Page Title</Label><Input placeholder="e.g. Best wireless headphones 2024" value={targetTitle} onChange={(e) => setTargetTitle(e.target.value)} /></CardContent>
              </Card>
              <Card className="flex flex-col h-[400px]">
                <CardHeader className="flex flex-row items-center justify-between"><CardTitle className="text-lg">Keywords ({suggestedKeywords.length})</CardTitle><Button variant="outline" size="sm" disabled={!suggestedKeywords.length} onClick={() => { navigator.clipboard.writeText(suggestedKeywords.join(", ")); toast({ title: "Copied!" }); }}>Copy All</Button></CardHeader>
                <CardContent className="flex-1 p-0"><ScrollArea className="h-full"><div className="p-4 flex flex-wrap gap-2">{suggestedKeywords.length ? suggestedKeywords.map((k, i) => <div key={i} className="px-3 py-1.5 bg-primary/10 text-primary border border-primary/20 rounded-full text-sm">{k}</div>) : <p className="text-muted-foreground italic text-center py-8 w-full">Keywords appear here...</p>}</div></ScrollArea></CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ── Broken Links ── */}
          <TabsContent value="broken-links">
            <div className="space-y-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div><CardTitle className="text-lg flex items-center gap-2"><Link2 className="h-5 w-5 text-primary" />Broken Link Checker</CardTitle><p className="text-sm text-muted-foreground mt-1">Crawls a page and checks every link for 404s and errors</p></div>
                  <Button onClick={checkBrokenLinks} disabled={isLoading || !linkCheckUrl} className="min-w-[130px]">{isLoading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Checking...</> : <><Search className="h-4 w-4 mr-2" />Check Links</>}</Button>
                </CardHeader>
                <CardContent className="p-6"><Input placeholder="https://example.com" value={linkCheckUrl} onChange={(e) => setLinkCheckUrl(e.target.value)} onKeyDown={(e) => e.key === "Enter" && checkBrokenLinks()} /></CardContent>
              </Card>
              {linkResults && (<>
                <div className="grid grid-cols-3 gap-4">
                  <Card className="text-center p-4"><p className="text-3xl font-bold">{linkResults.total}</p><p className="text-sm text-muted-foreground mt-1">Total</p></Card>
                  <Card className="text-center p-4"><p className="text-3xl font-bold text-green-600">{linkResults.total - linkResults.brokenCount}</p><p className="text-sm text-muted-foreground mt-1">Working</p></Card>
                  <Card className="text-center p-4"><p className="text-3xl font-bold text-red-600">{linkResults.brokenCount}</p><p className="text-sm text-muted-foreground mt-1">Broken</p></Card>
                </div>
                <Card><CardContent className="p-0"><ScrollArea className="h-[400px]"><div className="divide-y">{linkResults.results.sort((a, b) => Number(b.broken) - Number(a.broken)).map((lk, i) => (<div key={i} className={`flex items-center gap-3 p-3 ${lk.broken ? "bg-red-50" : ""}`}>{lk.broken ? <XCircle className="h-4 w-4 text-red-500 flex-shrink-0" /> : <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />}<a href={lk.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline break-all flex-1 truncate">{lk.url}</a><Badge variant="outline" className="text-xs flex-shrink-0">{lk.type}</Badge>{getStatusBadge(lk.status, lk.broken)}</div>))}</div></ScrollArea></CardContent></Card>
              </>)}
            </div>
          </TabsContent>

          {/* ── SERP ── */}
          <TabsContent value="serp">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card>
                <CardHeader><CardTitle className="text-lg">SERP Simulator</CardTitle></CardHeader>
                <CardContent className="space-y-4 p-6">
                  <div className="space-y-2"><Label>Title <span className="text-xs text-muted-foreground">({serpTitle.length}/60)</span></Label><Input placeholder="My Awesome Page" value={serpTitle} onChange={(e) => setSerpTitle(e.target.value)} maxLength={70} /></div>
                  <div className="space-y-2"><Label>Description <span className="text-xs text-muted-foreground">({serpDesc.length}/160)</span></Label><Textarea placeholder="Compelling description..." value={serpDesc} onChange={(e) => setSerpDesc(e.target.value)} className="resize-none h-20" /></div>
                  <div className="space-y-2"><Label>URL</Label><Input placeholder="https://example.com/page" value={serpUrl} onChange={(e) => setSerpUrl(e.target.value)} /></div>
                  <div className="flex items-center gap-2"><Checkbox id="sr" checked={serpShowRating} onCheckedChange={(c) => setSerpShowRating(!!c)} /><Label htmlFor="sr">Show Star Rating</Label></div>
                  {serpShowRating && (<div className="space-y-3 p-4 border rounded-lg bg-muted/30"><div className="space-y-2"><Label className="text-xs">Rating: {serpRating}</Label><Slider value={[serpRating]} min={1} max={5} step={0.1} onValueChange={([v]) => setSerpRating(Math.round(v * 10) / 10)} /></div><div className="space-y-1"><Label className="text-xs">Reviews</Label><Input type="number" value={serpReviews} onChange={(e) => setSerpReviews(Number(e.target.value))} className="h-8" /></div></div>)}
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="text-lg">Google Preview</CardTitle></CardHeader>
                <CardContent className="p-6">
                  <div className="border rounded-xl p-5 bg-white text-black shadow-sm">
                    <p className="text-xs text-[#202124] mb-1 truncate">{serpUrl || "https://example.com"}</p>
                    <h3 className="text-[#1a0dab] text-xl leading-6 cursor-pointer hover:underline">{serpTitle || "Your Page Title"}</h3>
                    {serpShowRating && (<div className="flex items-center gap-2 my-1"><span className="text-sm text-[#70757a]">{serpRating}</span><div className="flex">{[1,2,3,4,5].map(s => <Star key={s} className={`h-3.5 w-3.5 ${s <= Math.round(serpRating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`} />)}</div><span className="text-sm text-[#70757a]">({serpReviews.toLocaleString()})</span></div>)}
                    <p className="text-sm text-[#4d5156] mt-1 line-clamp-2">{serpDesc || "Your meta description will appear here..."}</p>
                  </div>
                  <div className="mt-5 space-y-2">
                    {[{ ok: serpTitle.length >= 10 && serpTitle.length <= 60, msg: `Title: ${serpTitle.length === 0 ? "Enter title" : serpTitle.length < 10 ? "Too short" : serpTitle.length <= 60 ? "Good ✓" : "Too long"}` }, { ok: serpDesc.length >= 70 && serpDesc.length <= 160, msg: `Description: ${serpDesc.length === 0 ? "Enter desc" : serpDesc.length < 70 ? "Too short" : serpDesc.length <= 160 ? "Good ✓" : "Too long"}` }, { ok: serpUrl.startsWith("https://"), msg: `URL: ${serpUrl.startsWith("https://") ? "HTTPS ✓" : "Use HTTPS"}` }].map(({ ok, msg }) => (
                      <div key={msg} className={`flex items-center gap-2 text-sm ${ok ? "text-green-600" : "text-yellow-600"}`}>{ok ? <CheckCircle className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}{msg}</div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ── Readability ── */}
          <TabsContent value="readability">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="flex flex-col h-[600px]">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-lg flex items-center gap-2"><BookOpen className="h-5 w-5 text-primary" />Readability Analyzer</CardTitle>
                  <Button onClick={analyzeReadability} disabled={isLoading || !readabilityText}>{isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <TrendingUp className="h-4 w-4 mr-2" />}Analyze</Button>
                </CardHeader>
                <CardContent className="flex-1 p-0"><Textarea placeholder="Paste your content here..." className="h-full w-full resize-none border-0 rounded-none focus-visible:ring-0 p-4 text-sm" value={readabilityText} onChange={(e) => setReadabilityText(e.target.value)} /></CardContent>
              </Card>
              <Card className="flex flex-col h-[600px] overflow-y-auto">
                <CardHeader><CardTitle className="text-lg">Results</CardTitle></CardHeader>
                <CardContent className="p-6">{readabilityResult ? (<div className="space-y-5">
                  <div className="text-center p-6 rounded-xl bg-muted/40 border">
                    <p className="text-sm text-muted-foreground mb-1">Flesch Reading Ease</p>
                    <p className={`text-5xl font-bold ${readabilityResult.fleschEase >= 70 ? "text-green-600" : readabilityResult.fleschEase >= 50 ? "text-yellow-600" : "text-red-600"}`}>{readabilityResult.fleschEase}</p>
                    <Badge className={`mt-2 ${readabilityResult.fleschEase >= 60 ? "bg-green-100 text-green-700" : readabilityResult.fleschEase >= 40 ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}`}>{readabilityResult.level}</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-3">{[["Grade", readabilityResult.fleschKincaidGrade], ["Words", readabilityResult.wordCount], ["Sentences", readabilityResult.sentenceCount], ["Avg W/S", readabilityResult.avgWordsPerSentence]].map(([l, v]) => <div key={String(l)} className="p-3 rounded-lg border text-center"><p className="text-xl font-bold">{v}</p><p className="text-xs text-muted-foreground">{l}</p></div>)}</div>
                  {readabilityResult.suggestions.length > 0 ? readabilityResult.suggestions.map((s, i) => <div key={i} className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800"><AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5 text-yellow-600" />{s}</div>) : <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800"><CheckCircle className="h-4 w-4 text-green-600" />Great job! Well-optimized content.</div>}
                </div>) : <p className="text-muted-foreground italic text-center py-12">Paste content and click Analyze</p>}</CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ── Meta Tags ── */}
          <TabsContent value="meta-tags">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-lg flex items-center gap-2"><Tag className="h-5 w-5 text-primary" />Meta Tag Generator</CardTitle>
                  <Button onClick={generateMetaTags} disabled={!metaTitle && !metaDesc}>Generate</Button>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="space-y-2"><Label>Title <span className="text-xs text-muted-foreground">({metaTitle.length}/60)</span></Label><Input placeholder="My Page" value={metaTitle} onChange={(e) => setMetaTitle(e.target.value)} /></div>
                  <div className="space-y-2"><Label>Description <span className="text-xs text-muted-foreground">({metaDesc.length}/160)</span></Label><Textarea placeholder="Clear description..." value={metaDesc} onChange={(e) => setMetaDesc(e.target.value)} className="resize-none h-20" /></div>
                  <div className="space-y-2"><Label>Canonical URL</Label><Input placeholder="https://example.com/page" value={metaUrl} onChange={(e) => setMetaUrl(e.target.value)} /></div>
                  <div className="space-y-2"><Label>OG Image URL</Label><Input placeholder="https://example.com/img.jpg" value={metaImage} onChange={(e) => setMetaImage(e.target.value)} /></div>
                  <div className="space-y-2"><Label>Author</Label><Input placeholder="John Doe" value={metaAuthor} onChange={(e) => setMetaAuthor(e.target.value)} /></div>
                  <div className="space-y-2"><Label>Keywords</Label><Input placeholder="seo, tools" value={metaKeywords} onChange={(e) => setMetaKeywords(e.target.value)} /></div>
                </CardContent>
              </Card>
              <Card className="flex flex-col h-[500px]">
                <CardHeader className="flex flex-row items-center justify-between"><CardTitle className="text-lg">Generated HTML</CardTitle><Button variant="outline" size="sm" disabled={!generatedMeta} onClick={() => { navigator.clipboard.writeText(generatedMeta); toast({ title: "Copied!" }); }}>Copy</Button></CardHeader>
                <CardContent className="flex-1 p-0"><Textarea className="h-full w-full resize-none border-0 rounded-none focus-visible:ring-0 p-4 font-mono text-xs bg-muted/20" value={generatedMeta} readOnly placeholder="Fill in the form and click Generate..." /></CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ── Schema ── */}
          <TabsContent value="schema">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-lg flex items-center gap-2"><Code2 className="h-5 w-5 text-primary" />Schema Generator</CardTitle>
                  <Button onClick={generateSchema}>Generate</Button>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="space-y-2"><Label>Type</Label><Select value={schemaType} onValueChange={(v) => { setSchemaType(v); setSchemaFields({}); setGeneratedSchema(""); }}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.entries(schemaTypes).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent></Select></div>
                  <div className="space-y-3 max-h-80 overflow-y-auto pr-1">{schemaTypes[schemaType]?.fields.map(f => (<div key={f.key} className="space-y-1"><Label className="text-xs">{f.label}</Label><Input placeholder={f.placeholder} value={schemaFields[f.key] || ""} onChange={(e) => setSchemaFields({ ...schemaFields, [f.key]: e.target.value })} className="h-8 text-sm" /></div>))}</div>
                </CardContent>
              </Card>
              <Card className="flex flex-col h-[500px]">
                <CardHeader className="flex flex-row items-center justify-between"><CardTitle className="text-lg">JSON-LD Output</CardTitle><Button variant="outline" size="sm" disabled={!generatedSchema} onClick={() => { navigator.clipboard.writeText(`<script type="application/ld+json">\n${generatedSchema}\n</script>`); toast({ title: "Copied!" }); }}>Copy</Button></CardHeader>
                <CardContent className="flex-1 p-0"><Textarea className="h-full w-full resize-none border-0 rounded-none focus-visible:ring-0 p-4 font-mono text-xs bg-muted/20" value={generatedSchema ? `<script type="application/ld+json">\n${generatedSchema}\n</script>` : ""} readOnly placeholder="Fill in the form and click Generate..." /></CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ── HTTP Headers ── */}
          <TabsContent value="http-headers">
            <div className="space-y-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div><CardTitle className="text-lg flex items-center gap-2"><Server className="h-5 w-5 text-primary" />HTTP Header Checker</CardTitle><p className="text-sm text-muted-foreground mt-1">Inspect security, caching, and SEO-related HTTP headers</p></div>
                  <Button onClick={checkHeaders} disabled={isLoading || !headerUrl} className="min-w-[130px]">{isLoading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Checking...</> : <><Server className="h-4 w-4 mr-2" />Check</>}</Button>
                </CardHeader>
                <CardContent className="p-6"><Input placeholder="https://example.com" value={headerUrl} onChange={(e) => setHeaderUrl(e.target.value)} onKeyDown={(e) => e.key === "Enter" && checkHeaders()} /></CardContent>
              </Card>
              {headerResult && (<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card><CardHeader><CardTitle className="text-lg flex items-center gap-3">Status <Badge className={`${headerResult.status < 300 ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>{headerResult.status} {headerResult.statusText}</Badge></CardTitle></CardHeader><CardContent><h4 className="font-semibold text-sm mb-3">Important SEO Headers</h4><div className="space-y-2">{headerResult.headers.filter(h => h.important).map((h, i) => <div key={i} className="p-2 rounded border bg-primary/5"><p className="text-xs font-mono font-bold text-primary">{h.key}</p><p className="text-xs text-muted-foreground break-all mt-0.5">{h.value}</p></div>)}{!headerResult.headers.filter(h => h.important).length && <p className="text-sm text-muted-foreground italic">No important headers found</p>}</div></CardContent></Card>
                <Card><CardHeader><CardTitle className="text-lg">All Headers ({headerResult.headers.length})</CardTitle></CardHeader><CardContent className="p-0"><ScrollArea className="h-[320px]"><div className="divide-y p-4 space-y-1">{headerResult.headers.map((h, i) => <div key={i} className="py-2"><p className="text-xs font-mono font-semibold">{h.key}</p><p className="text-xs text-muted-foreground break-all">{h.value}</p></div>)}</div></ScrollArea></CardContent></Card>
              </div>)}
            </div>
          </TabsContent>

          {/* ── Redirects ── */}
          <TabsContent value="redirects">
            <div className="space-y-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div><CardTitle className="text-lg flex items-center gap-2"><ArrowRight className="h-5 w-5 text-primary" />Redirect Chain Checker</CardTitle><p className="text-sm text-muted-foreground mt-1">Follow all redirects and see the full chain</p></div>
                  <Button onClick={checkRedirects} disabled={isLoading || !redirectUrl} className="min-w-[140px]">{isLoading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Checking...</> : <><ArrowRight className="h-4 w-4 mr-2" />Check</>}</Button>
                </CardHeader>
                <CardContent className="p-6"><Input placeholder="https://example.com" value={redirectUrl} onChange={(e) => setRedirectUrl(e.target.value)} onKeyDown={(e) => e.key === "Enter" && checkRedirects()} /></CardContent>
              </Card>
              {redirectChain && (<Card><CardHeader><CardTitle className="text-lg flex items-center gap-3">Redirect Chain <Badge className={redirectChain.redirectCount === 0 ? "bg-green-100 text-green-700" : redirectChain.redirectCount <= 2 ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}>{redirectChain.redirectCount} redirect{redirectChain.redirectCount !== 1 ? "s" : ""}</Badge>{redirectChain.redirectCount === 0 && <span className="text-xs text-green-600 flex items-center gap-1"><CheckCircle className="h-3 w-3" />No redirects!</span>}{redirectChain.redirectCount > 2 && <span className="text-xs text-red-600 flex items-center gap-1"><AlertTriangle className="h-3 w-3" />Too many!</span>}</CardTitle></CardHeader><CardContent><div className="space-y-2">{redirectChain.chain.map((step, i) => (<div key={i} className={`flex items-center gap-3 p-3 rounded-lg border ${getStatusColor(step.status)}`}><div className="w-7 h-7 rounded-full bg-white border flex items-center justify-center text-xs font-bold flex-shrink-0">{i + 1}</div>{getStatusIcon(step.status)}<a href={step.url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline break-all flex-1">{step.url}</a><Badge className={`flex-shrink-0 text-xs ${step.status < 300 ? "bg-green-100 text-green-700" : step.status < 400 ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}`}>{step.status}</Badge></div>))}</div>{redirectChain.redirectCount >= 1 && <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800"><strong>Tip:</strong> Each redirect adds latency. Link directly to the final URL for best SEO.</div>}</CardContent></Card>)}
            </div>
          </TabsContent>

          {/* ── Page Speed ── */}
          <TabsContent value="page-speed">
            <div className="space-y-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div><CardTitle className="text-lg flex items-center gap-2"><Zap className="h-5 w-5 text-primary" />Page Speed Analyzer</CardTitle><p className="text-sm text-muted-foreground mt-1">TTFB, compression, caching, resources, and SEO signals</p></div>
                  <Button onClick={analyzePageSpeed} disabled={isLoading || !pageSpeedUrl} className="min-w-[140px]">{isLoading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Analyzing...</> : <><Zap className="h-4 w-4 mr-2" />Analyze</>}</Button>
                </CardHeader>
                <CardContent className="p-6"><Input placeholder="https://example.com" value={pageSpeedUrl} onChange={(e) => setPageSpeedUrl(e.target.value)} onKeyDown={(e) => e.key === "Enter" && analyzePageSpeed()} /></CardContent>
              </Card>
              {pageSpeedResult && (() => {
                const s = pageSpeedResult;
                const scoreColor = s.score >= 80 ? "text-green-600" : s.score >= 50 ? "text-yellow-600" : "text-red-600";
                const scoreRing = s.score >= 80 ? "stroke-green-500" : s.score >= 50 ? "stroke-yellow-500" : "stroke-red-500";
                const ttfbColor = s.ttfb < 600 ? "text-green-600" : s.ttfb < 1500 ? "text-yellow-600" : "text-red-600";
                const circ = 2 * Math.PI * 44;
                return (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <Card className="flex flex-col items-center justify-center p-6">
                        <svg width="110" height="110" className="-rotate-90"><circle cx="55" cy="55" r="44" fill="none" stroke="currentColor" strokeWidth="8" className="text-muted/30" /><circle cx="55" cy="55" r="44" fill="none" strokeWidth="8" strokeDasharray={circ} strokeDashoffset={circ - (s.score / 100) * circ} strokeLinecap="round" className={`transition-all duration-700 ${scoreRing}`} /></svg>
                        <p className={`text-4xl font-black mt-2 ${scoreColor}`}>{s.score}</p><p className="text-xs text-muted-foreground">SEO Score</p>
                      </Card>
                      <div className="md:col-span-3 grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {[{ label: "TTFB", value: `${s.ttfb}ms`, color: ttfbColor, sub: s.ttfb < 600 ? "Excellent" : s.ttfb < 1500 ? "Moderate" : "Slow" }, { label: "HTML Size", value: `${s.htmlSizeKb}KB`, color: s.htmlSizeKb < 50 ? "text-green-600" : s.htmlSizeKb < 100 ? "text-yellow-600" : "text-red-600", sub: s.htmlSizeKb < 50 ? "Good" : "Large" }, { label: "Compression", value: s.isCompressed ? "On" : "Off", color: s.isCompressed ? "text-green-600" : "text-red-600", sub: s.isCompressed ? "gzip/br" : "Missing!" }, { label: "HTTPS", value: s.isHttps ? "Yes" : "No", color: s.isHttps ? "text-green-600" : "text-red-600", sub: s.isHttps ? "Secure" : "Insecure" }, { label: "Cache", value: s.hasCache ? "Yes" : "None", color: s.hasCache ? "text-green-600" : "text-yellow-600", sub: s.hasCache ? "Present" : "Missing" }, { label: "Mobile", value: s.hasViewport ? "Ready" : "No", color: s.hasViewport ? "text-green-600" : "text-red-600", sub: s.hasViewport ? "Viewport ✓" : "No viewport!" }].map(({ label, value, color, sub }) => <div key={label} className="p-3 rounded-xl border bg-card"><p className="text-xs font-semibold text-muted-foreground">{label}</p><p className={`text-xl font-black ${color}`}>{value}</p><p className="text-[10px] text-muted-foreground">{sub}</p></div>)}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Card><CardHeader><CardTitle className="text-base">Resource Counts</CardTitle></CardHeader><CardContent className="space-y-3">{[{ label: "Scripts", count: s.scriptCount, warn: 10 }, { label: "Stylesheets", count: s.styleCount, warn: 5 }, { label: "Images", count: s.imageCount, warn: 30 }, { label: "iFrames", count: s.iframeCount, warn: 2 }].map(({ label, count, warn }) => (<div key={label} className="flex items-center justify-between p-2 rounded-lg bg-muted/30"><span className="text-sm">{label}</span><div className="flex items-center gap-2"><div className="w-20 h-2 rounded-full bg-muted overflow-hidden"><div className="h-full bg-primary/60" style={{ width: `${Math.min(100, (count / (warn * 1.5)) * 100)}%` }} /></div><span className={`text-sm font-bold ${count > warn ? "text-red-500" : "text-green-600"}`}>{count}</span></div></div>))}</CardContent></Card>
                      <Card><CardHeader><CardTitle className="text-base">SEO Signals</CardTitle></CardHeader><CardContent className="space-y-3">{[{ l: "Title", v: s.title ? `"${s.title.slice(0, 35)}${s.title.length > 35 ? "…" : ""}"` : "Missing", ok: !!s.title }, { l: "Meta Desc", v: s.description ? "Present" : "Missing", ok: !!s.description }, { l: "Canonical", v: s.canonical ? "Present" : "Not found", ok: !!s.canonical }, { l: "H1", v: s.h1Count === 1 ? "1 (perfect)" : `${s.h1Count} (${s.h1Count === 0 ? "missing" : "too many"})`, ok: s.h1Count === 1 }, { l: "HSTS", v: s.hasHsts ? "Enabled" : "Missing", ok: s.hasHsts }, { l: "Server", v: s.server, ok: true }].map(({ l, v, ok }) => <div key={l} className="flex justify-between items-center py-1.5 border-b last:border-0"><div className="flex items-center gap-2 text-sm">{ok ? <CheckCircle className="h-3.5 w-3.5 text-green-500" /> : <XCircle className="h-3.5 w-3.5 text-red-500" />}{l}</div><span className="text-xs text-muted-foreground truncate max-w-[140px]">{v}</span></div>)}</CardContent></Card>
                    </div>
                    <Card><CardHeader><CardTitle className="text-base flex items-center gap-3"><AlertTriangle className="h-4 w-4 text-primary" />Issues <div className="flex gap-2"><Badge className="bg-red-100 text-red-700 text-xs">{s.issues.filter(i => i.type === "error").length} errors</Badge><Badge className="bg-yellow-100 text-yellow-700 text-xs">{s.issues.filter(i => i.type === "warning").length} warnings</Badge></div></CardTitle></CardHeader><CardContent className="space-y-2">{s.issues.map((issue, i) => <div key={i} className={`flex items-start gap-3 p-3 rounded-lg border ${issue.type === "error" ? "bg-red-50 border-red-200" : issue.type === "warning" ? "bg-yellow-50 border-yellow-200" : "bg-green-50 border-green-200"}`}>{issue.type === "error" ? <XCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" /> : issue.type === "warning" ? <AlertTriangle className="h-4 w-4 text-yellow-500 flex-shrink-0 mt-0.5" /> : <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />}<div><p className={`text-sm font-medium ${issue.type === "error" ? "text-red-800" : issue.type === "warning" ? "text-yellow-800" : "text-green-800"}`}>{issue.message}</p><p className={`text-xs mt-0.5 ${issue.type === "error" ? "text-red-600" : issue.type === "warning" ? "text-yellow-600" : "text-green-600"}`}>{issue.impact}</p></div></div>)}</CardContent></Card>
                  </div>
                );
              })()}
            </div>
          </TabsContent>

          {/* ── Rank Tracker ── */}
          <TabsContent value="rank-tracker">
            <div className="space-y-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div><CardTitle className="text-lg flex items-center gap-2"><Trophy className="h-5 w-5 text-primary" />Rank Tracker</CardTitle><p className="text-sm text-muted-foreground mt-1">Check search ranking for any keyword — 45-day history saved automatically</p></div>
                  <Button onClick={checkRanking} disabled={isLoading || !rankUrl || !rankKeyword} className="min-w-[140px]">{isLoading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Checking...</> : <><Search className="h-4 w-4 mr-2" />Check Rank</>}</Button>
                </CardHeader>
                <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Domain / URL</Label><Input placeholder="example.com" value={rankUrl} onChange={(e) => setRankUrl(e.target.value)} /></div>
                  <div className="space-y-2"><Label>Keyword</Label><Input placeholder="best image converter tool" value={rankKeyword} onChange={(e) => setRankKeyword(e.target.value)} /></div>
                </CardContent>
              </Card>
              {rankResult && (() => {
                const pos = rankResult.position;
                const posColor = !pos ? "text-muted-foreground" : pos <= 3 ? "text-green-600" : pos <= 10 ? "text-yellow-600" : pos <= 30 ? "text-orange-500" : "text-red-600";
                const chartData = [...rankHistory].reverse().map(r => ({ day: new Date(r.checkedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }), position: r.position }));
                const bestPos = rankHistory.reduce((b, r) => r.position && (!b || r.position < b) ? r.position : b, null as number | null);
                const worstPos = rankHistory.reduce((b, r) => r.position && (!b || r.position > b) ? r.position : b, null as number | null);
                return (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <Card className="flex flex-col items-center justify-center p-8 text-center">
                        <Trophy className={`h-8 w-8 mb-2 ${posColor}`} />
                        <p className={`text-6xl font-black ${posColor}`}>{pos ? `#${pos}` : "—"}</p>
                        <p className={`text-sm font-semibold mt-2 ${posColor}`}>{!pos ? "Not Found" : pos <= 3 ? "Top 3!" : pos <= 10 ? "Page 1" : pos <= 30 ? "Page 2–3" : "Low"}</p>
                      </Card>
                      <div className="sm:col-span-2 grid grid-cols-2 gap-4">
                        <Card className="p-4"><p className="text-xs text-muted-foreground">Domain</p><p className="font-bold truncate mt-1">{rankResult.url}</p></Card>
                        <Card className="p-4"><p className="text-xs text-muted-foreground">Keyword</p><p className="font-bold truncate mt-1">{rankResult.keyword}</p></Card>
                        <Card className="p-4"><p className="text-xs text-muted-foreground flex items-center gap-1"><TrendingUp className="h-3 w-3 text-green-500" />Best (45d)</p><p className="font-black text-2xl text-green-600">{bestPos ? `#${bestPos}` : "—"}</p></Card>
                        <Card className="p-4"><p className="text-xs text-muted-foreground flex items-center gap-1"><TrendingDown className="h-3 w-3 text-red-500" />Worst (45d)</p><p className="font-black text-2xl text-red-500">{worstPos ? `#${worstPos}` : "—"}</p></Card>
                      </div>
                    </div>
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-base flex items-center gap-2"><BarChart3 className="h-4 w-4 text-primary" />45-Day Ranking History <Badge variant="outline" className="text-xs">{rankHistory.length} checks</Badge></CardTitle>
                        <Button variant="outline" size="sm" onClick={() => fetchRankHistory(rankResult.url, rankResult.keyword)} className="gap-1.5 text-xs"><RefreshCw className="h-3 w-3" />Refresh</Button>
                      </CardHeader>
                      <CardContent>
                        {chartData.length >= 2 ? (<div className="h-56">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                              <XAxis dataKey="day" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                              <YAxis reversed tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `#${v}`} domain={["auto", "auto"]} />
                              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} formatter={(v: any) => [`#${v}`, "Position"]} />
                              {pos && <ReferenceLine y={pos} stroke="hsl(var(--primary))" strokeDasharray="4 2" />}
                              <Line type="monotone" dataKey="position" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={{ r: 4, fill: "hsl(var(--primary))" }} activeDot={{ r: 6 }} connectNulls={false} />
                            </LineChart>
                          </ResponsiveContainer>
                          <p className="text-xs text-muted-foreground text-center mt-2">Lower = higher ranking. Check regularly to build your history.</p>
                        </div>) : (<div className="h-36 flex flex-col items-center justify-center gap-2 text-center"><BarChart3 className="h-8 w-8 text-muted-foreground/30" /><p className="text-sm font-medium">Not enough data yet</p><p className="text-xs text-muted-foreground">Check the same keyword a few times to see the trend chart</p></div>)}
                      </CardContent>
                    </Card>
                    {rankHistory.length > 0 && (<Card><CardHeader><CardTitle className="text-base">Check History</CardTitle></CardHeader><CardContent className="p-0"><ScrollArea className="h-52"><table className="w-full text-sm"><thead className="sticky top-0 bg-muted/50"><tr className="border-b"><th className="text-left p-3 font-semibold">Date</th><th className="text-left p-3 font-semibold">Keyword</th><th className="text-center p-3 font-semibold">Position</th><th className="text-center p-3 font-semibold">Status</th></tr></thead><tbody>{rankHistory.map((r, i) => (<tr key={r.id} className={`border-b last:border-0 ${i === 0 ? "bg-primary/5" : ""}`}><td className="p-3 text-muted-foreground text-xs">{new Date(r.checkedAt).toLocaleString()}</td><td className="p-3 font-medium truncate max-w-[140px]">{r.keyword}</td><td className="p-3 text-center"><span className={`font-black ${!r.position ? "text-muted-foreground" : r.position <= 3 ? "text-green-600" : r.position <= 10 ? "text-yellow-600" : "text-orange-500"}`}>{r.position ? `#${r.position}` : "NF"}</span></td><td className="p-3 text-center"><Badge className={`text-xs ${!r.position ? "bg-muted text-muted-foreground" : r.position <= 3 ? "bg-green-100 text-green-700" : r.position <= 10 ? "bg-yellow-100 text-yellow-700" : "bg-orange-100 text-orange-700"}`}>{!r.position ? "NF" : r.position <= 3 ? "Top 3" : r.position <= 10 ? "Page 1" : `P${Math.ceil(r.position / 10)}`}</Badge></td></tr>))}</tbody></table></ScrollArea></CardContent></Card>)}
                    <Card className="bg-blue-50 border-blue-200"><CardContent className="p-4"><h4 className="font-semibold text-sm text-blue-800 mb-2 flex items-center gap-1.5"><TrendingUp className="h-4 w-4" />Improvement Tips</h4><div className="space-y-1 text-sm text-blue-700">{(!pos || pos > 30) && <p>• Not ranking well — optimize title, H1, and meta description for this keyword.</p>}{pos && pos > 10 && pos <= 30 && <p>• On page 2–3 — build backlinks and improve content depth.</p>}{pos && pos > 3 && pos <= 10 && <p>• Page 1! Add schema markup and improve CTR with a compelling title/description.</p>}{pos && pos <= 3 && <p>• Top 3! Keep content fresh and monitor competitors to maintain position.</p>}<p>• Results are from Bing search; actual Google rankings may vary slightly.</p></div></CardContent></Card>
                  </div>
                );
              })()}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
