import { GoogleMap, Marker } from "@react-google-maps/api";
import { forwardRef, useImperativeHandle, useRef } from "react";

const tagEmojiMap: Record<string, string> = {
  Restaurant: "🍜",
  Cultural: "⛩️",
  Nature: "🌿",
  Shopping: "🛍️",
  Events: "🎎",
  Transit: "🚉",
  Accommodation: "🛏️",
};

type Place = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  tag: string;
  duration: number;
};

export type MapHandle = {
  flyTo: (lat: number, lng: number) => void;
};

const Map = forwardRef<MapHandle, {
  center: google.maps.LatLngLiteral;
  markers: Place[];
}>(({ center, markers }, ref) => {
  const mapRef = useRef<google.maps.Map | null>(null);

  useImperativeHandle(ref, () => ({
    flyTo(lat: number, lng: number) {
      mapRef.current?.panTo({ lat, lng });
      mapRef.current?.setZoom(15);
    },
  }));

  return (
    <div className="w-full h-[500px] rounded-xl overflow-hidden shadow">
      <GoogleMap
        center={center}
        zoom={13}
        onLoad={(map) => {
          mapRef.current = map;
        }}
        mapContainerStyle={{ width: "100%", height: "100%" }}
      >
      {markers
        .filter((place) =>
          typeof place.lat === "number" &&
          typeof place.lng === "number" &&
          !isNaN(place.lat) &&
          !isNaN(place.lng)
        )
        .map((place) => (
          <Marker
            key={place.id}
            position={{ lat: place.lat, lng: place.lng }}
            label={{
              text: tagEmojiMap[place.tag] || "📍",
              fontSize: "24px",
            }}
            title={`${place.name} (${place.tag})`}
          />
      ))}
      </GoogleMap>
    </div>
  );
});

Map.displayName = "Map";
export default Map;
