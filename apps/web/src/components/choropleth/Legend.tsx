"use client";

import { useState, useMemo } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

interface LegendProps {
  title?: string;
  unit?: string;
  min?: number;
  max?: number;
  colors?: string[];
  breaks?: number[];
}

// Default electricity-inspired color scale (green to red)
const DEFAULT_COLORS = [
  "#22c55e", // Green (low)
  "#84cc16",
  "#eab308",
  "#f97316",
  "#ef4444", // Red (high)
];

const DEFAULT_BREAKS = [0, 300, 600, 900, 1200, 1500];

export function Legend({
  title = "Carbon Intensity",
  unit = "gCO₂eq/kWh",
  min = 0,
  max = 1500,
  colors = DEFAULT_COLORS,
  breaks = DEFAULT_BREAKS,
}: LegendProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Generate gradient CSS
  const gradient = useMemo(() => {
    const step = 100 / (colors.length - 1);
    const stops = colors
      .map((color, i) => `${color} ${i * step}%`)
      .join(", ");
    return `linear-gradient(to right, ${stops})`;
  }, [colors]);

  return (
    <div
      className={cn(
        "absolute bottom-12 right-4 z-10 rounded-lg border border-[var(--border)] bg-[var(--surface)] shadow-xl transition-all duration-200",
        isCollapsed ? "w-12 h-12" : "w-56"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--border)] p-2">
        {!isCollapsed && (
          <span className="text-xs font-medium">{title}</span>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={cn(isCollapsed && "mx-auto")}
        >
          {isCollapsed ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
      </div>

      {/* Content */}
      {!isCollapsed && (
        <div className="p-3 space-y-2">
          {/* Color Scale */}
          <div
            className="h-3 w-full rounded-full"
            style={{ background: gradient }}
          />

          {/* Labels */}
          <div className="flex justify-between text-xs">
            <span>{min}</span>
            <span className="text-[var(--text-muted)]">{unit}</span>
            <span>{max}</span>
          </div>

          {/* Break Points */}
          {breaks.length > 0 && (
            <div className="flex justify-between text-xs text-[var(--text-secondary)]">
              {breaks.slice(0, 3).map((value, i) => (
                <span key={i}>{value}</span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}