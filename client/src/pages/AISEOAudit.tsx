import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft, Search, Loader2, CheckCircle, XCircle, AlertTriangle,
  Info, Download, TrendingUp, Globe, FileText, Zap, Target,
  ChevronDown, ChevronUp, Sparkles, BarChart3, Shield, PenTool,
  Star, ArrowRight, RefreshCw, ExternalLink,
} from "lucide-react";

interface Issue {
  id: string; category: "Technical" | "On-Page" | "Content"; severity: "critical" | "warning" | "info";
  issue: string; fix: string;
}
interface PageSummary { url: string; score: number; title: string; wordCount: number; }
interface AuditReport {
  url: string; domain: string; score: number;
  techScore: number; onPageScore: number; contentScore: number;
  pagesCrawled: number; timestamp: string;
  issues: Issue[];
  pages: PageSummary[];
  aiInsights: {
    executiveSummary: string; topPriority: string;
    quickWins: string[]; longTermActions: string[]; competitiveInsight: string;
  };
}

// ── Circular score ring ───────────────────────────────────────────────────────
function ScoreRing({ score, size = 140, label }: { score: number; size?: number; label?: string }) {
  const r   = (size - 16) / 2;
  const circ = 2 * Math.PI * r;
  const pct  = Math.max(0, Math.min(100, score));
  const dash = (pct / 100) * circ;
  const color = pct >= 80 ? "#22c55e" : pct >= 60 ? "#f59e0b" : "#ef4444";
  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="currentColor" strokeWidth={10} className="text-muted/20" />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={10}
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          style={{ transition: "stroke-dasharray 1s ease" }} />
      </svg>
      <div className="absolute flex flex-col items-center justify-center" style={{ marginTop: -(size * 0.6) }}>
        <span className="text-3xl font-black leading-none" style={{ color }}>{pct}</span>
        <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-widest">/ 100</span>
      </div>
      {label && <p className="text-xs font-semibold text-muted-foreground mt-1">{label}</p>}
    </div>
  );
}

// ── Mini score bar ────────────────────────────────────────────────────────────
function ScoreBar({ score, label, icon: Icon }: { score: number; label: string; icon: any }) {
  const color = score >= 80 ? "bg-green-500" : score >= 60 ? "bg-amber-500" : "bg-red-500";
  const textColor = score >= 80 ? "text-green-600" : score >= 60 ? "text-amber-600" : "text-red-600";
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Icon className="h-4 w-4 text-primary" /> {label}
        </div>
        <span className={`text-sm font-bold ${textColor}`}>{score}/100</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <motion.div className={`h-full ${color} rounded-full`}
          initial={{ width: 0 }} animate={{ width: `${score}%` }} transition={{ duration: 1, ease: "easeOut" }} />
      </div>
    </div>
  );
}

// ── Severity badge ────────────────────────────────────────────────────────────
function SeverityBadge({ severity }: { severity: string }) {
  if (severity === "critical") return <Badge className="bg-red-500/10 text-red-600 border-red-200 gap-1 text-[10px]"><XCircle className="h-2.5 w-2.5" />Critical</Badge>;
  if (severity === "warning")  return <Badge className="bg-amber-500/10 text-amber-600 border-amber-200 gap-1 text-[10px]"><AlertTriangle className="h-2.5 w-2.5" />Warning</Badge>;
  return <Badge className="bg-blue-500/10 text-blue-600 border-blue-200 gap-1 text-[10px]"><Info className="h-2.5 w-2.5" />Info</Badge>;
}

// ── Issue card ────────────────────────────────────────────────────────────────
function IssueCard({ issue, idx }: { issue: Issue; idx: number }) {
  const [open, setOpen] = useState(false);
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.04 }}
      className="border rounded-xl overflow-hidden">
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 p-4 text-left hover:bg-muted/30 transition-colors">
        {issue.severity === "critical" ? <XCircle className="h-4 w-4 text-red-500 shrink-0" />
          : issue.severity === "warning" ? <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
          : <Info className="h-4 w-4 text-blue-500 shrink-0" />}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">{issue.issue}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <SeverityBadge severity={issue.severity} />
          <Badge variant="outline" className="text-[10px]">{issue.category}</Badge>
          {open ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
        </div>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
            <div className="px-4 pb-4 border-t bg-primary/5">
              <div className="flex items-start gap-2 pt-3">
                <Sparkles className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-primary mb-1">AI-Recommended Fix</p>
                  <p className="text-sm text-foreground/80">{issue.fix}</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Download report ───────────────────────────────────────────────────────────
function downloadReport(report: AuditReport) {
  const scoreColor = (s: number) => s >= 80 ? "#22c55e" : s >= 60 ? "#f59e0b" : "#ef4444";
  const criticalIssues = report.issues.filter(i => i.severity === "critical");
  const warnings       = report.issues.filter(i => i.severity === "warning");
  const infoIssues     = report.issues.filter(i => i.severity === "info");

  const issueRows = (items: Issue[], color: string) => items.map(i => `
    <tr>
      <td style="padding:10px 12px;border-bottom:1px solid #f0f0f0">
        <span style="display:inline-block;background:${color}20;color:${color};border-radius:4px;padding:2px 8px;font-size:11px;font-weight:700;text-transform:uppercase">${i.severity}</span>
      </td>
      <td style="padding:10px 12px;border-bottom:1px solid #f0f0f0;font-size:14px">${i.category}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #f0f0f0;font-size:14px">${i.issue}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #f0f0f0;font-size:13px;color:#555">${i.fix}</td>
    </tr>`).join("");

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>SEO Audit Report – ${report.domain}</title>
<style>body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;margin:0;padding:0;background:#f8fafc;color:#1a1a1a}
.wrap{max-width:900px;margin:0 auto;padding:32px}
.header{background:linear-gradient(135deg,#6366f1 0%,#8b5cf6 100%);color:#fff;padding:40px;border-radius:16px;margin-bottom:24px}
.score-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:24px}
.score-card{background:#fff;border-radius:12px;padding:20px;text-align:center;box-shadow:0 1px 3px rgba(0,0,0,.08)}
.score-num{font-size:36px;font-weight:900;line-height:1}
.section{background:#fff;border-radius:12px;padding:24px;margin-bottom:16px;box-shadow:0 1px 3px rgba(0,0,0,.08)}
h2{margin:0 0 16px;font-size:18px}table{width:100%;border-collapse:collapse}
th{text-align:left;padding:10px 12px;background:#f8fafc;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:#6b7280}
.ai-box{background:linear-gradient(135deg,#f0f0ff,#faf0ff);border:1px solid #e0d0ff;border-radius:12px;padding:20px;margin-bottom:8px}
.tag{display:inline-block;background:#6366f120;color:#6366f1;border-radius:4px;padding:2px 8px;font-size:11px;font-weight:700}
</style>
</head>
<body><div class="wrap">
<div class="header">
  <div style="font-size:12px;font-weight:600;opacity:.7;margin-bottom:8px;text-transform:uppercase;letter-spacing:.1em">SEO Audit Report</div>
  <h1 style="margin:0 0 4px;font-size:28px">${report.domain}</h1>
  <p style="margin:0;opacity:.8;font-size:14px">${report.url} &nbsp;·&nbsp; ${new Date(report.timestamp).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })} &nbsp;·&nbsp; ${report.pagesCrawled} page${report.pagesCrawled !== 1 ? "s" : ""} crawled</p>
</div>

<div class="score-grid">
  <div class="score-card"><div class="score-num" style="color:${scoreColor(report.score)}">${report.score}</div><div style="font-size:12px;color:#6b7280;margin-top:4px;font-weight:600">Overall Score</div></div>
  <div class="score-card"><div class="score-num" style="color:${scoreColor(report.techScore)}">${report.techScore}</div><div style="font-size:12px;color:#6b7280;margin-top:4px;font-weight:600">Technical</div></div>
  <div class="score-card"><div class="score-num" style="color:${scoreColor(report.onPageScore)}">${report.onPageScore}</div><div style="font-size:12px;color:#6b7280;margin-top:4px;font-weight:600">On-Page</div></div>
  <div class="score-card"><div class="score-num" style="color:${scoreColor(report.contentScore)}">${report.contentScore}</div><div style="font-size:12px;color:#6b7280;margin-top:4px;font-weight:600">Content</div></div>
</div>

${report.aiInsights.executiveSummary ? `
<div class="section">
  <h2>🤖 AI Analysis</h2>
  <div class="ai-box"><p style="margin:0;font-size:15px;line-height:1.6">${report.aiInsights.executiveSummary}</p></div>
  ${report.aiInsights.topPriority ? `<div style="margin-top:12px"><span class="tag">Top Priority</span><p style="margin:8px 0 0;font-size:14px;font-weight:600">${report.aiInsights.topPriority}</p></div>` : ""}
  ${report.aiInsights.competitiveInsight ? `<div style="margin-top:12px;padding:12px;background:#f0fdf4;border-radius:8px;font-size:13px;color:#166534">${report.aiInsights.competitiveInsight}</div>` : ""}
  ${report.aiInsights.quickWins.length ? `<div style="margin-top:16px"><h3 style="margin:0 0 8px;font-size:14px">⚡ Quick Wins</h3><ul style="margin:0;padding-left:20px">${report.aiInsights.quickWins.map(q => `<li style="font-size:13px;margin-bottom:4px">${q}</li>`).join("")}</ul></div>` : ""}
</div>` : ""}

${criticalIssues.length ? `<div class="section"><h2>🔴 Critical Issues (${criticalIssues.length})</h2><table><thead><tr><th>Severity</th><th>Category</th><th>Issue</th><th>Fix</th></tr></thead><tbody>${issueRows(criticalIssues, "#ef4444")}</tbody></table></div>` : ""}
${warnings.length ? `<div class="section"><h2>🟡 Warnings (${warnings.length})</h2><table><thead><tr><th>Severity</th><th>Category</th><th>Issue</th><th>Fix</th></tr></thead><tbody>${issueRows(warnings, "#f59e0b")}</tbody></table></div>` : ""}
${infoIssues.length ? `<div class="section"><h2>🔵 Opportunities (${infoIssues.length})</h2><table><thead><tr><th>Severity</th><th>Category</th><th>Issue</th><th>Fix</th></tr></thead><tbody>${issueRows(infoIssues, "#3b82f6")}</tbody></table></div>` : ""}

<div class="section"><h2>Pages Audited</h2><table><thead><tr><th>URL</th><th>Score</th><th>Title</th><th>Words</th></tr></thead><tbody>
${report.pages.map(p => `<tr><td style="padding:10px 12px;border-bottom:1px solid #f0f0f0;font-size:13px;max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${p.url}</td><td style="padding:10px 12px;border-bottom:1px solid #f0f0f0;font-weight:700;color:${scoreColor(p.score)}">${p.score}</td><td style="padding:10px 12px;border-bottom:1px solid #f0f0f0;font-size:13px">${p.title || "—"}</td><td style="padding:10px 12px;border-bottom:1px solid #f0f0f0;font-size:13px">${p.wordCount}</td></tr>`).join("")}
</tbody></table></div>

<p style="text-align:center;font-size:12px;color:#9ca3af;margin-top:32px">Generated by Image Convert & Compress SEO Tools · ${new Date().toLocaleDateString()}</p>
</div></body></html>`;

  const blob = new Blob([html], { type: "text/html" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `seo-audit-${report.domain}-${Date.now()}.html`;
  a.click();
}

// ── Loading steps ─────────────────────────────────────────────────────────────
const LOAD_STEPS = [
  "Connecting to website…",
  "Crawling pages…",
  "Analysing technical SEO…",
  "Checking on-page factors…",
  "Evaluating content quality…",
  "Running AI analysis…",
  "Generating your report…",
];

// ── Main page ─────────────────────────────────────────────────────────────────
export default function AISEOAudit() {
  const { toast } = useToast();
  const [url,      setUrl]      = useState("");
  const [loading,  setLoading]  = useState(false);
  const [step,     setStep]     = useState(0);
  const [report,   setReport]   = useState<AuditReport | null>(null);
  const [filter,   setFilter]   = useState<"all" | "critical" | "warning" | "info">("all");

  const runAudit = async () => {
    const trimmed = url.trim();
    if (!trimmed) { toast({ title: "Enter a URL first", variant: "destructive" }); return; }
    let normalized = trimmed;
    if (!/^https?:\/\//i.test(normalized)) normalized = "https://" + normalized;
    try { new URL(normalized); } catch { toast({ title: "Invalid URL", variant: "destructive" }); return; }

    setLoading(true); setReport(null); setStep(0);
    // Advance the step indicator
    let s = 0;
    const iv = setInterval(() => { s = Math.min(s + 1, LOAD_STEPS.length - 1); setStep(s); }, 2800);

    try {
      const res = await fetch("/api/seo/ai-full-audit", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: normalized }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Audit failed");
      setReport(data);
    } catch (err: any) {
      toast({ title: "Audit failed", description: err.message, variant: "destructive" });
    } finally {
      clearInterval(iv); setLoading(false);
    }
  };

  const filteredIssues = report?.issues.filter(i => filter === "all" || i.severity === filter) ?? [];
  const critCount = report?.issues.filter(i => i.severity === "critical").length ?? 0;
  const warnCount = report?.issues.filter(i => i.severity === "warning").length ?? 0;
  const infoCount = report?.issues.filter(i => i.severity === "info").length ?? 0;

  return (
    <div className="min-h-screen bg-background">
      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-950 via-violet-950 to-purple-950 text-white">
        {/* Grid decoration */}
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: "linear-gradient(rgba(255,255,255,.05) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.05) 1px,transparent 1px)", backgroundSize: "40px 40px" }} />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-violet-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative container mx-auto px-4 max-w-5xl py-6">
          <Link href="/">
            <Button variant="ghost" size="sm" className="text-white/70 hover:text-white hover:bg-white/10 gap-1.5 mb-6">
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
          </Link>

          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 text-xs font-semibold mb-6">
              <Sparkles className="h-3.5 w-3.5 text-yellow-400" /> AI-Powered &nbsp;·&nbsp; Instant Results &nbsp;·&nbsp; 100% Free
            </div>
            <h1 className="text-4xl sm:text-5xl font-black leading-tight mb-4">
              Free AI SEO Audit Tool
            </h1>
            <p className="text-lg text-white/70 mb-8 max-w-2xl mx-auto">
              Get an instant, AI-powered analysis of your website's SEO health — technical, on-page, and content — with specific fixes to outrank competitors.
            </p>

            {/* URL input */}
            <div className="flex flex-col sm:flex-row gap-3 max-w-2xl mx-auto">
              <div className="relative flex-1">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                <Input
                  value={url} onChange={e => setUrl(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && !loading && runAudit()}
                  placeholder="https://yourwebsite.com"
                  className="pl-9 h-12 bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-white/50 text-sm"
                  data-testid="input-url"
                />
              </div>
              <Button onClick={runAudit} disabled={loading} size="lg"
                className="h-12 px-8 bg-white text-indigo-900 hover:bg-white/90 font-bold gap-2 shrink-0"
                data-testid="button-audit">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                {loading ? "Analysing…" : "Audit My Site"}
              </Button>
            </div>

            {/* Feature pills */}
            <div className="flex flex-wrap justify-center gap-2 mt-6">
              {["Technical SEO", "On-Page Factors", "Content Quality", "AI Fix Suggestions", "Downloadable Report"].map(f => (
                <span key={f} className="flex items-center gap-1 text-xs bg-white/10 text-white/70 rounded-full px-3 py-1">
                  <CheckCircle className="h-3 w-3 text-green-400" /> {f}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-5xl py-10">

        {/* ── Loading state ──────────────────────────────────────────────── */}
        <AnimatePresence>
          {loading && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              className="flex flex-col items-center gap-8 py-16">
              <div className="relative">
                <div className="w-24 h-24 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                <Search className="absolute inset-0 m-auto h-8 w-8 text-primary" />
              </div>
              <div className="text-center space-y-2">
                <p className="font-semibold text-lg">{LOAD_STEPS[step]}</p>
                <p className="text-sm text-muted-foreground">This takes 15–30 seconds for most sites</p>
              </div>
              <div className="flex flex-col items-start gap-2 w-64">
                {LOAD_STEPS.map((s, i) => (
                  <div key={i} className={`flex items-center gap-2 text-sm transition-all ${i <= step ? "text-primary" : "text-muted-foreground/40"}`}>
                    {i < step ? <CheckCircle className="h-3.5 w-3.5 text-green-500 shrink-0" />
                      : i === step ? <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />
                      : <div className="h-3.5 w-3.5 rounded-full border border-current shrink-0" />}
                    {s}
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Report ────────────────────────────────────────────────────── */}
        <AnimatePresence>
          {report && !loading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">

              {/* ── Score header ──────────────────────────────────────── */}
              <Card className="overflow-hidden">
                <div className="bg-gradient-to-r from-indigo-600/10 via-violet-600/10 to-purple-600/10 border-b px-6 py-4">
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Globe className="h-4 w-4 text-primary" />
                        <a href={report.url} target="_blank" rel="noopener noreferrer"
                          className="font-bold text-lg hover:underline flex items-center gap-1">
                          {report.domain} <ExternalLink className="h-3.5 w-3.5 opacity-50" />
                        </a>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {report.pagesCrawled} page{report.pagesCrawled !== 1 ? "s" : ""} crawled &nbsp;·&nbsp;
                        {new Date(report.timestamp).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <Button variant="outline" size="sm" gap-2 onClick={() => setReport(null)} className="gap-1.5">
                        <RefreshCw className="h-3.5 w-3.5" /> New Audit
                      </Button>
                      <Button size="sm" onClick={() => downloadReport(report)} className="gap-1.5">
                        <Download className="h-3.5 w-3.5" /> Download Report
                      </Button>
                    </div>
                  </div>
                </div>

                <CardContent className="p-6">
                  <div className="grid md:grid-cols-[auto_1fr] gap-8 items-center">
                    {/* Score ring */}
                    <div className="flex justify-center relative" style={{ width: 140, height: 140 }}>
                      <ScoreRing score={report.score} />
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className={`text-3xl font-black leading-none ${report.score >= 80 ? "text-green-500" : report.score >= 60 ? "text-amber-500" : "text-red-500"}`}>
                          {report.score}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-semibold">/ 100</span>
                      </div>
                    </div>

                    {/* Category bars */}
                    <div className="space-y-4">
                      <ScoreBar score={report.techScore} label="Technical SEO" icon={Shield} />
                      <ScoreBar score={report.onPageScore} label="On-Page SEO" icon={PenTool} />
                      <ScoreBar score={report.contentScore} label="Content Quality" icon={FileText} />
                    </div>
                  </div>

                  {/* Issue counts */}
                  <div className="grid grid-cols-3 gap-3 mt-6">
                    {[
                      { label: "Critical", count: critCount, color: "text-red-500", bg: "bg-red-500/10 border-red-200" },
                      { label: "Warnings", count: warnCount, color: "text-amber-500", bg: "bg-amber-500/10 border-amber-200" },
                      { label: "Info",     count: infoCount, color: "text-blue-500",  bg: "bg-blue-500/10 border-blue-200" },
                    ].map(({ label, count, color, bg }) => (
                      <div key={label} className={`rounded-xl p-4 border ${bg} text-center`}>
                        <div className={`text-3xl font-black ${color}`}>{count}</div>
                        <div className="text-xs font-semibold text-muted-foreground mt-1">{label}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* ── AI Insights ──────────────────────────────────────── */}
              {report.aiInsights.executiveSummary && (
                <Card className="border-violet-200 dark:border-violet-800">
                  <CardHeader className="pb-3 border-b bg-gradient-to-r from-violet-500/5 to-purple-500/5">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-violet-500" /> AI Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-5 space-y-4">
                    <p className="text-sm leading-relaxed">{report.aiInsights.executiveSummary}</p>

                    {report.aiInsights.topPriority && (
                      <div className="bg-violet-50 dark:bg-violet-950/30 rounded-lg p-4 border border-violet-200 dark:border-violet-800">
                        <p className="text-xs font-bold text-violet-600 uppercase tracking-wide mb-1">Top Priority Action</p>
                        <p className="text-sm font-medium">{report.aiInsights.topPriority}</p>
                      </div>
                    )}

                    <div className="grid sm:grid-cols-2 gap-4">
                      {report.aiInsights.quickWins?.length > 0 && (
                        <div>
                          <p className="text-xs font-bold text-green-600 uppercase tracking-wide mb-2 flex items-center gap-1">
                            <Zap className="h-3 w-3" /> Quick Wins
                          </p>
                          <ul className="space-y-1.5">
                            {report.aiInsights.quickWins.map((w, i) => (
                              <li key={i} className="flex items-start gap-2 text-sm">
                                <CheckCircle className="h-3.5 w-3.5 text-green-500 shrink-0 mt-0.5" /> {w}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {report.aiInsights.longTermActions?.length > 0 && (
                        <div>
                          <p className="text-xs font-bold text-blue-600 uppercase tracking-wide mb-2 flex items-center gap-1">
                            <TrendingUp className="h-3 w-3" /> Strategic Actions
                          </p>
                          <ul className="space-y-1.5">
                            {report.aiInsights.longTermActions.map((a, i) => (
                              <li key={i} className="flex items-start gap-2 text-sm">
                                <ArrowRight className="h-3.5 w-3.5 text-blue-500 shrink-0 mt-0.5" /> {a}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    {report.aiInsights.competitiveInsight && (
                      <div className="bg-green-50 dark:bg-green-950/30 rounded-lg p-3 border border-green-200 dark:border-green-800 flex items-start gap-2">
                        <Target className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                        <p className="text-sm text-green-700 dark:text-green-300">{report.aiInsights.competitiveInsight}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* ── Issues list ───────────────────────────────────────── */}
              <Card>
                <CardHeader className="pb-3 border-b">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <BarChart3 className="h-4 w-4 text-primary" /> Issues Found ({report.issues.length})
                    </CardTitle>
                    <div className="flex gap-1.5 flex-wrap">
                      {(["all", "critical", "warning", "info"] as const).map(f => (
                        <button key={f} onClick={() => setFilter(f)}
                          className={`px-3 py-1 rounded-full text-xs font-semibold transition-all capitalize ${filter === f ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>
                          {f} {f !== "all" && `(${f === "critical" ? critCount : f === "warning" ? warnCount : infoCount})`}
                        </button>
                      ))}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4 space-y-2">
                  {filteredIssues.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <CheckCircle className="h-8 w-8 mx-auto text-green-500 mb-2" />
                      <p className="font-medium">No issues in this category!</p>
                    </div>
                  ) : (
                    filteredIssues.map((issue, idx) => <IssueCard key={issue.id} issue={issue} idx={idx} />)
                  )}
                </CardContent>
              </Card>

              {/* ── Pages table ───────────────────────────────────────── */}
              {report.pages.length > 1 && (
                <Card>
                  <CardHeader className="pb-3 border-b">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Globe className="h-4 w-4 text-primary" /> Pages Audited
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="divide-y">
                      {report.pages.map((p, i) => (
                        <div key={i} className="flex items-center gap-3 px-4 py-3">
                          <div className={`text-sm font-bold w-10 text-center shrink-0 ${p.score >= 80 ? "text-green-500" : p.score >= 60 ? "text-amber-500" : "text-red-500"}`}>{p.score}</div>
                          <div className="flex-1 min-w-0">
                            <a href={p.url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium hover:underline truncate block">{p.url}</a>
                            {p.title && <p className="text-xs text-muted-foreground truncate">{p.title}</p>}
                          </div>
                          <span className="text-xs text-muted-foreground shrink-0">{p.wordCount} words</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* ── CTA ──────────────────────────────────────────────── */}
              <Card className="bg-gradient-to-r from-indigo-600 to-violet-600 border-0 text-white">
                <CardContent className="p-6 text-center space-y-4">
                  <Star className="h-8 w-8 mx-auto text-yellow-400" />
                  <h3 className="text-xl font-bold">Want deeper analysis?</h3>
                  <p className="text-white/80 text-sm max-w-sm mx-auto">
                    Use our full SEO suite — 25+ tools including keyword research, broken link checker, SERP preview, and more.
                  </p>
                  <div className="flex flex-wrap justify-center gap-3">
                    <Link href="/seo-tools">
                      <Button className="bg-white text-indigo-700 hover:bg-white/90 font-bold gap-1.5">
                        Open SEO Tools <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button variant="outline" className="border-white/30 text-white hover:bg-white/10"
                      onClick={() => downloadReport(report)}>
                      <Download className="h-4 w-4 mr-1.5" /> Download Report
                    </Button>
                  </div>
                </CardContent>
              </Card>

            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Empty state / feature list ──────────────────────────────────── */}
        {!report && !loading && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-4">
            <div className="grid sm:grid-cols-3 gap-4 mb-8">
              {[
                { icon: Shield, title: "Technical SEO", desc: "HTTPS, canonical tags, viewport, robots, structured data, site speed signals", color: "text-blue-500" },
                { icon: PenTool, title: "On-Page SEO", desc: "Title tags, meta descriptions, heading structure, image alt text, internal links", color: "text-violet-500" },
                { icon: FileText, title: "Content Quality", desc: "Word count, readability, keyword usage, Open Graph tags, content structure", color: "text-pink-500" },
              ].map(({ icon: Icon, title, desc, color }) => (
                <Card key={title} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-5 space-y-2">
                    <Icon className={`h-7 w-7 ${color}`} />
                    <h3 className="font-bold">{title}</h3>
                    <p className="text-sm text-muted-foreground">{desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { icon: Sparkles, title: "AI Fix Suggestions", desc: "Every issue comes with a specific, expert-written fix powered by GPT-4. No guesswork." },
                { icon: Download, title: "Downloadable Report", desc: "Export your full audit as a branded HTML report to share with clients or your team." },
                { icon: TrendingUp, title: "Priority Roadmap", desc: "AI ranks fixes by impact and effort so you work on what moves the needle fastest." },
                { icon: Target, title: "Competitive Insights", desc: "Understand what you need to do to outrank competitors in your niche." },
              ].map(({ icon: Icon, title, desc }) => (
                <div key={title} className="flex items-start gap-3 p-4 rounded-xl border bg-card">
                  <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm">{title}</h4>
                    <p className="text-sm text-muted-foreground">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
