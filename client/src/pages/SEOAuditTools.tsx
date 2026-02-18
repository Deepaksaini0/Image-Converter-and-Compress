import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Search, FileCode, BarChart3, Loader2 } from "lucide-react";
import { Link } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function SEOAuditTools() {
  const { toast } = useToast();
  const [sitemapXml, setSitemapXml] = useState("");
  const [sitemapResult, setSitemapResult] = useState<{ count: number; urls: string[] } | null>(null);
  const [keywordText, setKeywordText] = useState("");
  const [keywordResult, setKeywordResult] = useState<{ totalWords: number; density: { word: string; count: number; percentage: string }[] } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

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
            <p className="text-muted-foreground">Analyze sitemaps and content keyword density</p>
          </div>
        </div>

        <Tabs defaultValue="sitemap" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="sitemap" className="flex items-center gap-2">
              <FileCode className="h-4 w-4" /> Sitemap Visualizer
            </TabsTrigger>
            <TabsTrigger value="keyword" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" /> Keyword Density
            </TabsTrigger>
          </TabsList>

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
        </Tabs>
      </div>
    </div>
  );
}
