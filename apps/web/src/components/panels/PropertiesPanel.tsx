"use client";

import { useState } from "react";
import { X, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useLayerStore } from "@/stores/layerStore";
import { cn } from "@/lib/utils";

export function PropertiesPanel() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { layers, activeLayerId, updateLayer } = useLayerStore();
  const activeLayer = layers.find((l) => l.id === activeLayerId);

  if (!activeLayer) {
    return (
      <div className="absolute right-4 top-20 z-10 w-64 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4 text-center text-[var(--text-muted)]">
        <p className="text-sm">Select a layer to view properties</p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "absolute right-4 top-20 z-10 flex flex-col rounded-lg border border-[var(--border)] bg-[var(--surface)] shadow-xl transition-all duration-200",
        isCollapsed ? "w-12 h-12" : "w-72"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--border)] p-3">
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <ChevronRight className="h-4 w-4 text-[var(--text-muted)]" />
            <span className="text-sm font-medium">Properties</span>
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={cn(isCollapsed && "mx-auto")}
        >
          {isCollapsed ? "→" : "×"}
        </Button>
      </div>

      {/* Content */}
      {!isCollapsed && (
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Layer Name */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-[var(--text-muted)]">
              Layer Name
            </label>
            <Input
              value={activeLayer.name}
              onChange={(e) => updateLayer(activeLayer.id, { name: e.target.value })}
              className="h-9"
            />
          </div>

          {/* Opacity */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-[var(--text-muted)]">
              Opacity: {Math.round(activeLayer.opacity * 100)}%
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={activeLayer.opacity * 100}
              onChange={(e) =>
                updateLayer(activeLayer.id, { opacity: Number(e.target.value) / 100 })
              }
              className="w-full accent-[var(--primary)]"
            />
          </div>

          {/* Style Section */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-[var(--text-muted)]">
              Style
            </label>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <span className="text-xs text-[var(--text-secondary)]">Fill Color</span>
                <input
                  type="color"
                  value={(activeLayer.style.color as string) || "#3b82f6"}
                  onChange={(e) =>
                    updateLayer(activeLayer.id, {
                      style: { ...activeLayer.style, color: e.target.value },
                    })
                  }
                  className="h-9 w-full cursor-pointer rounded border border-[var(--border)]"
                />
              </div>
              <div className="space-y-1">
                <span className="text-xs text-[var(--text-secondary)]">Stroke Color</span>
                <input
                  type="color"
                  value={(activeLayer.style.strokeColor as string) || "#ffffff"}
                  onChange={(e) =>
                    updateLayer(activeLayer.id, {
                      style: { ...activeLayer.style, strokeColor: e.target.value },
                    })
                  }
                  className="h-9 w-full cursor-pointer rounded border border-[var(--border)]"
                />
              </div>
            </div>
          </div>

          {/* Layer Info */}
          <div className="space-y-2 rounded-md bg-[var(--background)] p-3 text-xs">
            <div className="flex justify-between">
              <span className="text-[var(--text-muted)]">Type</span>
              <span className="font-medium uppercase">{activeLayer.type}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--text-muted)]">Visible</span>
              <span className={activeLayer.visibility ? "text-[var(--success)]" : "text-[var(--error)]"}>
                {activeLayer.visibility ? "Yes" : "No"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--text-muted)]">Locked</span>
              <span className={activeLayer.locked ? "text-[var(--warning)]" : "text-[var(--text-secondary)]"}>
                {activeLayer.locked ? "Yes" : "No"}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}