"use client";

import { useEffect, useState, useRef } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  where,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useLoadScript } from "@react-google-maps/api";
import GoogleMapWithPins, { MapHandle } from "@/components/Map";
import AuthForm from "@/components/Authform";
import PlaceSearch from "@/components/PlaceSearch";
import AddToItineraryPopup from "@/components/AddToItineraryPopup";
import EditItineraryPopup from "@/components/EditItineraryPopup";
import { getWalkingDistances } from "@/lib/google";
import Link from "next/link";

const libraries: any = ["places"];



type Place = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  tag: string;
  duration: number;
  city?: string;
};

export default function HomePage() {
  const mapRef = useRef<MapHandle>(null);
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
    libraries,
  });

  const [user, setUser] = useState<User | null>(null);
  const [tripCities, setTripCities] = useState<string[]>([]);
  const [distances, setDistances] = useState<string[]>([]);
  const [editingPlace, setEditingPlace] = useState<Place | null>(null);
  const [center, setCenter] = useState({ lat: 35.6895, lng: 139.6917 });
  const [markers, setMarkers] = useState<Place[]>([]);
  const [pendingPlace, setPendingPlace] = useState<null | {
    name: string;
    lat: number;
    lng: number;
  }>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setUser(user);

      if (user) {
        const tripSnapshot = await getDocs(
          query(collection(db, "userTrips"), where("userId", "==", user.uid))
        );
        const cities = tripSnapshot.docs.map((doc) => doc.data().city);
        const uniqueCities = Array.from(new Set(cities)).filter(Boolean);
        setTripCities(uniqueCities.length > 0 ? uniqueCities : ["Other"]);
      }
    });

    return () => unsub();
  }, []);

  useEffect(() => {
    if (!user) return;

    const fetchTripCities = async () => {
      const tripQuery = query(collection(db, "userTrips"), where("userId", "==", user.uid));
      const tripSnapshot = await getDocs(tripQuery);
      const cities = tripSnapshot.docs.map((doc) => doc.data().city);
      setTripCities(cities);
    };

    const fetchPins = async () => {
      const q = query(collection(db, "itinerary"), where("userId", "==", user.uid));
      const snapshot = await getDocs(q);
      const pins = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name,
          lat: data.lat,
          lng: data.lng,
          tag: data.tag,
          duration: data.duration ?? 60,
          city: data.city ?? "Unknown",
        };
      });

      

      setMarkers(pins);
      console.log("Loaded markers from Firestore:", pins);

      if (pins.length >= 2) {
        const origin = { lat: pins[0].lat, lng: pins[0].lng };
        const destinations = pins.slice(1).map(p => ({ lat: p.lat, lng: p.lng }));

        try {
          const response = await fetch("/api/walking", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ origin, destinations }),
          });

          const data = await response.json();
          console.log("Walking distances:", data.distances);
        } catch (error) {
          console.error("Failed to fetch walking distances:", error);
        }
      }
    };

    fetchPins();
    fetchTripCities();
  }, [user]);

  const handleAddToItinerary = async (tag: string, duration: number, city: string) => {
    if (!pendingPlace || !user) return;

    const newPlace = {
      name: pendingPlace.name,
      lat: pendingPlace.lat,
      lng: pendingPlace.lng,
      tag,
      duration,
      city,
      userId: user.uid,
      createdAt: serverTimestamp(),
    };

    try {
      const docRef = await addDoc(collection(db, "itinerary"), newPlace);
      const placeWithId: Place = {
        id: docRef.id,
        name: newPlace.name,
        lat: newPlace.lat,
        lng: newPlace.lng,
        tag: newPlace.tag,
        duration: newPlace.duration,
        city: newPlace.city,
      };
      setMarkers((prev) => [...prev, placeWithId]);
      setPendingPlace(null);
      setCenter({ lat: newPlace.lat, lng: newPlace.lng });
    } catch (err) {
      console.error("Error saving place:", err);
    }
  };

  const handleCancel = () => setPendingPlace(null);

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, "itinerary", id));
      setMarkers((prev) => prev.filter((m) => m.id !== id));
    } catch (err) {
      console.error("Error deleting place:", err);
    }
  };

  const handlePlaceSelect = (place: { name: string; lat: number; lng: number }) => {
    setPendingPlace(place);
  };

  if (!isLoaded) return <p className="p-4">Loading Google Maps...</p>;
  if (!user) return <AuthForm />;

  return (
    <main className="max-w-4xl mx-auto p-4 space-y-4">
      <PlaceSearch onSelect={handlePlaceSelect} />
      {pendingPlace && (
        <AddToItineraryPopup
          place={pendingPlace}
          cities={tripCities}
          onAdd={handleAddToItinerary}
          onCancel={handleCancel}
        />
      )}

      <GoogleMapWithPins ref={mapRef} center={center} markers={markers} />
      {editingPlace && (
        <EditItineraryPopup
          place={editingPlace}
          onCancel={() => setEditingPlace(null)}
          onDelete={async () => {
            await handleDelete(editingPlace.id);
            setEditingPlace(null);
          }}
          onUpdate={async (newDuration) => {
            const updated = { ...editingPlace, duration: newDuration };
            await updateDoc(doc(db, "itinerary", editingPlace.id), {
              duration: newDuration,
            });
            setMarkers((prev) =>
              prev.map((m) => (m.id === updated.id ? updated : m))
            );
            setEditingPlace(null);
          }}
        />
      )}

      {markers.length > 0 && (
        <div className="bg-base-200 p-4 rounded-lg shadow">
          <h3 className="text-lg font-bold mb-2">Itinerary</h3>
          <ul className="space-y-2">
            {markers.map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between bg-base-100 p-2 rounded shadow cursor-pointer hover:bg-base-300"
                onClick={() => mapRef.current?.flyTo(item.lat, item.lng)}
              >
                <div>
                  <strong>{item.name}</strong>
                  <span className="badge ml-2">{item.tag}</span>
                  <span className="text-sm ml-2 text-gray-500">
                    ({item.duration} min)
                  </span>
                  {item.city && (
                    <div className="text-sm text-gray-400">📍 {item.city}</div>
                  )}
                </div>
                <button
                  className="btn btn-xs btn-primary"
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingPlace(item);
                  }}
                >
                  Edit
                </button>
              </li>
            ))}
          </ul>
          <a
            href="/trips"
            className="fixed bottom-4 right-4 btn btn-primary shadow-lg"
          >
            🗓️ Trips
          </a>
        </div>
      )}
    </main>
  );
}

