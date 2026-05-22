"use client";

import { useState } from "react";
import { Download, FileJson, Layers } from "lucide-react";
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
import { useLayerStore } from "@/stores/layerStore";

interface ExportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ExportModal({ open, onOpenChange }: ExportModalProps) {
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [filename, setFilename] = useState("map-studio-export");

  const { layers } = useLayerStore();

  const handleExport = () => {
    if (!selectedLayerId) return;

    setIsExporting(true);

    try {
      // Find the selected layer
      const layer = layers.find((l) => l.id === selectedLayerId);
      if (!layer) {
        throw new Error("Layer not found");
      }

      // Create GeoJSON with layer metadata
      const exportData: GeoJSON.FeatureCollection = {
        type: "FeatureCollection",
        features: [],
        // Store layer info in metadata
      };

      // Add layer info as metadata
      const meta = {
        layer: {
          id: layer.id,
          name: layer.name,
          type: layer.type,
          style: layer.style,
        },
        exportedAt: new Date().toISOString(),
      };

      // Create export with metadata
      const fullExport = {
        ...exportData,
        metadata: meta,
      };

      const blob = new Blob([JSON.stringify(fullExport, null, 2)], {
        type: "application/json",
      });
      saveAs(blob, `${filename}.geojson`);
      onOpenChange(false);
    } catch (err) {
      console.error("Export failed:", err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportAll = () => {
    setIsExporting(true);

    try {
      // Export all layers metadata
      const exportData: GeoJSON.FeatureCollection = {
        type: "FeatureCollection",
        features: [],
      };

      const meta = {
        layers: layers.map((l) => ({
          id: l.id,
          name: l.name,
          type: l.type,
          style: l.style,
        })),
        exportedAt: new Date().toISOString(),
      };

      const fullExport = {
        ...exportData,
        metadata: meta,
      };

      const blob = new Blob([JSON.stringify(fullExport, null, 2)], {
        type: "application/json",
      });
      saveAs(blob, `${filename}.geojson`);
      onOpenChange(false);
    } catch (err) {
      console.error("Export all failed:", err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent className="max-w-md">
        <ModalHeader>
          <ModalTitle>Export GeoJSON</ModalTitle>
          <ModalDescription>
            Download your map data as a GeoJSON file
          </ModalDescription>
        </ModalHeader>

        <div className="py-4 space-y-4">
          {/* Filename */}
          <div>
            <label className="text-xs font-medium text-[var(--text-muted)]">
              Filename
            </label>
            <input
              type="text"
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              className="mt-1 w-full h-9 px-3 rounded-md border border-[var(--border)] bg-[var(--surface)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
            />
          </div>

          {/* Layer selection */}
          <div>
            <label className="text-xs font-medium text-[var(--text-muted)]">
              Select Layer
            </label>
            <div className="mt-1 max-h-48 overflow-y-auto space-y-1">
              {layers.length === 0 ? (
                <p className="text-sm text-[var(--text-muted)] py-4 text-center">
                  No layers available
                </p>
              ) : (
                layers.map((layer) => (
                  <button
                    key={layer.id}
                    onClick={() => setSelectedLayerId(layer.id)}
                    className={`
                      w-full flex items-center gap-2 p-2 rounded-md text-left text-sm
                      transition-colors
                      ${
                        selectedLayerId === layer.id
                          ? "bg-[var(--primary)] text-white"
                          : "hover:bg-[var(--surface-hover)]"
                      }
                    `}
                  >
                    <Layers className="h-4 w-4" />
                    <span className="flex-1 truncate">{layer.name}</span>
                    <span
                      className={`h-2 w-2 rounded-full ${
                        layer.type === "geojson"
                          ? "bg-blue-500"
                          : layer.type === "choropleth"
                          ? "bg-gradient-to-r from-green-500 to-red-500"
                          : "bg-purple-500"
                      }`}
                    />
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        <ModalFooter className="flex-col-reverse sm:flex-row sm:space-x-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="outline"
            onClick={handleExportAll}
            disabled={isExporting || layers.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            Export All Layers
          </Button>
          <Button
            onClick={handleExport}
            disabled={!selectedLayerId || isExporting}
          >
            <FileJson className="h-4 w-4 mr-2" />
            {isExporting ? "Exporting..." : "Export Selected"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}