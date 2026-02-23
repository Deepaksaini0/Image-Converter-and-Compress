import { useState, useEffect } from 'react';
import { Cropper, CropperRef, CircleStencil } from 'react-advanced-cropper';
import 'react-advanced-cropper/dist/style.css';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Maximize2, Crop, RotateCw, Type } from 'lucide-react';

interface ImageEditorProps {
  image: string;
  onSave: (blob: Blob) => void;
  onClose: () => void;
}

export function ImageEditor({ image, onSave, onClose }: ImageEditorProps) {
  const [cropper, setCropper] = useState<CropperRef | null>(null);
  const [resize, setResize] = useState({ width: 0, height: 0, originalWidth: 0, originalHeight: 0 });
  const [aspectRatio, setAspectRatio] = useState<number | undefined>(undefined);
  const [rotation, setRotation] = useState(0);

  const handleUpdate = (ref: CropperRef) => {
    setCropper(ref);
    const state = ref.getState();
    const image = ref.getImage();
    
    if (state && state.coordinates) {
      setResize(prev => ({
        ...prev,
        width: Math.round(state.coordinates.width),
        height: Math.round(state.coordinates.height),
        originalWidth: image?.width || 0,
        originalHeight: image?.height || 0
      }));
    }
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleResizeWidth = (val: string) => {
    const width = parseInt(val) || 0;
    if (width > 0 && cropper) {
      const state = cropper.getState();
      if (state?.coordinates) {
        const ratio = state.coordinates.height / state.coordinates.width;
        cropper.setCoordinates({
          ...state.coordinates,
          width,
          height: Math.round(width * ratio)
        });
      }
    }
  };

  const handleSave = () => {
    if (cropper) {
      const canvas = cropper.getCanvas();
      if (canvas) {
        canvas.toBlob((blob) => {
          if (blob) {
            onSave(blob);
          }
        }, 'image/jpeg', 0.9);
      }
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b">
          <DialogTitle>Edit Image</DialogTitle>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={handleRotate} title="Rotate 90°">
              <RotateCw className="h-4 w-4" />
            </Button>
            <div className="h-4 w-[1px] bg-border mx-1" />
            <Tabs value={aspectRatio?.toString() || "free"} onValueChange={(v) => setAspectRatio(v === "free" ? undefined : parseFloat(v))}>
              <TabsList className="h-8">
                <TabsTrigger value="free" className="text-xs px-2">Free</TabsTrigger>
                <TabsTrigger value="1" className="text-xs px-2">1:1</TabsTrigger>
                <TabsTrigger value="1.77777777778" className="text-xs px-2">16:9</TabsTrigger>
                <TabsTrigger value="1.33333333333" className="text-xs px-2">4:3</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden bg-zinc-950">
          <div className="flex-1 relative">
            <Cropper
              src={image}
              onChange={handleUpdate}
              className="h-full"
              stencilProps={{
                aspectRatio: aspectRatio
              }}
              imageTransform={{
                rotate: rotation
              }}
            />
          </div>

          <div className="w-72 border-l bg-background p-6 flex flex-col gap-6 overflow-y-auto">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Maximize2 className="h-4 w-4" />
                Dimensions
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-[10px] uppercase text-muted-foreground">Width</Label>
                  <div className="relative">
                    <Input
                      type="number"
                      value={resize.width}
                      onChange={(e) => handleResizeWidth(e.target.value)}
                      className="h-8 pr-6 text-xs"
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">px</span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] uppercase text-muted-foreground">Height</Label>
                  <div className="relative">
                    <Input
                      type="number"
                      value={resize.height}
                      readOnly
                      className="h-8 pr-6 text-xs bg-muted/50"
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">px</span>
                  </div>
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground text-center">
                Original: {resize.originalWidth} x {resize.originalHeight}
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Crop className="h-4 w-4" />
                Quick Resize
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[500, 800, 1200, 1920].map(w => (
                  <Button 
                    key={w} 
                    variant="outline" 
                    size="sm" 
                    className="text-[10px] h-7"
                    onClick={() => handleResizeWidth(w.toString())}
                  >
                    {w}px
                  </Button>
                ))}
              </div>
            </div>
            
            <div className="mt-auto pt-6 flex flex-col gap-2">
              <Button onClick={handleSave} className="w-full">
                Apply & Save
              </Button>
              <Button variant="ghost" onClick={onClose} className="w-full">
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
