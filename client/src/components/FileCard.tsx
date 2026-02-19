import { UploadedFile } from "@shared/schema";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, FileImage, Edit2 } from "lucide-react";
import bytes from "bytes";
import { motion } from "framer-motion";

interface FileCardProps {
  file: UploadedFile;
  onRemove: (id: string) => void;
  onEdit?: (file: UploadedFile) => void;
}

export function FileCard({ file, onRemove, onEdit }: FileCardProps) {
  const isImage = file.mimeType.startsWith("image/");

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      layout
    >
      <Card className="group relative overflow-hidden bg-secondary/30 hover:bg-secondary/50 border-white/5 transition-all duration-300 hover:shadow-lg hover:border-primary/20">
        <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
          {isImage && onEdit && (
            <Button
              size="icon"
              variant="secondary"
              className="h-6 w-6 rounded-full shadow-lg"
              onClick={() => onEdit(file)}
              data-testid={`button-edit-file-${file.id}`}
            >
              <Edit2 className="h-3 w-3" />
            </Button>
          )}
          <Button
            size="icon"
            variant="destructive"
            className="h-6 w-6 rounded-full shadow-lg"
            onClick={() => onRemove(file.id)}
            data-testid={`button-remove-file-${file.id}`}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>

        <div className="p-3 flex items-center gap-4">
          <div className="relative h-16 w-16 flex-shrink-0 rounded-lg overflow-hidden bg-background border border-white/10 shadow-inner">
            {isImage ? (
              <img
                src={file.url}
                alt={file.originalName}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                <FileImage className="h-8 w-8" />
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <h4 className="truncate text-sm font-medium text-foreground group-hover:text-primary transition-colors">
              {file.originalName}
            </h4>
            <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
              <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 font-medium text-primary">
                {file.filename.split('.').pop()?.toUpperCase()}
              </span>
              <span>•</span>
              <span>{bytes(file.size)}</span>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
