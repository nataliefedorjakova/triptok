export async function getWalkingDistances(
  origin: { lat: number; lng: number },
  destinations: { lat: number; lng: number }[]
): Promise<number[]> {
  const res = await fetch("/api/walking", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ origin, destinations }),
  });

  const data = await res.json();

  if (!res.ok || !data?.distances) {
    console.error("Failed to fetch walking distances:", data?.error || data);
    return [];
  }

  return data.distances;
}