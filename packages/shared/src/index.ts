import { z } from "zod";

// UUID schema
export const uuidSchema = z.string().uuid();
export type UUID = string;

// Project schema
export const projectSchema = z.object({
  id: uuidSchema,
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  ownerId: uuidSchema,
  bounds: z.any().optional(), // GeoJSON geometry
  defaultCenter: z.tuple([z.number(), z.number()]).optional(),
  defaultZoom: z.number().int().min(1).max(22).optional(),
  settings: z.record(z.unknown()).optional(),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});
export type Project = z.infer<typeof projectSchema>;

// Layer schema
export const layerSchema = z.object({
  id: uuidSchema,
  projectId: uuidSchema,
  parentId: uuidSchema.optional(),
  name: z.string().min(1).max(255),
  type: z.enum(["geojson", "choropleth", "raster", "group"]),
  visibility: z.boolean().default(true),
  opacity: z.number().min(0).max(1).default(1),
  zIndex: z.number().int().default(0),
  style: z.record(z.unknown()).optional(),
  locked: z.boolean().default(false),
});
export type Layer = z.infer<typeof layerSchema>;

// Feature schema (GeoJSON Feature)
export const featureSchema = z.object({
  id: uuidSchema,
  layerId: uuidSchema,
  geometry: z.any(), // GeoJSON geometry object
  properties: z.record(z.unknown()).optional(),
  centroid: z.tuple([z.number(), z.number()]).optional(),
  bbox: z.tuple([z.number(), z.number(), z.number(), z.number()]).optional(),
  createdBy: uuidSchema.optional(),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});
export type Feature = z.infer<typeof featureSchema>;

// Choropleth config schema
export const choroplethConfigSchema = z.object({
  id: uuidSchema,
  layerId: uuidSchema,
  propertyKey: z.string(),
  colorScale: z.enum(["sequential", "diverging", "categorical"]).default("sequential"),
  colorScheme: z.array(z.string()),
  breaks: z.array(z.number()).optional(),
  classificationMethod: z.enum(["equal", "quantile", "jenks", "natural"]).default("equal"),
  legendConfig: z.record(z.unknown()).optional(),
});
export type ChoroplethConfig = z.infer<typeof choroplethConfigSchema>;

// API request/response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Create/Update DTOs
export const createProjectDto = projectSchema.omit({ id: true, createdAt: true, updatedAt: true });
export type CreateProjectDto = z.infer<typeof createProjectDto>;

export const updateProjectDto = projectSchema.partial().omit({ id: true, ownerId: true, createdAt: true });
export type UpdateProjectDto = z.infer<typeof updateProjectDto>;

export const createLayerDto = layerSchema.omit({ id: true, zIndex: true });
export type CreateLayerDto = z.infer<typeof createLayerDto>;

export const updateLayerDto = layerSchema.partial().omit({ id: true, projectId: true });
export type UpdateLayerDto = z.infer<typeof updateLayerDto>;

export const createFeatureDto = featureSchema.omit({ id: true, createdAt: true, updatedAt: true });
export type CreateFeatureDto = z.infer<typeof createFeatureDto>;

export const updateFeatureDto = featureSchema.partial().omit({ id: true, layerId: true });
export type UpdateFeatureDto = z.infer<typeof updateFeatureDto>;

// GeoJSON Import
export interface GeoJsonImportResult {
  layerId: string;
  featuresCreated: number;
  warnings: string[];
  bounds: [[number, number], [number, number]];
  geometryTypes: Record<string, number>;
}

// Export types
export type ExportFormat = "geojson" | "shapefile" | "kml";

export interface ExportOptions {
  format: ExportFormat;
  includeProperties?: boolean;
  compression?: boolean;
}