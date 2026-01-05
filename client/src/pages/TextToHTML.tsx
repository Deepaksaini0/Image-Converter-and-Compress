import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { 
  Copy, ArrowLeft, RotateCcw, Download, Bold, Italic, Underline, 
  List, ListOrdered, Link as LinkIcon, AlignLeft, AlignCenter, 
  AlignRight, AlignJustify, Type, Highlighter, Table as TableIcon,
  Undo, Redo, ChevronDown, Image as ImageIcon
} from "lucide-react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import UnderlineExtension from '@tiptap/extension-underline';
import LinkExtension from '@tiptap/extension-link';
import { Color } from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import { Highlight } from '@tiptap/extension-highlight';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableHeader } from '@tiptap/extension-table-header';
import { TableCell } from '@tiptap/extension-table-cell';
import { TextAlign } from '@tiptap/extension-text-align';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
// @ts-ignore
import { html as beautifyHtml } from "js-beautify";

import Image from '@tiptap/extension-image';

const MenuBar = ({ editor }: { editor: any }) => {
  if (!editor) return null;

  const addImage = () => {
    const url = window.prompt('Image URL');
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  const addLink = () => {
    const url = window.prompt('URL');
    if (url) {
      editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    }
  };

  const addTable = () => {
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  };

  const addClass = () => {
    const className = window.prompt('Enter class name (e.g., custom-title, my-list)');
    if (className && editor) {
      if (!editor.state.selection.empty) {
        // Selection is not empty, apply to selection (marks)
        editor.chain().focus().setMark('textStyle', { class: className }).run();
      } else {
        // Apply to current block
        editor.chain().focus().updateAttributes(editor.state.selection.$from.parent.type, {
          class: className
        }).run();
      }
    }
  };

  return (
    <div className="flex flex-col border-b bg-muted/30">
      <div className="flex gap-4 px-3 py-1 border-b text-sm text-muted-foreground bg-muted/20">
        <DropdownMenu>
          <DropdownMenuTrigger className="hover:text-foreground outline-none">File</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => editor.commands.setContent('')}>New</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <DropdownMenu>
          <DropdownMenuTrigger className="hover:text-foreground outline-none">Edit</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => editor.chain().focus().undo().run()}>Undo</DropdownMenuItem>
            <DropdownMenuItem onClick={() => editor.chain().focus().redo().run()}>Redo</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <DropdownMenu>
          <DropdownMenuTrigger className="hover:text-foreground outline-none">Insert</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={addLink}>Link</DropdownMenuItem>
            <DropdownMenuItem onClick={addTable}>Table</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <DropdownMenu>
          <DropdownMenuTrigger className="hover:text-foreground outline-none">Format</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={addClass}>Add Class to Block</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <span className="cursor-default">Table</span>
        <span className="cursor-default">Tools</span>
      </div>

      <div className="flex flex-wrap items-center gap-0.5 p-1.5">
        <div className="flex items-center">
          <Button variant="ghost" size="sm" onClick={() => editor.chain().focus().undo().run()} className="h-8 w-8 p-0">
            <Undo className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => editor.chain().focus().redo().run()} className="h-8 w-8 p-0">
            <Redo className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="w-px h-6 bg-border mx-1" />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 px-2 flex items-center gap-1">
              Formats <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => editor.chain().focus().setParagraph().run()}>Paragraph</DropdownMenuItem>
            <DropdownMenuItem onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>Heading 1</DropdownMenuItem>
            <DropdownMenuItem onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>Heading 2</DropdownMenuItem>
            <DropdownMenuItem onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>Heading 3</DropdownMenuItem>
            <DropdownMenuItem onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()}>Heading 4</DropdownMenuItem>
            <DropdownMenuItem onClick={() => editor.chain().focus().toggleHeading({ level: 5 }).run()}>Heading 5</DropdownMenuItem>
            <DropdownMenuItem onClick={() => editor.chain().focus().toggleHeading({ level: 6 }).run()}>Heading 6</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="w-px h-6 bg-border mx-1" />

        <div className="flex items-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`h-8 w-8 p-0 ${editor.isActive('bold') ? 'bg-muted' : ''}`}
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`h-8 w-8 p-0 ${editor.isActive('italic') ? 'bg-muted' : ''}`}
          >
            <Italic className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={`h-8 w-8 p-0 ${editor.isActive('underline') ? 'bg-muted' : ''}`}
          >
            <Underline className="h-4 w-4" />
          </Button>
        </div>

        <div className="w-px h-6 bg-border mx-1" />

        <div className="flex items-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            className={`h-8 w-8 p-0 ${editor.isActive({ textAlign: 'left' }) ? 'bg-muted' : ''}`}
          >
            <AlignLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            className={`h-8 w-8 p-0 ${editor.isActive({ textAlign: 'center' }) ? 'bg-muted' : ''}`}
          >
            <AlignCenter className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            className={`h-8 w-8 p-0 ${editor.isActive({ textAlign: 'right' }) ? 'bg-muted' : ''}`}
          >
            <AlignRight className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().setTextAlign('justify').run()}
            className={`h-8 w-8 p-0 ${editor.isActive({ textAlign: 'justify' }) ? 'bg-muted' : ''}`}
          >
            <AlignJustify className="h-4 w-4" />
          </Button>
        </div>

        <div className="w-px h-6 bg-border mx-1" />

        <div className="flex items-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`h-8 w-8 p-0 ${editor.isActive('bulletList') ? 'bg-muted' : ''}`}
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`h-8 w-8 p-0 ${editor.isActive('orderedList') ? 'bg-muted' : ''}`}
          >
            <ListOrdered className="h-4 w-4" />
          </Button>
        </div>

        <div className="w-px h-6 bg-border mx-1" />

        <div className="flex items-center">
          <Button variant="ghost" size="sm" onClick={addLink} className={`h-8 w-8 p-0 ${editor.isActive('link') ? 'bg-muted' : ''}`}>
            <LinkIcon className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={addImage} className="h-8 w-8 p-0">
            <ImageIcon className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().setColor('#ff0000').run()}
            className="h-8 w-8 p-0"
          >
            <Type className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleHighlight().run()}
            className={`h-8 w-8 p-0 ${editor.isActive('highlight') ? 'bg-muted' : ''}`}
          >
            <Highlighter className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={addTable} className="h-8 w-8 p-0">
            <TableIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default function TextToHTML() {
  const [html, setHtml] = useState("");
  const { toast } = useToast();

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: {
          keepMarks: true,
          keepAttributes: false,
          HTMLAttributes: {
            class: null,
          },
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: false,
          HTMLAttributes: {
            class: null,
          },
        },
        paragraph: {
          HTMLAttributes: {
            class: null,
          },
        },
        heading: {
          HTMLAttributes: {
            class: null,
          },
        },
      }),
      UnderlineExtension,
      LinkExtension.configure({ 
        openOnClick: false,
        HTMLAttributes: {
          rel: 'noopener noreferrer',
          target: '_blank',
        },
      }),
      Color,
      TextStyle,
      Highlight,
      Table.configure({ 
        resizable: true,
        allowTableNodeSelection: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Image,
    ],
    content: '',
    onUpdate: ({ editor }) => {
      const rawHtml = editor.getHTML();
      // Further clean the output HTML
      // Note: We are explicitly avoiding stripping 'class' attribute here
      const cleanedHtml = rawHtml
        .replace(/ style="[^"]*"/gi, '')
        .replace(/<span(?! class=")[^>]*>/gi, '') // Only strip spans WITHOUT classes
        .replace(/<\/span>/gi, '</span>') // Keep span closing tags if needed, or refine
        .replace(/&nbsp;/g, ' ')
        .replace(/\u00A0/g, ' ')
        .replace(/<li><p>(.*?)<\/p><\/li>/gi, '<li>$1</li>');

      const beautified = beautifyHtml(cleanedHtml, {
        indent_size: 2,
        wrap_line_length: 80,
        preserve_newlines: false,
        extra_liners: [],
        unformatted: ['strong', 'em', 'a'], // Removed 'span' from unformatted to allow proper cleaning if needed
      });
      setHtml(beautified);
    },
    editorProps: {
      attributes: {
        class: 'prose dark:prose-invert max-w-none p-4 min-h-[450px] focus:outline-none',
      },
      transformPastedHTML: (html) => {
        // Strip inline styles and other messy attributes from Word/Google Docs
        return html
          .replace(/style="[^"]*"/gi, '')
          .replace(/class="[^"]*"/gi, '')
          .replace(/&nbsp;/g, ' ')
          .replace(/<span[^>]*>/gi, '')
          .replace(/<\/span>/gi, '')
          .replace(/\u00A0/g, ' ');
      },
      handlePaste: (view, event) => {
        return false;
      }
    },
  });

  const copyToClipboard = () => {
    if (!html) return;
    navigator.clipboard.writeText(html);
    toast({ title: "Copied!", description: "HTML code copied to clipboard." });
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

  const resetEditor = () => {
    if (editor) {
      editor.commands.setContent('');
      setHtml('');
      toast({
        title: "Reset Complete",
        description: "Editor and output have been cleared."
      });
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
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
            </div>
          </div>
          <Button 
            variant="outline" 
            onClick={resetEditor}
            className="hover-elevate"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <Card className="flex flex-col h-[700px] overflow-hidden shadow-sm border-border/60">
            <MenuBar editor={editor} />
            <CardContent className="flex-1 p-0 overflow-y-auto bg-white dark:bg-zinc-950">
              <EditorContent editor={editor} />
            </CardContent>
          </Card>

          <Card className="flex flex-col h-[700px] shadow-sm border-border/60">
            <CardHeader className="flex flex-row items-center justify-between gap-1 py-3 px-4 border-b bg-muted/10">
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">HTML Output</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={copyToClipboard} disabled={!html || html === '<p></p>'} className="h-8">
                  <Copy className="h-3.5 w-3.5 mr-1.5" /> Copy
                </Button>
                <Button variant="outline" size="sm" onClick={downloadHTML} disabled={!html || html === '<p></p>'} className="h-8">
                  <Download className="h-3.5 w-3.5 mr-1.5" /> Download
                </Button>
              </div>
            </CardHeader>
            <CardContent className="flex-1 p-0 bg-muted/5 min-h-0 overflow-hidden">
              <ScrollArea className="h-full w-full">
                <textarea
                  value={html && html !== '<p></p>' ? html : ""}
                  onChange={(e) => setHtml(e.target.value)}
                  placeholder="Resulting HTML will appear here..."
                  className="w-full h-full p-4 font-mono text-base text-black bg-transparent border-0 focus:ring-0 resize-none leading-relaxed"
                  spellCheck={false}
                />
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
