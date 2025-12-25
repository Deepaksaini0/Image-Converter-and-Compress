import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { mergeDirections, MergeOptions, formats } from "@shared/schema";

interface MergeControlsProps {
  options: MergeOptions;
  setOptions: (options: MergeOptions) => void;
}

export function MergeControls({ options, setOptions }: MergeControlsProps) {
  const updateOption = <K extends keyof MergeOptions>(key: K, value: MergeOptions[K]) => {
    setOptions({ ...options, [key]: value });
  };

  return (
    <div className="space-y-6">
      {/* Direction */}
      <div className="space-y-2">
        <Label htmlFor="merge-direction">Merge Direction</Label>
        <Select value={options.direction} onValueChange={(val) => updateOption("direction", val as any)}>
          <SelectTrigger id="merge-direction" className="border-gray-300 dark:border-gray-600">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="horizontal">Horizontal (Side by side)</SelectItem>
            <SelectItem value="vertical">Vertical (Stacked)</SelectItem>
            <SelectItem value="grid">Grid (2x2 layout)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Spacing */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label htmlFor="spacing">Spacing</Label>
          <span className="text-xs font-mono">{options.spacing}px</span>
        </div>
        <Slider
          id="spacing"
          value={[options.spacing]}
          min={0}
          max={50}
          step={1}
          onValueChange={([val]) => updateOption("spacing", val)}
        />
      </div>

      {/* Background Color */}
      <div className="space-y-2">
        <Label htmlFor="bg-color">Background Color</Label>
        <div className="flex gap-2">
          <Input
            id="bg-color"
            type="color"
            value={options.backgroundColor}
            onChange={(e) => updateOption("backgroundColor", e.target.value)}
            className="w-12 h-10 cursor-pointer border-gray-300 dark:border-gray-600"
          />
          <Input
            type="text"
            value={options.backgroundColor}
            onChange={(e) => updateOption("backgroundColor", e.target.value)}
            placeholder="#ffffff"
            className="flex-1 border-gray-300 dark:border-gray-600"
          />
        </div>
      </div>

      {/* Format */}
      <div className="space-y-2">
        <Label htmlFor="merge-format">Output Format</Label>
        <Select value={options.format} onValueChange={(val) => updateOption("format", val as any)}>
          <SelectTrigger id="merge-format" className="border-gray-300 dark:border-gray-600">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {formats.map((fmt) => (
              <SelectItem key={fmt} value={fmt}>
                {fmt.toUpperCase()}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Quality */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label htmlFor="merge-quality">Quality</Label>
          <span className="text-xs font-mono">{options.quality}%</span>
        </div>
        <Slider
          id="merge-quality"
          value={[options.quality]}
          min={1}
          max={100}
          step={1}
          onValueChange={([val]) => updateOption("quality", val)}
        />
      </div>
    </div>
  );
}
