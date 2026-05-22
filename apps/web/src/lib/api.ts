const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export interface Project {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  bounds?: unknown;
  defaultCenter?: [number, number];
  defaultZoom?: number;
  settings?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
}

export interface Layer {
  id: string;
  projectId: string;
  parentId?: string;
  name: string;
  type: "geojson" | "choropleth" | "raster" | "group";
  visibility: boolean;
  opacity: number;
  zIndex: number;
  style: Record<string, unknown>;
  locked: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Feature {
  id: string;
  layerId: string;
  geometry: GeoJSON.Geometry;
  properties: Record<string, unknown>;
  centroid?: [number, number];
  bbox?: [number, number, number, number];
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

async function handleResponse<T>(response: Response): Promise<T> {
  const data: ApiResponse<T> = await response.json();
  if (!data.success) {
    throw new Error(data.error || "API request failed");
  }
  return data.data as T;
}

export const api = {
  projects: {
    list: async (ownerId?: string): Promise<Project[]> => {
      const url = ownerId
        ? `${API_URL}/api/projects?ownerId=${ownerId}`
        : `${API_URL}/api/projects`;
      const response = await fetch(url);
      return handleResponse<Project[]>(response);
    },

    get: async (id: string): Promise<Project> => {
      const response = await fetch(`${API_URL}/api/projects/${id}`);
      return handleResponse<Project>(response);
    },

    create: async (data: {
      name: string;
      description?: string;
      ownerId?: string;
      bounds?: unknown;
      defaultCenter?: [number, number];
      defaultZoom?: number;
    }): Promise<Project> => {
      const response = await fetch(`${API_URL}/api/projects`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return handleResponse<Project>(response);
    },

    update: async (
      id: string,
      data: Partial<{
        name: string;
        description: string;
        bounds: unknown;
        defaultCenter: [number, number];
        defaultZoom: number;
      }>
    ): Promise<Project> => {
      const response = await fetch(`${API_URL}/api/projects/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return handleResponse<Project>(response);
    },

    delete: async (id: string): Promise<void> => {
      const response = await fetch(`${API_URL}/api/projects/${id}`, {
        method: "DELETE",
      });
      return handleResponse<void>(response);
    },

    getLayers: async (projectId: string): Promise<Layer[]> => {
      const response = await fetch(`${API_URL}/api/projects/${projectId}/layers`);
      return handleResponse<Layer[]>(response);
    },
  },

  layers: {
    get: async (id: string): Promise<Layer> => {
      const response = await fetch(`${API_URL}/api/layers/${id}`);
      return handleResponse<Layer>(response);
    },

    update: async (
      id: string,
      data: Partial<{
        parentId: string;
        name: string;
        visibility: boolean;
        opacity: number;
        zIndex: number;
        style: Record<string, unknown>;
        locked: boolean;
      }>
    ): Promise<Layer> => {
      const response = await fetch(`${API_URL}/api/layers/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return handleResponse<Layer>(response);
    },

    delete: async (id: string): Promise<void> => {
      const response = await fetch(`${API_URL}/api/layers/${id}`, {
        method: "DELETE",
      });
      return handleResponse<void>(response);
    },

    getFeatures: async (layerId: string): Promise<Feature[]> => {
      const response = await fetch(`${API_URL}/api/layers/${layerId}/features`);
      return handleResponse<Feature[]>(response);
    },
  },

  features: {
    create: async (data: {
      layerId: string;
      geometry: GeoJSON.Geometry;
      properties?: Record<string, unknown>;
    }): Promise<Feature> => {
      const response = await fetch(`${API_URL}/api/features`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return handleResponse<Feature>(response);
    },

    delete: async (id: string): Promise<void> => {
      const response = await fetch(`${API_URL}/api/features/${id}`, {
        method: "DELETE",
      });
      return handleResponse<void>(response);
    },
  },

  import: {
    geojson: async (data: {
      projectId: string;
      layerName?: string;
      geojson: GeoJSON.FeatureCollection;
    }): Promise<{
      layerId: string;
      featuresCreated: number;
      warnings: string[];
      bounds: [[number, number], [number, number]];
      geometryTypes: Record<string, number>;
    }> => {
      const response = await fetch(`${API_URL}/api/import/geojson`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return handleResponse(response);
    },
  },

  export: {
    geojson: async (
      layerId: string
    ): Promise<GeoJSON.FeatureCollection> => {
      const response = await fetch(
        `${API_URL}/api/export/geojson/${layerId}`
      );
      return handleResponse<GeoJSON.FeatureCollection>(response);
    },

    projectGeojson: async (
      projectId: string
    ): Promise<GeoJSON.FeatureCollection> => {
      const response = await fetch(
        `${API_URL}/api/export/geojson/project/${projectId}`
      );
      return handleResponse<GeoJSON.FeatureCollection>(response);
    },
  },

  health: async (): Promise<{ status: string; timestamp: string }> => {
    const response = await fetch(`${API_URL}/health`);
    return handleResponse(response);
  },
};

export default api;