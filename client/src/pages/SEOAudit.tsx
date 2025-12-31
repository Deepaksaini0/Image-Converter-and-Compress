import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { ArrowLeft, CheckCircle, AlertCircle, Loader } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface AuditResult {
  url: string;
  score: number;
  timestamp: string;
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
  pageAudits?: Array<{
    url: string;
    issues: Array<{
      type: string;
      message: string;
      severity: "critical" | "warning" | "info";
    }>;
  }>;
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
        description: `SEO Score: ${data.score}/100`
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
        {/* Header */}
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
              Comprehensive website SEO analysis & optimization recommendations
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
                <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">What We Check</h3>
                <div className="grid grid-cols-2 gap-2 text-sm text-blue-800 dark:text-blue-200">
                  <div>✓ Basic SEO (titles, descriptions, headings)</div>
                  <div>✓ Technical SEO (HTTPS, structure, redirects)</div>
                  <div>✓ On-Page SEO (images, links, content)</div>
                  <div>✓ Performance (load speed, assets)</div>
                  <div>✓ Security & Trust (schema, OG tags)</div>
                  <div>✓ Mobile Friendliness</div>
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
            {/* Score Card */}
            <Card className={`p-8 ${getScoreBg(result.score)}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm font-medium mb-2">SEO SCORE</p>
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

            {/* Recommendations */}
            {result.recommendations.length > 0 && (
              <Card className="p-6">
                <h2 className="text-xl font-bold text-black dark:text-white mb-4">
                  📋 Top Recommendations
                </h2>
                <div className="space-y-2">
                  {result.recommendations.slice(0, 5).map((rec, idx) => (
                    <div key={idx} className="flex gap-3 text-sm">
                      <span className="text-blue-600 dark:text-blue-400 font-bold flex-shrink-0">{idx + 1}.</span>
                      <p className="text-gray-700 dark:text-gray-300">{rec}</p>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Page Audits */}
            {result.pageAudits && result.pageAudits.length > 0 && (
              <Card className="p-6">
                <h2 className="text-xl font-bold text-black dark:text-white mb-4">
                  📄 Page-by-Page Analysis
                </h2>
                <div className="space-y-4">
                  {result.pageAudits.map((pageAudit, pageIdx) => (
                    <div key={pageIdx} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <p className="font-semibold text-black dark:text-white text-sm mb-3 break-all">
                        {pageAudit.url}
                      </p>
                      {pageAudit.issues.length === 0 ? (
                        <p className="text-sm text-green-600 dark:text-green-400">✓ No issues found</p>
                      ) : (
                        <div className="space-y-2">
                          {pageAudit.issues.map((issue, issueIdx) => (
                            <div key={issueIdx} className="flex gap-2 text-sm">
                              <span className={`flex-shrink-0 font-bold ${
                                issue.severity === "critical"
                                  ? "text-red-600 dark:text-red-400"
                                  : issue.severity === "warning"
                                  ? "text-yellow-600 dark:text-yellow-400"
                                  : "text-blue-600 dark:text-blue-400"
                              }`}>
                                {issue.severity === "critical" ? "✕" : issue.severity === "warning" ? "!" : "ℹ"}
                              </span>
                              <p className="text-gray-700 dark:text-gray-300">{issue.message}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Detailed Results */}
            <div className="space-y-4">
              {result.checks.map((category, catIdx) => (
                <Card key={catIdx} className="p-6">
                  <h3 className="text-lg font-bold text-black dark:text-white mb-4">
                    {category.category}
                  </h3>
                  <div className="space-y-3">
                    {category.items.map((item, itemIdx) => (
                      <div key={itemIdx} className="flex items-start gap-3 pb-3 border-b border-gray-200 dark:border-gray-700 last:border-b-0 last:pb-0">
                        <div className="flex-shrink-0 mt-0.5">
                          {item.status === "pass" ? (
                            <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                          ) : (
                            <AlertCircle className={`h-5 w-5 ${
                              item.severity === "critical"
                                ? "text-red-600 dark:text-red-400"
                                : "text-yellow-600 dark:text-yellow-400"
                            }`} />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-black dark:text-white text-sm">
                            {item.name}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {item.message}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              ))}
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                onClick={() => setResult(null)}
                variant="outline"
                className="flex-1"
                data-testid="button-new-audit"
              >
                New Audit
              </Button>
              <Button
                onClick={() => {
                  const csvContent = generateCSV(result);
                  downloadCSV(csvContent, result.url);
                }}
                variant="default"
                className="flex-1"
                data-testid="button-download-report"
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
  let csv = `SEO Audit Report\n`;
  csv += `Website: ${result.url}\n`;
  csv += `Date: ${new Date(result.timestamp).toLocaleString()}\n`;
  csv += `Score: ${result.score}/100\n\n`;

  csv += `RECOMMENDATIONS\n`;
  result.recommendations.forEach((rec, idx) => {
    csv += `${idx + 1},"${rec}"\n`;
  });

  csv += `\nDETAILED RESULTS\n`;
  result.checks.forEach(category => {
    csv += `\n${category.category}\n`;
    category.items.forEach(item => {
      csv += `"${item.name}","${item.status.toUpperCase()}","${item.message}"\n`;
    });
  });

  return csv;
}

function downloadCSV(csv: string, domain: string) {
  const element = document.createElement("a");
  const file = new Blob([csv], { type: "text/csv" });
  element.href = URL.createObjectURL(file);
  element.download = `seo-audit-${domain.replace(/\//g, '')}-${Date.now()}.csv`;
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
}
