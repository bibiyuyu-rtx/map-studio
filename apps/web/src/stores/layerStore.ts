import { create } from "zustand";

export interface Layer {
  id: string;
  name: string;
  type: "geojson" | "choropleth" | "raster" | "group";
  visibility: boolean;
  opacity: number;
  zIndex: number;
  style: Record<string, unknown>;
  locked: boolean;
  children?: Layer[];
}

export interface LayerState {
  layers: Layer[];
  activeLayerId: string | null;

  addLayer: (layer: Omit<Layer, "id" | "zIndex">) => void;
  removeLayer: (id: string) => void;
  updateLayer: (id: string, updates: Partial<Layer>) => void;
  reorderLayers: (fromIndex: number, toIndex: number) => void;
  toggleVisibility: (id: string) => void;
  setActiveLayer: (id: string | null) => void;
  setLayers: (layers: Layer[]) => void;
}

export const useLayerStore = create<LayerState>((set, get) => ({
  layers: [
    // Default sample layer
    {
      id: "sample-layer-1",
      name: "Sample Points",
      type: "geojson",
      visibility: true,
      opacity: 1,
      zIndex: 0,
      style: {
        color: "#3b82f6",
        radius: 8,
      },
      locked: false,
    },
  ],
  activeLayerId: null,

  addLayer: (layer) => {
    const { layers } = get();
    const newLayer: Layer = {
      ...layer,
      id: `layer-${Date.now()}`,
      zIndex: layers.length,
    };
    set({ layers: [...layers, newLayer] });
  },

  removeLayer: (id) => {
    set((state) => ({
      layers: state.layers.filter((l) => l.id !== id),
      activeLayerId: state.activeLayerId === id ? null : state.activeLayerId,
    }));
  },

  updateLayer: (id, updates) => {
    set((state) => ({
      layers: state.layers.map((l) => (l.id === id ? { ...l, ...updates } : l)),
    }));
  },

  reorderLayers: (fromIndex, toIndex) => {
    set((state) => {
      const newLayers = [...state.layers];
      const [removed] = newLayers.splice(fromIndex, 1);
      newLayers.splice(toIndex, 0, removed);
      return { layers: newLayers.map((l, i) => ({ ...l, zIndex: i })) };
    });
  },

  toggleVisibility: (id) => {
    set((state) => ({
      layers: state.layers.map((l) =>
        l.id === id ? { ...l, visibility: !l.visibility } : l
      ),
    }));
  },

  setActiveLayer: (activeLayerId) => set({ activeLayerId }),

  setLayers: (layers) => set({ layers }),
}));