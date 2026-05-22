"use client";

import { useState } from "react";
import { Eye, EyeOff, Trash2, Plus, GripVertical, Layers } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useLayerStore, Layer } from "@/stores/layerStore";
import { cn } from "@/lib/utils";

export function LayerPanel() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [newLayerName, setNewLayerName] = useState("");

  const { layers, addLayer, removeLayer, toggleVisibility, setActiveLayer, activeLayerId } =
    useLayerStore();

  const handleAddLayer = () => {
    if (newLayerName.trim()) {
      addLayer({
        name: newLayerName.trim(),
        type: "geojson",
        visibility: true,
        opacity: 1,
        style: {},
        locked: false,
      });
      setNewLayerName("");
      setIsAdding(false);
    }
  };

  return (
    <div
      className={cn(
        "absolute left-4 top-20 z-10 flex flex-col rounded-lg border border-[var(--border)] bg-[var(--surface)] shadow-xl transition-all duration-200",
        isCollapsed ? "w-12" : "w-64"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--border)] p-3">
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-[var(--text-muted)]" />
            <span className="text-sm font-medium">Layers</span>
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="ml-auto"
        >
          {isCollapsed ? "→" : "←"}
        </Button>
      </div>

      {/* Layer List */}
      {!isCollapsed && (
        <div className="flex-1 overflow-y-auto p-2">
          <div className="space-y-1">
            {layers.map((layer, index) => (
              <LayerItem
                key={layer.id}
                layer={layer}
                index={index}
                isActive={activeLayerId === layer.id}
                onToggleVisibility={() => toggleVisibility(layer.id)}
                onRemove={() => removeLayer(layer.id)}
                onSelect={() => setActiveLayer(layer.id)}
              />
            ))}
          </div>

          {/* Add Layer Form */}
          {isAdding ? (
            <div className="mt-3 flex gap-2">
              <Input
                value={newLayerName}
                onChange={(e) => setNewLayerName(e.target.value)}
                placeholder="Layer name..."
                className="h-8 text-xs"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAddLayer();
                  if (e.key === "Escape") setIsAdding(false);
                }}
              />
              <Button size="sm" onClick={handleAddLayer} className="h-8">
                Add
              </Button>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsAdding(true)}
              className="mt-2 w-full justify-start text-[var(--text-muted)]"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Layer
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

interface LayerItemProps {
  layer: Layer;
  index: number;
  isActive: boolean;
  onToggleVisibility: () => void;
  onRemove: () => void;
  onSelect: () => void;
}

function LayerItem({
  layer,
  index,
  isActive,
  onToggleVisibility,
  onRemove,
  onSelect,
}: LayerItemProps) {
  return (
    <div
      className={cn(
        "group flex items-center gap-2 rounded-md p-2 text-sm transition-colors cursor-pointer",
        isActive
          ? "bg-[var(--primary)] bg-opacity-20 text-[var(--primary)]"
          : "hover:bg-[var(--surface-hover)]"
      )}
      onClick={onSelect}
    >
      <GripVertical className="h-4 w-4 cursor-grab text-[var(--text-muted)] opacity-0 group-hover:opacity-100" />

      <span
        className={cn(
          "h-3 w-3 rounded-full",
          layer.type === "geojson" && "bg-blue-500",
          layer.type === "choropleth" && "bg-gradient-to-r from-green-500 to-red-500",
          layer.type === "raster" && "bg-purple-500"
        )}
      />

      <span className="flex-1 truncate">{layer.name}</span>

      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggleVisibility();
        }}
        className="rounded p-1 hover:bg-[var(--surface-hover)]"
      >
        {layer.visibility ? (
          <Eye className="h-4 w-4 text-[var(--text-muted)]" />
        ) : (
          <EyeOff className="h-4 w-4 text-[var(--text-muted)]" />
        )}
      </button>

      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className="rounded p-1 opacity-0 hover:bg-[var(--error)] hover:text-white group-hover:opacity-100"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}