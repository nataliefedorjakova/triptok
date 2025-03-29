import { NextResponse } from "next/server";
import axios from "axios";

export async function POST(req: Request) {
  const body = await req.json();
  const { origin, destinations } = body;

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

    const elements = response.data.rows[0].elements;
    const distances = elements.map((el: any) =>
      el.status === "OK" ? el.distance.value / 1000 : 0
    );

    return NextResponse.json({ distances });
  } catch (error) {
    console.error("Distance API error:", error);
    return NextResponse.json({ error: "Failed to fetch distances" }, { status: 500 });
  }
}