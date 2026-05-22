import type { FastifyInstance } from "fastify";
import { db } from "../services/database.js";

export async function layersRoutes(fastify: FastifyInstance) {
  // Get single layer
  fastify.get<{ Params: { id: string } }>("/:id", async (request, reply) => {
    const layer = await db.getLayer(request.params.id);
    if (!layer) {
      return reply.status(404).send({
        success: false,
        error: "Layer not found",
      });
    }
    return {
      success: true,
      data: formatLayer(layer),
    };
  });

  // Update layer
  fastify.patch<{
    Params: { id: string };
    Body: Partial<{
      parentId: string;
      name: string;
      visibility: boolean;
      opacity: number;
      zIndex: number;
      style: Record<string, unknown>;
      locked: boolean;
    }>;
  }>("/:id", async (request, reply) => {
    const existing = await db.getLayer(request.params.id);
    if (!existing) {
      return reply.status(404).send({
        success: false,
        error: "Layer not found",
      });
    }

    const layer = await db.updateLayer(request.params.id, {
      parentId: request.body.parentId,
      name: request.body.name,
      visibility: request.body.visibility !== undefined ? (request.body.visibility ? 1 : 0) : undefined,
      opacity: request.body.opacity,
      zIndex: request.body.zIndex,
      style: request.body.style ? JSON.stringify(request.body.style) : undefined,
      locked: request.body.locked !== undefined ? (request.body.locked ? 1 : 0) : undefined,
    });

    return {
      success: true,
      data: formatLayer(layer),
    };
  });

  // Delete layer
  fastify.delete<{ Params: { id: string } }>("/:id", async (request, reply) => {
    const existing = await db.getLayer(request.params.id);
    if (!existing) {
      return reply.status(404).send({
        success: false,
        error: "Layer not found",
      });
    }

    await db.deleteLayer(request.params.id);
    return {
      success: true,
      message: "Layer deleted",
    };
  });

  // Get layer features
  fastify.get<{ Params: { id: string } }>("/:id/features", async (request, reply) => {
    const layer = await db.getLayer(request.params.id);
    if (!layer) {
      return reply.status(404).send({
        success: false,
        error: "Layer not found",
      });
    }

    const features = await db.getFeatures(request.params.id);
    return {
      success: true,
      data: features.map(formatFeature),
    };
  });
}

function formatLayer(row: Record<string, unknown>) {
  return {
    id: row.id,
    projectId: row.project_id,
    parentId: row.parent_id,
    name: row.name,
    type: row.type,
    visibility: Boolean(row.visibility),
    opacity: row.opacity,
    zIndex: row.z_index,
    style: row.style ? JSON.parse(row.style as string) : {},
    locked: Boolean(row.locked),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function formatFeature(row: Record<string, unknown>) {
  return {
    id: row.id,
    layerId: row.layer_id,
    geometry: JSON.parse(row.geometry as string),
    properties: row.properties ? JSON.parse(row.properties as string) : {},
    centroid: row.centroid ? JSON.parse(row.centroid as string) : null,
    bbox: row.bbox ? JSON.parse(row.bbox as string) : null,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}