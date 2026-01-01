import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { Copy, Code, ArrowLeft, RotateCcw, Download } from "lucide-react";
import { Link } from "wouter";
import { motion } from "framer-motion";

export default function TextToHTML() {
  const [text, setText] = useState("");
  const [html, setHtml] = useState("");
  const { toast } = useToast();

  const convertToHTML = () => {
    if (!text.trim()) {
      setHtml("");
      return;
    }

    // Simple conversion logic: split by double newlines for paragraphs,
    // and single newlines within paragraphs for line breaks.
    const paragraphs = text.trim().split(/\n\s*\n/);
    const converted = paragraphs
      .map((p) => {
        const lines = p.split("\n").map((line) => line.trim());
        return `<p>${lines.join("<br />")}</p>`;
      })
      .join("\n");

    setHtml(converted);
  };

  const copyToClipboard = () => {
    if (!html) return;
    navigator.clipboard.writeText(html);
    toast({
      title: "Copied!",
      description: "HTML code has been copied to clipboard.",
    });
  };

  const downloadHTML = () => {
    if (!html) return;
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "converted.html";
    a.click();
    URL.revokeObjectURL(url);
  };

  const reset = () => {
    setText("");
    setHtml("");
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="icon" className="hover-elevate">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-display font-bold text-black dark:text-black">
                Text to HTML Converter
              </h1>
              <p className="text-muted-foreground">
                Convert plain text to clean HTML paragraphs and breaks
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={reset}
              disabled={!text && !html}
              className="hover-elevate"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Area */}
          <Card className="flex flex-col h-[600px]">
            <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                Plain Text
              </CardTitle>
              <Button
                size="sm"
                onClick={convertToHTML}
                disabled={!text.trim()}
                className="hover-elevate"
              >
                Convert
              </Button>
            </CardHeader>
            <CardContent className="flex-1 p-0">
              <Textarea
                placeholder="Paste your plain text here..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="h-full w-full resize-none border-0 rounded-none focus-visible:ring-0 p-4 text-base font-mono"
              />
            </CardContent>
          </Card>

          {/* Output Area */}
          <Card className="flex flex-col h-[600px]">
            <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                HTML Output
              </CardTitle>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyToClipboard}
                  disabled={!html}
                  className="hover-elevate"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={downloadHTML}
                  disabled={!html}
                  className="hover-elevate"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>
            </CardHeader>
            <CardContent className="flex-1 p-0 bg-muted/30">
              <ScrollArea className="h-full w-full">
                <div className="p-4 font-mono text-sm break-all whitespace-pre-wrap">
                  {html || (
                    <span className="text-muted-foreground italic">
                      HTML output will appear here...
                    </span>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Live Preview */}
        {html && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  Live Preview
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 prose dark:prose-invert max-w-none">
                <div dangerouslySetInnerHTML={{ __html: html }} />
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}
