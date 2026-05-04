import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft, Search, Loader2, CheckCircle, XCircle, AlertTriangle, Info,
  Download, TrendingUp, Globe, FileText, Zap, Target, ChevronDown, ChevronUp,
  Sparkles, BarChart3, Shield, PenTool, Star, ArrowRight, RefreshCw,
  ExternalLink, Share2, Copy, Mail, Calendar, Users, Link2, Gauge,
  Trophy, Clock, Lightbulb, BookOpen, Activity,
} from "lucide-react";

interface Issue {
  id: string; category: "Technical" | "On-Page" | "Content"; severity: "critical" | "warning" | "info";
  issue: string; fix: string;
}
interface PageSummary { url: string; score: number; title: string; wordCount: number; scripts?: number; pageSize?: number; }
interface AuditReport {
  url: string; domain: string; shareId: string;
  score: number; techScore: number; onPageScore: number; contentScore: number; perfScore: number;
  pagesCrawled: number; timestamp: string;
  issues: Issue[];
  pages: PageSummary[];
  aiInsights: {
    executiveSummary: string; topPriority: string; quickWins: string[];
    longTermActions: string[]; competitiveInsight: string; rankingPrediction: string;
    roadmap: { week1: string[]; month1: string[]; quarter: string[] };
    eeat: { experienceScore: number; expertiseScore: number; authorityScore: number; trustScore: number; improvements: string[] };
    keywordOpportunities: { keyword: string; intent: string; difficulty: string; action: string }[];
    contentSuggestions: { page: string; suggestion: string }[];
    competitorComparison: { topCompetitors: string[]; gaps: string[]; advantages: string[] };
    internalLinkingIssues: string[];
    coreWebVitals: { lcp: string; cls: string; inp: string; lcpTip: string; clsTip: string; inpTip: string };
  };
}

// ── Score ring ─────────────────────────────────────────────────────────────────
function ScoreRing({ score, size = 140, label }: { score: number; size?: number; label?: string }) {
  const r    = (size - 14) / 2;
  const circ = 2 * Math.PI * r;
  const pct  = Math.max(0, Math.min(100, score));
  const dash = (pct / 100) * circ;
  const color = pct >= 80 ? "#22c55e" : pct >= 60 ? "#f59e0b" : "#ef4444";
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90 absolute inset-0">
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="currentColor" strokeWidth={9} className="text-muted/20" />
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={9}
            strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
            style={{ transition: "stroke-dasharray 1.2s ease" }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-black leading-none" style={{ fontSize: size * 0.26, color }}>{pct}</span>
          <span className="text-muted-foreground font-semibold" style={{ fontSize: size * 0.075 }}>/ 100</span>
        </div>
      </div>
      {label && <span className="text-xs font-semibold text-muted-foreground text-center">{label}</span>}
    </div>
  );
}

// ── Score bar ──────────────────────────────────────────────────────────────────
function ScoreBar({ score, label, icon: Icon }: { score: number; label: string; icon: any }) {
  const color = score >= 80 ? "bg-green-500" : score >= 60 ? "bg-amber-500" : "bg-red-500";
  const textColor = score >= 80 ? "text-green-600" : score >= 60 ? "text-amber-600" : "text-red-600";
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Icon className="h-4 w-4 text-primary" /> {label}
        </div>
        <span className={`text-sm font-bold ${textColor}`}>{score}/100</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <motion.div className={`h-full ${color} rounded-full`}
          initial={{ width: 0 }} animate={{ width: `${score}%` }} transition={{ duration: 1.2, ease: "easeOut" }} />
      </div>
    </div>
  );
}

// ── CWV badge ──────────────────────────────────────────────────────────────────
function CWVBadge({ status }: { status: string }) {
  if (status === "good") return <Badge className="bg-green-500/10 text-green-700 border-green-200 text-[10px]">Good</Badge>;
  if (status === "needs-improvement") return <Badge className="bg-amber-500/10 text-amber-700 border-amber-200 text-[10px]">Needs Work</Badge>;
  return <Badge className="bg-red-500/10 text-red-600 border-red-200 text-[10px]">Poor</Badge>;
}

// ── Severity badge ─────────────────────────────────────────────────────────────
function SeverityBadge({ severity }: { severity: string }) {
  if (severity === "critical") return <Badge className="bg-red-500/10 text-red-600 border-red-200 gap-1 text-[10px]"><XCircle className="h-2.5 w-2.5" />Critical</Badge>;
  if (severity === "warning")  return <Badge className="bg-amber-500/10 text-amber-600 border-amber-200 gap-1 text-[10px]"><AlertTriangle className="h-2.5 w-2.5" />Warning</Badge>;
  return <Badge className="bg-blue-500/10 text-blue-600 border-blue-200 gap-1 text-[10px]"><Info className="h-2.5 w-2.5" />Info</Badge>;
}

// ── Issue card ─────────────────────────────────────────────────────────────────
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
          <p className="text-sm font-medium truncate">{issue.issue}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <SeverityBadge severity={issue.severity} />
          <Badge variant="outline" className="text-[10px] hidden sm:inline-flex">{issue.category}</Badge>
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

// ── Roadmap phase ──────────────────────────────────────────────────────────────
function RoadmapPhase({ title, icon: Icon, color, tasks, delay }: { title: string; icon: any; color: string; tasks: string[]; delay: number }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}>
      <Card className={`border-l-4 ${color}`}>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Icon className="h-4 w-4" /> {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 pt-0">
          {tasks.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">No tasks — great foundations already in place.</p>
          ) : tasks.map((task, i) => (
            <div key={i} className="flex items-start gap-2">
              <div className="mt-1.5 h-2 w-2 rounded-full bg-current shrink-0" style={{ color: "currentcolor" }} />
              <p className="text-sm">{task}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ── Download report HTML ───────────────────────────────────────────────────────
function buildReportHtml(report: AuditReport): string {
  const sc = (s: number) => s >= 80 ? "#22c55e" : s >= 60 ? "#f59e0b" : "#ef4444";
  const crit = report.issues.filter(i => i.severity === "critical");
  const warn = report.issues.filter(i => i.severity === "warning");
  const info = report.issues.filter(i => i.severity === "info");
  const rows = (items: Issue[], color: string) => items.map(i => `
    <tr><td style="padding:10px 12px;border-bottom:1px solid #f0f0f0">
      <span style="background:${color}20;color:${color};border-radius:4px;padding:2px 8px;font-size:11px;font-weight:700;text-transform:uppercase">${i.severity}</span>
    </td><td style="padding:10px 12px;border-bottom:1px solid #f0f0f0;font-size:13px">${i.category}</td>
    <td style="padding:10px 12px;border-bottom:1px solid #f0f0f0;font-size:13px">${i.issue}</td>
    <td style="padding:10px 12px;border-bottom:1px solid #f0f0f0;font-size:12px;color:#555">${i.fix}</td></tr>`).join("");

  const roadmap = report.aiInsights.roadmap;
  const eeat    = report.aiInsights.eeat;
  const kwds    = report.aiInsights.keywordOpportunities || [];
  const comp    = report.aiInsights.competitorComparison || {};

  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">
<title>SEO Audit Report – ${report.domain}</title>
<style>body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;margin:0;padding:0;background:#f8fafc;color:#1a1a1a}
.wrap{max-width:960px;margin:0 auto;padding:32px}
.header{background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;padding:40px;border-radius:16px;margin-bottom:24px}
.grid4{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:20px}
.grid2{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:20px}
.sc{background:#fff;border-radius:12px;padding:18px;text-align:center;box-shadow:0 1px 3px rgba(0,0,0,.08)}
.sc-num{font-size:34px;font-weight:900;line-height:1}
.section{background:#fff;border-radius:12px;padding:24px;margin-bottom:16px;box-shadow:0 1px 3px rgba(0,0,0,.08)}
h2{margin:0 0 16px;font-size:18px}h3{margin:0 0 10px;font-size:15px}
table{width:100%;border-collapse:collapse}th{text-align:left;padding:10px 12px;background:#f8fafc;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:#6b7280}
.ai-box{background:linear-gradient(135deg,#f0f0ff,#faf0ff);border:1px solid #e0d0ff;border-radius:10px;padding:18px;margin-bottom:10px}
.tag{display:inline-block;background:#6366f120;color:#6366f1;border-radius:4px;padding:2px 8px;font-size:11px;font-weight:700}
.bar{height:8px;border-radius:4px;background:#e5e7eb;margin:4px 0 12px;overflow:hidden}
.bar-fill{height:100%;border-radius:4px}
</style></head><body><div class="wrap">
<div class="header">
  <div style="font-size:12px;font-weight:600;opacity:.7;margin-bottom:8px;text-transform:uppercase;letter-spacing:.1em">SEO Audit Report</div>
  <h1 style="margin:0 0 4px;font-size:26px">${report.domain}</h1>
  <p style="margin:0;opacity:.8;font-size:13px">${report.url} &nbsp;·&nbsp; ${new Date(report.timestamp).toLocaleDateString("en-GB",{day:"numeric",month:"long",year:"numeric"})} &nbsp;·&nbsp; ${report.pagesCrawled} pages crawled</p>
</div>

<div class="grid4">
  <div class="sc"><div class="sc-num" style="color:${sc(report.score)}">${report.score}</div><div style="font-size:11px;color:#6b7280;margin-top:4px;font-weight:600">Overall</div></div>
  <div class="sc"><div class="sc-num" style="color:${sc(report.techScore)}">${report.techScore}</div><div style="font-size:11px;color:#6b7280;margin-top:4px;font-weight:600">Technical</div></div>
  <div class="sc"><div class="sc-num" style="color:${sc(report.onPageScore)}">${report.onPageScore}</div><div style="font-size:11px;color:#6b7280;margin-top:4px;font-weight:600">On-Page</div></div>
  <div class="sc"><div class="sc-num" style="color:${sc(report.contentScore)}">${report.contentScore}</div><div style="font-size:11px;color:#6b7280;margin-top:4px;font-weight:600">Content</div></div>
</div>

${report.aiInsights.executiveSummary ? `<div class="section"><h2>🤖 AI Analysis</h2>
<div class="ai-box"><p style="margin:0;font-size:14px;line-height:1.65">${report.aiInsights.executiveSummary}</p></div>
${report.aiInsights.topPriority ? `<div style="margin:12px 0"><span class="tag">Top Priority</span><p style="margin:8px 0 0;font-size:13px;font-weight:600">${report.aiInsights.topPriority}</p></div>` : ""}
${report.aiInsights.rankingPrediction ? `<div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:12px;font-size:13px;color:#166534"><strong>📈 Prediction:</strong> ${report.aiInsights.rankingPrediction}</div>` : ""}
</div>` : ""}

${eeat ? `<div class="section"><h2>🏆 EEAT Analysis</h2>
${[["Experience",eeat.experienceScore],["Expertise",eeat.expertiseScore],["Authority",eeat.authorityScore],["Trust",eeat.trustScore]].map(([l,s]) => `
<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px"><span style="font-size:13px;font-weight:600">${l}</span><span style="font-size:13px;font-weight:700;color:${sc(s as number)}">${s}/100</span></div>
<div class="bar"><div class="bar-fill" style="width:${s}%;background:${sc(s as number)}"></div></div>`).join("")}
${eeat.improvements?.length ? `<p style="font-size:12px;font-weight:600;color:#6b7280;text-transform:uppercase;margin:12px 0 6px">Improvements</p><ul style="margin:0;padding-left:18px">${eeat.improvements.map((i: string) => `<li style="font-size:13px;margin-bottom:4px">${i}</li>`).join("")}</ul>` : ""}
</div>` : ""}

${roadmap ? `<div class="section"><h2>🗺 SEO Roadmap</h2>
<div class="grid2" style="grid-template-columns:1fr 1fr 1fr">
${[["⚡ Days 1–7",roadmap.week1,"#ef4444"],["📅 Days 8–30",roadmap.month1,"#f59e0b"],["🚀 Days 31–90",roadmap.quarter,"#22c55e"]].map(([t,tasks,c]) => `
<div style="border-left:3px solid ${c};padding-left:12px">
<p style="font-weight:700;font-size:13px;margin:0 0 8px">${t}</p>
<ul style="margin:0;padding-left:16px">${(tasks as string[]).map(t => `<li style="font-size:12px;margin-bottom:4px">${t}</li>`).join("")}</ul>
</div>`).join("")}
</div></div>` : ""}

${kwds.length ? `<div class="section"><h2>🔍 Keyword Opportunities</h2><table><thead><tr><th>Keyword</th><th>Intent</th><th>Difficulty</th><th>Action</th></tr></thead><tbody>
${kwds.map((k: any) => `<tr><td style="padding:9px 12px;border-bottom:1px solid #f0f0f0;font-size:13px;font-weight:600">${k.keyword}</td><td style="padding:9px 12px;border-bottom:1px solid #f0f0f0;font-size:12px;text-transform:capitalize">${k.intent}</td><td style="padding:9px 12px;border-bottom:1px solid #f0f0f0;font-size:12px;text-transform:capitalize">${k.difficulty}</td><td style="padding:9px 12px;border-bottom:1px solid #f0f0f0;font-size:12px;color:#555">${k.action}</td></tr>`).join("")}
</tbody></table></div>` : ""}

${crit.length ? `<div class="section"><h2>🔴 Critical Issues (${crit.length})</h2><table><thead><tr><th>Sev.</th><th>Category</th><th>Issue</th><th>Fix</th></tr></thead><tbody>${rows(crit,"#ef4444")}</tbody></table></div>` : ""}
${warn.length ? `<div class="section"><h2>🟡 Warnings (${warn.length})</h2><table><thead><tr><th>Sev.</th><th>Category</th><th>Issue</th><th>Fix</th></tr></thead><tbody>${rows(warn,"#f59e0b")}</tbody></table></div>` : ""}
${info.length ? `<div class="section"><h2>🔵 Opportunities (${info.length})</h2><table><thead><tr><th>Sev.</th><th>Category</th><th>Issue</th><th>Fix</th></tr></thead><tbody>${rows(info,"#3b82f6")}</tbody></table></div>` : ""}

<div class="section"><h2>Pages Audited</h2><table><thead><tr><th>URL</th><th>Score</th><th>Title</th><th>Words</th></tr></thead><tbody>
${report.pages.map(p => `<tr><td style="padding:9px 12px;border-bottom:1px solid #f0f0f0;font-size:12px;max-width:220px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${p.url}</td><td style="padding:9px 12px;border-bottom:1px solid #f0f0f0;font-weight:700;color:${sc(p.score)}">${p.score}</td><td style="padding:9px 12px;border-bottom:1px solid #f0f0f0;font-size:12px">${p.title || "—"}</td><td style="padding:9px 12px;border-bottom:1px solid #f0f0f0;font-size:12px">${p.wordCount}</td></tr>`).join("")}
</tbody></table></div>

<p style="text-align:center;font-size:11px;color:#9ca3af;margin-top:32px">Generated by SEO Tools Suite · ${new Date().toLocaleDateString()}</p>
</div></body></html>`;
}

const LOAD_STEPS = [
  "Connecting to website…", "Crawling pages…", "Checking robots.txt & sitemap…",
  "Analysing technical SEO…", "Checking on-page factors…", "Evaluating content & EEAT…",
  "Running AI analysis & roadmap…", "Generating your report…",
];

// ── Main page ──────────────────────────────────────────────────────────────────
export default function AISEOAudit() {
  const { toast } = useToast();
  const [url,      setUrl]      = useState("");
  const [loading,  setLoading]  = useState(false);
  const [step,     setStep]     = useState(0);
  const [report,   setReport]   = useState<AuditReport | null>(null);
  const [filter,   setFilter]   = useState<"all" | "critical" | "warning" | "info">("all");
  const [activeTab, setActiveTab] = useState("overview");
  const [email,    setEmail]    = useState("");
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailDone, setEmailDone] = useState(false);
  const [copied,   setCopied]   = useState(false);

  // ── Load shared report from URL param ────────────────────────────────────
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");
    if (id) {
      setLoading(true);
      fetch(`/api/seo/audit-report/${id}`)
        .then(r => r.json())
        .then(data => { if (!data.error) setReport(data); else toast({ title: "Shared report not found or expired", variant: "destructive" }); })
        .catch(() => toast({ title: "Could not load shared report", variant: "destructive" }))
        .finally(() => setLoading(false));
    }
  }, []);

  const runAudit = async () => {
    const trimmed = url.trim();
    if (!trimmed) { toast({ title: "Enter a URL first", variant: "destructive" }); return; }
    let normalized = trimmed;
    if (!/^https?:\/\//i.test(normalized)) normalized = "https://" + normalized;
    try { new URL(normalized); } catch { toast({ title: "Invalid URL", variant: "destructive" }); return; }

    setLoading(true); setReport(null); setStep(0); setActiveTab("overview");
    let s = 0;
    const iv = setInterval(() => { s = Math.min(s + 1, LOAD_STEPS.length - 1); setStep(s); }, 3000);
    try {
      const res  = await fetch("/api/seo/ai-full-audit", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: normalized }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Audit failed");
      setReport(data);
      // Update URL for shareability without reload
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.set("id", data.shareId);
      window.history.replaceState({}, "", newUrl.toString());
    } catch (err: any) {
      toast({ title: "Audit failed", description: err.message, variant: "destructive" });
    } finally {
      clearInterval(iv); setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!report) return;
    if (!emailDone) { setShowEmailModal(true); return; }
    triggerDownload();
  };

  const triggerDownload = () => {
    if (!report) return;
    const html  = buildReportHtml(report);
    const blob  = new Blob([html], { type: "text/html" });
    const a     = document.createElement("a");
    a.href      = URL.createObjectURL(blob);
    a.download  = `seo-audit-${report.domain}-${Date.now()}.html`;
    a.click();
  };

  const handleEmailSubmit = () => {
    if (!email.includes("@")) { toast({ title: "Enter a valid email", variant: "destructive" }); return; }
    setEmailDone(true);
    setShowEmailModal(false);
    triggerDownload();
  };

  const copyShareLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredIssues = report?.issues.filter(i => filter === "all" || i.severity === filter) ?? [];
  const critCount = report?.issues.filter(i => i.severity === "critical").length ?? 0;
  const warnCount = report?.issues.filter(i => i.severity === "warning").length ?? 0;
  const infoCount = report?.issues.filter(i => i.severity === "info").length ?? 0;
  const ai = report?.aiInsights;

  return (
    <div className="min-h-screen bg-background">
      {/* Email capture modal */}
      <Dialog open={showEmailModal} onOpenChange={setShowEmailModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Mail className="h-5 w-5 text-primary" /> Get Your Full Report</DialogTitle>
            <DialogDescription>Enter your email to download the white-label HTML report. We won't spam you.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <Input placeholder="you@yourcompany.com" type="email" value={email} onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleEmailSubmit()} />
            <Button className="w-full gap-2" onClick={handleEmailSubmit}>
              <Download className="h-4 w-4" /> Download Report
            </Button>
            <p className="text-xs text-muted-foreground text-center">Your report generates instantly as a standalone HTML file.</p>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Hero ────────────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-950 via-violet-950 to-purple-950 text-white">
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
              <Sparkles className="h-3.5 w-3.5 text-yellow-400" /> AI-Powered &nbsp;·&nbsp; 20-Page Crawl &nbsp;·&nbsp; 100% Free
            </div>
            <h1 className="text-4xl sm:text-5xl font-black leading-tight mb-4">Free AI SEO Audit Tool</h1>
            <p className="text-lg text-white/70 mb-8 max-w-2xl mx-auto">
              Full-site crawl with AI-powered fixes, competitor gaps, EEAT analysis, Core Web Vitals, and a 90-day growth roadmap.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 max-w-2xl mx-auto">
              <div className="relative flex-1">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                <Input value={url} onChange={e => setUrl(e.target.value)} onKeyDown={e => e.key === "Enter" && !loading && runAudit()}
                  placeholder="https://yourwebsite.com"
                  className="pl-9 h-12 bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-white/50 text-sm" data-testid="input-url" />
              </div>
              <Button onClick={runAudit} disabled={loading} size="lg"
                className="h-12 px-8 bg-white text-indigo-900 hover:bg-white/90 font-bold gap-2 shrink-0" data-testid="button-audit">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                {loading ? "Analysing…" : "Audit My Site"}
              </Button>
            </div>
            <div className="flex flex-wrap justify-center gap-2 mt-5">
              {["Technical SEO","On-Page","Content & EEAT","Core Web Vitals","Competitor Gaps","90-Day Roadmap"].map(f => (
                <span key={f} className="flex items-center gap-1 text-xs bg-white/10 text-white/70 rounded-full px-3 py-1">
                  <CheckCircle className="h-3 w-3 text-green-400" /> {f}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-5xl py-10">

        {/* ── Loading ─────────────────────────────────────────────────────── */}
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
                <p className="text-sm text-muted-foreground">Crawling up to 20 pages · Usually 20–45 seconds</p>
              </div>
              <div className="flex flex-col items-start gap-2 w-72">
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

        {/* ── Report dashboard ─────────────────────────────────────────────── */}
        <AnimatePresence>
          {report && !loading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">

              {/* Header bar */}
              <Card className="overflow-hidden">
                <div className="bg-gradient-to-r from-indigo-600/10 via-violet-600/10 to-purple-600/10 border-b px-5 py-4">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <Globe className="h-4 w-4 text-primary" />
                        <a href={report.url} target="_blank" rel="noopener noreferrer"
                          className="font-bold text-lg hover:underline flex items-center gap-1">
                          {report.domain} <ExternalLink className="h-3.5 w-3.5 opacity-40" />
                        </a>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {report.pagesCrawled} pages crawled &nbsp;·&nbsp; {new Date(report.timestamp).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <Button variant="outline" size="sm" onClick={copyShareLink} className="gap-1.5">
                        {copied ? <CheckCircle className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                        {copied ? "Copied!" : "Share Link"}
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => { setReport(null); window.history.replaceState({}, "", window.location.pathname); }} className="gap-1.5">
                        <RefreshCw className="h-3.5 w-3.5" /> New Audit
                      </Button>
                      <Button size="sm" onClick={handleDownload} className="gap-1.5">
                        <Download className="h-3.5 w-3.5" /> Download Report
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Score grid */}
                <CardContent className="p-5">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
                    {[
                      { label: "Overall", score: report.score, icon: BarChart3 },
                      { label: "Technical", score: report.techScore, icon: Shield },
                      { label: "On-Page", score: report.onPageScore, icon: PenTool },
                      { label: "Content", score: report.contentScore, icon: FileText },
                    ].map(({ label, score, icon: Icon }) => {
                      const col = score >= 80 ? "text-green-500" : score >= 60 ? "text-amber-500" : "text-red-500";
                      const bg  = score >= 80 ? "bg-green-500/10" : score >= 60 ? "bg-amber-500/10" : "bg-red-500/10";
                      return (
                        <div key={label} className={`rounded-xl p-4 text-center border ${bg}`}>
                          <Icon className={`h-4 w-4 mx-auto mb-1 ${col}`} />
                          <div className={`text-3xl font-black ${col}`}>{score}</div>
                          <div className="text-xs font-semibold text-muted-foreground mt-0.5">{label}</div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: "Critical", count: critCount, color: "text-red-500", bg: "bg-red-500/10 border-red-200" },
                      { label: "Warnings", count: warnCount, color: "text-amber-500", bg: "bg-amber-500/10 border-amber-200" },
                      { label: "Info",     count: infoCount, color: "text-blue-500",  bg: "bg-blue-500/10 border-blue-200" },
                    ].map(({ label, count, color, bg }) => (
                      <div key={label} className={`rounded-xl p-3 border ${bg} text-center`}>
                        <div className={`text-2xl font-black ${color}`}>{count}</div>
                        <div className="text-[11px] font-semibold text-muted-foreground">{label}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* ── Tabs ──────────────────────────────────────────────────── */}
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="w-full flex-wrap h-auto gap-1 p-1">
                  <TabsTrigger value="overview"     className="gap-1.5 text-xs"><BarChart3 className="h-3.5 w-3.5" />Overview</TabsTrigger>
                  <TabsTrigger value="issues"       className="gap-1.5 text-xs"><AlertTriangle className="h-3.5 w-3.5" />Issues ({report.issues.length})</TabsTrigger>
                  <TabsTrigger value="roadmap"      className="gap-1.5 text-xs"><Calendar className="h-3.5 w-3.5" />Roadmap</TabsTrigger>
                  <TabsTrigger value="competitors"  className="gap-1.5 text-xs"><Users className="h-3.5 w-3.5" />Competitors</TabsTrigger>
                  <TabsTrigger value="content"      className="gap-1.5 text-xs"><BookOpen className="h-3.5 w-3.5" />Content & EEAT</TabsTrigger>
                  <TabsTrigger value="pages"        className="gap-1.5 text-xs"><Globe className="h-3.5 w-3.5" />Pages ({report.pages.length})</TabsTrigger>
                </TabsList>

                {/* ── OVERVIEW TAB ────────────────────────────────────────── */}
                <TabsContent value="overview" className="space-y-4 mt-4">
                  {/* Score rings */}
                  <Card>
                    <CardHeader className="pb-3 border-b"><CardTitle className="text-sm flex items-center gap-2"><Activity className="h-4 w-4 text-primary" />Score Breakdown</CardTitle></CardHeader>
                    <CardContent className="p-5">
                      <div className="flex flex-wrap justify-around gap-6">
                        <ScoreRing score={report.score} size={120} label="Overall SEO" />
                        <ScoreRing score={report.techScore} size={100} label="Technical" />
                        <ScoreRing score={report.onPageScore} size={100} label="On-Page" />
                        <ScoreRing score={report.contentScore} size={100} label="Content" />
                        <ScoreRing score={report.perfScore} size={100} label="Performance" />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Ranking prediction */}
                  {ai?.rankingPrediction && (
                    <div className="rounded-xl border bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200 dark:border-green-800 p-4 flex items-start gap-3">
                      <TrendingUp className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-bold text-green-700 uppercase tracking-wide mb-1">Ranking Prediction</p>
                        <p className="text-sm text-green-800 dark:text-green-200">{ai.rankingPrediction}</p>
                      </div>
                    </div>
                  )}

                  {/* AI Summary */}
                  {ai?.executiveSummary && (
                    <Card className="border-violet-200 dark:border-violet-800">
                      <CardHeader className="pb-3 border-b bg-gradient-to-r from-violet-500/5 to-purple-500/5">
                        <CardTitle className="text-sm flex items-center gap-2"><Sparkles className="h-4 w-4 text-violet-500" />AI Executive Summary</CardTitle>
                      </CardHeader>
                      <CardContent className="p-5 space-y-4">
                        <p className="text-sm leading-relaxed">{ai.executiveSummary}</p>
                        {ai.topPriority && (
                          <div className="bg-violet-50 dark:bg-violet-950/30 rounded-lg p-3 border border-violet-200 dark:border-violet-800">
                            <p className="text-xs font-bold text-violet-600 uppercase tracking-wide mb-1">Top Priority Action</p>
                            <p className="text-sm font-medium">{ai.topPriority}</p>
                          </div>
                        )}
                        <div className="grid sm:grid-cols-2 gap-4">
                          {ai.quickWins?.length > 0 && (
                            <div>
                              <p className="text-xs font-bold text-green-600 uppercase tracking-wide mb-2 flex items-center gap-1"><Zap className="h-3 w-3" />Quick Wins (under 1 hour)</p>
                              <ul className="space-y-1.5">
                                {ai.quickWins.map((w, i) => (
                                  <li key={i} className="flex items-start gap-2 text-sm"><CheckCircle className="h-3.5 w-3.5 text-green-500 shrink-0 mt-0.5" />{w}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {ai.longTermActions?.length > 0 && (
                            <div>
                              <p className="text-xs font-bold text-blue-600 uppercase tracking-wide mb-2 flex items-center gap-1"><TrendingUp className="h-3 w-3" />Strategic Actions</p>
                              <ul className="space-y-1.5">
                                {ai.longTermActions.map((a, i) => (
                                  <li key={i} className="flex items-start gap-2 text-sm"><ArrowRight className="h-3.5 w-3.5 text-blue-500 shrink-0 mt-0.5" />{a}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                        {ai.competitiveInsight && (
                          <div className="bg-green-50 dark:bg-green-950/30 rounded-lg p-3 border border-green-200 dark:border-green-800 flex items-start gap-2">
                            <Target className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                            <p className="text-sm text-green-700 dark:text-green-300">{ai.competitiveInsight}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                {/* ── ISSUES TAB ──────────────────────────────────────────── */}
                <TabsContent value="issues" className="mt-4">
                  <Card>
                    <CardHeader className="pb-3 border-b">
                      <div className="flex items-center justify-between flex-wrap gap-3">
                        <CardTitle className="text-sm flex items-center gap-2"><BarChart3 className="h-4 w-4 text-primary" />All Issues ({report.issues.length})</CardTitle>
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
                      ) : filteredIssues.map((issue, idx) => <IssueCard key={issue.id} issue={issue} idx={idx} />)}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* ── ROADMAP TAB ─────────────────────────────────────────── */}
                <TabsContent value="roadmap" className="mt-4 space-y-4">
                  <div className="rounded-xl border bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800 p-4 flex items-start gap-3">
                    <Lightbulb className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">AI-Generated 90-Day SEO Growth Plan</p>
                      <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">Prioritised by impact. Complete week 1 tasks first to build momentum.</p>
                    </div>
                  </div>
                  <div className="grid md:grid-cols-3 gap-4">
                    <RoadmapPhase title="Days 1–7: Quick Wins" icon={Zap} color="border-l-red-500" tasks={ai?.roadmap?.week1 ?? []} delay={0} />
                    <RoadmapPhase title="Days 8–30: Build Momentum" icon={Clock} color="border-l-amber-500" tasks={ai?.roadmap?.month1 ?? []} delay={0.1} />
                    <RoadmapPhase title="Days 31–90: Scale & Dominate" icon={TrendingUp} color="border-l-green-500" tasks={ai?.roadmap?.quarter ?? []} delay={0.2} />
                  </div>
                  {/* Internal linking */}
                  {ai?.internalLinkingIssues && ai.internalLinkingIssues.length > 0 && (
                    <Card>
                      <CardHeader className="pb-3 border-b"><CardTitle className="text-sm flex items-center gap-2"><Link2 className="h-4 w-4 text-primary" />Internal Linking Recommendations</CardTitle></CardHeader>
                      <CardContent className="p-4 space-y-2">
                        {ai.internalLinkingIssues.map((issue, i) => (
                          <div key={i} className="flex items-start gap-2 text-sm p-3 rounded-lg border bg-muted/30">
                            <ArrowRight className="h-4 w-4 text-primary shrink-0 mt-0.5" />{issue}
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                {/* ── COMPETITORS TAB ─────────────────────────────────────── */}
                <TabsContent value="competitors" className="mt-4 space-y-4">
                  {ai?.competitorComparison && (
                    <>
                      <div className="grid sm:grid-cols-3 gap-3">
                        {(ai.competitorComparison.topCompetitors ?? []).map((comp, i) => (
                          <Card key={i}>
                            <CardContent className="p-4 flex items-center gap-3">
                              <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0 font-bold text-primary">#{i+1}</div>
                              <div className="min-w-0">
                                <p className="text-sm font-semibold truncate">{comp}</p>
                                <p className="text-xs text-muted-foreground">Likely top competitor</p>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                      <div className="grid sm:grid-cols-2 gap-4">
                        <Card className="border-red-200 dark:border-red-800">
                          <CardHeader className="pb-2 border-b">
                            <CardTitle className="text-sm text-red-600 flex items-center gap-2"><XCircle className="h-4 w-4" />Competitor Advantages (Gaps)</CardTitle>
                          </CardHeader>
                          <CardContent className="p-4 space-y-2">
                            {(ai.competitorComparison.gaps ?? []).map((gap, i) => (
                              <div key={i} className="flex items-start gap-2 text-sm">
                                <XCircle className="h-3.5 w-3.5 text-red-400 shrink-0 mt-0.5" />{gap}
                              </div>
                            ))}
                          </CardContent>
                        </Card>
                        <Card className="border-green-200 dark:border-green-800">
                          <CardHeader className="pb-2 border-b">
                            <CardTitle className="text-sm text-green-600 flex items-center gap-2"><Trophy className="h-4 w-4" />Your Advantages</CardTitle>
                          </CardHeader>
                          <CardContent className="p-4 space-y-2">
                            {(ai.competitorComparison.advantages ?? []).map((adv, i) => (
                              <div key={i} className="flex items-start gap-2 text-sm">
                                <CheckCircle className="h-3.5 w-3.5 text-green-500 shrink-0 mt-0.5" />{adv}
                              </div>
                            ))}
                          </CardContent>
                        </Card>
                      </div>
                    </>
                  )}
                  {/* Keyword opportunities */}
                  {ai?.keywordOpportunities && ai.keywordOpportunities.length > 0 && (
                    <Card>
                      <CardHeader className="pb-3 border-b"><CardTitle className="text-sm flex items-center gap-2"><Search className="h-4 w-4 text-primary" />Keyword Opportunities</CardTitle></CardHeader>
                      <CardContent className="p-0">
                        <div className="divide-y">
                          <div className="grid grid-cols-4 px-4 py-2 bg-muted/50 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                            <span>Keyword</span><span>Intent</span><span>Difficulty</span><span>Action</span>
                          </div>
                          {ai.keywordOpportunities.map((kw, i) => {
                            const diffColor = kw.difficulty === "low" ? "text-green-600 bg-green-50" : kw.difficulty === "medium" ? "text-amber-600 bg-amber-50" : "text-red-600 bg-red-50";
                            return (
                              <div key={i} className="grid grid-cols-4 px-4 py-3 items-start gap-2 text-sm">
                                <span className="font-semibold">{kw.keyword}</span>
                                <span className="capitalize text-muted-foreground text-xs">{kw.intent}</span>
                                <span className={`inline-flex text-xs px-2 py-0.5 rounded-full font-semibold capitalize w-fit ${diffColor}`}>{kw.difficulty}</span>
                                <span className="text-muted-foreground text-xs">{kw.action}</span>
                              </div>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                {/* ── CONTENT & EEAT TAB ──────────────────────────────────── */}
                <TabsContent value="content" className="mt-4 space-y-4">
                  {/* EEAT */}
                  {ai?.eeat && (
                    <Card>
                      <CardHeader className="pb-3 border-b"><CardTitle className="text-sm flex items-center gap-2"><Trophy className="h-4 w-4 text-primary" />EEAT Analysis (Experience, Expertise, Authority, Trust)</CardTitle></CardHeader>
                      <CardContent className="p-5">
                        <div className="grid sm:grid-cols-2 gap-5 mb-5">
                          {[
                            { label: "Experience", score: ai.eeat.experienceScore, desc: "First-hand expertise signals" },
                            { label: "Expertise", score: ai.eeat.expertiseScore, desc: "Subject matter knowledge" },
                            { label: "Authority", score: ai.eeat.authorityScore, desc: "Industry recognition & links" },
                            { label: "Trust", score: ai.eeat.trustScore, desc: "Safety, accuracy & transparency" },
                          ].map(({ label, score, desc }) => {
                            const col = score >= 80 ? "bg-green-500" : score >= 60 ? "bg-amber-500" : "bg-red-500";
                            const txt = score >= 80 ? "text-green-600" : score >= 60 ? "text-amber-600" : "text-red-600";
                            return (
                              <div key={label} className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="text-sm font-semibold">{label}</p>
                                    <p className="text-xs text-muted-foreground">{desc}</p>
                                  </div>
                                  <span className={`text-lg font-black ${txt}`}>{score}</span>
                                </div>
                                <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                                  <motion.div className={`h-full ${col} rounded-full`}
                                    initial={{ width: 0 }} animate={{ width: `${score}%` }} transition={{ duration: 1.2 }} />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        {ai.eeat.improvements?.length > 0 && (
                          <div className="border rounded-xl p-4 bg-muted/30">
                            <p className="text-xs font-bold text-primary uppercase tracking-wide mb-2">EEAT Improvement Actions</p>
                            <ul className="space-y-2">
                              {ai.eeat.improvements.map((imp, i) => (
                                <li key={i} className="flex items-start gap-2 text-sm">
                                  <Sparkles className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />{imp}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {/* Core Web Vitals */}
                  {ai?.coreWebVitals && (
                    <Card>
                      <CardHeader className="pb-3 border-b"><CardTitle className="text-sm flex items-center gap-2"><Gauge className="h-4 w-4 text-primary" />Core Web Vitals</CardTitle></CardHeader>
                      <CardContent className="p-5 space-y-4">
                        {[
                          { metric: "LCP", full: "Largest Contentful Paint", status: ai.coreWebVitals.lcp, tip: ai.coreWebVitals.lcpTip, desc: "Loading performance" },
                          { metric: "CLS", full: "Cumulative Layout Shift", status: ai.coreWebVitals.cls, tip: ai.coreWebVitals.clsTip, desc: "Visual stability" },
                          { metric: "INP", full: "Interaction to Next Paint", status: ai.coreWebVitals.inp, tip: ai.coreWebVitals.inpTip, desc: "Interactivity" },
                        ].map(({ metric, full, status, tip, desc }) => (
                          <div key={metric} className="flex items-start gap-4 p-3 rounded-lg border bg-muted/20">
                            <div className="text-center shrink-0">
                              <div className="text-lg font-black">{metric}</div>
                              <CWVBadge status={status} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold">{full}</p>
                              <p className="text-xs text-muted-foreground mb-1">{desc}</p>
                              {tip && <p className="text-xs text-foreground/70 bg-primary/5 rounded p-2 border-l-2 border-primary">{tip}</p>}
                            </div>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  )}

                  {/* Content suggestions */}
                  {ai?.contentSuggestions && ai.contentSuggestions.length > 0 && (
                    <Card>
                      <CardHeader className="pb-3 border-b"><CardTitle className="text-sm flex items-center gap-2"><Lightbulb className="h-4 w-4 text-primary" />Content Improvement Suggestions</CardTitle></CardHeader>
                      <CardContent className="p-4 space-y-3">
                        {ai.contentSuggestions.map((s, i) => (
                          <div key={i} className="flex items-start gap-3 p-3 rounded-lg border bg-muted/20">
                            <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-xs font-bold text-primary">{i + 1}</div>
                            <div>
                              <p className="text-xs font-bold text-primary mb-0.5">{s.page}</p>
                              <p className="text-sm">{s.suggestion}</p>
                            </div>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                {/* ── PAGES TAB ───────────────────────────────────────────── */}
                <TabsContent value="pages" className="mt-4">
                  <Card>
                    <CardHeader className="pb-3 border-b"><CardTitle className="text-sm flex items-center gap-2"><Globe className="h-4 w-4 text-primary" />All Crawled Pages ({report.pages.length})</CardTitle></CardHeader>
                    <CardContent className="p-0">
                      <div className="divide-y">
                        <div className="grid grid-cols-12 px-4 py-2 bg-muted/50 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                          <span className="col-span-1">Score</span>
                          <span className="col-span-6">URL / Title</span>
                          <span className="col-span-2 text-right">Words</span>
                          <span className="col-span-2 text-right">Size</span>
                          <span className="col-span-1 text-right">JS</span>
                        </div>
                        {report.pages.map((p, i) => {
                          const col = p.score >= 80 ? "text-green-500" : p.score >= 60 ? "text-amber-500" : "text-red-500";
                          return (
                            <div key={i} className="grid grid-cols-12 px-4 py-3 items-center gap-1 hover:bg-muted/20 transition-colors">
                              <span className={`col-span-1 font-black text-sm ${col}`}>{p.score}</span>
                              <div className="col-span-6 min-w-0">
                                <a href={p.url} target="_blank" rel="noopener noreferrer" className="text-xs font-medium hover:underline truncate block">{p.url.replace(/^https?:\/\//, "")}</a>
                                {p.title && <p className="text-xs text-muted-foreground truncate">{p.title}</p>}
                              </div>
                              <span className="col-span-2 text-xs text-muted-foreground text-right">{p.wordCount}</span>
                              <span className="col-span-2 text-xs text-muted-foreground text-right">{p.pageSize ? `${Math.round(p.pageSize / 1024)}KB` : "—"}</span>
                              <span className="col-span-1 text-xs text-muted-foreground text-right">{p.scripts ?? "—"}</span>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>

              {/* ── Bottom CTA ────────────────────────────────────────────── */}
              <Card className="bg-gradient-to-r from-indigo-600 to-violet-600 border-0 text-white">
                <CardContent className="p-6 text-center space-y-3">
                  <Star className="h-7 w-7 mx-auto text-yellow-400" />
                  <h3 className="text-lg font-bold">Want deeper analysis?</h3>
                  <p className="text-white/80 text-sm max-w-sm mx-auto">Use our full SEO suite — 25+ tools including keyword research, broken link checker, SERP preview, and more.</p>
                  <div className="flex flex-wrap justify-center gap-3">
                    <Link href="/seo-tools">
                      <Button className="bg-white text-indigo-700 hover:bg-white/90 font-bold gap-1.5">
                        Open SEO Tools <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button variant="outline" className="border-white/30 text-white hover:bg-white/10" onClick={handleDownload}>
                      <Download className="h-4 w-4 mr-1.5" /> Download Report
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Landing / feature list ───────────────────────────────────────── */}
        {!report && !loading && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-4">
            <div className="grid sm:grid-cols-3 gap-4 mb-6">
              {[
                { icon: Shield,   title: "Technical SEO",       desc: "HTTPS, canonical, viewport, robots.txt, sitemap, schema, page speed signals", color: "text-blue-500" },
                { icon: PenTool,  title: "On-Page SEO",         desc: "Title tags, meta descriptions, heading structure, image alt text", color: "text-violet-500" },
                { icon: FileText, title: "Content & EEAT",      desc: "Word count, readability, EEAT analysis, Open Graph, structured data", color: "text-pink-500" },
                { icon: Gauge,    title: "Core Web Vitals",     desc: "LCP, CLS, INP estimates with specific optimisation tips for each", color: "text-orange-500" },
                { icon: Users,    title: "Competitor Analysis", desc: "Top 3 likely competitors, keyword gaps, and your competitive advantages", color: "text-emerald-500" },
                { icon: Calendar, title: "90-Day Roadmap",      desc: "AI-generated week-by-week action plan prioritised by impact", color: "text-indigo-500" },
              ].map(({ icon: Icon, title, desc, color }) => (
                <Card key={title} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-5 space-y-2">
                    <Icon className={`h-7 w-7 ${color}`} />
                    <h3 className="font-bold text-sm">{title}</h3>
                    <p className="text-sm text-muted-foreground">{desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { icon: Sparkles, title: "AI Fix Suggestions",   desc: "Every issue includes a specific, GPT-4 powered fix. No guesswork — just copy and implement." },
                { icon: Share2,   title: "Shareable Audit Link", desc: "Share your audit with your team or client via a unique URL. Reports stay live for 24 hours." },
                { icon: Download, title: "White-Label Report",   desc: "Download a polished HTML report with full audit data, roadmap, and EEAT analysis." },
                { icon: Target,   title: "Keyword Gaps",         desc: "Discover keyword opportunities your competitors rank for that you're missing." },
              ].map(({ icon: Icon, title, desc }) => (
                <div key={title} className="flex items-start gap-3 p-4 rounded-xl border bg-card">
                  <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0"><Icon className="h-4 w-4 text-primary" /></div>
                  <div><h4 className="font-semibold text-sm">{title}</h4><p className="text-sm text-muted-foreground">{desc}</p></div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
