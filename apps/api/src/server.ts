import Fastify from "fastify";
import cors from "@fastify/cors";
import jwt from "@fastify/jwt";
import multipart from "@fastify/multipart";
import rateLimit from "@fastify/rate-limit";

import { projectsRoutes } from "./routes/projects.js";
import { layersRoutes } from "./routes/layers.js";
import { featuresRoutes } from "./routes/features.js";
import { importRoutes } from "./routes/import.js";
import { exportRoutes } from "./routes/export.js";
import { db } from "./services/database.js";

const fastify = Fastify({
  logger: true,
});

// Plugins
await fastify.register(cors, {
  origin: true,
  credentials: true,
});

await fastify.register(jwt, {
  secret: process.env.JWT_SECRET || "your-super-secret-key-change-in-production",
});

await fastify.register(multipart, {
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max file size
  },
});

await fastify.register(rateLimit, {
  max: 100,
  timeWindow: "1 minute",
});

// Health check
fastify.get("/health", async () => {
  return { status: "ok", timestamp: new Date().toISOString() };
});

// Routes
await fastify.register(projectsRoutes, { prefix: "/api/projects" });
await fastify.register(layersRoutes, { prefix: "/api/layers" });
await fastify.register(featuresRoutes, { prefix: "/api/features" });
await fastify.register(importRoutes, { prefix: "/api/import" });
await fastify.register(exportRoutes, { prefix: "/api/export" });

// Error handler
fastify.setErrorHandler((error, request, reply) => {
  fastify.log.error(error);

  if (error.validation) {
    return reply.status(400).send({
      success: false,
      error: "Validation error",
      details: error.validation,
    });
  }

  return reply.status(error.statusCode || 500).send({
    success: false,
    error: error.message || "Internal server error",
  });
});

// Graceful shutdown
const gracefulShutdown = async () => {
  fastify.log.info("Shutting down...");
  await db.close();
  await fastify.close();
  process.exit(0);
};

process.on("SIGINT", gracefulShutdown);
process.on("SIGTERM", gracefulShutdown);

// Start server
const start = async () => {
  try {
    // Initialize database
    await db.initialize();
    fastify.log.info("Database initialized");

    const port = Number(process.env.PORT) || 3001;
    await fastify.listen({ port, host: "0.0.0.0" });
    fastify.log.info(`Server running at http://localhost:${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();

export { fastify };
