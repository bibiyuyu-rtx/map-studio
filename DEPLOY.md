# Map Studio - Dokploy Deployment Guide

## Prerequisites

- Dokploy account at https://dokploy.satudata.xyz
- GitHub repository: https://github.com/bibiyuyu-rtx/map-studio

## Step 1: Create Dokploy Database

1. Login to **https://dokploy.satudata.xyz**
2. Go to **Databases** → **Create Database**
3. Configure:
   - **Name**: `mapstudio`
   - **Type**: `PostgreSQL`
   - **Version**: `16` (or latest)
   - **Enable PostGIS**: ✅ Check this option

4. Click **Create** and wait for the database to be ready
5. Copy the connection details:
   ```
   Host: db-xxxxx.dokploy.dev
   Port: 5432
   Database: mapstudio
   Username: postgres
   Password: xxxxxxxx
   ```

## Step 2: Deploy Backend API

1. Go to **Projects** → **Create Project**
2. Configure:
   - **Name**: `map-studio-api`
   - **Type**: `Application`

3. Connect GitHub:
   - Repository: `bibiyuyu-rtx/map-studio`
   - Branch: `main`

4. Build Configuration:
   - **Dockerfile Path**: `apps/api/Dockerfile`
   - **Container Name**: `api`
   - **Port**: `3001`
   - **Health Check**: `/health`

5. Environment Variables:
   ```
   DB_HOST=your-db-host.dokploy.dev
   DB_PORT=5432
   DB_NAME=mapstudio
   DB_USER=postgres
   DB_PASSWORD=your-db-password
   JWT_SECRET=your-super-secret-jwt-key
   PORT=3001
   NODE_ENV=production
   ```

6. Domain Configuration:
   - **Domain**: `kahyapu-api.satudata.xyz`
   - **HTTPS**: Enable

7. Click **Deploy**

## Step 3: Deploy Frontend Web

1. Go to **Projects** → **Create Project**
2. Configure:
   - **Name**: `map-studio-web`
   - **Type**: `Application`

3. Connect GitHub:
   - Repository: `bibiyuyu-rtx/map-studio`
   - Branch: `main`

4. Build Configuration:
   - **Dockerfile Path**: `apps/web/Dockerfile`
   - **Container Name**: `web`
   - **Port**: `3000`

5. Environment Variables:
   ```
   NEXT_PUBLIC_API_URL=https://kahyapu-api.satudata.xyz
   NODE_ENV=production
   ```

6. Domain Configuration:
   - **Domain**: `kahyapu.satudata.xyz`
   - **HTTPS**: Enable

7. Click **Deploy**

## Step 4: Verify Deployment

1. Open **https://kahyapu.satudata.xyz**
2. Check if the map loads
3. Test import GeoJSON
4. Test export GeoJSON

## Step 5: QGIS Desktop Integration

### Connect QGIS to Database

1. Open QGIS Desktop
2. Go to **Browser** → **PostgreSQL** → **New Connection**

3. Configure:
   - **Name**: `Map Studio (Dokploy)`
   - **Host**: `your-db-host.dokploy.dev`
   - **Port**: `5432`
   - **Database**: `mapstudio`
   - **Username**: `postgres`
   - **Password**: `your-db-password`

4. Check **List databases with PostGIS geometries**

5. Click **Test Connection** → **OK**

### Work with Spatial Data in QGIS

Once connected, you can:

1. **View layers**: All layers appear in the browser
2. **Edit features**: Use QGIS editing tools
3. **Add new features**: Draw geometries directly
4. **Edit properties**: Modify attribute tables
5. **Save changes**: Auto-saves to PostgreSQL
6. **View in web app**: Refresh browser to see changes

### Sync with Web App

Changes made in QGIS are immediately available in the web app since they share the same database.

## Troubleshooting

### Database Connection Issues

Check logs:
```bash
docker logs api
```

Verify environment variables are set correctly in Dokploy.

### Frontend Not Loading

1. Check if API is accessible: `https://kahyapu-api.satudata.xyz/health`
2. Verify `NEXT_PUBLIC_API_URL` points to correct API URL
3. Check browser console for CORS errors

### QGIS Connection Failed

1. Verify database credentials in Dokploy dashboard
2. Check if PostGIS extension is enabled
3. Verify firewall allows connection

## Environment Variables Reference

### Backend (API)
| Variable | Description |
|----------|-------------|
| `DB_HOST` | PostgreSQL host address |
| `DB_PORT` | PostgreSQL port (default: 5432) |
| `DB_NAME` | Database name |
| `DB_USER` | Database username |
| `DB_PASSWORD` | Database password |
| `JWT_SECRET` | Secret for JWT tokens |
| `PORT` | Server port (3001) |

### Frontend (Web)
| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Backend API URL |
| `NODE_ENV` | Environment (production) |