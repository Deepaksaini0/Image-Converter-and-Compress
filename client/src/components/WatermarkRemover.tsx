import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Droplet, Loader2, Upload, Download, RefreshCw, Info, Eraser } from "lucide-react";

type Method = "blur" | "lighten" | "darken";
type Stage = "upload" | "edit" | "result";

interface Box { x: number; y: number; w: number; h: number }

const METHODS: { value: Method; label: string; desc: string }[] = [
  { value: "blur",    label: "Blur",    desc: "Best for most watermarks" },
  { value: "lighten", label: "Lighten", desc: "Good for dark logo/text" },
  { value: "darken",  label: "Darken",  desc: "Good for white/light marks" },
];

export function WatermarkRemover() {
  const { toast } = useToast();
  const fileRef   = useRef<HTMLInputElement>(null);
  const imgRef    = useRef<HTMLImageElement>(null);

  const [stage,   setStage]   = useState<Stage>("upload");
  const [imgSrc,  setImgSrc]  = useState("");
  const [file,    setFile]    = useState<File | null>(null);
  const [result,  setResult]  = useState("");   // base64 data URL of processed image
  const [loading, setLoading] = useState(false);
  const [method,  setMethod]  = useState<Method>("blur");
  const [box,     setBox]     = useState<Box | null>(null);
  const [drawing, setDrawing] = useState(false);
  const [anchor,  setAnchor]  = useState({ x: 0, y: 0 });

  // ── File handling ──────────────────────────────────────────────────────────
  const loadFile = (f: File) => {
    if (!f.type.startsWith("image/")) {
      toast({ title: "Please upload an image", variant: "destructive" }); return;
    }
    setFile(f);
    setBox(null);
    setResult("");
    setStage("edit");
    const reader = new FileReader();
    reader.onload = e => setImgSrc(e.target?.result as string);
    reader.readAsDataURL(f);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) loadFile(f);
  };

  // ── Box drawing ────────────────────────────────────────────────────────────
  const getPct = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = imgRef.current;
    if (!el) return { x: 0, y: 0 };
    const r = el.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(100, ((e.clientX - r.left)  / r.width)  * 100)),
      y: Math.max(0, Math.min(100, ((e.clientY - r.top)   / r.height) * 100)),
    };
  };

  const onMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (stage !== "edit") return;
    e.preventDefault();
    const p = getPct(e);
    setAnchor(p);
    setBox({ x: p.x, y: p.y, w: 0, h: 0 });
    setDrawing(true);
  };

  const onMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!drawing) return;
    const p = getPct(e);
    setBox({
      x: Math.min(anchor.x, p.x),
      y: Math.min(anchor.y, p.y),
      w: Math.abs(p.x - anchor.x),
      h: Math.abs(p.y - anchor.y),
    });
  };

  const onMouseUp = () => setDrawing(false);

  // ── Removal ────────────────────────────────────────────────────────────────
  const doRemove = async (overrideMethod?: Method) => {
    if (!file) { toast({ title: "Upload an image first", variant: "destructive" }); return; }
    if (!box || box.w < 0.5 || box.h < 0.5) {
      toast({ title: "Draw a box over the watermark first", variant: "destructive" }); return;
    }
    const m = overrideMethod ?? method;
    setLoading(true);

    const fd = new FormData();
    fd.append("image", file);
    fd.append("x", String(box.x));
    fd.append("y", String(box.y));
    fd.append("w", String(box.w));
    fd.append("h", String(box.h));
    fd.append("method", m);

    try {
      const res = await fetch("/api/image/remove-watermark", { method: "POST", body: fd });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(err.error || "Server error");
      }
      // Convert response blob → base64 data URL for reliable display
      const blob = await res.blob();
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload  = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
      setResult(dataUrl);
      setStage("result");
      toast({ title: "Watermark removed successfully!" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // ── Download ───────────────────────────────────────────────────────────────
  const download = () => {
    const a = document.createElement("a");
    a.href     = result;
    a.download = `no-watermark-${Date.now()}.jpg`;
    a.click();
  };

  const reset = () => {
    setStage("upload"); setImgSrc(""); setFile(null);
    setResult(""); setBox(null);
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">

      {/* Header card */}
      <Card className="border-primary/20 bg-gradient-to-br from-violet-500/5 to-pink-500/5">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Droplet className="h-5 w-5 text-violet-500" /> Watermark Remover
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Upload an image, draw a box over the watermark, pick a method and remove it. The processed image appears below for download.
          </p>
        </CardHeader>

        {/* Method selector — always visible */}
        <CardContent className="pt-0">
          <div className="grid sm:grid-cols-3 gap-2">
            {METHODS.map(m => (
              <button key={m.value} onClick={() => setMethod(m.value)}
                className={`p-3 rounded-lg border-2 text-left transition-all ${method === m.value ? "border-primary bg-primary/10" : "border-border hover:border-primary/40"}`}>
                <div className="flex items-center gap-2 mb-0.5">
                  <Eraser className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span className="text-sm font-semibold">{m.label}</span>
                  {method === m.value && <Badge className="text-[10px] ml-auto h-4 px-1.5">Active</Badge>}
                </div>
                <p className="text-xs text-muted-foreground pl-5">{m.desc}</p>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ── Stage: upload ── */}
      {stage === "upload" && (
        <div
          className="border-2 border-dashed rounded-xl p-10 text-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-all"
          onDragOver={e => e.preventDefault()} onDrop={onDrop}
          onClick={() => fileRef.current?.click()}
        >
          <Upload className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
          <p className="font-semibold text-muted-foreground">Drop an image here or click to browse</p>
          <p className="text-xs text-muted-foreground mt-1">PNG · JPG · WEBP · max 20 MB</p>
          <input ref={fileRef} type="file" accept="image/*" className="hidden"
            onChange={e => e.target.files?.[0] && loadFile(e.target.files[0])} />
        </div>
      )}

      {/* ── Stage: edit — draw selection box ── */}
      {(stage === "edit" || stage === "result") && imgSrc && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <CardTitle className="text-sm flex items-center gap-2">
                {stage === "edit" ? "Draw a box over the watermark" : "Original Image"}
                {box && box.w > 0.5 && stage === "edit" && (
                  <Badge variant="secondary" className="text-xs">
                    {box.w.toFixed(0)}% × {box.h.toFixed(0)}%
                  </Badge>
                )}
              </CardTitle>
              <div className="flex gap-2 flex-wrap">
                {stage === "edit" && box && box.w > 0.5 && (
                  <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => setBox(null)}>Clear box</Button>
                )}
                <Button variant="outline" size="sm" className="text-xs h-7" onClick={reset}>Change image</Button>
              </div>
            </div>
            {stage === "edit" && (
              <p className="text-xs text-muted-foreground">Click and drag on the image to select the watermark area, then click Remove.</p>
            )}
          </CardHeader>
          <CardContent className="pt-0 space-y-3">
            {/* Image with selection overlay */}
            <div
              className={`relative select-none rounded-lg overflow-hidden border bg-black/5 ${stage === "edit" ? "cursor-crosshair" : ""}`}
              onMouseDown={onMouseDown}
              onMouseMove={onMouseMove}
              onMouseUp={onMouseUp}
              onMouseLeave={onMouseUp}
            >
              <img
                ref={imgRef}
                src={imgSrc}
                alt="Source"
                draggable={false}
                className="w-full h-auto block max-h-[460px] object-contain"
              />

              {/* Selection box */}
              {box && box.w > 0.5 && box.h > 0.5 && stage === "edit" && (
                <div
                  className="absolute border-2 border-red-500 bg-red-500/20 pointer-events-none"
                  style={{ left: `${box.x}%`, top: `${box.y}%`, width: `${box.w}%`, height: `${box.h}%` }}
                >
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded whitespace-nowrap">
                      WATERMARK AREA
                    </span>
                  </div>
                </div>
              )}

              {/* Loading overlay */}
              {loading && (
                <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-2 rounded-lg">
                  <Loader2 className="h-8 w-8 text-white animate-spin" />
                  <span className="text-white text-sm font-medium">Removing watermark…</span>
                </div>
              )}
            </div>

            {/* Action buttons */}
            {stage === "edit" && (
              <div className="flex gap-2 flex-wrap">
                <Button
                  onClick={() => doRemove()}
                  disabled={loading || !box || box.w < 0.5}
                  className="gap-2"
                >
                  {loading
                    ? <><Loader2 className="h-4 w-4 animate-spin" />Removing…</>
                    : <><Droplet className="h-4 w-4" />Remove Watermark</>}
                </Button>
                {!box || box.w < 0.5 ? (
                  <p className="text-xs text-muted-foreground self-center">← Draw a box first</p>
                ) : null}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Stage: result — show processed image ── */}
      {stage === "result" && result && (
        <Card className="border-green-200 dark:border-green-800">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <CardTitle className="text-sm flex items-center gap-2 text-green-700 dark:text-green-400">
                <Droplet className="h-4 w-4" /> Watermark Removed — Result
              </CardTitle>
              <div className="flex gap-2 flex-wrap">
                <Button size="sm" onClick={download} className="gap-1.5 bg-green-600 hover:bg-green-700">
                  <Download className="h-3.5 w-3.5" /> Download
                </Button>
                <Button variant="outline" size="sm" onClick={() => { setStage("edit"); setResult(""); }} className="gap-1.5">
                  <RefreshCw className="h-3.5 w-3.5" /> Try again
                </Button>
                <Button variant="outline" size="sm" onClick={reset} className="gap-1.5">
                  New image
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0 space-y-4">
            {/* Result image — full width, prominent */}
            <div className="rounded-lg overflow-hidden border bg-black/5">
              <img
                src={result}
                alt="Watermark removed"
                className="w-full h-auto block max-h-[500px] object-contain"
                onError={() => toast({ title: "Image failed to display", variant: "destructive" })}
              />
            </div>

            {/* Before / After side by side */}
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide text-center">Before</p>
                <img src={imgSrc} alt="Before" className="w-full rounded-lg border object-contain max-h-[200px] bg-black/5" />
              </div>
              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-green-600 uppercase tracking-wide text-center">After</p>
                <img src={result} alt="After" className="w-full rounded-lg border object-contain max-h-[200px] bg-black/5" />
              </div>
            </div>

            {/* Try other methods */}
            <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg border flex-wrap">
              <p className="text-xs text-muted-foreground font-medium">Not perfect? Try another method:</p>
              {METHODS.filter(m => m.value !== method).map(m => (
                <Button key={m.value} variant="outline" size="sm" className="text-xs gap-1 h-7"
                  onClick={() => { setMethod(m.value); setStage("edit"); setResult(""); }}>
                  <Eraser className="h-3 w-3" /> {m.label}
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
            <strong>Tip:</strong> Draw a tight box around just the watermark area — avoid selecting too much of the surrounding image.
            The <strong>Blur</strong> method works best for semi-transparent watermarks. If the result isn't clean, try <strong>Lighten</strong> or <strong>Darken</strong> depending on the watermark colour.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
