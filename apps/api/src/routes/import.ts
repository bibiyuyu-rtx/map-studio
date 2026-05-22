import type { FastifyInstance } from "fastify";
import { db } from "../services/database.js";
import * as turf from "@turf/helpers";
import centroid from "@turf/centroid";
import bbox from "@turf/bbox";

export async function importRoutes(fastify: FastifyInstance) {
  // Import GeoJSON
  fastify.post<{
    Body: {
      projectId: string;
      layerName: string;
      geojson: GeoJSON.FeatureCollection;
    };
  }>("/geojson", async (request, reply) => {
    const { projectId, layerName, geojson } = request.body;

    if (!projectId || !geojson) {
      return reply.status(400).send({
        success: false,
        error: "projectId and geojson are required",
      });
    }

    // Validate GeoJSON
    if (geojson.type !== "FeatureCollection" || !Array.isArray(geojson.features)) {
      return reply.status(400).send({
        success: false,
        error: "Invalid GeoJSON: must be a FeatureCollection with features array",
      });
    }

    // Check project exists
    const project = await db.getProject(projectId);
    if (!project) {
      return reply.status(404).send({
        success: false,
        error: "Project not found",
      });
    }

    // Create layer
    const layer = await db.createLayer({
      projectId,
      name: layerName || "Imported Layer",
      type: "geojson",
    });

    // Count geometry types
    const geometryTypes: Record<string, number> = {};
    let featuresCreated = 0;
    const warnings: string[] = [];
    let bounds: [[number, number], [number, number]] = [[180, 90], [-180, -90]];

    // Import features
    for (const feature of geojson.features) {
      if (!feature.geometry) {
        warnings.push("Feature without geometry skipped");
        continue;
      }

      try {
        let featureCentroid: [number, number] | undefined;
        let featureBbox: [number, number, number, number] | undefined;

        try {
          const pt = centroid(turf.feature(feature.geometry));
          featureCentroid = pt.geometry.coordinates as [number, number];
          featureBbox = bbox(turf.feature(feature.geometry)) as [
            number,
            number,
            number,
            number,
          ];
        } catch {
          // Skip centroid/bbox for invalid geometry
        }

        await db.createFeature({
          layerId: layer!.id as string,
          geometry: JSON.stringify(feature.geometry),
          properties: JSON.stringify(feature.properties || {}),
          centroid: featureCentroid ? JSON.stringify(featureCentroid) : undefined,
          bbox: featureBbox ? JSON.stringify(featureBbox) : undefined,
        });

        // Track geometry type
        const type = feature.geometry.type;
        geometryTypes[type] = (geometryTypes[type] || 0) + 1;
        featuresCreated++;

        // Update bounds
        if (featureBbox) {
          bounds = [
            [
              Math.min(bounds[0][0], featureBbox[0]),
              Math.min(bounds[0][1], featureBbox[1]),
            ],
            [
              Math.max(bounds[1][0], featureBbox[2]),
              Math.max(bounds[1][1], featureBbox[3]),
            ],
          ];
        }
      } catch (err) {
        warnings.push(`Failed to import feature: ${(err as Error).message}`);
      }
    }

    return {
      success: true,
      data: {
        layerId: layer!.id,
        featuresCreated,
        warnings,
        bounds,
        geometryTypes,
      },
    };
  });
}