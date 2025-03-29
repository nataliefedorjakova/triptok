"use client";

import { useState } from "react";

export default function EditItineraryPopup({
  place,
  onUpdate,
  onDelete,
  onCancel,
}: {
  place: { id: string; name: string; duration: number };
  onUpdate: (duration: number) => void;
  onDelete: () => void;
  onCancel: () => void;
}) {
  const [duration, setDuration] = useState(place.duration);

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
      <div className="bg-base-100 p-6 rounded-xl shadow-xl max-w-sm w-full space-y-4">
        <h2 className="text-lg font-bold">Edit "{place.name}"</h2>

        <div className="space-y-2">
          <label className="font-semibold">Duration (minutes):</label>
          <input
            type="number"
            className="input input-bordered w-full"
            value={duration}
            onChange={(e) => setDuration(parseInt(e.target.value))}
            min={1}
          />
        </div>

        <div className="flex justify-between mt-4">
          <button className="btn btn-error" onClick={onDelete}>
            Delete
          </button>
          <div className="flex gap-2">
            <button className="btn btn-ghost" onClick={onCancel}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={() => onUpdate(duration)}>
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
