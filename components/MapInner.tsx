"use client";

import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { Candidate } from "@/lib/schema";

type Props = { candidates: Candidate[] };

const CONFIDENCE_COLOR = (c: number) =>
  c >= 0.65 ? "#22c55e" : c >= 0.4 ? "#eab308" : "#ef4444";

export default function MapInner({ candidates }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: {
        version: 8,
        sources: {
          osm: {
            type: "raster",
            tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
            tileSize: 256,
            attribution:
              '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          },
        },
        layers: [{ id: "osm", type: "raster", source: "osm" }],
      },
      center: [35.0, 31.5],
      zoom: 7,
    });

    mapRef.current = map;

    map.addControl(new maplibregl.NavigationControl(), "bottom-left");

    const markers: maplibregl.Marker[] = [];

    map.on("load", () => {
      const bounds = new maplibregl.LngLatBounds();

      candidates.forEach((c, i) => {
        const color = CONFIDENCE_COLOR(c.confidence);
        const rank = i + 1;

        const el = document.createElement("div");
        el.style.cssText = `
          width: 36px; height: 36px;
          border-radius: 50%;
          background: ${color};
          border: 3px solid white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.35);
          display: flex; align-items: center; justify-content: center;
          font-weight: 700; font-size: 14px; color: white;
          cursor: pointer;
          font-family: system-ui, sans-serif;
        `;
        el.textContent = String(rank);

        const popupHtml = `
          <div dir="rtl" style="font-family: system-ui, sans-serif; padding: 4px; max-width: 220px;">
            <div style="font-weight:700; font-size:14px; margin-bottom:4px;">
              ${c.specific_location ? `${c.specific_location} · ` : ""}${c.region}
            </div>
            <div style="font-size:12px; color:#666; margin-bottom:6px;">
              ביטחון: ${(c.confidence * 100).toFixed(0)}%
            </div>
            <div style="font-size:12px; line-height:1.5;">${c.reasoning}</div>
          </div>
        `;

        const popup = new maplibregl.Popup({ offset: 20, maxWidth: "260px" })
          .setHTML(popupHtml);

        const marker = new maplibregl.Marker({ element: el })
          .setLngLat([c.lng, c.lat])
          .setPopup(popup)
          .addTo(map);

        markers.push(marker);
        bounds.extend([c.lng, c.lat]);
      });

      if (candidates.length > 0) {
        map.fitBounds(bounds, {
          padding: { top: 60, bottom: 60, left: 60, right: 60 },
          maxZoom: 11,
          duration: 800,
        });
      }
    });

    return () => {
      markers.forEach((m) => m.remove());
      map.remove();
      mapRef.current = null;
    };
  }, [candidates]);

  return (
    <div
      ref={containerRef}
      className="w-full rounded-xl overflow-hidden"
      style={{ height: "380px" }}
    />
  );
}
