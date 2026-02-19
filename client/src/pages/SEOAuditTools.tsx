import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Search, FileCode, BarChart3, Loader2, Globe, Share2 } from "lucide-react";
import { Link } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

export default function SEOAuditTools() {
  const { toast } = useToast();
  const [sitemapXml, setSitemapXml] = useState("");
  const [sitemapResult, setSitemapResult] = useState<{ count: number; urls: string[] } | null>(null);
  const [keywordText, setKeywordText] = useState("");
  const [keywordResult, setKeywordResult] = useState<{ totalWords: number; density: { word: string; count: number; percentage: string }[] } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

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

  const handleSitemapParse = async () => {
    if (!sitemapXml.trim()) return;
    setIsLoading(true);
    try {
      const res = await fetch("/api/seo/parse-sitemap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ xml: sitemapXml }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setSitemapResult(data);
      toast({ title: "Sitemap Parsed", description: `Found ${data.count} URLs.` });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeywordDensity = async () => {
    if (!keywordText.trim()) return;
    setIsLoading(true);
    try {
      const res = await fetch("/api/seo/keyword-density", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: keywordText }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setKeywordResult(data);
      toast({ title: "Analysis Complete", description: `Analyzed ${data.totalWords} words.` });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const generateRobots = () => {
    let content = "";
    robotsRules.forEach(rule => {
      content += `User-agent: ${rule.agent}\n${rule.allow ? "Allow" : "Disallow"}: ${rule.path}\n\n`;
    });
    if (robotsSitemap) {
      content += `Sitemap: ${robotsSitemap}\n`;
    }
    setGeneratedRobots(content.trim());
    toast({ title: "Robots.txt Generated" });
  };

  const fetchSocialPreview = async () => {
    if (!previewUrl) return;
    setIsLoading(true);
    try {
      const res = await fetch("/api/seo/social-preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: previewUrl }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setSocialData(data);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const generateKeywords = async () => {
    if (!targetTitle) return;
    setIsLoading(true);
    try {
      const res = await fetch("/api/seo/suggest-keywords", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: targetTitle }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setSuggestedKeywords(data.keywords);
      toast({ title: "Keywords Generated" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
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
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="sitemap" className="flex items-center gap-2">
              <FileCode className="h-4 w-4" /> Sitemap
            </TabsTrigger>
            <TabsTrigger value="keyword" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" /> Keywords
            </TabsTrigger>
            <TabsTrigger value="robots" className="flex items-center gap-2">
              <Globe className="h-4 w-4" /> Robots.txt
            </TabsTrigger>
            <TabsTrigger value="social" className="flex items-center gap-2">
              <Share2 className="h-4 w-4" /> Social Preview
            </TabsTrigger>
            <TabsTrigger value="keywords-gen" className="flex items-center gap-2">
              <Search className="h-4 w-4" /> Keyword Suggest
            </TabsTrigger>
          </TabsList>

          <TabsContent value="sitemap">
            {/* Existing Sitemap Content */}
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
                  <Textarea
                    placeholder='<?xml version="1.0" encoding="UTF-8"?>...'
                    className="h-full w-full resize-none border-0 rounded-none focus-visible:ring-0 p-4 font-mono text-sm"
                    value={sitemapXml}
                    onChange={(e) => setSitemapXml(e.target.value)}
                  />
                </CardContent>
              </Card>

              <Card className="flex flex-col h-[600px]">
                <CardHeader>
                  <CardTitle className="text-lg">Parsed URLs {sitemapResult && `(${sitemapResult.count})`}</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 p-0">
                  <ScrollArea className="h-full">
                    <div className="p-4 space-y-2">
                      {sitemapResult ? (
                        sitemapResult.urls.map((url, i) => (
                          <div key={i} className="p-2 bg-muted/50 rounded text-sm break-all border">
                            {url}
                          </div>
                        ))
                      ) : (
                        <p className="text-muted-foreground italic text-center py-8">Result will appear here...</p>
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="keyword">
            {/* Existing Keyword Content */}
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
                  <Textarea
                    placeholder="Paste your article or page content here..."
                    className="h-full w-full resize-none border-0 rounded-none focus-visible:ring-0 p-4 text-sm"
                    value={keywordText}
                    onChange={(e) => setKeywordText(e.target.value)}
                  />
                </CardContent>
              </Card>

              <Card className="flex flex-col h-[600px]">
                <CardHeader>
                  <CardTitle className="text-lg">Keyword Density {keywordResult && `(Total Words: ${keywordResult.totalWords})`}</CardTitle>
                </CardHeader>
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
                      ) : (
                        <p className="text-muted-foreground italic text-center py-8">Analysis will appear here...</p>
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

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
                    <Input 
                      placeholder="https://example.com/sitemap.xml" 
                      value={robotsSitemap}
                      onChange={(e) => setRobotsSitemap(e.target.value)}
                    />
                  </div>
                  
                  {robotsRules.map((rule, idx) => (
                    <div key={idx} className="p-4 border rounded-lg space-y-4 relative bg-muted/30">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>User Agent</Label>
                          <Input 
                            value={rule.agent} 
                            onChange={(e) => {
                              const newRules = [...robotsRules];
                              newRules[idx].agent = e.target.value;
                              setRobotsRules(newRules);
                            }}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Path</Label>
                          <Input 
                            value={rule.path} 
                            onChange={(e) => {
                              const newRules = [...robotsRules];
                              newRules[idx].path = e.target.value;
                              setRobotsRules(newRules);
                            }}
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Checkbox 
                          id={`allow-${idx}`} 
                          checked={rule.allow} 
                          onCheckedChange={(checked) => {
                            const newRules = [...robotsRules];
                            newRules[idx].allow = !!checked;
                            setRobotsRules(newRules);
                          }}
                        />
                        <Label htmlFor={`allow-${idx}`}>Allow Access</Label>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="absolute top-2 right-2 h-8 w-8 p-0"
                        onClick={() => setRobotsRules(robotsRules.filter((_, i) => i !== idx))}
                      >
                        ×
                      </Button>
                    </div>
                  ))}
                  
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => setRobotsRules([...robotsRules, { agent: "*", allow: false, path: "/admin" }])}
                  >
                    + Add Rule
                  </Button>
                </CardContent>
              </Card>

              <Card className="flex flex-col h-[600px]">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-lg">Generated robots.txt</CardTitle>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    disabled={!generatedRobots}
                    onClick={() => {
                      navigator.clipboard.writeText(generatedRobots);
                      toast({ title: "Copied!" });
                    }}
                  >
                    Copy
                  </Button>
                </CardHeader>
                <CardContent className="flex-1 p-0">
                  <Textarea 
                    className="h-full w-full resize-none border-0 rounded-none focus-visible:ring-0 p-4 font-mono text-sm bg-muted/30"
                    value={generatedRobots}
                    readOnly
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="social">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="flex flex-col h-[600px]">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-lg">Fetch Preview</CardTitle>
                  <Button onClick={fetchSocialPreview} disabled={isLoading || !previewUrl}>
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Search className="h-4 w-4 mr-2" />}
                    Preview
                  </Button>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="space-y-2">
                    <Label>Page URL</Label>
                    <Input 
                      placeholder="https://example.com" 
                      value={previewUrl}
                      onChange={(e) => setPreviewUrl(e.target.value)}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="flex flex-col h-[600px]">
                <CardHeader>
                  <CardTitle className="text-lg">Facebook Preview</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  {socialData ? (
                    <div className="border rounded-xl overflow-hidden shadow-sm bg-white text-black max-w-[500px] mx-auto">
                      {socialData.image ? (
                        <img src={socialData.image} alt="Preview" className="w-full h-auto border-b" />
                      ) : (
                        <div className="w-full h-48 bg-muted flex items-center justify-center border-b">
                          No Image Found
                        </div>
                      )}
                      <div className="p-3 bg-[#f2f3f5]">
                        <p className="text-xs text-gray-500 uppercase font-semibold">
                          {socialData.site_name || new URL(socialData.url).hostname}
                        </p>
                        <h4 className="font-bold text-lg leading-tight mt-1 line-clamp-1">
                          {socialData.title}
                        </h4>
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                          {socialData.description}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-muted-foreground italic text-center py-8">
                      Fetch a URL to see how it looks on social media
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="keywords-gen">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="flex flex-col h-[600px]">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-lg">Target Title</CardTitle>
                  <Button onClick={generateKeywords} disabled={isLoading || !targetTitle}>
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Search className="h-4 w-4 mr-2" />}
                    Get Keywords
                  </Button>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="space-y-2">
                    <Label>Page Title</Label>
                    <Input 
                      placeholder="e.g. Best wireless headphones 2024" 
                      value={targetTitle}
                      onChange={(e) => setTargetTitle(e.target.value)}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground italic">
                    I'll use AI to analyze the title and suggest 20 high-performing keywords.
                  </p>
                </CardContent>
              </Card>

              <Card className="flex flex-col h-[600px]">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-lg">Suggested Keywords</CardTitle>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    disabled={suggestedKeywords.length === 0}
                    onClick={() => {
                      navigator.clipboard.writeText(suggestedKeywords.join(", "));
                      toast({ title: "Copied to clipboard" });
                    }}
                  >
                    Copy All
                  </Button>
                </CardHeader>
                <CardContent className="flex-1 p-0">
                  <ScrollArea className="h-full">
                    <div className="p-4 flex flex-wrap gap-2">
                      {suggestedKeywords.length > 0 ? (
                        suggestedKeywords.map((kw, i) => (
                          <div key={i} className="px-3 py-1.5 bg-primary/10 text-primary border border-primary/20 rounded-full text-sm font-medium">
                            {kw}
                          </div>
                        ))
                      ) : (
                        <p className="text-muted-foreground italic text-center py-8 w-full">
                          Keywords will appear here after generation
                        </p>
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
