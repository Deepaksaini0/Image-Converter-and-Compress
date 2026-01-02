import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { ArrowLeft, Plus, Trash2, Copy, Download } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

export default function FAQPage() {
  const [faqItems, setFaqItems] = useState<FAQItem[]>([
    {
      id: "1",
      question: "What is this tool?",
      answer: "This tool generates FAQ Page JSON-LD Schema for improved SEO and rich search results."
    }
  ]);
  const [websiteName, setWebsiteName] = useState("My Website");
  const [websiteUrl, setWebsiteUrl] = useState("https://example.com");
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [currentAnswer, setCurrentAnswer] = useState("");
  const { toast } = useToast();

  const addFAQItem = () => {
    if (!currentQuestion.trim() || !currentAnswer.trim()) {
      toast({
        title: "Error",
        description: "Please enter both question and answer",
        variant: "destructive"
      });
      return;
    }

    const newItem: FAQItem = {
      id: Date.now().toString(),
      question: currentQuestion,
      answer: currentAnswer
    };

    setFaqItems([...faqItems, newItem]);
    setCurrentQuestion("");
    setCurrentAnswer("");

    toast({
      title: "Success",
      description: "FAQ item added successfully"
    });
  };

  const removeFAQItem = (id: string) => {
    setFaqItems(faqItems.filter(item => item.id !== id));
    toast({
      title: "Removed",
      description: "FAQ item removed"
    });
  };

  const generateJSONLD = () => {
    const mainEntity = faqItems.map(item => ({
      "@type": "Question",
      "name": item.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": item.answer
      }
    }));

    return {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": mainEntity
    };
  };

  const jsonldOutput = generateJSONLD();
  const jsonldString = JSON.stringify(jsonldOutput);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(jsonldString);
    toast({
      title: "Copied!",
      description: "JSON-LD schema copied to clipboard"
    });
  };

  const downloadSchema = () => {
    const element = document.createElement("a");
    const file = new Blob([jsonldString], { type: "application/json" });
    element.href = URL.createObjectURL(file);
    element.download = "faq-schema.json";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);

    toast({
      title: "Downloaded!",
      description: "FAQ schema downloaded as JSON file"
    });
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
              FAQ JSON-LD Schema Generator
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Create structured data for better SEO and rich search results
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="p-6 space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-black dark:text-white mb-4">
                  Website Information
                </h2>
                
                <div className="space-y-4">
                  <div>
                    <Label className="text-black dark:text-white font-semibold mb-2 block">
                      Website Name
                    </Label>
                    <Input
                      placeholder="My Website"
                      value={websiteName}
                      onChange={(e) => setWebsiteName(e.target.value)}
                      className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-black dark:text-white"
                      data-testid="input-website-name"
                    />
                  </div>

                  <div>
                    <Label className="text-black dark:text-white font-semibold mb-2 block">
                      Website URL
                    </Label>
                    <Input
                      placeholder="https://example.com"
                      value={websiteUrl}
                      onChange={(e) => setWebsiteUrl(e.target.value)}
                      className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-black dark:text-white"
                      data-testid="input-website-url"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-300 dark:border-gray-700 pt-6">
                <h2 className="text-2xl font-bold text-black dark:text-white mb-4">
                  Add FAQ Items
                </h2>

                <div className="space-y-4">
                  <div>
                    <Label className="text-black dark:text-white font-semibold mb-2 block">
                      Question
                    </Label>
                    <Input
                      placeholder="What is this service?"
                      value={currentQuestion}
                      onChange={(e) => setCurrentQuestion(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addFAQItem()}
                      className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-black dark:text-white"
                      data-testid="input-question"
                    />
                  </div>

                  <div>
                    <Label className="text-black dark:text-white font-semibold mb-2 block">
                      Answer
                    </Label>
                    <Textarea
                      placeholder="Provide a detailed answer..."
                      value={currentAnswer}
                      onChange={(e) => setCurrentAnswer(e.target.value)}
                      className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-black dark:text-white min-h-24 resize-none"
                      data-testid="textarea-answer"
                    />
                  </div>

                  <Button
                    onClick={addFAQItem}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    data-testid="button-add-faq"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add FAQ Item
                  </Button>
                </div>
              </div>

              {/* FAQ Items List */}
              <div className="border-t border-gray-300 dark:border-gray-700 pt-6">
                <h2 className="text-xl font-bold text-black dark:text-white mb-4">
                  FAQ Items ({faqItems.length})
                </h2>

                <AnimatePresence>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {faqItems.map((item) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg"
                      >
                        <div className="flex justify-between items-start gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-black dark:text-white truncate">
                              {item.question}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                              {item.answer}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeFAQItem(item.id)}
                            className="hover-elevate text-red-600 dark:text-red-400"
                            data-testid={`button-delete-faq-${item.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </AnimatePresence>
              </div>
            </Card>
          </motion.div>

          {/* Output Section */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="p-6 space-y-4 h-full flex flex-col">
              <div>
                <h2 className="text-2xl font-bold text-black dark:text-white mb-4">
                  JSON-LD Schema
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Add this to your page's &lt;head&gt; tag inside &lt;script type="application/ld+json"&gt;
                </p>
              </div>

              <div className="flex-1 bg-gray-900 rounded-lg p-4 overflow-auto">
                <pre className="text-sm text-green-400 font-mono whitespace-pre-wrap break-words">
                  {jsonldString}
                </pre>
              </div>

              <div className="flex gap-2 pt-4 border-t border-gray-300 dark:border-gray-700">
                <Button
                  onClick={copyToClipboard}
                  variant="default"
                  className="flex-1"
                  data-testid="button-copy-schema"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy
                </Button>
                <Button
                  onClick={downloadSchema}
                  variant="outline"
                  className="flex-1"
                  data-testid="button-download-schema"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>

              {/* HTML Snippet */}
              <div className="pt-6 border-t border-gray-300 dark:border-gray-700">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-bold text-black dark:text-white">
                    HTML Snippet
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const snippet = `<script type="application/ld+json">\n${jsonldString}\n</script>`;
                      navigator.clipboard.writeText(snippet);
                      toast({
                        title: "Copied!",
                        description: "HTML snippet copied to clipboard"
                      });
                    }}
                    className="h-8 px-2"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy HTML
                  </Button>
                </div>
                <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 overflow-auto max-h-40">
                  <pre className="text-xs text-black dark:text-white font-mono whitespace-pre-wrap break-words">
{`<script type="application/ld+json">
${jsonldString}
</script>`}
                  </pre>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
