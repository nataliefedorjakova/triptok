import axios from "axios";

export async function getWalkingDistances(
    origin: { lat: number; lng: number },
    destinations: { lat: number; lng: number }[]
  ): Promise<number[]> {
    const res = await fetch("/api/distance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ origin, destinations }),
    });
  
    const data = await res.json();
  
    if (!res.ok) {
      console.error("Failed to fetch distances:", data.error);
      return [];
    }
  
    return data.distances;
  }
