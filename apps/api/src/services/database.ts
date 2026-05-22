import { createClient } from "@libsql/client";
import { v4 as uuidv4 } from "uuid";

const DB_URL = process.env.DATABASE_URL || "file:local.db";
const AUTH_TOKEN = process.env.DATABASE_AUTH_TOKEN;

export const db = {
  client: null as ReturnType<typeof createClient> | null,

  async initialize() {
    this.client = createClient({
      url: DB_URL,
      authToken: AUTH_TOKEN,
    });

    // Create tables
    await this.createTables();
  },

  async createTables() {
    if (!this.client) throw new Error("Database not initialized");

    // Projects table
    await this.client.execute(`
      CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
        name TEXT NOT NULL,
        description TEXT,
        owner_id TEXT NOT NULL,
        bounds TEXT,
        default_center TEXT,
        default_zoom INTEGER DEFAULT 5,
        settings TEXT DEFAULT '{}',
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      )
    `);

    // Layers table
    await this.client.execute(`
      CREATE TABLE IF NOT EXISTS layers (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
        project_id TEXT NOT NULL,
        parent_id TEXT,
        name TEXT NOT NULL,
        type TEXT NOT NULL DEFAULT 'geojson',
        visibility INTEGER DEFAULT 1,
        opacity REAL DEFAULT 1.0,
        z_index INTEGER DEFAULT 0,
        style TEXT DEFAULT '{}',
        locked INTEGER DEFAULT 0,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
      )
    `);

    // Features table
    await this.client.execute(`
      CREATE TABLE IF NOT EXISTS features (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
        layer_id TEXT NOT NULL,
        geometry TEXT NOT NULL,
        properties TEXT DEFAULT '{}',
        centroid TEXT,
        bbox TEXT,
        created_by TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (layer_id) REFERENCES layers(id) ON DELETE CASCADE
      )
    `);

    // Choropleth configs table
    await this.client.execute(`
      CREATE TABLE IF NOT EXISTS choropleth_configs (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
        layer_id TEXT NOT NULL,
        property_key TEXT NOT NULL,
        color_scale TEXT DEFAULT 'sequential',
        color_scheme TEXT NOT NULL,
        breaks TEXT,
        classification_method TEXT DEFAULT 'equal',
        legend_config TEXT DEFAULT '{}',
        created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (layer_id) REFERENCES layers(id) ON DELETE CASCADE
      )
    `);

    // Indexes
    await this.client.execute(
      "CREATE INDEX IF NOT EXISTS idx_layers_project ON layers(project_id)"
    );
    await this.client.execute(
      "CREATE INDEX IF NOT EXISTS idx_features_layer ON features(layer_id)"
    );
    await this.client.execute(
      "CREATE INDEX IF NOT EXISTS idx_choropleth_layer ON choropleth_configs(layer_id)"
    );
  },

  async close() {
    if (this.client) {
      this.client.close();
      this.client = null;
    }
  },

  // Helper methods
  async getProjects(ownerId?: string) {
    if (!this.client) throw new Error("Database not initialized");

    if (ownerId) {
      const result = await this.client.execute({
        sql: "SELECT * FROM projects WHERE owner_id = ? ORDER BY updated_at DESC",
        args: [ownerId],
      });
      return result.rows;
    }

    const result = await this.client.execute(
      "SELECT * FROM projects ORDER BY updated_at DESC"
    );
    return result.rows;
  },

  async getProject(id: string) {
    if (!this.client) throw new Error("Database not initialized");
    const result = await this.client.execute({
      sql: "SELECT * FROM projects WHERE id = ?",
      args: [id],
    });
    return result.rows[0] || null;
  },

  async createProject(data: {
    name: string;
    description?: string;
    ownerId: string;
    bounds?: string;
    defaultCenter?: string;
    defaultZoom?: number;
  }) {
    if (!this.client) throw new Error("Database not initialized");
    const id = uuidv4();
    await this.client.execute({
      sql: `INSERT INTO projects (id, name, description, owner_id, bounds, default_center, default_zoom)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [
        id,
        data.name,
        data.description || null,
        data.ownerId,
        data.bounds || null,
        data.defaultCenter || null,
        data.defaultZoom || 5,
      ],
    });
    return this.getProject(id);
  },

  async updateProject(
    id: string,
    data: Partial<{
      name: string;
      description: string;
      bounds: string;
      defaultCenter: string;
      defaultZoom: number;
    }>
  ) {
    if (!this.client) throw new Error("Database not initialized");

    const fields: string[] = [];
    const values: unknown[] = [];

    if (data.name !== undefined) {
      fields.push("name = ?");
      values.push(data.name);
    }
    if (data.description !== undefined) {
      fields.push("description = ?");
      values.push(data.description);
    }
    if (data.bounds !== undefined) {
      fields.push("bounds = ?");
      values.push(data.bounds);
    }
    if (data.defaultCenter !== undefined) {
      fields.push("default_center = ?");
      values.push(data.defaultCenter);
    }
    if (data.defaultZoom !== undefined) {
      fields.push("default_zoom = ?");
      values.push(data.defaultZoom);
    }

    fields.push("updated_at = datetime('now')");
    values.push(id);

    await this.client.execute({
      sql: `UPDATE projects SET ${fields.join(", ")} WHERE id = ?`,
      args: values,
    });

    return this.getProject(id);
  },

  async deleteProject(id: string) {
    if (!this.client) throw new Error("Database not initialized");
    await this.client.execute({
      sql: "DELETE FROM projects WHERE id = ?",
      args: [id],
    });
    return { success: true };
  },

  // Layer methods
  async getLayers(projectId: string) {
    if (!this.client) throw new Error("Database not initialized");
    const result = await this.client.execute({
      sql: "SELECT * FROM layers WHERE project_id = ? ORDER BY z_index ASC",
      args: [projectId],
    });
    return result.rows;
  },

  async getLayer(id: string) {
    if (!this.client) throw new Error("Database not initialized");
    const result = await this.client.execute({
      sql: "SELECT * FROM layers WHERE id = ?",
      args: [id],
    });
    return result.rows[0] || null;
  },

  async createLayer(data: {
    projectId: string;
    parentId?: string;
    name: string;
    type: string;
    visibility?: number;
    opacity?: number;
    style?: string;
    locked?: number;
  }) {
    if (!this.client) throw new Error("Database not initialized");

    // Get max z_index
    const maxResult = await this.client.execute({
      sql: "SELECT COALESCE(MAX(z_index), -1) as max_z FROM layers WHERE project_id = ?",
      args: [data.projectId],
    });
    const maxZ = (maxResult.rows[0]?.max_z as number) ?? -1;

    const id = uuidv4();
    await this.client.execute({
      sql: `INSERT INTO layers (id, project_id, parent_id, name, type, visibility, opacity, z_index, style, locked)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        id,
        data.projectId,
        data.parentId || null,
        data.name,
        data.type,
        data.visibility ?? 1,
        data.opacity ?? 1.0,
        maxZ + 1,
        data.style || "{}",
        data.locked ?? 0,
      ],
    });
    return this.getLayer(id);
  },

  async updateLayer(
    id: string,
    data: Partial<{
      parentId: string;
      name: string;
      visibility: number;
      opacity: number;
      zIndex: number;
      style: string;
      locked: number;
    }>
  ) {
    if (!this.client) throw new Error("Database not initialized");

    const fields: string[] = [];
    const values: unknown[] = [];

    if (data.parentId !== undefined) {
      fields.push("parent_id = ?");
      values.push(data.parentId);
    }
    if (data.name !== undefined) {
      fields.push("name = ?");
      values.push(data.name);
    }
    if (data.visibility !== undefined) {
      fields.push("visibility = ?");
      values.push(data.visibility);
    }
    if (data.opacity !== undefined) {
      fields.push("opacity = ?");
      values.push(data.opacity);
    }
    if (data.zIndex !== undefined) {
      fields.push("z_index = ?");
      values.push(data.zIndex);
    }
    if (data.style !== undefined) {
      fields.push("style = ?");
      values.push(data.style);
    }
    if (data.locked !== undefined) {
      fields.push("locked = ?");
      values.push(data.locked);
    }

    fields.push("updated_at = datetime('now')");
    values.push(id);

    await this.client.execute({
      sql: `UPDATE layers SET ${fields.join(", ")} WHERE id = ?`,
      args: values,
    });

    return this.getLayer(id);
  },

  async deleteLayer(id: string) {
    if (!this.client) throw new Error("Database not initialized");
    await this.client.execute({
      sql: "DELETE FROM layers WHERE id = ?",
      args: [id],
    });
    return { success: true };
  },

  // Feature methods
  async getFeatures(layerId: string) {
    if (!this.client) throw new Error("Database not initialized");
    const result = await this.client.execute({
      sql: "SELECT * FROM features WHERE layer_id = ? ORDER BY created_at DESC",
      args: [layerId],
    });
    return result.rows;
  },

  async createFeature(data: {
    layerId: string;
    geometry: string;
    properties?: string;
    centroid?: string;
    bbox?: string;
    createdBy?: string;
  }) {
    if (!this.client) throw new Error("Database not initialized");
    const id = uuidv4();
    await this.client.execute({
      sql: `INSERT INTO features (id, layer_id, geometry, properties, centroid, bbox, created_by)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [
        id,
        data.layerId,
        data.geometry,
        data.properties || "{}",
        data.centroid || null,
        data.bbox || null,
        data.createdBy || null,
      ],
    });
    const result = await this.client.execute({
      sql: "SELECT * FROM features WHERE id = ?",
      args: [id],
    });
    return result.rows[0];
  },

  async deleteFeature(id: string) {
    if (!this.client) throw new Error("Database not initialized");
    await this.client.execute({
      sql: "DELETE FROM features WHERE id = ?",
      args: [id],
    });
    return { success: true };
  },
};
