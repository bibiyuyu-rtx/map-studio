"use client";

import { MapView } from "@/components/map/MapView";
import { LayerPanel } from "@/components/panels/LayerPanel";
import { FloatingToolbar } from "@/components/controls/FloatingToolbar";
import { PropertiesPanel } from "@/components/panels/PropertiesPanel";
import { Legend } from "@/components/choropleth/Legend";

export default function Home() {
  return (
    <main className="relative h-screen w-screen overflow-hidden">
      {/* Main Map */}
      <MapView />

      {/* Floating Toolbar - Top */}
      <FloatingToolbar />

      {/* Layer Panel - Left Sidebar */}
      <LayerPanel />

      {/* Properties Panel - Right Sidebar */}
      <PropertiesPanel />

      {/* Legend - Bottom Right */}
      <Legend />

      {/* Map Attribution */}
      <div className="absolute bottom-2 right-2 text-xs text-[var(--text-muted)] opacity-70">
        Map data © OpenStreetMap contributors
      </div>
    </main>
  );
}