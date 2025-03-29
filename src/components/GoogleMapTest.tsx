"use client";

import { GoogleMap, Marker, useLoadScript } from "@react-google-maps/api";

const libraries: any = ["places"];

export default function GoogleMapTest() {
    const { isLoaded } = useLoadScript({
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
        libraries,
    });

    const center = { lat: 35.6895, lng: 139.6917 };

    if (!isLoaded) return <p className="p-4">Loading map...</p>;

    return (
        <div
            className="w-full h-[500px]"
            style={{ height: "500px" }} // backup in case Tailwind fails
        >
            <GoogleMap
                center={center}
                zoom={12}
                mapContainerStyle={{ width: "100%", height: "100%" }}
            >
                <Marker position={center} />
            </GoogleMap>
        </div>
    );
}
