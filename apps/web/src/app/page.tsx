"use client";

import { useState } from "react";
import { MapView } from "@/components/map/MapView";
import { LayerPanel } from "@/components/panels/LayerPanel";
import { FloatingToolbar } from "@/components/controls/FloatingToolbar";
import { PropertiesPanel } from "@/components/panels/PropertiesPanel";
import { Legend } from "@/components/choropleth/Legend";
import { ImportModal } from "@/components/modals/ImportModal";
import { ExportModal } from "@/components/modals/ExportModal";

export default function Home() {
  const [importOpen, setImportOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);

  return (
    <main className="relative h-screen w-screen overflow-hidden">
      {/* Main Map */}
      <MapView />

      {/* Floating Toolbar - Top */}
      <FloatingToolbar
        onImport={() => setImportOpen(true)}
        onExport={() => setExportOpen(true)}
      />

      {/* Layer Panel - Left Sidebar */}
      <LayerPanel />

      {/* Properties Panel - Right Sidebar */}
      <PropertiesPanel />

      {/* Legend - Bottom Right */}
      <Legend />

      {/* Modals */}
      <ImportModal
        open={importOpen}
        onOpenChange={setImportOpen}
      />
      <ExportModal
        open={exportOpen}
        onOpenChange={setExportOpen}
      />

      {/* Map Attribution */}
      <div className="absolute bottom-2 right-2 text-xs text-[var(--text-muted)] opacity-70">
        Map data © OpenStreetMap contributors
      </div>
    </main>
  );
}