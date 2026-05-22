import { Pool } from "pg";
import { v4 as uuidv4 } from "uuid";

const DB_HOST = process.env.DB_HOST || "localhost";
const DB_PORT = process.env.DB_PORT || "5432";
const DB_NAME = process.env.DB_NAME || "mapstudio";
const DB_USER = process.env.DB_USER || "postgres";
const DB_PASSWORD = process.env.DB_PASSWORD || "postgres";

const pool = new Pool({
  host: DB_HOST,
  port: parseInt(DB_PORT),
  database: DB_NAME,
  user: DB_USER,
  password: DB_PASSWORD,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

export const db = {
  pool,

  async initialize() {
    const client = await pool.connect();
    try {
      // Create PostGIS extension
      await client.query(`CREATE EXTENSION IF NOT EXISTS postgis;`);

      // Create tables
      await client.query(`
        CREATE TABLE IF NOT EXISTS projects (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name VARCHAR(255) NOT NULL,
          description TEXT,
          owner_id VARCHAR(255) NOT NULL,
          bounds GEOMETRY(POLYGON, 4326),
          default_center GEOMETRY(POINT, 4326),
          default_zoom INTEGER DEFAULT 5,
          settings JSONB DEFAULT '{}',
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS layers (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
          parent_id UUID,
          name VARCHAR(255) NOT NULL,
          type VARCHAR(50) NOT NULL DEFAULT 'geojson',
          visibility BOOLEAN DEFAULT true,
          opacity REAL DEFAULT 1.0,
          z_index INTEGER DEFAULT 0,
          style JSONB DEFAULT '{}',
          locked BOOLEAN DEFAULT false,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS features (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          layer_id UUID NOT NULL REFERENCES layers(id) ON DELETE CASCADE,
          geometry GEOMETRY(GEOMETRY, 4326) NOT NULL,
          properties JSONB DEFAULT '{}',
          centroid GEOMETRY(POINT, 4326),
          bbox BOX2D,
          created_by VARCHAR(255),
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS choropleth_configs (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          layer_id UUID NOT NULL REFERENCES layers(id) ON DELETE CASCADE,
          property_key VARCHAR(255) NOT NULL,
          color_scale VARCHAR(50) DEFAULT 'sequential',
          color_scheme JSONB NOT NULL,
          breaks JSONB,
          classification_method VARCHAR(50) DEFAULT 'equal',
          legend_config JSONB DEFAULT '{}',
          created_at TIMESTAMPTZ DEFAULT NOW()
        );
      `);

      // Create indexes
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_layers_project ON layers(project_id);
      `);
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_features_layer ON features(layer_id);
      `);
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_features_geometry ON features USING GIST (geometry);
      `);
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_choropleth_layer ON choropleth_configs(layer_id);
      `);

      console.log("Database initialized successfully");
    } finally {
      client.release();
    }
  },

  async close() {
    await pool.end();
  },

  // Helper to convert geometry to GeoJSON string
  geometryToJson(geometry: unknown): string {
    if (!geometry) return null;
    return geometry as string;
  },

  // Get all projects
  async getProjects(ownerId?: string) {
    const result = ownerId
      ? await pool.query(
          "SELECT * FROM projects WHERE owner_id = $1 ORDER BY updated_at DESC",
          [ownerId]
        )
      : await pool.query("SELECT * FROM projects ORDER BY updated_at DESC");
    return result.rows;
  },

  // Get single project
  async getProject(id: string) {
    const result = await pool.query("SELECT * FROM projects WHERE id = $1", [id]);
    return result.rows[0] || null;
  },

  // Create project
  async createProject(data: {
    name: string;
    description?: string;
    ownerId: string;
    bounds?: string;
    defaultCenter?: string;
    defaultZoom?: number;
  }) {
    const id = uuidv4();
    const result = await pool.query(
      `INSERT INTO projects (id, name, description, owner_id, bounds, default_center, default_zoom)
       VALUES ($1, $2, $3, $4,
         CASE WHEN $5::text IS NOT NULL THEN ST_GeomFromGeoJSON($5) ELSE NULL END,
         CASE WHEN $6::text IS NOT NULL THEN ST_GeomFromText($6, 4326) ELSE NULL END,
         $7)
       RETURNING *`,
      [
        id,
        data.name,
        data.description || null,
        data.ownerId,
        data.bounds || null,
        data.defaultCenter
          ? `POINT(${data.defaultCenter.split(",")[0]} ${data.defaultCenter.split(",")[1]})`
          : null,
        data.defaultZoom || 5,
      ]
    );
    return result.rows[0];
  },

  // Update project
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
    const fields: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (data.name !== undefined) {
      fields.push(`name = $${idx++}`);
      values.push(data.name);
    }
    if (data.description !== undefined) {
      fields.push(`description = $${idx++}`);
      values.push(data.description);
    }
    if (data.bounds !== undefined) {
      fields.push(`bounds = CASE WHEN $${idx++}::text IS NOT NULL THEN ST_GeomFromGeoJSON($${idx - 1}) ELSE NULL END`);
      values.push(data.bounds);
    }
    if (data.defaultCenter !== undefined) {
      const [lng, lat] = data.defaultCenter.split(",");
      fields.push(`default_center = CASE WHEN $${idx++}::text IS NOT NULL THEN ST_SetSRID(ST_MakePoint($${idx - 1}), 4326) ELSE NULL END`);
      values.push(`${lng},${lat}`);
    }
    if (data.defaultZoom !== undefined) {
      fields.push(`default_zoom = $${idx++}`);
      values.push(data.defaultZoom);
    }

    fields.push("updated_at = NOW()");
    values.push(id);

    const result = await pool.query(
      `UPDATE projects SET ${fields.join(", ")} WHERE id = $${idx} RETURNING *`,
      values
    );
    return result.rows[0];
  },

  // Delete project
  async deleteProject(id: string) {
    await pool.query("DELETE FROM projects WHERE id = $1", [id]);
    return { success: true };
  },

  // Get layers for project
  async getLayers(projectId: string) {
    const result = await pool.query(
      "SELECT * FROM layers WHERE project_id = $1 ORDER BY z_index ASC",
      [projectId]
    );
    return result.rows;
  },

  // Get single layer
  async getLayer(id: string) {
    const result = await pool.query("SELECT * FROM layers WHERE id = $1", [id]);
    return result.rows[0] || null;
  },

  // Create layer
  async createLayer(data: {
    projectId: string;
    parentId?: string;
    name: string;
    type: string;
    visibility?: boolean;
    opacity?: number;
    style?: string;
    locked?: boolean;
  }) {
    const maxResult = await pool.query(
      "SELECT COALESCE(MAX(z_index), -1) as max_z FROM layers WHERE project_id = $1",
      [data.projectId]
    );
    const maxZ = (maxResult.rows[0]?.max_z ?? -1) + 1;

    const id = uuidv4();
    const result = await pool.query(
      `INSERT INTO layers (id, project_id, parent_id, name, type, visibility, opacity, z_index, style, locked)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        id,
        data.projectId,
        data.parentId || null,
        data.name,
        data.type,
        data.visibility ?? true,
        data.opacity ?? 1.0,
        maxZ,
        data.style || "{}",
        data.locked ?? false,
      ]
    );
    return result.rows[0];
  },

  // Update layer
  async updateLayer(
    id: string,
    data: Partial<{
      parentId: string;
      name: string;
      visibility: boolean;
      opacity: number;
      zIndex: number;
      style: string;
      locked: boolean;
    }>
  ) {
    const fields: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (data.parentId !== undefined) {
      fields.push(`parent_id = $${idx++}`);
      values.push(data.parentId);
    }
    if (data.name !== undefined) {
      fields.push(`name = $${idx++}`);
      values.push(data.name);
    }
    if (data.visibility !== undefined) {
      fields.push(`visibility = $${idx++}`);
      values.push(data.visibility);
    }
    if (data.opacity !== undefined) {
      fields.push(`opacity = $${idx++}`);
      values.push(data.opacity);
    }
    if (data.zIndex !== undefined) {
      fields.push(`z_index = $${idx++}`);
      values.push(data.zIndex);
    }
    if (data.style !== undefined) {
      fields.push(`style = $${idx++}`);
      values.push(data.style);
    }
    if (data.locked !== undefined) {
      fields.push(`locked = $${idx++}`);
      values.push(data.locked);
    }

    fields.push("updated_at = NOW()");
    values.push(id);

    const result = await pool.query(
      `UPDATE layers SET ${fields.join(", ")} WHERE id = $${idx} RETURNING *`,
      values
    );
    return result.rows[0];
  },

  // Delete layer
  async deleteLayer(id: string) {
    await pool.query("DELETE FROM layers WHERE id = $1", [id]);
    return { success: true };
  },

  // Get features for layer
  async getFeatures(layerId: string) {
    const result = await pool.query(
      `SELECT id, layer_id, ST_AsGeoJSON(geometry) as geometry, properties,
              ST_AsGeoJSON(centroid) as centroid, bbox, created_by, created_at, updated_at
       FROM features WHERE layer_id = $1 ORDER BY created_at DESC`,
      [layerId]
    );
    return result.rows;
  },

  // Create feature
  async createFeature(data: {
    layerId: string;
    geometry: string;
    properties?: string;
    centroid?: string;
    bbox?: string;
    createdBy?: string;
  }) {
    const id = uuidv4();
    const result = await pool.query(
      `INSERT INTO features (id, layer_id, geometry, properties, centroid, bbox, created_by)
       VALUES ($1, $2, ST_GeomFromGeoJSON($3), $4,
         CASE WHEN $5::text IS NOT NULL THEN ST_GeomFromGeoJSON($5) ELSE NULL END,
         CASE WHEN $6::text IS NOT NULL THEN $6::box2d ELSE NULL END,
         $7)
       RETURNING *`,
      [
        id,
        data.layerId,
        data.geometry,
        data.properties || "{}",
        data.centroid || null,
        data.bbox || null,
        data.createdBy || null,
      ]
    );

    // Fetch the created feature with proper GeoJSON
    const fetchResult = await pool.query(
      `SELECT id, layer_id, ST_AsGeoJSON(geometry) as geometry, properties,
              ST_AsGeoJSON(centroid) as centroid, created_by, created_at
       FROM features WHERE id = $1`,
      [id]
    );
    return fetchResult.rows[0];
  },

  // Delete feature
  async deleteFeature(id: string) {
    await pool.query("DELETE FROM features WHERE id = $1", [id]);
    return { success: true };
  },

  // Export layer as GeoJSON
  async exportLayerGeoJSON(layerId: string) {
    const result = await pool.query(
      `SELECT json_build_object(
        'type', 'FeatureCollection',
        'features', COALESCE(
          (SELECT json_agg(
            json_build_object(
              'type', 'Feature',
              'id', f.id,
              'geometry', ST_AsGeoJSON(f.geometry)::json,
              'properties', f.properties
            )
          ))
          FROM features f WHERE f.layer_id = $1
        ), '[]'::json)
      ) as geojson`,
      [layerId]
    );
    return result.rows[0]?.geojson;
  },

  // Export project as GeoJSON
  async exportProjectGeoJSON(projectId: string) {
    const result = await pool.query(
      `SELECT json_build_object(
        'type', 'FeatureCollection',
        'features', COALESCE(
          (SELECT json_agg(
            json_build_object(
              'type', 'Feature',
              'id', f.id,
              'geometry', ST_AsGeoJSON(f.geometry)::json,
              'properties', f.properties
            )
          ))
          FROM features f
          JOIN layers l ON f.layer_id = l.id
          WHERE l.project_id = $1
        ), '[]'::json)
      ) as geojson`,
      [projectId]
    );
    return result.rows[0]?.geojson;
  },
};