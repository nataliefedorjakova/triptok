"use client";

import usePlacesAutocomplete, { getGeocode, getLatLng } from "use-places-autocomplete";

export default function PlaceSearch({
  onSelect,
}: {
  onSelect: (place: { name: string; lat: number; lng: number }) => void;
}) {
  const {
    ready,
    value,
    setValue,
    suggestions: { status, data },
    clearSuggestions,
  } = usePlacesAutocomplete();

  const handleSelect = async (description: string) => {
    setValue(description, false);
    clearSuggestions();
    const results = await getGeocode({ address: description });
    const { lat, lng } = await getLatLng(results[0]);
    onSelect({ name: description, lat, lng });
  };

  return (
    <div className="form-control w-full">
      <input
        className="input input-bordered w-full"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        disabled={!ready}
        placeholder="Search for a place"
      />
      {status === "OK" && (
        <ul className="menu bg-base-100 mt-2 rounded-box shadow w-full">
          {data.map(({ place_id, description }) => (
            <li key={place_id}>
              <button type="button" onClick={() => handleSelect(description)}>
                {description}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
