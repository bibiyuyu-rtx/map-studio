import { create } from "zustand";
import type { Map as MaplibreMap } from "maplibre-gl";

interface MapState {
  map: MaplibreMap | null;
  center: [number, number]; // [lng, lat]
  zoom: number;
  isDrawing: boolean;
  drawMode: "point" | "line" | "polygon" | null;
  selectedFeatureId: string | null;

  setMap: (map: MaplibreMap) => void;
  setCenter: (center: [number, number]) => void;
  setZoom: (zoom: number) => void;
  setDrawing: (isDrawing: boolean) => void;
  setDrawMode: (mode: "point" | "line" | "polygon" | null) => void;
  setSelectedFeatureId: (id: string | null) => void;
  flyTo: (center: [number, number], zoom?: number) => void;
}

export const useMapStore = create<MapState>((set, get) => ({
  map: null,
  center: [107.6298, -6.9175], // Default to Indonesia
  zoom: 5,
  isDrawing: false,
  drawMode: null,
  selectedFeatureId: null,

  setMap: (map) => set({ map }),

  setCenter: (center) => set({ center }),

  setZoom: (zoom) => set({ zoom }),

  setDrawing: (isDrawing) => set({ isDrawing }),

  setDrawMode: (drawMode) =>
    set({
      drawMode,
      isDrawing: drawMode !== null,
    }),

  setSelectedFeatureId: (selectedFeatureId) => set({ selectedFeatureId }),

  flyTo: (center, zoom) => {
    const { map } = get();
    if (map) {
      map.flyTo({ center, zoom: zoom || map.getZoom(), duration: 500 });
      set({ center, zoom: zoom || get().zoom });
    }
  },
}));