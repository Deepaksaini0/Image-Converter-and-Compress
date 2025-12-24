import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ConversionOptions, formats } from "@shared/schema";
import { Settings2, Wand2, Zap, X } from "lucide-react";

interface SidebarProps {
  options: ConversionOptions;
  setOptions: (options: ConversionOptions) => void;
  onProcess: () => void;
  isProcessing: boolean;
  fileCount: number;
}

export function Sidebar({
  options,
  setOptions,
  onProcess,
  isProcessing,
  fileCount,
}: SidebarProps) {
  const updateOption = <K extends keyof ConversionOptions>(
    key: K,
    value: ConversionOptions[K],
  ) => {
    setOptions({ ...options, [key]: value });
  };

  return (
    <div className="h-full flex flex-col bg-card/50 border-r border-border backdrop-blur-sm">
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-3 text-primary mb-1">
          <Settings2 className="h-5 w-5" />
          <h2 className="font-display font-bold text-lg tracking-tight">
            Configuration
          </h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Adjust your conversion settings.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        {/* Format Selection */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Converter</Label>
          <Select
            value={options.format}
            onValueChange={(val) => updateOption("format", val as any)}
          >
            <SelectTrigger className="w-full h-11 bg-background/50 border-input focus:ring-primary/20">
              <SelectValue placeholder="Select format" />
            </SelectTrigger>
            <SelectContent>
              {formats.map((fmt) => (
                <SelectItem key={fmt} value={fmt} className="capitalize">
                  {fmt.toUpperCase()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Quality Slider */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Compress</Label>
            <span className="text-xs font-mono bg-primary/10 text-primary px-2 py-1 rounded">
              {options.quality}%
            </span>
          </div>
          <Slider
            value={[options.quality]}
            min={1}
            max={100}
            step={1}
            onValueChange={([val]) => updateOption("quality", val)}
            className="[&_.range-thumb]:border-primary"
          />
        </div>

        {/* Smart Compression */}
        <div className="bg-secondary/30 rounded-xl p-4 border border-white/5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wand2 className="h-4 w-4 text-accent" />
              <Label htmlFor="smart-compression" className="cursor-pointer">
                Target Size
              </Label>
            </div>
            <Switch
              id="smart-compression"
              checked={!!options.targetSizeKB}
              onCheckedChange={(checked) =>
                updateOption("targetSizeKB", checked ? 500 : undefined)
              }
            />
          </div>

          {options.targetSizeKB !== undefined && (
            <div className="pt-2 animate-in slide-in-from-top-2 fade-in duration-200">
              <div className="relative">
                <Input
                  type="number"
                  value={options.targetSizeKB}
                  onChange={(e) =>
                    updateOption("targetSizeKB", Number(e.target.value))
                  }
                  className="pr-10 bg-background/50"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-medium">
                  KB
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                We'll try to reach this size while maintaining quality.
              </p>
            </div>
          )}
        </div>

        {/* Metadata */}
        <div className="flex items-center justify-between p-1">
          <Label htmlFor="keep-metadata" className="cursor-pointer">
            Preserve Metadata
          </Label>
          <Switch
            id="keep-metadata"
            checked={options.keepMetadata}
            onCheckedChange={(checked) => updateOption("keepMetadata", checked)}
          />
        </div>

        {/* Watermark Section */}
        <div className="space-y-4 pt-4 border-t border-border/50">
          <div className="flex items-center justify-between">
            <Label>Watermark (Optional)</Label>
            {options.watermarkText && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => updateOption("watermarkText", undefined)}
                className="h-6 w-6 p-0 hover:bg-destructive/10 hover:text-destructive"
                title="Remove watermark"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          <Input
            placeholder="© 2024 Your Name"
            value={options.watermarkText || ""}
            onChange={(e) =>
              updateOption("watermarkText", e.target.value || undefined)
            }
            className="bg-background/50 border-gray-300 dark:border-gray-600"
          />

          {options.watermarkText && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground">Opacity</Label>
                <span className="text-xs font-mono">
                  {Math.round(options.watermarkOpacity * 100)}%
                </span>
              </div>
              <Slider
                value={[options.watermarkOpacity]}
                min={0}
                max={1}
                step={0.1}
                onValueChange={([val]) => updateOption("watermarkOpacity", val)}
              />
            </div>
          )}
        </div>
      </div>

      <div className="p-6 border-t border-border bg-card/50">
        <Button
          className="w-full h-12 text-base font-semibold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all"
          size="lg"
          onClick={onProcess}
          disabled={isProcessing || fileCount === 0}
        >
          {isProcessing ? (
            <>Processing...</>
          ) : (
            <>
              <Zap className="mr-2 h-4 w-4 fill-current" />
              Process {fileCount > 0 ? `${fileCount} Files` : ""}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
