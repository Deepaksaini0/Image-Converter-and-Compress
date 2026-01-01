import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { Copy, ArrowLeft, RotateCcw, Download, Bold, Italic, Underline, List, ListOrdered, Link as LinkIcon } from "lucide-react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import UnderlineExtension from '@tiptap/extension-underline';
import LinkExtension from '@tiptap/extension-link';

const MenuBar = ({ editor }: { editor: any }) => {
  if (!editor) return null;

  const addLink = () => {
    const url = window.prompt('URL');
    if (url) {
      editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    }
  };

  return (
    <div className="flex flex-wrap gap-1 p-2 border-b bg-muted/50">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={editor.isActive('bold') ? 'bg-muted' : ''}
      >
        <Bold className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={editor.isActive('italic') ? 'bg-muted' : ''}
      >
        <Italic className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        className={editor.isActive('underline') ? 'bg-muted' : ''}
      >
        <Underline className="h-4 w-4" />
      </Button>
      <div className="w-px h-6 bg-border mx-1" />
      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={editor.isActive('bulletList') ? 'bg-muted' : ''}
      >
        <List className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={editor.isActive('orderedList') ? 'bg-muted' : ''}
      >
        <ListOrdered className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={addLink}
        className={editor.isActive('link') ? 'bg-muted' : ''}
      >
        <LinkIcon className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default function TextToHTML() {
  const [html, setHtml] = useState("");
  const { toast } = useToast();

  const editor = useEditor({
    extensions: [
      StarterKit,
      UnderlineExtension,
      LinkExtension.configure({
        openOnClick: false,
      }),
    ],
    content: '',
    onUpdate: ({ editor }) => {
      setHtml(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose dark:prose-invert max-w-none p-4 min-h-[400px] focus:outline-none',
      },
    },
  });

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
    editor?.commands.setContent('');
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
                Rich Text to HTML
              </h1>
              <p className="text-muted-foreground">
                Design with rich text and get clean HTML output
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={reset}
              disabled={!html || html === '<p></p>'}
              className="hover-elevate"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Editor Area */}
          <Card className="flex flex-col h-[600px] overflow-hidden">
            <CardHeader className="p-0 border-b">
              <MenuBar editor={editor} />
            </CardHeader>
            <CardContent className="flex-1 p-0 overflow-y-auto">
              <EditorContent editor={editor} />
            </CardContent>
          </Card>

          {/* Output Area */}
          <Card className="flex flex-col h-[600px]">
            <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2 border-b">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                HTML Output
              </CardTitle>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyToClipboard}
                  disabled={!html || html === '<p></p>'}
                  className="hover-elevate"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={downloadHTML}
                  disabled={!html || html === '<p></p>'}
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
                  {html && html !== '<p></p>' ? (
                    html
                  ) : (
                    <span className="text-muted-foreground italic">
                      HTML output will appear here as you type...
                    </span>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
