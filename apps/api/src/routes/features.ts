import type { FastifyInstance } from "fastify";
import { db } from "../services/database.js";
import * as turf from "@turf/helpers";

export async function featuresRoutes(fastify: FastifyInstance) {
  // Create feature
  fastify.post<{
    Body: {
      layerId: string;
      geometry: GeoJSON.Geometry;
      properties?: Record<string, unknown>;
    };
  }>("/", async (request, reply) => {
    const { layerId, geometry, properties } = request.body;

    if (!layerId || !geometry) {
      return reply.status(400).send({
        success: false,
        error: "layerId and geometry are required",
      });
    }

    const layer = await db.getLayer(layerId);
    if (!layer) {
      return reply.status(404).send({
        success: false,
        error: "Layer not found",
      });
    }

    // Calculate centroid and bbox using Turf.js
    let centroid: [number, number] | undefined;
    let bbox: [number, number, number, number] | undefined;

    try {
      const feature = turf.feature(geometry);
      const pt = turf.centroid(feature);
      centroid = pt.geometry.coordinates as [number, number];

      const bboxPolygon = turf.bbox(feature);
      bbox = bboxPolygon as [number, number, number, number];
    } catch {
      // Geometry might not support centroid calculation
    }

    const feature = await db.createFeature({
      layerId,
      geometry: JSON.stringify(geometry),
      properties: properties ? JSON.stringify(properties) : "{}",
      centroid: centroid ? JSON.stringify(centroid) : undefined,
      bbox: bbox ? JSON.stringify(bbox) : undefined,
    });

    return reply.status(201).send({
      success: true,
      data: formatFeature(feature),
    });
  });

  // Delete feature
  fastify.delete<{ Params: { id: string } }>("/:id", async (request, reply) => {
    await db.deleteFeature(request.params.id);
    return {
      success: true,
      message: "Feature deleted",
    };
  });
}

function formatFeature(row: Record<string, unknown>) {
  return {
    id: row.id,
    layerId: row.layer_id,
    geometry: row.geometry ? JSON.parse(row.geometry as string) : null,
    properties: row.properties ? JSON.parse(row.properties as string) : {},
    centroid: row.centroid ? JSON.parse(row.centroid as string) : null,
    bbox: row.bbox,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}