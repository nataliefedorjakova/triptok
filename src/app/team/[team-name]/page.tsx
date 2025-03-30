"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
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

export default function TeamMapPage() {
    const params = useParams();
    const teamName = params["team-name"] as string;
    console.log("Resolved team name:", teamName);
    const mapRef = useRef<MapHandle>(null);
    const { isLoaded } = useLoadScript({
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
        libraries,
    });

    const [user, setUser] = useState<User | null>(null);
    const [tripCities, setTripCities] = useState<string[]>([]);
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
            if (!user || !teamName) return;

            const tripSnapshot = await getDocs(
                query(collection(db, "userTrips"), where("team", "==", teamName))
            );
            const cities = tripSnapshot.docs
                .map((doc) => doc.data().city)
                .filter((city) => typeof city === "string" && city.trim().length > 0);
            console.log("Fetched trip cities:", cities);
            const uniqueCities = Array.from(new Set(cities));
            setTripCities(uniqueCities.length > 0 ? uniqueCities : ["Other"]);
        });
        return () => unsub();
    }, [teamName]);

    useEffect(() => {
        if (teamName && typeof teamName === "string") {
            console.log("Saving selected team:", teamName);
            localStorage.setItem("selectedTeam", teamName);
        } else {
            console.log("No valid team name found in useParams");
        }
    }, [teamName]);

    useEffect(() => {
        if (!user || !teamName) return;

        const fetchPins = async () => {
            const q = query(collection(db, "itinerary"), where("team", "==", teamName));
            console.log("Fetching pins for team:", teamName);
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
        };

        fetchPins();
    }, [user, teamName]);

    const handleAddToItinerary = async (tag: string, duration: number, city: string) => {
        if (!pendingPlace || !user || !teamName) return;

        const newPlace = {
            name: pendingPlace.name,
            lat: pendingPlace.lat,
            lng: pendingPlace.lng,
            tag,
            duration,
            city,
            userId: user.uid,
            team: teamName,
            createdAt: serverTimestamp(),
        };

        try {
            const docRef = await addDoc(collection(db, "itinerary"), newPlace);
            setMarkers((prev) => [...prev, { id: docRef.id, ...newPlace }]);
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
                                onClick={() => {
                                    if (typeof item.lat === "number" && typeof item.lng === "number") {
                                      mapRef.current?.flyTo(item.lat, item.lng);
                                    } else {
                                      console.warn("Invalid coordinates for item", item);
                                    }
                                  }}
                            >
                                <div>
                                    <strong>{item.name}</strong>
                                    <span className="badge ml-2">{item.tag}</span>
                                    <span className="text-sm ml-2 text-gray-500">
                                        ({item.duration} min)
                                    </span>
                                    {item.city && (
                                        <div className="text-sm text-gray-400">{item.city}</div> // TODO: add pins with tags
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

                </div>
            )}
            <Link
                href="/trips"
                className="fixed bottom-4 right-4 btn btn-primary shadow-lg"
            >
                Trips
            </Link>

            <a
                href="/"
                className="btn btn-outline fixed bottom-4 left-4 shadow"
            >
                ⬅ Deselect Team
            </a>
        </main>
    );
}