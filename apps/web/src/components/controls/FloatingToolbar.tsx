"use client";

import { useState } from "react";
import {
  MousePointer2,
  Square,
  Circle,
  Minus,
  Upload,
  Download,
  Settings,
  Layers,
  ZoomIn,
  ZoomOut,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useMapStore } from "@/stores/mapStore";
import { cn } from "@/lib/utils";

interface FloatingToolbarProps {
  onImport?: () => void;
  onExport?: () => void;
  onSettings?: () => void;
}

export function FloatingToolbar({
  onImport,
  onExport,
  onSettings,
}: FloatingToolbarProps) {
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const { map, drawMode, setDrawMode } = useMapStore();

  const tools = [
    { id: "select", icon: MousePointer2, label: "Select" },
    { id: "point", icon: Circle, label: "Point" },
    { id: "line", icon: Minus, label: "Line" },
    { id: "polygon", icon: Square, label: "Polygon" },
  ];

  const actions = [
    { id: "import", icon: Upload, label: "Import", onClick: onImport },
    { id: "export", icon: Download, label: "Export", onClick: onExport },
    { id: "layers", icon: Layers, label: "Layers" },
    { id: "settings", icon: Settings, label: "Settings", onClick: onSettings },
  ];

  const handleToolClick = (toolId: string) => {
    if (toolId === "select") {
      setDrawMode(null);
    } else {
      setDrawMode(toolId as "point" | "line" | "polygon");
    }
    setActiveTool(activeTool === toolId ? null : toolId);
  };

  const handleZoomIn = () => {
    if (map) map.zoomIn();
  };

  const handleZoomOut = () => {
    if (map) map.zoomOut();
  };

  const handleResetView = () => {
    if (map) {
      map.flyTo({
        center: [107.6298, -6.9175], // Indonesia center
        zoom: 5,
        duration: 1000,
      });
    }
  };

  return (
    <div className="absolute left-1/2 top-4 z-10 -translate-x-1/2">
      <div className="flex items-center gap-1 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-1.5 shadow-xl">
        {/* Drawing Tools */}
        <div className="flex items-center gap-0.5 border-r border-[var(--border)] pr-2">
          {tools.map((tool) => (
            <Button
              key={tool.id}
              variant="ghost"
              size="icon"
              onClick={() => handleToolClick(tool.id)}
              className={cn(
                "h-9 w-9",
                (activeTool === tool.id || drawMode === tool.id) &&
                  "bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)]"
              )}
              title={tool.label}
            >
              <tool.icon className="h-4 w-4" />
            </Button>
          ))}
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-0.5 border-r border-[var(--border)] pr-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            title="Zoom In"
            onClick={handleZoomIn}
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            title="Zoom Out"
            onClick={handleZoomOut}
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            title="Reset View"
            onClick={handleResetView}
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-0.5">
          {actions.map((action) => (
            <Button
              key={action.id}
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              title={action.label}
              onClick={action.onClick}
            >
              <action.icon className="h-4 w-4" />
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}