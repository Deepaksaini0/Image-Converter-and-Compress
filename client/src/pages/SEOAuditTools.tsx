import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Search, FileCode, BarChart3, Loader2, Globe, Share2, Link2, Star, BookOpen, CheckCircle, XCircle, AlertTriangle, TrendingUp } from "lucide-react";
import { Link } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";

export default function SEOAuditTools() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  // Sitemap State
  const [sitemapXml, setSitemapXml] = useState("");
  const [sitemapResult, setSitemapResult] = useState<{ count: number; urls: string[] } | null>(null);

  // Keyword Density State
  const [keywordText, setKeywordText] = useState("");
  const [keywordResult, setKeywordResult] = useState<{ totalWords: number; density: { word: string; count: number; percentage: string }[] } | null>(null);

  // Robots.txt State
  const [robotsSitemap, setRobotsSitemap] = useState("");
  const [robotsRules, setRobotsRules] = useState([{ agent: "*", allow: true, path: "/" }]);
  const [generatedRobots, setGeneratedRobots] = useState("");

  // Social Preview State
  const [previewUrl, setPreviewUrl] = useState("");
  const [socialData, setSocialData] = useState<{ title: string; description: string; image: string; site_name: string; url: string } | null>(null);

  // Keyword Generator State
  const [targetTitle, setTargetTitle] = useState("");
  const [suggestedKeywords, setSuggestedKeywords] = useState<string[]>([]);

  // Broken Link Checker State
  const [linkCheckUrl, setLinkCheckUrl] = useState("");
  const [linkResults, setLinkResults] = useState<{ total: number; brokenCount: number; results: { url: string; status: number; broken: boolean; type: string; error?: string }[] } | null>(null);

  // SERP Simulator State
  const [serpTitle, setSerpTitle] = useState("");
  const [serpDesc, setSerpDesc] = useState("");
  const [serpUrl, setSerpUrl] = useState("");
  const [serpRating, setSerpRating] = useState(4.5);
  const [serpReviews, setSerpReviews] = useState(128);
  const [serpShowRating, setSerpShowRating] = useState(false);

  // Readability State
  const [readabilityText, setReadabilityText] = useState("");
  const [readabilityResult, setReadabilityResult] = useState<{
    wordCount: number; sentenceCount: number; syllableCount: number;
    avgWordsPerSentence: number; avgSyllablesPerWord: number;
    fleschEase: number; fleschKincaidGrade: number; level: string; levelColor: string; suggestions: string[];
  } | null>(null);

  const handleSitemapParse = async () => {
    if (!sitemapXml.trim()) return;
    setIsLoading(true);
    try {
      const res = await fetch("/api/seo/parse-sitemap", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ xml: sitemapXml }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setSitemapResult(data);
      toast({ title: "Sitemap Parsed", description: `Found ${data.count} URLs.` });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally { setIsLoading(false); }
  };

  const handleKeywordDensity = async () => {
    if (!keywordText.trim()) return;
    setIsLoading(true);
    try {
      const res = await fetch("/api/seo/keyword-density", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: keywordText }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setKeywordResult(data);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally { setIsLoading(false); }
  };

  const generateRobots = () => {
    let content = "";
    robotsRules.forEach(rule => {
      content += `User-agent: ${rule.agent}\n${rule.allow ? "Allow" : "Disallow"}: ${rule.path}\n\n`;
    });
    if (robotsSitemap) content += `Sitemap: ${robotsSitemap}\n`;
    setGeneratedRobots(content.trim());
    toast({ title: "Robots.txt Generated" });
  };

  const fetchSocialPreview = async () => {
    if (!previewUrl) return;
    setIsLoading(true);
    try {
      const res = await fetch("/api/seo/social-preview", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: previewUrl }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setSocialData(data);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally { setIsLoading(false); }
  };

  const generateKeywords = async () => {
    if (!targetTitle) return;
    setIsLoading(true);
    try {
      const res = await fetch("/api/seo/suggest-keywords", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: targetTitle }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setSuggestedKeywords(data.keywords);
      toast({ title: "Keywords Generated" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally { setIsLoading(false); }
  };

  const checkBrokenLinks = async () => {
    if (!linkCheckUrl) return;
    setIsLoading(true);
    setLinkResults(null);
    try {
      const res = await fetch("/api/seo/broken-links", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: linkCheckUrl }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setLinkResults(data);
      toast({ title: `Found ${data.brokenCount} broken link${data.brokenCount !== 1 ? "s" : ""} out of ${data.total} total.` });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally { setIsLoading(false); }
  };

  const analyzeReadability = async () => {
    if (!readabilityText.trim()) return;
    setIsLoading(true);
    try {
      const res = await fetch("/api/seo/readability", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: readabilityText }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setReadabilityResult(data);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally { setIsLoading(false); }
  };

  const getReadabilityColor = (ease: number) => {
    if (ease >= 70) return "text-green-600";
    if (ease >= 50) return "text-yellow-600";
    return "text-red-600";
  };

  const getStatusBadge = (status: number, broken: boolean) => {
    if (!broken) return <Badge className="bg-green-100 text-green-700 text-xs">{status} OK</Badge>;
    if (status === 0) return <Badge variant="destructive" className="text-xs">Connection Error</Badge>;
    return <Badge variant="destructive" className="text-xs">{status}</Badge>;
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="icon" className="hover-elevate">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-display font-bold text-black">SEO Utility Tools</h1>
            <p className="text-muted-foreground">Comprehensive SEO management suite</p>
          </div>
        </div>

        <Tabs defaultValue="sitemap" className="w-full">
          <TabsList className="flex flex-wrap h-auto gap-1 mb-8 bg-muted p-1">
            <TabsTrigger value="sitemap" className="flex items-center gap-2 text-xs sm:text-sm">
              <FileCode className="h-3 w-3 sm:h-4 sm:w-4" /> Sitemap
            </TabsTrigger>
            <TabsTrigger value="keyword" className="flex items-center gap-2 text-xs sm:text-sm">
              <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4" /> Keywords
            </TabsTrigger>
            <TabsTrigger value="robots" className="flex items-center gap-2 text-xs sm:text-sm">
              <Globe className="h-3 w-3 sm:h-4 sm:w-4" /> Robots.txt
            </TabsTrigger>
            <TabsTrigger value="social" className="flex items-center gap-2 text-xs sm:text-sm">
              <Share2 className="h-3 w-3 sm:h-4 sm:w-4" /> Social Preview
            </TabsTrigger>
            <TabsTrigger value="keywords-gen" className="flex items-center gap-2 text-xs sm:text-sm">
              <Search className="h-3 w-3 sm:h-4 sm:w-4" /> Keyword Suggest
            </TabsTrigger>
            <TabsTrigger value="broken-links" className="flex items-center gap-2 text-xs sm:text-sm">
              <Link2 className="h-3 w-3 sm:h-4 sm:w-4" /> Broken Links
            </TabsTrigger>
            <TabsTrigger value="serp" className="flex items-center gap-2 text-xs sm:text-sm">
              <Star className="h-3 w-3 sm:h-4 sm:w-4" /> SERP Preview
            </TabsTrigger>
            <TabsTrigger value="readability" className="flex items-center gap-2 text-xs sm:text-sm">
              <BookOpen className="h-3 w-3 sm:h-4 sm:w-4" /> Readability
            </TabsTrigger>
          </TabsList>

          {/* Sitemap */}
          <TabsContent value="sitemap">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="flex flex-col h-[600px]">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-lg">Paste Sitemap XML</CardTitle>
                  <Button onClick={handleSitemapParse} disabled={isLoading || !sitemapXml}>
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Search className="h-4 w-4 mr-2" />}
                    Parse Sitemap
                  </Button>
                </CardHeader>
                <CardContent className="flex-1 p-0">
                  <Textarea placeholder='<?xml version="1.0" encoding="UTF-8"?>...' className="h-full w-full resize-none border-0 rounded-none focus-visible:ring-0 p-4 font-mono text-sm" value={sitemapXml} onChange={(e) => setSitemapXml(e.target.value)} />
                </CardContent>
              </Card>
              <Card className="flex flex-col h-[600px]">
                <CardHeader><CardTitle className="text-lg">Parsed URLs {sitemapResult && `(${sitemapResult.count})`}</CardTitle></CardHeader>
                <CardContent className="flex-1 p-0">
                  <ScrollArea className="h-full">
                    <div className="p-4 space-y-2">
                      {sitemapResult ? sitemapResult.urls.map((url, i) => (
                        <div key={i} className="p-2 bg-muted/50 rounded text-sm break-all border">{url}</div>
                      )) : <p className="text-muted-foreground italic text-center py-8">Result will appear here...</p>}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Keywords */}
          <TabsContent value="keyword">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="flex flex-col h-[600px]">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-lg">Content to Analyze</CardTitle>
                  <Button onClick={handleKeywordDensity} disabled={isLoading || !keywordText}>
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <BarChart3 className="h-4 w-4 mr-2" />}
                    Analyze Density
                  </Button>
                </CardHeader>
                <CardContent className="flex-1 p-0">
                  <Textarea placeholder="Paste your article or page content here..." className="h-full w-full resize-none border-0 rounded-none focus-visible:ring-0 p-4 text-sm" value={keywordText} onChange={(e) => setKeywordText(e.target.value)} />
                </CardContent>
              </Card>
              <Card className="flex flex-col h-[600px]">
                <CardHeader><CardTitle className="text-lg">Keyword Density {keywordResult && `(Total Words: ${keywordResult.totalWords})`}</CardTitle></CardHeader>
                <CardContent className="flex-1 p-0">
                  <ScrollArea className="h-full">
                    <div className="p-4">
                      {keywordResult ? (
                        <div className="space-y-3">
                          {keywordResult.density.map((item, i) => (
                            <div key={i} className="flex items-center justify-between p-3 bg-muted/50 rounded border">
                              <span className="font-medium text-primary">{item.word}</span>
                              <div className="flex gap-4 text-sm text-muted-foreground">
                                <span>Count: {item.count}</span>
                                <span className="font-bold">{item.percentage}%</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : <p className="text-muted-foreground italic text-center py-8">Analysis will appear here...</p>}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Robots.txt */}
          <TabsContent value="robots">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="flex flex-col h-[600px]">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-lg">Configure Rules</CardTitle>
                  <Button onClick={generateRobots}>Generate</Button>
                </CardHeader>
                <CardContent className="p-6 space-y-6 overflow-y-auto">
                  <div className="space-y-2">
                    <Label>Sitemap URL</Label>
                    <Input placeholder="https://example.com/sitemap.xml" value={robotsSitemap} onChange={(e) => setRobotsSitemap(e.target.value)} />
                  </div>
                  {robotsRules.map((rule, idx) => (
                    <div key={idx} className="p-4 border rounded-lg space-y-4 relative bg-muted/30">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>User Agent</Label>
                          <Input value={rule.agent} onChange={(e) => { const n = [...robotsRules]; n[idx].agent = e.target.value; setRobotsRules(n); }} />
                        </div>
                        <div className="space-y-2">
                          <Label>Path</Label>
                          <Input value={rule.path} onChange={(e) => { const n = [...robotsRules]; n[idx].path = e.target.value; setRobotsRules(n); }} />
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Checkbox id={`allow-${idx}`} checked={rule.allow} onCheckedChange={(checked) => { const n = [...robotsRules]; n[idx].allow = !!checked; setRobotsRules(n); }} />
                        <Label htmlFor={`allow-${idx}`}>Allow Access</Label>
                      </div>
                      <Button variant="ghost" size="sm" className="absolute top-2 right-2 h-8 w-8 p-0" onClick={() => setRobotsRules(robotsRules.filter((_, i) => i !== idx))}>×</Button>
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
                <CardContent className="flex-1 p-0">
                  <Textarea className="h-full w-full resize-none border-0 rounded-none focus-visible:ring-0 p-4 font-mono text-sm bg-muted/30" value={generatedRobots} readOnly />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Social Preview */}
          <TabsContent value="social">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="flex flex-col h-[600px]">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-lg">Fetch Preview</CardTitle>
                  <Button onClick={fetchSocialPreview} disabled={isLoading || !previewUrl}>
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Search className="h-4 w-4 mr-2" />}Preview
                  </Button>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="space-y-2">
                    <Label>Page URL</Label>
                    <Input placeholder="https://example.com" value={previewUrl} onChange={(e) => setPreviewUrl(e.target.value)} />
                  </div>
                </CardContent>
              </Card>
              <Card className="flex flex-col h-[600px]">
                <CardHeader><CardTitle className="text-lg">Facebook Preview</CardTitle></CardHeader>
                <CardContent className="p-6">
                  {socialData ? (
                    <div className="border rounded-xl overflow-hidden shadow-sm bg-white text-black max-w-[500px] mx-auto">
                      {socialData.image ? <img src={socialData.image} alt="Preview" className="w-full h-auto border-b" /> : <div className="w-full h-48 bg-muted flex items-center justify-center border-b">No Image Found</div>}
                      <div className="p-3 bg-[#f2f3f5]">
                        <p className="text-xs text-gray-500 uppercase font-semibold">{socialData.site_name || new URL(socialData.url).hostname}</p>
                        <h4 className="font-bold text-lg leading-tight mt-1 line-clamp-1">{socialData.title}</h4>
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">{socialData.description}</p>
                      </div>
                    </div>
                  ) : <p className="text-muted-foreground italic text-center py-8">Fetch a URL to see how it looks on social media</p>}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Keyword Suggest */}
          <TabsContent value="keywords-gen">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="flex flex-col h-[600px]">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-lg">Target Title</CardTitle>
                  <Button onClick={generateKeywords} disabled={isLoading || !targetTitle}>
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Search className="h-4 w-4 mr-2" />}Get Keywords
                  </Button>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="space-y-2">
                    <Label>Page Title</Label>
                    <Input placeholder="e.g. Best wireless headphones 2024" value={targetTitle} onChange={(e) => setTargetTitle(e.target.value)} />
                  </div>
                  <p className="text-sm text-muted-foreground italic">I'll use AI to analyze the title and suggest 20 high-performing keywords.</p>
                </CardContent>
              </Card>
              <Card className="flex flex-col h-[600px]">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-lg">Suggested Keywords</CardTitle>
                  <Button variant="outline" size="sm" disabled={suggestedKeywords.length === 0} onClick={() => { navigator.clipboard.writeText(suggestedKeywords.join(", ")); toast({ title: "Copied to clipboard" }); }}>Copy All</Button>
                </CardHeader>
                <CardContent className="flex-1 p-0">
                  <ScrollArea className="h-full">
                    <div className="p-4 flex flex-wrap gap-2">
                      {suggestedKeywords.length > 0 ? suggestedKeywords.map((kw, i) => (
                        <div key={i} className="px-3 py-1.5 bg-primary/10 text-primary border border-primary/20 rounded-full text-sm font-medium">{kw}</div>
                      )) : <p className="text-muted-foreground italic text-center py-8 w-full">Keywords will appear here after generation</p>}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Broken Link Checker */}
          <TabsContent value="broken-links">
            <div className="space-y-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2"><Link2 className="h-5 w-5 text-primary" />Broken Link Checker</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">Crawls a webpage and checks all links for 404s and connection errors</p>
                  </div>
                  <Button onClick={checkBrokenLinks} disabled={isLoading || !linkCheckUrl} className="min-w-[120px]">
                    {isLoading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Checking...</> : <><Search className="h-4 w-4 mr-2" />Check Links</>}
                  </Button>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="flex gap-3">
                    <Input placeholder="https://example.com" value={linkCheckUrl} onChange={(e) => setLinkCheckUrl(e.target.value)} onKeyDown={(e) => e.key === "Enter" && checkBrokenLinks()} className="flex-1" />
                  </div>
                </CardContent>
              </Card>

              {linkResults && (
                <>
                  <div className="grid grid-cols-3 gap-4">
                    <Card className="text-center p-4">
                      <p className="text-3xl font-bold">{linkResults.total}</p>
                      <p className="text-sm text-muted-foreground mt-1">Total Links</p>
                    </Card>
                    <Card className="text-center p-4 border-green-200">
                      <p className="text-3xl font-bold text-green-600">{linkResults.total - linkResults.brokenCount}</p>
                      <p className="text-sm text-muted-foreground mt-1">Working</p>
                    </Card>
                    <Card className="text-center p-4 border-red-200">
                      <p className="text-3xl font-bold text-red-600">{linkResults.brokenCount}</p>
                      <p className="text-sm text-muted-foreground mt-1">Broken</p>
                    </Card>
                  </div>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <CardTitle className="text-lg">All Links</CardTitle>
                      <div className="flex gap-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><CheckCircle className="h-3 w-3 text-green-500" />Working</span>
                        <span className="flex items-center gap-1"><XCircle className="h-3 w-3 text-red-500" />Broken</span>
                      </div>
                    </CardHeader>
                    <CardContent className="p-0">
                      <ScrollArea className="h-[400px]">
                        <div className="divide-y">
                          {linkResults.results.sort((a, b) => Number(b.broken) - Number(a.broken)).map((link, i) => (
                            <div key={i} className={`flex items-center gap-3 p-3 ${link.broken ? "bg-red-50" : ""}`}>
                              {link.broken ? <XCircle className="h-4 w-4 text-red-500 flex-shrink-0" /> : <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />}
                              <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline break-all flex-1 min-w-0 truncate">{link.url}</a>
                              <Badge variant="outline" className="text-xs flex-shrink-0">{link.type}</Badge>
                              {getStatusBadge(link.status, link.broken)}
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
          </TabsContent>

          {/* SERP Simulator */}
          <TabsContent value="serp">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="h-fit">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2"><Star className="h-5 w-5 text-primary" />SERP Simulator</CardTitle>
                  <p className="text-sm text-muted-foreground">Preview how your page looks in Google search results</p>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="space-y-2">
                    <Label>Page Title <span className="text-muted-foreground text-xs">({serpTitle.length}/60)</span></Label>
                    <Input placeholder="My Amazing Page Title" value={serpTitle} onChange={(e) => setSerpTitle(e.target.value)} maxLength={70} />
                    {serpTitle.length > 60 && <p className="text-xs text-yellow-600 flex items-center gap-1"><AlertTriangle className="h-3 w-3" />Title may be truncated in Google (over 60 chars)</p>}
                  </div>
                  <div className="space-y-2">
                    <Label>Meta Description <span className="text-muted-foreground text-xs">({serpDesc.length}/160)</span></Label>
                    <Textarea placeholder="A compelling description of your page..." value={serpDesc} onChange={(e) => setSerpDesc(e.target.value)} maxLength={200} className="resize-none h-24" />
                    {serpDesc.length > 160 && <p className="text-xs text-yellow-600 flex items-center gap-1"><AlertTriangle className="h-3 w-3" />Description may be truncated (over 160 chars)</p>}
                  </div>
                  <div className="space-y-2">
                    <Label>Page URL</Label>
                    <Input placeholder="https://example.com/your-page" value={serpUrl} onChange={(e) => setSerpUrl(e.target.value)} />
                  </div>
                  <div className="flex items-center gap-3 pt-2">
                    <Checkbox id="show-rating" checked={serpShowRating} onCheckedChange={(c) => setSerpShowRating(!!c)} />
                    <Label htmlFor="show-rating">Show Star Rating / Rich Snippet</Label>
                  </div>
                  {serpShowRating && (
                    <div className="space-y-4 border rounded-lg p-4 bg-muted/30">
                      <div className="space-y-2">
                        <Label>Rating: {serpRating} / 5</Label>
                        <Slider value={[serpRating]} min={1} max={5} step={0.1} onValueChange={([v]) => setSerpRating(Math.round(v * 10) / 10)} />
                      </div>
                      <div className="space-y-2">
                        <Label>Number of Reviews</Label>
                        <Input type="number" value={serpReviews} onChange={(e) => setSerpReviews(Number(e.target.value))} />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Google Search Preview</CardTitle>
                  <p className="text-sm text-muted-foreground">Live preview of your search result</p>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="border rounded-xl p-5 bg-white text-black shadow-sm font-sans max-w-[600px]">
                    <p className="text-xs text-[#202124] mb-1 truncate">{serpUrl || "https://example.com/your-page"}</p>
                    <h3 className="text-[#1a0dab] text-xl leading-6 cursor-pointer hover:underline line-clamp-1">
                      {serpTitle || "Your Page Title Will Appear Here"}
                    </h3>
                    {serpShowRating && (
                      <div className="flex items-center gap-2 mt-1 mb-1">
                        <span className="text-sm text-[#70757a]">{serpRating}</span>
                        <div className="flex">
                          {[1,2,3,4,5].map(s => (
                            <Star key={s} className={`h-3.5 w-3.5 ${s <= Math.round(serpRating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`} />
                          ))}
                        </div>
                        <span className="text-sm text-[#70757a]">({serpReviews.toLocaleString()} reviews)</span>
                      </div>
                    )}
                    <p className="text-sm text-[#4d5156] mt-1 line-clamp-2 leading-5">
                      {serpDesc || "Your meta description will appear here. Make it compelling and informative to improve click-through rates."}
                    </p>
                  </div>

                  <div className="mt-6 space-y-3">
                    <h4 className="font-semibold text-sm">SEO Tips</h4>
                    <div className="space-y-2 text-sm">
                      <div className={`flex items-center gap-2 ${serpTitle.length >= 10 && serpTitle.length <= 60 ? "text-green-600" : "text-yellow-600"}`}>
                        {serpTitle.length >= 10 && serpTitle.length <= 60 ? <CheckCircle className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                        Title: {serpTitle.length === 0 ? "Enter a title" : serpTitle.length < 10 ? "Too short (min 10)" : serpTitle.length <= 60 ? "Good length" : "Too long — may be cut off"}
                      </div>
                      <div className={`flex items-center gap-2 ${serpDesc.length >= 70 && serpDesc.length <= 160 ? "text-green-600" : "text-yellow-600"}`}>
                        {serpDesc.length >= 70 && serpDesc.length <= 160 ? <CheckCircle className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                        Description: {serpDesc.length === 0 ? "Enter a description" : serpDesc.length < 70 ? "Too short (min 70)" : serpDesc.length <= 160 ? "Good length" : "Too long — may be cut off"}
                      </div>
                      <div className={`flex items-center gap-2 ${serpUrl.startsWith("https://") ? "text-green-600" : "text-yellow-600"}`}>
                        {serpUrl.startsWith("https://") ? <CheckCircle className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                        URL: {serpUrl.startsWith("https://") ? "HTTPS — good for SEO" : "Use HTTPS for better ranking"}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Content Readability */}
          <TabsContent value="readability">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="flex flex-col h-[600px]">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2"><BookOpen className="h-5 w-5 text-primary" />Content Readability Analyzer</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">Flesch-Kincaid score with SEO improvement suggestions</p>
                  </div>
                  <Button onClick={analyzeReadability} disabled={isLoading || !readabilityText}>
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <TrendingUp className="h-4 w-4 mr-2" />}Analyze
                  </Button>
                </CardHeader>
                <CardContent className="flex-1 p-0">
                  <Textarea placeholder="Paste your article, blog post, or page content here to analyze readability..." className="h-full w-full resize-none border-0 rounded-none focus-visible:ring-0 p-4 text-sm" value={readabilityText} onChange={(e) => setReadabilityText(e.target.value)} />
                </CardContent>
              </Card>

              <Card className="flex flex-col h-[600px]">
                <CardHeader><CardTitle className="text-lg">Readability Results</CardTitle></CardHeader>
                <CardContent className="flex-1 overflow-y-auto p-6">
                  {readabilityResult ? (
                    <div className="space-y-6">
                      <div className="text-center p-6 rounded-xl bg-muted/40 border">
                        <p className="text-sm text-muted-foreground mb-1">Flesch Reading Ease</p>
                        <p className={`text-5xl font-bold ${getReadabilityColor(readabilityResult.fleschEase)}`}>{readabilityResult.fleschEase}</p>
                        <Badge className={`mt-2 ${readabilityResult.fleschEase >= 60 ? "bg-green-100 text-green-700" : readabilityResult.fleschEase >= 40 ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}`}>
                          {readabilityResult.level}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 rounded-lg border bg-muted/20 text-center">
                          <p className="text-xl font-bold">{readabilityResult.fleschKincaidGrade}</p>
                          <p className="text-xs text-muted-foreground">Grade Level</p>
                        </div>
                        <div className="p-3 rounded-lg border bg-muted/20 text-center">
                          <p className="text-xl font-bold">{readabilityResult.wordCount}</p>
                          <p className="text-xs text-muted-foreground">Word Count</p>
                        </div>
                        <div className="p-3 rounded-lg border bg-muted/20 text-center">
                          <p className="text-xl font-bold">{readabilityResult.sentenceCount}</p>
                          <p className="text-xs text-muted-foreground">Sentences</p>
                        </div>
                        <div className="p-3 rounded-lg border bg-muted/20 text-center">
                          <p className="text-xl font-bold">{readabilityResult.avgWordsPerSentence}</p>
                          <p className="text-xs text-muted-foreground">Avg Words/Sentence</p>
                        </div>
                      </div>

                      {readabilityResult.suggestions.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="font-semibold text-sm flex items-center gap-1"><TrendingUp className="h-4 w-4 text-primary" />SEO Suggestions</h4>
                          {readabilityResult.suggestions.map((s, i) => (
                            <div key={i} className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
                              <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5 text-yellow-600" />
                              {s}
                            </div>
                          ))}
                        </div>
                      )}
                      {readabilityResult.suggestions.length === 0 && (
                        <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          Great job! Your content looks well-optimized for readability.
                        </div>
                      )}
                    </div>
                  ) : <p className="text-muted-foreground italic text-center py-8">Paste your content and click Analyze to see results</p>}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
