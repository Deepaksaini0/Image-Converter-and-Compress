import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { ArrowLeft, Copy, Download } from "lucide-react";
import { motion } from "framer-motion";

const DEFAULT_LLMS_TXT = `# llms.txt - AI Web Standards

## About
This file communicates AI accessibility and usage policies to Large Language Models.

## Model Information
- Name: [Your Website Name]
- Website: https://example.com
- Last Updated: 2024-12-30

## Content Policy

### Allowed Uses
- Summarization of publicly available content
- Citation and attribution with proper links
- Educational and research purposes
- Training on published materials with respect to robots.txt

### Disallowed Uses
- Commercial reproduction without permission
- Training proprietary models without consent
- Removing or modifying attribution
- Creating competing products from our content
- Mass scraping or systematic downloading
- Real-time content mirroring

## Content Guidelines

### Respect
- Honor the author's original intent and context
- Provide proper attribution and source links
- Disclose when content is AI-generated
- Respect copyright and intellectual property rights

### Accuracy
- Verify information against original sources
- Correct misinformation when identified
- Note limitations and uncertainties
- Update outdated information

### Privacy
- Do not use personal information from content
- Respect privacy policies
- Handle sensitive data appropriately
- Comply with data protection regulations

## Content Categories

### Recommended for Training
- Blog posts and articles
- Published guides and tutorials
- Documentation and technical content
- Research and whitepapers
- Open source documentation

### Not Recommended
- User-generated comments and discussions
- Personal data and private information
- Medical or legal advice
- Financial recommendations
- Unverified claims

## Rate Limits
- Request limits: Respect website rate limits
- Cache responses when possible
- Implement exponential backoff for retries
- Identify requests with User-Agent headers

## Contact
- For questions: contact@example.com
- Website: https://example.com
- Privacy Policy: https://example.com/privacy

## License
This llms.txt file is provided under the Creative Commons CC0 1.0 Universal license.

---
Version: 1.0
Standards: llms.txt specification v1`;

export default function LLMPage() {
  const [content, setContent] = useState(DEFAULT_LLMS_TXT);
  const { toast } = useToast();

  const copyToClipboard = () => {
    navigator.clipboard.writeText(content);
    toast({
      title: "Copied!",
      description: "llms.txt content copied to clipboard"
    });
  };

  const downloadFile = () => {
    const element = document.createElement("a");
    const file = new Blob([content], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = "llms.txt";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);

    toast({
      title: "Downloaded!",
      description: "llms.txt file downloaded"
    });
  };

  const resetToDefault = () => {
    setContent(DEFAULT_LLMS_TXT);
    toast({
      title: "Reset",
      description: "Content reset to default template"
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/">
            <Button variant="ghost" size="icon" className="hover-elevate">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-4xl font-bold text-black dark:text-white">
              llms.txt Generator
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Create a standard file to communicate AI policies to Large Language Models
            </p>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="p-6 space-y-6">
            {/* Instructions */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h2 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">How to Use</h2>
              <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                <li>1. Edit the content below to customize for your website</li>
                <li>2. Replace placeholder values with your actual information</li>
                <li>3. Copy the content or download as llms.txt</li>
                <li>4. Place the file in your website root directory (e.g., example.com/llms.txt)</li>
              </ul>
            </div>

            {/* Editor */}
            <div>
              <Label className="text-black dark:text-white font-semibold mb-3 block">
                llms.txt Content
              </Label>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="font-mono text-sm bg-gray-900 dark:bg-gray-950 text-green-400 border-gray-700 dark:border-gray-700 min-h-96 resize-vertical p-4 rounded-lg"
                data-testid="textarea-llms-content"
              />
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
                <p className="text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wide">Content Size</p>
                <p className="text-lg font-semibold text-black dark:text-white mt-1">
                  {(content.length / 1024).toFixed(2)} KB
                </p>
              </div>
              <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
                <p className="text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wide">Lines</p>
                <p className="text-lg font-semibold text-black dark:text-white mt-1">
                  {content.split('\n').length}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-gray-300 dark:border-gray-700">
              <Button
                onClick={copyToClipboard}
                variant="default"
                className="flex-1"
                data-testid="button-copy-llms"
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy
              </Button>
              <Button
                onClick={downloadFile}
                variant="outline"
                className="flex-1"
                data-testid="button-download-llms"
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
              <Button
                onClick={resetToDefault}
                variant="ghost"
                className="flex-1"
                data-testid="button-reset-llms"
              >
                Reset
              </Button>
            </div>

            {/* Preview Info */}
            <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
              <h3 className="font-semibold text-black dark:text-white mb-2">File Details</h3>
              <div className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
                <p><span className="font-medium">Filename:</span> llms.txt</p>
                <p><span className="font-medium">Location:</span> https://example.com/llms.txt</p>
                <p><span className="font-medium">Format:</span> Plain text (UTF-8)</p>
                <p><span className="font-medium">Content-Type:</span> text/plain</p>
              </div>
            </div>

            {/* Additional Info */}
            <div className="border-t border-gray-300 dark:border-gray-700 pt-6">
              <h3 className="font-semibold text-black dark:text-white mb-3">Key Sections</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium text-black dark:text-white mb-1">Allowed Uses</p>
                  <p className="text-gray-600 dark:text-gray-400">Define what LLMs can do with your content</p>
                </div>
                <div>
                  <p className="font-medium text-black dark:text-white mb-1">Disallowed Uses</p>
                  <p className="text-gray-600 dark:text-gray-400">Specify prohibited activities</p>
                </div>
                <div>
                  <p className="font-medium text-black dark:text-white mb-1">Rate Limits</p>
                  <p className="text-gray-600 dark:text-gray-400">Set expectations for access patterns</p>
                </div>
                <div>
                  <p className="font-medium text-black dark:text-white mb-1">Contact Info</p>
                  <p className="text-gray-600 dark:text-gray-400">Provide support and inquiry channels</p>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
