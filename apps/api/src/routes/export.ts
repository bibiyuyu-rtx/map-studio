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

      // Use PostGIS to export directly as GeoJSON
      const geojson = await db.exportLayerGeoJSON(request.params.layerId);

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

      // Use PostGIS to export directly as GeoJSON
      const geojson = await db.exportProjectGeoJSON(request.params.projectId);

      return {
        success: true,
        data: geojson,
      };
    }
  );
}