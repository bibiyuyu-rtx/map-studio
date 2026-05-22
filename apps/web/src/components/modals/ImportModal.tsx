"use client";

import { useCallback, useState } from "react";
import { Upload, FileJson, CheckCircle, AlertCircle } from "lucide-react";
import { useDropzone } from "react-dropzone";
import { saveAs } from "file-saver";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalFooter,
} from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { useMapStore } from "@/stores/mapStore";
import { useLayerStore, Layer } from "@/stores/layerStore";
import * as turf from "@turf/turf";

interface ImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId?: string;
  onImportComplete?: (layerId: string, featuresCount: number) => void;
}

export function ImportModal({
  open,
  onOpenChange,
  projectId,
  onImportComplete,
}: ImportModalProps) {
  const [geojson, setGeojson] = useState<GeoJSON.FeatureCollection | null>(null);
  const [layerName, setLayerName] = useState("Imported Layer");
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { map } = useMapStore();
  const { addLayer } = useLayerStore();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const parsed = JSON.parse(text);

        // Validate GeoJSON
        if (parsed.type !== "FeatureCollection" || !Array.isArray(parsed.features)) {
          throw new Error("Invalid GeoJSON: must be a FeatureCollection with features array");
        }

        setGeojson(parsed);
        setError(null);
      } catch (err) {
        setError((err as Error).message);
        setGeojson(null);
      }
    };
    reader.readAsText(file);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/geo+json": [".geojson", ".json"],
      "application/json": [".json"],
    },
    multiple: false,
  });

  const handleImport = async () => {
    if (!geojson || !map) return;

    setIsImporting(true);
    setError(null);

    try {
      // Add layer to store
      const newLayer: Layer = {
        id: `layer-${Date.now()}`,
        name: layerName,
        type: "geojson",
        visibility: true,
        opacity: 1,
        zIndex: Date.now(),
        style: {
          color: "#3b82f6",
          fillOpacity: 0.6,
          strokeColor: "#ffffff",
          strokeWidth: 1,
        },
        locked: false,
      };

      addLayer({
        name: newLayer.name,
        type: newLayer.type,
        visibility: newLayer.visibility,
        opacity: newLayer.opacity,
        style: newLayer.style,
        locked: newLayer.locked,
      });

      // Add GeoJSON source to map
      const sourceId = `source-${newLayer.id}`;
      if (!map.getSource(sourceId)) {
        map.addSource(sourceId, {
          type: "geojson",
          data: geojson,
        });

        // Add fill layer
        map.addLayer({
          id: `fill-${newLayer.id}`,
          type: "fill",
          source: sourceId,
          paint: {
            "fill-color": newLayer.style.color as string || "#3b82f6",
            "fill-opacity": newLayer.style.fillOpacity as number || 0.6,
          },
        });

        // Add stroke layer
        map.addLayer({
          id: `stroke-${newLayer.id}`,
          type: "line",
          source: sourceId,
          paint: {
            "line-color": newLayer.style.strokeColor as string || "#ffffff",
            "line-width": newLayer.style.strokeWidth as number || 1,
          },
        });

        // Fit map to GeoJSON bounds
        const bounds = turf.bbox(geojson);
        map.fitBounds(
          [
            [bounds[0], bounds[1]],
            [bounds[2], bounds[3]],
          ],
          { padding: 50, duration: 1000 }
        );
      }

      onImportComplete?.(newLayer.id, geojson.features.length);
      onOpenChange(false);
      setGeojson(null);
      setLayerName("Imported Layer");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsImporting(false);
    }
  };

  const handleCancel = () => {
    setGeojson(null);
    setLayerName("Imported Layer");
    setError(null);
    onOpenChange(false);
  };

  const featureCount = geojson?.features.length || 0;
  const geometryTypes = geojson?.features.reduce((acc, f) => {
    const type = f.geometry?.type || "Unknown";
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent className="max-w-md">
        <ModalHeader>
          <ModalTitle>Import GeoJSON</ModalTitle>
          <ModalDescription>
            Upload a GeoJSON file to add features to your map
          </ModalDescription>
        </ModalHeader>

        <div className="py-4 space-y-4">
          {/* Dropzone */}
          {!geojson ? (
            <div
              {...getRootProps()}
              className={`
                border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
                transition-colors
                ${
                  isDragActive
                    ? "border-[var(--primary)] bg-[var(--primary)]/10"
                    : "border-[var(--border)] hover:border-[var(--border-light)]"
                }
              `}
            >
              <input {...getInputProps()} />
              <Upload className="h-12 w-12 mx-auto mb-4 text-[var(--text-muted)]" />
              <p className="text-sm text-[var(--text-muted)]">
                {isDragActive
                  ? "Drop the GeoJSON file here"
                  : "Drag & drop a GeoJSON file here, or click to select"}
              </p>
              <p className="text-xs text-[var(--text-secondary)] mt-2">
                Supports .geojson and .json files
              </p>
            </div>
          ) : (
            /* Preview */
            <div className="space-y-3">
              <div className="flex items-center gap-2 p-3 rounded-lg bg-[var(--background)]">
                <FileJson className="h-5 w-5 text-[var(--success)]" />
                <div className="flex-1">
                  <p className="text-sm font-medium">{layerName}</p>
                  <p className="text-xs text-[var(--text-muted)]">
                    {featureCount} features
                  </p>
                </div>
                <button
                  onClick={() => setGeojson(null)}
                  className="text-xs text-[var(--error)] hover:underline"
                >
                  Remove
                </button>
              </div>

              {/* Geometry types */}
              <div className="flex flex-wrap gap-2">
                {Object.entries(geometryTypes).map(([type, count]) => (
                  <span
                    key={type}
                    className="px-2 py-1 text-xs rounded bg-[var(--background)] text-[var(--text-muted)]"
                  >
                    {type}: {count}
                  </span>
                ))}
              </div>

              {/* Layer name input */}
              <div>
                <label className="text-xs font-medium text-[var(--text-muted)]">
                  Layer Name
                </label>
                <input
                  type="text"
                  value={layerName}
                  onChange={(e) => setLayerName(e.target.value)}
                  className="mt-1 w-full h-9 px-3 rounded-md border border-[var(--border)] bg-[var(--surface)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                />
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-[var(--error)]/10 text-[var(--error)]">
              <AlertCircle className="h-4 w-4" />
              <p className="text-sm">{error}</p>
            </div>
          )}
        </div>

        <ModalFooter>
          <Button variant="ghost" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleImport} disabled={!geojson || isImporting}>
            {isImporting ? "Importing..." : "Import"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}