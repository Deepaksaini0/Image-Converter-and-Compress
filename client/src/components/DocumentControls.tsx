import { Label } from "@/components/ui/label";

interface DocumentControlsProps {
  format: string;
}

export function DocumentControls({ format }: DocumentControlsProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>Format</Label>
        <p className="text-sm text-muted-foreground">
          Converting to: <span className="font-semibold">{format.toUpperCase()}</span>
        </p>
      </div>

      <div className="space-y-2">
        <Label>Supported Formats</Label>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• XLSX / XLS (Excel)</li>
          <li>• CSV (Comma-separated)</li>
          <li>• ODS (OpenDocument)</li>
          <li>• DOCX (Word)</li>
        </ul>
      </div>

      <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
        <p className="text-xs text-blue-900 dark:text-blue-100">
          Documents will be converted to PDF format with full content preservation.
        </p>
      </div>
    </div>
  );
}
