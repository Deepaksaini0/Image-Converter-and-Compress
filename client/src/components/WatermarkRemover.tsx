import { useState, useRef, useCallback, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Droplet, Loader2, Upload, Download, RefreshCw, Info, Eraser, Move } from "lucide-react";

type Method = "blur" | "lighten" | "darken";

interface Box { x: number; y: number; w: number; h: number }

const METHOD_OPTIONS: { value: Method; label: string; desc: string }[] = [
  { value: "blur",    label: "Blur",    desc: "Best for most watermarks — blends the area into background" },
  { value: "lighten", label: "Lighten", desc: "Works well on dark text/logo watermarks" },
  { value: "darken",  label: "Darken",  desc: "Works well on white/light watermarks" },
];

export function WatermarkRemover() {
  const { toast } = useToast();
  const [imgSrc, setImgSrc] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [method, setMethod] = useState<Method>("blur");
  const [box, setBox] = useState<Box | null>(null);
  const [dragging, setDragging] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (f: File) => {
    if (!f.type.startsWith("image/")) { toast({ title: "Please upload an image file", variant: "destructive" }); return; }
    setFile(f);
    setResult("");
    setBox(null);
    const reader = new FileReader();
    reader.onload = e => setImgSrc(e.target?.result as string);
    reader.readAsDataURL(f);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) handleFileSelect(f);
  };

  const getRelativePos = (e: React.MouseEvent) => {
    const rect = imgRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return {
      x: Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100)),
      y: Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100)),
    };
  };

  const onMouseDown = (e: React.MouseEvent) => {
    if (!imgSrc) return;
    e.preventDefault();
    const pos = getRelativePos(e);
    setStartPos(pos);
    setBox({ x: pos.x, y: pos.y, w: 0, h: 0 });
    setDragging(true);
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!dragging) return;
    const pos = getRelativePos(e);
    const x = Math.min(startPos.x, pos.x);
    const y = Math.min(startPos.y, pos.y);
    const w = Math.abs(pos.x - startPos.x);
    const h = Math.abs(pos.y - startPos.y);
    setBox({ x, y, w, h });
  };

  const onMouseUp = () => setDragging(false);

  const remove = async () => {
    if (!file || !box || box.w < 1 || box.h < 1) {
      toast({ title: "Draw a box over the watermark first", variant: "destructive" }); return;
    }
    setLoading(true); setResult("");
    const fd = new FormData();
    fd.append("image", file);
    fd.append("x", box.x.toString());
    fd.append("y", box.y.toString());
    fd.append("w", box.w.toString());
    fd.append("h", box.h.toString());
    fd.append("method", method);
    try {
      const r = await fetch("/api/image/remove-watermark", { method: "POST", body: fd });
      if (!r.ok) { const d = await r.json(); throw new Error(d.error); }
      const blob = await r.blob();
      setResult(URL.createObjectURL(blob));
      toast({ title: "Watermark removed!" });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally { setLoading(false); }
  };

  const download = () => {
    const a = document.createElement("a");
    a.href = result;
    a.download = `watermark-removed-${Date.now()}.jpg`;
    a.click();
  };

  const reset = () => { setImgSrc(""); setFile(null); setResult(""); setBox(null); };

  return (
    <div className="space-y-5">
      <Card className="border-primary/20 bg-gradient-to-br from-violet-500/5 to-pink-500/5">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Droplet className="h-5 w-5 text-violet-500" /> Watermark Remover
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Upload an image, draw a box over the watermark, choose a removal method, and download the clean result.
          </p>
        </CardHeader>
        <CardContent className="pt-0 space-y-4">
          {/* Method picker */}
          <div className="space-y-2">
            <Label className="font-semibold text-sm">Removal Method</Label>
            <div className="grid sm:grid-cols-3 gap-2">
              {METHOD_OPTIONS.map(m => (
                <button key={m.value} onClick={() => setMethod(m.value)}
                  className={`p-3 rounded-lg border-2 text-left transition-all ${method === m.value ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <Eraser className="h-3.5 w-3.5 text-primary" />
                    <span className="text-sm font-semibold">{m.label}</span>
                    {method === m.value && <Badge className="text-[10px] ml-auto h-4">Selected</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground">{m.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Upload zone */}
          {!imgSrc && (
            <div
              className="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-all"
              onDragOver={e => e.preventDefault()} onDrop={onDrop}
              onClick={() => fileRef.current?.click()}
            >
              <Upload className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
              <p className="font-medium text-muted-foreground">Drop an image here or click to browse</p>
              <p className="text-xs text-muted-foreground mt-1">PNG, JPG, WEBP · Max 20 MB</p>
              <input ref={fileRef} type="file" accept="image/*" className="hidden"
                onChange={e => e.target.files?.[0] && handleFileSelect(e.target.files[0])} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Image editor area */}
      {imgSrc && !result && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Move className="h-4 w-4 text-primary" />
                Draw a box over the watermark
                {box && box.w > 1 && box.h > 1 && (
                  <Badge variant="secondary" className="text-xs">
                    Box: {box.w.toFixed(1)}% × {box.h.toFixed(1)}%
                  </Badge>
                )}
              </CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setBox(null)} className="gap-1 text-xs">
                  <RefreshCw className="h-3.5 w-3.5" /> Clear box
                </Button>
                <Button variant="outline" size="sm" onClick={reset} className="gap-1 text-xs">
                  Change image
                </Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Click and drag directly on the image to select the watermark area.</p>
          </CardHeader>
          <CardContent className="pt-0">
            <div
              ref={canvasRef}
              className="relative select-none cursor-crosshair rounded-lg overflow-hidden border"
              onMouseDown={onMouseDown}
              onMouseMove={onMouseMove}
              onMouseUp={onMouseUp}
              onMouseLeave={onMouseUp}
            >
              <img ref={imgRef} src={imgSrc} alt="Upload" className="w-full h-auto block max-h-[480px] object-contain" draggable={false} />
              {box && box.w > 0.5 && box.h > 0.5 && (
                <div
                  className="absolute border-2 border-red-500 bg-red-500/20 pointer-events-none"
                  style={{
                    left: `${box.x}%`, top: `${box.y}%`,
                    width: `${box.w}%`, height: `${box.h}%`,
                  }}
                >
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">WATERMARK</span>
                  </div>
                </div>
              )}
            </div>
            <div className="mt-3 flex gap-2 flex-wrap">
              <Button onClick={remove} disabled={loading || !box || box.w < 1} className="gap-2">
                {loading ? <><Loader2 className="h-4 w-4 animate-spin" />Removing…</> : <><Droplet className="h-4 w-4" />Remove Watermark</>}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Result */}
      {result && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <CardTitle className="text-sm flex items-center gap-2 text-green-600">
                <Droplet className="h-4 w-4" /> Watermark Removed
              </CardTitle>
              <div className="flex gap-2">
                <Button size="sm" onClick={download} className="gap-1.5">
                  <Download className="h-3.5 w-3.5" /> Download
                </Button>
                <Button variant="outline" size="sm" onClick={reset} className="gap-1.5">
                  <RefreshCw className="h-3.5 w-3.5" /> New image
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0 space-y-4">
            {/* Before/After */}
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Before</p>
                <img src={imgSrc} alt="Before" className="w-full rounded-lg border object-contain max-h-[320px]" />
              </div>
              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-green-600 uppercase tracking-wide">After</p>
                <img src={result} alt="After" className="w-full rounded-lg border object-contain max-h-[320px]" />
              </div>
            </div>

            {/* Try again with different method */}
            <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg border flex-wrap">
              <p className="text-xs text-muted-foreground flex-1">Not satisfied? Try a different method:</p>
              {METHOD_OPTIONS.filter(m => m.value !== method).map(m => (
                <Button key={m.value} variant="outline" size="sm" className="text-xs gap-1"
                  onClick={() => { setMethod(m.value); setResult(""); remove(); }}>
                  <Eraser className="h-3 w-3" /> Try {m.label}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info note */}
      <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-800">
        <CardContent className="p-4 flex gap-2.5">
          <Info className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
          <p className="text-xs text-blue-700 dark:text-blue-300">
            <strong>How it works:</strong> We apply intelligent image processing to the selected area — blurring, lightening, or darkening to blend the watermark into the background.
            Works best on semi-transparent and corner watermarks. Complex opaque watermarks may need multiple attempts with different methods.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
