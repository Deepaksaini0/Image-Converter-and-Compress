import { useCallback, useState } from "react";
import { Upload, FileUp, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface DropzoneProps {
  onDrop: (files: File[]) => void;
  isUploading: boolean;
}

export function Dropzone({ onDrop, isUploading }: DropzoneProps) {
  const [isDragActive, setIsDragActive] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
    
    if (e.dataTransfer.files?.length) {
      onDrop(Array.from(e.dataTransfer.files));
    }
  }, [onDrop]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      onDrop(Array.from(e.target.files));
      // Reset value so same file can be selected again
      e.target.value = "";
    }
  }, [onDrop]);

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        "relative group cursor-pointer overflow-hidden rounded-3xl border-2 border-dashed transition-all duration-300",
        isDragActive 
          ? "border-primary bg-primary/5 scale-[1.01] shadow-2xl shadow-primary/20" 
          : "border-muted-foreground/25 hover:border-primary/50 hover:bg-secondary/30 bg-card/40"
      )}
    >
      <input
        type="file"
        multiple
        accept="image/*"
        onChange={handleFileSelect}
        className="absolute inset-0 cursor-pointer opacity-0 z-50"
        disabled={isUploading}
      />

      <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
        <div className={cn(
          "mb-6 flex h-20 w-20 items-center justify-center rounded-2xl transition-all duration-500",
          isDragActive ? "bg-primary text-primary-foreground scale-110 rotate-3" : "bg-secondary text-muted-foreground group-hover:text-primary group-hover:scale-105"
        )}>
          {isUploading ? (
            <Loader2 className="h-10 w-10 animate-spin" />
          ) : isDragActive ? (
            <FileUp className="h-10 w-10" />
          ) : (
            <Upload className="h-10 w-10" />
          )}
        </div>

        <h3 className="mb-2 text-2xl font-bold tracking-tight font-display">
          {isUploading ? "Uploading files..." : "Drop your images here"}
        </h3>
        <p className="mb-6 max-w-sm text-sm text-muted-foreground">
          Supports JPG, PNG, WebP, AVIF, TIFF and more. Max file size 50MB.
        </p>
        
        <div className="relative">
          <span className="relative z-10 bg-card px-4 text-xs font-semibold uppercase text-muted-foreground">
            Or
          </span>
          <div className="absolute inset-0 top-1/2 -z-10 h-px w-full -translate-y-1/2 bg-border"></div>
        </div>

        <button className="mt-6 inline-flex items-center justify-center rounded-xl bg-primary px-8 py-3 font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:scale-105 hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/30 active:scale-95 disabled:opacity-50">
          Browse Files
        </button>
      </div>
      
      {/* Decorative background gradients */}
      <div className="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-primary/10 blur-3xl transition-opacity group-hover:opacity-75" />
      <div className="absolute -bottom-24 -left-24 h-48 w-48 rounded-full bg-accent/10 blur-3xl transition-opacity group-hover:opacity-75" />
    </div>
  );
}
