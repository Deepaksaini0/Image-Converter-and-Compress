import { useState } from 'react';
import { Cropper, CropperRef } from 'react-advanced-cropper';
import 'react-advanced-cropper/dist/style.css';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ImageEditorProps {
  image: string;
  onSave: (blob: Blob) => void;
  onClose: () => void;
}

export function ImageEditor({ image, onSave, onClose }: ImageEditorProps) {
  const [cropper, setCropper] = useState<CropperRef | null>(null);
  const [resize, setResize] = useState({ width: 0, height: 0 });

  const handleUpdate = (ref: CropperRef) => {
    setCropper(ref);
    const state = ref.getState();
    if (state && state.coordinates) {
      setResize({
        width: Math.round(state.coordinates.width),
        height: Math.round(state.coordinates.height)
      });
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
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Edit Image</DialogTitle>
        </DialogHeader>
        <div className="flex-1 min-h-0 relative bg-muted rounded-md overflow-hidden">
          <Cropper
            src={image}
            onChange={handleUpdate}
            className="h-full"
          />
        </div>
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div className="space-y-2">
            <Label>Width (px)</Label>
            <Input
              type="number"
              value={resize.width}
              readOnly
              className="bg-muted"
            />
          </div>
          <div className="space-y-2">
            <Label>Height (px)</Label>
            <Input
              type="number"
              value={resize.height}
              readOnly
              className="bg-muted"
            />
          </div>
        </div>
        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}>Apply & Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
