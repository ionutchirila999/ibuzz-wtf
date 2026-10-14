import { useState } from "react";
import Cropper from "react-easy-crop";
import { RotateCcw, RotateCw } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { MAX_IMAGE_EDGE, renderEdited, type Area } from "@/lib/product-images";

const ASPECTS = [{ label: "Square", v: 1 }, { label: "4:3", v: 4 / 3 }, { label: "3:4", v: 3 / 4 }, { label: "16:9", v: 16 / 9 }];

export function ImageEditor({ src, onCancel, onSave }: { src: string; onCancel: () => void; onSave: (b: Blob) => Promise<void> }) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [aspect, setAspect] = useState(1);
  const [maxEdge, setMaxEdge] = useState(MAX_IMAGE_EDGE);
  const [area, setArea] = useState<Area | null>(null);
  const [busy, setBusy] = useState(false);

  async function save() {
    if (!area) return;
    setBusy(true);
    try { await onSave(await renderEdited(src, area, rotation, maxEdge)); } finally { setBusy(false); }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onCancel()}>
      <DialogContent className="max-h-[95dvh] w-[calc(100vw-1rem)] max-w-lg overflow-y-auto p-4">
        <DialogHeader><DialogTitle>Edit photo</DialogTitle></DialogHeader>
        <div className="relative h-72 w-full overflow-hidden rounded-md bg-muted sm:h-80" style={{ touchAction: "none" }}>
          <Cropper image={src} crop={crop} zoom={zoom} rotation={rotation} aspect={aspect} minZoom={1} maxZoom={5}
            onCropChange={setCrop} onZoomChange={setZoom} onRotationChange={setRotation}
            onCropComplete={(_, px) => setArea(px)} />
        </div>
        <p className="text-xs text-muted-foreground">Drag to reposition, pinch or use the slider to zoom.</p>
        <div className="space-y-3">
          <div><Label>Zoom</Label><Slider min={1} max={5} step={0.05} value={[zoom]} onValueChange={([v]) => setZoom(v ?? 1)} /></div>
          <div><Label>Rotate ({Math.round(rotation)}°)</Label>
            <div className="flex items-center gap-2">
              <Button type="button" size="icon" variant="outline" aria-label="Rotate left" onClick={() => setRotation((r) => (r - 90) % 360)}><RotateCcw className="h-4 w-4" /></Button>
              <Slider className="flex-1" min={-180} max={180} step={1} value={[rotation]} onValueChange={([v]) => setRotation(v ?? 0)} />
              <Button type="button" size="icon" variant="outline" aria-label="Rotate right" onClick={() => setRotation((r) => (r + 90) % 360)}><RotateCw className="h-4 w-4" /></Button>
            </div>
          </div>
          <div><Label>Crop shape</Label>
            <div className="mt-1 flex flex-wrap gap-2">{ASPECTS.map((a) => (
              <Button key={a.label} type="button" size="sm" variant={aspect === a.v ? "default" : "outline"} onClick={() => setAspect(a.v)}>{a.label}</Button>
            ))}</div>
          </div>
          <div><Label>Saved size (longest side)</Label>
            <div className="mt-1 flex flex-wrap gap-2">{[800, 1200, 1600].map((s) => (
              <Button key={s} type="button" size="sm" variant={maxEdge === s ? "default" : "outline"} onClick={() => setMaxEdge(s)}>{s}px</Button>
            ))}</div>
          </div>
        </div>
        <div className="flex gap-2 pt-2">
          <Button type="button" variant="outline" className="flex-1" onClick={onCancel} disabled={busy}>Cancel</Button>
          <Button type="button" variant="glow" className="flex-1" onClick={save} disabled={busy || !area}>{busy ? "Saving…" : "Save photo"}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
