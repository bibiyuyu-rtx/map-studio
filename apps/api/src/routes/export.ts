import type { FastifyInstance } from "fastify";
import { db } from "../services/database.js";

export async function exportRoutes(fastify: FastifyInstance) {
  // Export layer as GeoJSON
  fastify.get<{ Params: { layerId: string } }>(
    "/geojson/:layerId",
    async (request, reply) => {
      const layer = await db.getLayer(request.params.layerId);
      if (!layer) {
        return reply.status(404).send({
          success: false,
          error: "Layer not found",
        });
      }

      const features = await db.getFeatures(request.params.layerId);

      const geojson: GeoJSON.FeatureCollection = {
        type: "FeatureCollection",
        features: features.map((f) => ({
          type: "Feature",
          id: f.id,
          geometry: JSON.parse(f.geometry as string),
          properties: f.properties ? JSON.parse(f.properties as string) : {},
        })),
      };

      return {
        success: true,
        data: geojson,
      };
    }
  );

  // Export project as GeoJSON
  fastify.get<{ Params: { projectId: string } }>(
    "/geojson/project/:projectId",
    async (request, reply) => {
      const project = await db.getProject(request.params.projectId);
      if (!project) {
        return reply.status(404).send({
          success: false,
          error: "Project not found",
        });
      }

      const layers = await db.getLayers(request.params.projectId);

      const features: GeoJSON.Feature[] = [];
      for (const layer of layers) {
        const layerFeatures = await db.getFeatures(layer.id as string);
        for (const f of layerFeatures) {
          features.push({
            type: "Feature",
            id: f.id,
            geometry: JSON.parse(f.geometry as string),
            properties: {
              ...(f.properties ? JSON.parse(f.properties as string) : {}),
              _layerId: f.layer_id,
              _layerName: layer.name,
            },
          });
        }
      }

      const geojson: GeoJSON.FeatureCollection = {
        type: "FeatureCollection",
        features,
      };

      return {
        success: true,
        data: geojson,
      };
    }
  );
}