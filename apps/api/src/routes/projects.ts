import type { FastifyInstance } from "fastify";
import { db } from "../services/database.js";

export async function projectsRoutes(fastify: FastifyInstance) {
  // List projects
  fastify.get("/", async (request, reply) => {
    const ownerId = (request.query as { ownerId?: string }).ownerId;
    const projects = await db.getProjects(ownerId);
    return {
      success: true,
      data: projects.map(formatProject),
    };
  });

  // Get single project
  fastify.get<{ Params: { id: string } }>("/:id", async (request, reply) => {
    const project = await db.getProject(request.params.id);
    if (!project) {
      return reply.status(404).send({
        success: false,
        error: "Project not found",
      });
    }
    return {
      success: true,
      data: formatProject(project),
    };
  });

  // Create project
  fastify.post<{
    Body: {
      name: string;
      description?: string;
      ownerId?: string;
      bounds?: string;
      defaultCenter?: [number, number];
      defaultZoom?: number;
    };
  }>("/", async (request, reply) => {
    const { name, description, bounds, defaultCenter, defaultZoom } = request.body;

    if (!name) {
      return reply.status(400).send({
        success: false,
        error: "Name is required",
      });
    }

    const project = await db.createProject({
      name,
      description,
      ownerId: request.body.ownerId || "anonymous",
      bounds,
      defaultCenter: defaultCenter ? JSON.stringify(defaultCenter) : undefined,
      defaultZoom,
    });

    return reply.status(201).send({
      success: true,
      data: formatProject(project),
    });
  });

  // Update project
  fastify.patch<{
    Params: { id: string };
    Body: Partial<{
      name: string;
      description: string;
      bounds: string;
      defaultCenter: [number, number];
      defaultZoom: number;
    }>;
  }>("/:id", async (request, reply) => {
    const existing = await db.getProject(request.params.id);
    if (!existing) {
      return reply.status(404).send({
        success: false,
        error: "Project not found",
      });
    }

    const project = await db.updateProject(request.params.id, {
      name: request.body.name,
      description: request.body.description,
      bounds: request.body.bounds,
      defaultCenter: request.body.defaultCenter
        ? JSON.stringify(request.body.defaultCenter)
        : undefined,
      defaultZoom: request.body.defaultZoom,
    });

    return {
      success: true,
      data: formatProject(project),
    };
  });

  // Delete project
  fastify.delete<{ Params: { id: string } }>("/:id", async (request, reply) => {
    const existing = await db.getProject(request.params.id);
    if (!existing) {
      return reply.status(404).send({
        success: false,
        error: "Project not found",
      });
    }

    await db.deleteProject(request.params.id);
    return {
      success: true,
      message: "Project deleted",
    };
  });

  // Get project layers
  fastify.get<{ Params: { id: string } }>("/:id/layers", async (request, reply) => {
    const project = await db.getProject(request.params.id);
    if (!project) {
      return reply.status(404).send({
        success: false,
        error: "Project not found",
      });
    }

    const layers = await db.getLayers(request.params.id);
    return {
      success: true,
      data: layers.map(formatLayer),
    };
  });
}

function formatProject(row: Record<string, unknown>) {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    ownerId: row.owner_id,
    bounds: row.bounds ? JSON.parse(row.bounds as string) : null,
    defaultCenter: row.default_center ? JSON.parse(row.default_center as string) : null,
    defaultZoom: row.default_zoom,
    settings: row.settings ? JSON.parse(row.settings as string) : {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
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