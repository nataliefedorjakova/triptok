import type { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  const { origin, destinations } = req.body;

  const origins = `${origin.lat},${origin.lng}`;
  const dests = destinations.map((d: any) => `${d.lat},${d.lng}`).join("|");

  try {
    const response = await axios.get("https://maps.googleapis.com/maps/api/distancematrix/json", {
      params: {
        origins,
        destinations: dests,
        mode: "walking",
        key: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
      },
    });

    if (response.data.status !== "OK") {
      console.error("Distance Matrix API error:", response.data);
      return res.status(500).json({ error: "Failed to fetch distances." });
    }

    const distances = response.data.rows[0].elements.map((el: any) =>
      el.status === "OK" ? el.distance.value / 1000 : null
    );

    return res.status(200).json({ distances });
  } catch (err: any) {
    console.error("API error:", err);
    return res.status(500).json({ error: "Server error." });
  }
}
