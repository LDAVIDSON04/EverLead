"use client";

import { useState, useCallback, useEffect } from "react";
import Cropper, { Area } from "react-easy-crop";
import { getCroppedImageBlob } from "@/lib/getCroppedImg";
import { Loader2, X } from "lucide-react";

/** Wide frame similar to the public blog card; drag / zoom to compose, then apply. */
const ASPECT = 16 / 9;

type Props = {
  imageSrc: string | null;
  onCancel: () => void;
  onComplete: (file: File) => void;
};

export function BlogImageCropModal({ imageSrc, onCancel, onComplete }: Props) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    if (imageSrc) {
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setCroppedAreaPixels(null);
    }
  }, [imageSrc]);

  const onCropComplete = useCallback((_croppedArea: Area, croppedAreaPixelsVal: Area) => {
    setCroppedAreaPixels(croppedAreaPixelsVal);
  }, []);

  const handleApply = async () => {
    if (!imageSrc || !croppedAreaPixels) return;
    setApplying(true);
    try {
      const blob = await getCroppedImageBlob(imageSrc, croppedAreaPixels);
      const file = new File([blob], `blog-${Date.now()}.jpg`, { type: "image/jpeg" });
      onComplete(file);
    } catch {
      onCancel();
    } finally {
      setApplying(false);
    }
  };

  if (!imageSrc) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col bg-black/80 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Crop image"
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-neutral-900 text-white">
        <p className="text-sm font-medium">Position &amp; crop</p>
        <button
          type="button"
          onClick={onCancel}
          className="p-2 rounded-full hover:bg-white/10"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="relative flex-1 min-h-[280px] max-h-[min(70vh,520px)] w-full bg-neutral-950">
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          aspect={ASPECT}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={onCropComplete}
          showGrid
        />
      </div>

      <div className="px-4 py-4 bg-neutral-900 border-t border-white/10 space-y-4">
        <div>
          <label className="text-xs text-neutral-400 block mb-2">Zoom</label>
          <input
            type="range"
            min={1}
            max={3}
            step={0.01}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="w-full accent-white"
          />
        </div>
        <p className="text-xs text-neutral-500">
          Drag to reposition. Pinch or use the slider to zoom. The visible area is what readers will see.
        </p>
        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2.5 rounded-lg text-sm font-medium bg-neutral-800 text-white hover:bg-neutral-700"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleApply}
            disabled={applying || !croppedAreaPixels}
            className="px-4 py-2.5 rounded-lg text-sm font-medium bg-white text-neutral-900 hover:bg-neutral-100 disabled:opacity-50 inline-flex items-center gap-2"
          >
            {applying ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Use image
          </button>
        </div>
      </div>
    </div>
  );
}
