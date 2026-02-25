import { useState, useEffect } from 'react';
import { Cropper, CropperRef, CircleStencil } from 'react-advanced-cropper';
import 'react-advanced-cropper/dist/style.css';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Maximize2, Crop, RotateCw, Type, Lock, Unlock, Download, Check, X } from 'lucide-react';

interface ImageEditorProps {
  image: string;
  onSave: (blob: Blob) => void;
  onClose: () => void;
}

export function ImageEditor({ image, onSave, onClose }: ImageEditorProps) {
  const [cropper, setCropper] = useState<CropperRef | null>(null);
  const [resize, setResize] = useState({ width: 0, height: 0, originalWidth: 0, originalHeight: 0 });
  const [aspectRatio, setAspectRatio] = useState<number | undefined>(undefined);
  const [lockAspectRatio, setLockAspectRatio] = useState(true);
  const [rotation, setRotation] = useState(0);
  const [backgroundColor, setBackgroundColor] = useState('#ffffff');

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
        if (lockAspectRatio) {
          const ratio = state.coordinates.height / state.coordinates.width;
          cropper.setCoordinates({
            ...state.coordinates,
            width,
            height: Math.round(width * ratio)
          });
        } else {
          cropper.setCoordinates({
            ...state.coordinates,
            width
          });
        }
      }
    }
  };

  const handleResizeHeight = (val: string) => {
    const height = parseInt(val) || 0;
    if (height > 0 && cropper) {
      const state = cropper.getState();
      if (state?.coordinates) {
        if (lockAspectRatio) {
          const ratio = state.coordinates.width / state.coordinates.height;
          cropper.setCoordinates({
            ...state.coordinates,
            height,
            width: Math.round(height * ratio)
          });
        } else {
          cropper.setCoordinates({
            ...state.coordinates,
            height
          });
        }
      }
    }
  };

  const handleSave = () => {
    if (cropper) {
      const canvas = cropper.getCanvas();
      if (canvas) {
        // Create a new canvas with background color
        const bgCanvas = document.createElement('canvas');
        bgCanvas.width = canvas.width;
        bgCanvas.height = canvas.height;
        const ctx = bgCanvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = backgroundColor;
          ctx.fillRect(0, 0, bgCanvas.width, bgCanvas.height);
          ctx.drawImage(canvas, 0, 0);
          bgCanvas.toBlob((blob) => {
            if (blob) {
              onSave(blob);
            }
          }, 'image/jpeg', 0.9);
        }
      }
    }
  };

  const handleDownload = () => {
    if (cropper) {
      const canvas = cropper.getCanvas();
      if (canvas) {
        const bgCanvas = document.createElement('canvas');
        bgCanvas.width = canvas.width;
        bgCanvas.height = canvas.height;
        const ctx = bgCanvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = backgroundColor;
          ctx.fillRect(0, 0, bgCanvas.width, bgCanvas.height);
          ctx.drawImage(canvas, 0, 0);
          const link = document.createElement('a');
          link.download = `edited-image-${Date.now()}.jpg`;
          link.href = bgCanvas.toDataURL('image/jpeg', 0.9);
          link.click();
        }
      }
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] w-[1200px] h-[90vh] flex flex-col p-0 gap-0 overflow-hidden bg-background">
        <div className="flex items-center justify-between p-4 border-b bg-card z-10">
          <div className="flex items-center gap-4">
            <DialogTitle className="text-xl font-bold">Image Editor</DialogTitle>
            <div className="flex items-center gap-1 bg-muted p-1 rounded-lg">
              <Button variant="ghost" size="sm" onClick={handleRotate} className="h-8 gap-2">
                <RotateCw className="h-4 w-4" />
                <span className="hidden sm:inline">Rotate</span>
              </Button>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleDownload} className="gap-2">
              <Download className="h-4 w-4" />
              Download
            </Button>
            <Button size="sm" onClick={handleSave} className="gap-2">
              <Check className="h-4 w-4" />
              Apply Changes
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* Main Editor Area */}
          <div className="flex-1 relative bg-zinc-950 flex items-center justify-center p-4 lg:p-8 overflow-hidden">
            <div 
              className="relative shadow-2xl transition-all duration-300 flex items-center justify-center overflow-hidden"
              style={{ backgroundColor, minWidth: '100px', minHeight: '100px' }}
            >
              <Cropper
                src={image}
                onChange={handleUpdate}
                className="max-h-full max-w-full"
                stencilProps={{
                  aspectRatio: aspectRatio
                }}
                imageTransform={{
                  rotate: rotation
                }}
                backgroundProps={{
                  className: "bg-transparent"
                }}
                style={{
                  backgroundColor: backgroundColor
                }}
              />
            </div>
          </div>

          {/* Controls Sidebar */}
          <div className="w-full lg:w-80 border-t lg:border-t-0 lg:border-l bg-card flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              {/* Aspect Ratio */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Crop className="h-4 w-4 text-primary" />
                  Aspect Ratio
                </div>
                <Tabs value={aspectRatio?.toString() || "free"} onValueChange={(v) => setAspectRatio(v === "free" ? undefined : parseFloat(v))}>
                  <TabsList className="grid grid-cols-4 h-9">
                    <TabsTrigger value="free" className="text-[10px]">Free</TabsTrigger>
                    <TabsTrigger value="1" className="text-[10px]">1:1</TabsTrigger>
                    <TabsTrigger value="1.77777777778" className="text-[10px]">16:9</TabsTrigger>
                    <TabsTrigger value="1.33333333333" className="text-[10px]">4:3</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              {/* Background Color */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <div className="h-4 w-4 rounded-full border border-primary/20" style={{ backgroundColor }} />
                  Background Canvas
                </div>
                <div className="flex flex-wrap gap-2 p-1 bg-muted/30 rounded-lg">
                  {['#ffffff', '#000000', '#f3f4f6', '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'].map(color => (
                    <button
                      key={color}
                      className={`h-7 w-7 rounded-md border-2 transition-all hover:scale-110 ${backgroundColor === color ? 'border-primary ring-2 ring-primary/20' : 'border-transparent'}`}
                      style={{ backgroundColor: color }}
                      onClick={() => setBackgroundColor(color)}
                    />
                  ))}
                  <div className="relative h-7 w-7 rounded-md border-2 border-dashed border-muted-foreground/30 overflow-hidden hover:border-primary transition-colors">
                    <input
                      type="color"
                      value={backgroundColor}
                      onChange={(e) => setBackgroundColor(e.target.value)}
                      className="absolute inset-[-5px] w-[200%] h-[200%] cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* Custom Dimensions */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <Maximize2 className="h-4 w-4 text-primary" />
                    Dimensions
                  </div>
                  <div className="flex items-center gap-2 px-2 py-1 bg-muted/50 rounded-md">
                    <Checkbox 
                      id="lock-ratio" 
                      checked={lockAspectRatio} 
                      onCheckedChange={(checked) => setLockAspectRatio(!!checked)} 
                      className="h-3 w-3"
                    />
                    <Label htmlFor="lock-ratio" className="text-[10px] cursor-pointer flex items-center gap-1 font-medium">
                      {lockAspectRatio ? <Lock className="h-2.5 w-2.5" /> : <Unlock className="h-2.5 w-2.5" />}
                      Lock
                    </Label>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Width</Label>
                    <div className="relative group">
                      <Input
                        type="number"
                        value={resize.width}
                        onChange={(e) => handleResizeWidth(e.target.value)}
                        className="h-9 pr-7 text-xs font-mono focus:ring-1 focus:ring-primary"
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-bold text-muted-foreground group-focus-within:text-primary transition-colors">PX</span>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Height</Label>
                    <div className="relative group">
                      <Input
                        type="number"
                        value={resize.height}
                        onChange={(e) => handleResizeHeight(e.target.value)}
                        className={`h-9 pr-7 text-xs font-mono focus:ring-1 focus:ring-primary ${lockAspectRatio ? 'bg-muted/30 cursor-not-allowed opacity-70' : ''}`}
                        readOnly={lockAspectRatio}
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-bold text-muted-foreground group-focus-within:text-primary transition-colors">PX</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-center gap-2 py-2 px-3 bg-primary/5 rounded-lg border border-primary/10">
                  <span className="text-[10px] font-bold text-primary uppercase tracking-tighter">Current Source:</span>
                  <span className="text-[10px] font-mono font-bold text-primary/80">{resize.originalWidth} × {resize.originalHeight}</span>
                </div>
              </div>

              {/* Quick Presets */}
              <div className="space-y-3">
                <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Quick Width Presets</div>
                <div className="grid grid-cols-2 gap-2">
                  {[800, 1200, 1920, 2560].map(w => (
                    <Button 
                      key={w} 
                      variant="outline" 
                      size="sm" 
                      className="text-[10px] h-8 font-bold hover:bg-primary hover:text-white transition-all"
                      onClick={() => handleResizeWidth(w.toString())}
                    >
                      {w}px
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6 border-t bg-muted/10">
              <div className="flex flex-col gap-2">
                <Button onClick={handleSave} className="w-full h-10 shadow-lg shadow-primary/20 font-bold">
                  Save Changes
                </Button>
                <Button variant="ghost" onClick={onClose} className="w-full h-10 text-muted-foreground font-semibold">
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
      </DialogContent>
    </Dialog>
  );
}
