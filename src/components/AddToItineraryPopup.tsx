"use client";

import { useState } from "react";

export default function AddToItineraryPopup({
  place,
  cities,
  onAdd,
  onCancel,
}: {
  place: { name: string; lat: number; lng: number };
  cities: string[];
  onAdd: (tag: string, duration: number, city: string) => void;
  onCancel: () => void;
}) {
  const [tag, setTag] = useState("🍜 Restaurant");
  const [duration, setDuration] = useState(60);
  const [city, setCity] = useState(cities[0] || "");

  const tags = [
    "🍜 Restaurant",
    "⛩️ Cultural",
    "🗻 Nature",
    "🏪 Shopping",
    "🎟️ Events",
    "🚃 Transit",
    "🛏️ Accommodation",
  ];

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
      <div className="bg-base-100 p-6 rounded-xl shadow-xl max-w-sm w-full space-y-4">
        <h2 className="text-lg font-bold">
          Add "{place.name}" to itinerary?
        </h2>

        <div className="space-y-2">
          <label className="font-semibold">Choose tag:</label>
          <select
            className="select select-bordered w-full"
            value={tag}
            onChange={(e) => setTag(e.target.value)}
          >
            {tags.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="font-semibold">Duration (in minutes):</label>
          <input
            type="number"
            min={1}
            className="input input-bordered w-full"
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
          />
        </div>

        <div className="space-y-2">
          <label className="font-semibold">Select city:</label>
          <select
            className="select select-bordered w-full"
            value={city}
            onChange={(e) => setCity(e.target.value)}
          >
            {cities.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div className="flex justify-end gap-2">
          <button className="btn btn-ghost" onClick={onCancel}>
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={() => {
              console.log("Adding place with tag:", tag, "duration:", duration, "city:", city);
              onAdd(tag, duration, city);
            }}
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
}
