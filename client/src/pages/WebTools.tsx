import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Copy, Code, ArrowLeft, RotateCcw, Download, Zap, Wand2 } from "lucide-react";
import { Link } from "wouter";
import { motion } from "framer-motion";

type ToolType = "css-minify" | "css-beautify" | "js-minify" | "js-beautify" | "html-minify" | "html-beautify" | "sitemap-generator";

export default function WebTools() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [tool, setTool] = useState<ToolType>("css-minify");
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleProcess = async () => {
    if (!input.trim()) return;
    setIsProcessing(true);
    try {
      if (tool === "sitemap-generator") {
        const res = await fetch("/api/generate-sitemap", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: input }),
        });
        if (!res.ok) throw new Error("Failed to generate sitemap");
        const data = await res.text();
        setOutput(data);
      } else {
        const res = await fetch("/api/web-tools/process", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ input, tool }),
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        setOutput(data.output);
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to process code",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const copyToClipboard = () => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    toast({ title: "Copied!", description: "Output copied to clipboard." });
  };

  const downloadOutput = () => {
    if (!output) return;
    let ext = tool.startsWith("css") ? "css" : tool.startsWith("js") ? "js" : "html";
    if (tool === "sitemap-generator") ext = "xml";
    const blob = new Blob([output], { type: tool === "sitemap-generator" ? "application/xml" : "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = tool === "sitemap-generator" ? "sitemap.xml" : `processed.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="icon" className="hover-elevate">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-display font-bold text-black">Web Development Tools</h1>
              <p className="text-muted-foreground">Minify, Beautify, or Generate Sitemap</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => { setInput(""); setOutput(""); }} className="hover-elevate">
              <RotateCcw className="h-4 w-4 mr-2" /> Reset
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="flex flex-col h-[600px]">
            <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-2">
              <Select value={tool} onValueChange={(v) => {
                setTool(v as ToolType);
                if (v === "sitemap-generator") {
                  setInput("https://");
                }
              }}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Select Tool" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="css-minify">CSS Minify</SelectItem>
                  <SelectItem value="css-beautify">CSS Beautifier</SelectItem>
                  <SelectItem value="js-minify">JS Minify</SelectItem>
                  <SelectItem value="js-beautify">JS Beautifier</SelectItem>
                  <SelectItem value="html-minify">HTML Minify</SelectItem>
                  <SelectItem value="html-beautify">HTML Beautifier</SelectItem>
                  <SelectItem value="sitemap-generator">Sitemap Generator</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleProcess} disabled={!input.trim() || isProcessing} className="hover-elevate">
                {isProcessing ? "Processing..." : tool === "sitemap-generator" ? <Code className="h-4 w-4 mr-2" /> : tool.includes("minify") ? <Zap className="h-4 w-4 mr-2" /> : <Wand2 className="h-4 w-4 mr-2" />}
                {tool.split("-").map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(" ")}
              </Button>
            </CardHeader>
            <CardContent className="flex-1 p-0">
              <Textarea
                placeholder={tool === "sitemap-generator" ? "Enter website URL (e.g., https://example.com)" : "Paste your code here..."}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="h-full w-full resize-none border-0 rounded-none focus-visible:ring-0 p-4 font-mono text-sm"
              />
            </CardContent>
          </Card>

          <Card className="flex flex-col h-[600px]">
            <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
              <CardTitle className="text-lg font-semibold">Output</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={copyToClipboard} disabled={!output} className="hover-elevate">
                  <Copy className="h-4 w-4 mr-2" /> Copy
                </Button>
                <Button variant="outline" size="sm" onClick={downloadOutput} disabled={!output} className="hover-elevate">
                  <Download className="h-4 w-4 mr-2" /> Download
                </Button>
              </div>
            </CardHeader>
            <CardContent className="flex-1 p-0 bg-muted/30 min-h-0 overflow-hidden">
              <ScrollArea className="h-full w-full">
                <div className="p-4 font-mono text-sm whitespace-pre-wrap break-words overflow-x-hidden">
                  {output || <span className="text-muted-foreground italic">Processed output will appear here...</span>}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
