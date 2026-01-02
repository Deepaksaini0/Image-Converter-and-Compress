import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { ArrowLeft, CheckCircle, AlertCircle, Loader } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface PageAudit {
  url: string;
  score: number;
  checks: {
    category: string;
    items: {
      name: string;
      status: "pass" | "warning" | "fail";
      message: string;
      severity: "critical" | "warning" | "info";
    }[];
  }[];
  recommendations: string[];
}

interface AuditResult {
  url: string;
  score: number;
  timestamp: string;
  pages: PageAudit[];
  recommendations: string[];
}

export default function SEOAuditPage() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AuditResult | null>(null);
  const { toast } = useToast();

  const handleAudit = async () => {
    if (!url.trim()) {
      toast({
        title: "Error",
        description: "Please enter a website URL",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/seo-audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() })
      });

      if (!response.ok) {
        throw new Error("Audit failed");
      }

      const data = await response.json();
      setResult(data);
      toast({
        title: "Audit Complete",
        description: `Website SEO Score: ${data.score}/100`
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to audit website. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600 dark:text-green-400";
    if (score >= 60) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return "bg-green-100 dark:bg-green-900/30";
    if (score >= 60) return "bg-yellow-100 dark:bg-yellow-900/30";
    return "bg-red-100 dark:bg-red-900/30";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/">
            <Button variant="ghost" size="icon" className="hover-elevate">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-4xl font-bold text-black dark:text-white">
              SEO Audit Platform
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Multi-page website analysis & optimization recommendations
            </p>
          </div>
        </div>

        {!result ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="p-8 space-y-6 max-w-2xl">
              <div>
                <Label className="text-black dark:text-white font-semibold mb-3 block text-lg">
                  Website URL
                </Label>
                <div className="flex gap-3">
                  <Input
                    placeholder="https://example.com"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAudit()}
                    className="flex-1 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-black dark:text-white"
                    data-testid="input-audit-url"
                  />
                  <Button
                    onClick={handleAudit}
                    disabled={loading || !url.trim()}
                    className="px-8"
                    data-testid="button-start-audit"
                  >
                    {loading ? (
                      <>
                        <Loader className="h-4 w-4 mr-2 animate-spin" />
                        Auditing...
                      </>
                    ) : (
                      "Audit Website"
                    )}
                  </Button>
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Full Website Audit</h3>
                <p className="text-sm text-blue-800 dark:text-blue-200 mb-4">
                  We'll crawl up to 5 internal pages and provide a detailed report for each.
                </p>
                <div className="grid grid-cols-2 gap-2 text-sm text-blue-800 dark:text-blue-200">
                  <div>✓ Title Tag & Meta Data</div>
                  <div>✓ H1 Tag Verification</div>
                  <div>✓ Image ALT Text Check</div>
                  <div>✓ Multi-page Crawling</div>
                </div>
              </div>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <Card className={`p-8 ${getScoreBg(result.score)}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm font-medium mb-2">OVERALL SEO SCORE</p>
                  <p className={`text-5xl font-bold ${getScoreColor(result.score)}`}>
                    {result.score}
                    <span className="text-2xl">/100</span>
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">Audited Website</p>
                  <p className="text-lg font-semibold text-black dark:text-white break-all">{result.url}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    {new Date(result.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
            </Card>

            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-black dark:text-white px-2">Page-by-Page Audit</h2>
              <Accordion type="single" collapsible className="w-full space-y-4">
                {result.pages.map((page, idx) => (
                  <AccordionItem key={idx} value={`page-${idx}`} className="border-none">
                    <Card className="overflow-hidden">
                      <AccordionTrigger className="px-6 py-4 hover:no-underline">
                        <div className="flex items-center justify-between w-full pr-4">
                          <div className="text-left">
                            <p className="text-sm font-medium text-blue-600 dark:text-blue-400 truncate max-w-md">{page.url}</p>
                            <p className="text-xs text-muted-foreground mt-1">Page {idx + 1}</p>
                          </div>
                          <div className={`text-xl font-bold ${getScoreColor(page.score)}`}>
                            {page.score}%
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-6 pb-6 pt-2">
                        <div className="space-y-6">
                          {page.checks.map((category, catIdx) => (
                            <div key={catIdx} className="space-y-3">
                              <h4 className="font-bold text-sm uppercase tracking-wider text-muted-foreground">{category.category}</h4>
                              <div className="grid gap-3">
                                {category.items.map((item, itemIdx) => (
                                  <div key={itemIdx} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                                    <div className="mt-0.5">
                                      {item.status === "pass" ? (
                                        <CheckCircle className="h-4 w-4 text-green-600" />
                                      ) : (
                                        <AlertCircle className={`h-4 w-4 ${item.severity === "critical" ? "text-red-600" : "text-yellow-600"}`} />
                                      )}
                                    </div>
                                    <div className="flex-1">
                                      <p className="text-sm font-semibold">{item.name}</p>
                                      <p className="text-xs text-muted-foreground mt-0.5">{item.message}</p>
                                    </div>
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
            </div>

            <div className="flex gap-3">
              <Button onClick={() => setResult(null)} variant="outline" className="flex-1">New Audit</Button>
              <Button
                onClick={() => {
                  const csvContent = generateCSV(result);
                  downloadCSV(csvContent, result.url);
                }}
                className="flex-1"
              >
                Download Report
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

function generateCSV(result: AuditResult): string {
  let csv = `Full Website SEO Audit Report\n`;
  csv += `Root URL: ${result.url}\n`;
  csv += `Average Score: ${result.score}/100\n\n`;

  result.pages.forEach((page, idx) => {
    csv += `PAGE ${idx + 1}: ${page.url}\n`;
    csv += `Page Score: ${page.score}/100\n`;
    page.checks.forEach(cat => {
      cat.items.forEach(item => {
        csv += `"${cat.category}","${item.name}","${item.status.toUpperCase()}","${item.message}"\n`;
      });
    });
    csv += `\n`;
  });

  return csv;
}

function downloadCSV(csv: string, domain: string) {
  const element = document.createElement("a");
  const file = new Blob([csv], { type: "text/csv" });
  element.href = URL.createObjectURL(file);
  element.download = `full-seo-audit-${domain.replace(/[^\w]/g, '-')}.csv`;
  element.click();
}
