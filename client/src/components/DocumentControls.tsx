import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DocumentControlsProps {
  outputFormat: string;
  onFormatChange: (format: string) => void;
}

export function DocumentControls({ outputFormat, onFormatChange }: DocumentControlsProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="output-format">Output Format</Label>
        <Select value={outputFormat} onValueChange={onFormatChange}>
          <SelectTrigger id="output-format" className="border-gray-300 dark:border-gray-600">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pdf">PDF</SelectItem>
            <SelectItem value="xlsx">XLSX (Excel)</SelectItem>
            <SelectItem value="csv">CSV</SelectItem>
            <SelectItem value="docx">DOCX (Word)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Supported Input Formats</Label>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• XLSX / XLS (Excel)</li>
          <li>• CSV (Comma-separated)</li>
          <li>• ODS (OpenDocument)</li>
          <li>• DOCX (Word)</li>
          <li>• PDF</li>
        </ul>
      </div>

      <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
        <p className="text-xs text-blue-900 dark:text-blue-100">
          Convert between documents and spreadsheets with full content preservation.
        </p>
      </div>
    </div>
  );
}
