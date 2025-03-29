"use client";

import { useRef, useEffect } from "react";
import mapboxgl from "mapbox-gl";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;

export default function MapboxDebug() {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!container.current) return;

    const map = new mapboxgl.Map({
      container: container.current,
      style: "mapbox://styles/mapbox/streets-v11",
      center: [139.6917, 35.6895],
      zoom: 10,
    });

    new mapboxgl.Marker()
      .setLngLat([139.6917, 35.6895])
      .setPopup(new mapboxgl.Popup().setText("Tokyo"))
      .addTo(map);

    return () => map.remove();
  }, []);

  return (
    <div
      ref={container}
      style={{
        width: "100vw",
        height: "100vh",
        position: "fixed",
        inset: 0,
        zIndex: 0,
      }}
    />
  );
}
