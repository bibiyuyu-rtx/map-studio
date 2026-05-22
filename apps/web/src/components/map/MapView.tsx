"use client";

import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useMapStore } from "@/stores/mapStore";

export function MapView() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const { center, zoom, setMap } = useMapStore();

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    // Initialize MapLibre with dark basemap
    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          "osm-tiles": {
            type: "raster",
            tiles: [
              "https://a.tile.openstreetmap.org/{z}/{x}/{y}.png",
              "https://b.tile.openstreetmap.org/{z}/{x}/{y}.png",
              "https://c.tile.openstreetmap.org/{z}/{x}/{y}.png",
            ],
            tileSize: 256,
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          },
        },
        layers: [
          {
            id: "osm-tiles-layer",
            type: "raster",
            source: "osm-tiles",
            minzoom: 0,
            maxzoom: 19,
            paint: {
              "raster-saturation": -0.5, // Darken the basemap
              "raster-brightness-max": 0.6,
            },
          },
        ],
      },
      center: center,
      zoom: zoom,
      attributionControl: false,
    });

    // Add attribution control in bottom-right
    map.current.addControl(
      new maplibregl.AttributionControl({ compact: true }),
      "bottom-right"
    );

    // Add navigation controls
    map.current.addControl(new maplibregl.NavigationControl(), "top-right");

    map.current.on("load", () => {
      setIsLoaded(true);
      if (map.current) {
        setMap(map.current);
      }
    });

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // Update center and zoom from store
  useEffect(() => {
    if (map.current && isLoaded) {
      map.current.flyTo({ center, zoom, duration: 500 });
    }
  }, [center, zoom, isLoaded]);

  return (
    <div className="absolute inset-0">
      <div ref={mapContainer} className="h-full w-full" />
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-[var(--background)]">
          <div className="flex flex-col items-center gap-4">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--primary)] border-t-transparent" />
            <span className="text-[var(--text-muted)]">Loading map...</span>
          </div>
        </div>
      )}
    </div>
  );
}