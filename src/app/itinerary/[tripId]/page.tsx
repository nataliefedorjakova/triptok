"use client";
import { serverTimestamp } from "firebase/firestore";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { FieldValue } from "firebase/firestore";
import {
    collection,
    getDoc,
    getDocs,
    query,
    where,
    doc,
    addDoc,
    deleteDoc,
} from "firebase/firestore";

interface Trip {
    id: string;
    city: string;
    days: number;
    startDate?: string;
    team: string;
}

interface ItineraryItem {
    id: string;
    name: string;
    duration: number;
    tag: string;
    city: string;
    team: string;
    lat: number;
    lng: number;
    distance?: number;
}

interface DayPlan {
    id: string;
    itemId: string;
    name: string;
    duration: number;
    tag: string;
    city: string;
    day: number;
    createdAt: Date | FieldValue;
}

export default function ItineraryPage() {
    const { tripId } = useParams();
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [trip, setTrip] = useState<Trip | null>(null);
    const [availableItems, setAvailableItems] = useState<ItineraryItem[]>([]);
    const [dayPlans, setDayPlans] = useState<DayPlan[]>([]);
    const [showPopupDay, setShowPopupDay] = useState<number | null>(null);
    const [selectedItem, setSelectedItem] = useState<ItineraryItem | null>(null);
    const [recommendedItems, setRecommendedItems] = useState<ItineraryItem[]>([]);

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, setUser);
        return () => unsub();
    }, []);

    useEffect(() => {
        const fetchTripAndItems = async () => {
            if (!user || !tripId) return;

            const tripRef = doc(db, "userTrips", tripId as string);
            const tripSnap = await getDoc(tripRef);
            if (!tripSnap.exists()) return;
            const tripData = tripSnap.data() as Omit<Trip, "id">;
            setTrip({ id: tripSnap.id, ...tripData });

            const team = tripData.team;
            if (!team) return;

            const itineraryQuery = query(
                collection(db, "itinerary"),
                where("team", "==", team),
                where("city", "==", tripData.city)
            );

            const itinerarySnapshot = await getDocs(itineraryQuery);
            const items: ItineraryItem[] = itinerarySnapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            } as ItineraryItem));
            setAvailableItems(items);

            const plansQuery = query(
                collection(db, "tripItinerary"),
                where("tripId", "==", tripSnap.id)
            );
            const plansSnapshot = await getDocs(plansQuery);

            const plans: DayPlan[] = plansSnapshot.docs.map((doc) => {
                const data = doc.data();
                return {
                    id: doc.id,
                    itemId: data.itemId,
                    name: data.name,
                    duration: data.duration,
                    tag: data.tag,
                    city: data.city,
                    day: data.day,
                    createdAt: data.createdAt?.toDate?.() ?? new Date(),
                };
            });

            setDayPlans(plans);
        };

        fetchTripAndItems();
    }, [user, tripId]);

    useEffect(() => {
        if (!showPopupDay || !availableItems.length) return;
        console.log("=== Recomputing Recommendations ===");
        console.log("Day selected:", showPopupDay);
        console.log("All dayPlans:", dayPlans);
        const itemsForDay = dayPlans
            .filter((p): p is DayPlan & { createdAt: Date } =>
                p.day === showPopupDay && p.createdAt instanceof Date
            )
            .sort((a, b) => {
                const timeA = a.createdAt instanceof Date ? a.createdAt.getTime() : 0;
                const timeB = b.createdAt instanceof Date ? b.createdAt.getTime() : 0;
                return timeB - timeA;
            });
        console.log("Filtered items for this day:", itemsForDay);
        const latest = itemsForDay[0];
        console.log("Latest item added:", latest);
        const origin = availableItems.find((item) => item.id === latest?.itemId);
        console.log("Origin for recommendations:", origin);
        if (origin) {
            setSelectedItem(origin);
            fetchRecommendations(origin);
        } else {
            setSelectedItem(null);
            setRecommendedItems([]);
        }
    }, [showPopupDay, dayPlans, availableItems]);

    const fetchRecommendations = async (origin: ItineraryItem) => {
        const destinations = availableItems
            .filter((item) => item.id !== origin.id)
            .map((item) => ({ lat: item.lat, lng: item.lng }));

        if (!destinations.length) return;

        try {
            const response = await fetch("/api/walking", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    origin: { lat: origin.lat, lng: origin.lng },
                    destinations,
                }),
            });

            const data = await response.json();
            if (!data?.distances || !Array.isArray(data.distances)) {
                console.error("Walking API returned no distances:", data);
                return;
            }

            const distances = data.distances;

            const sorted = availableItems
                .filter((item) => item.id !== origin.id)
                .map((item, i) => ({ ...item, distance: distances[i] }))
                .sort((a, b) => a.distance - b.distance);

            setRecommendedItems(sorted.slice(0, 5));
        } catch (error) {
            console.error("Failed to fetch walking distances:", error);
        }
    };

    const handleAssignToDay = async (item: ItineraryItem, day: number) => {
        if (!trip || !user) return;

        const newPlan = {
            tripId: trip.id,
            team: trip.team,
            day,
            itemId: item.id,
            name: item.name,
            duration: item.duration,
            tag: item.tag,
            city: item.city,
            userId: user.uid,
            createdAt: new Date(),
        };

        const docRef = await addDoc(collection(db, "tripItinerary"), newPlan);
        const planWithId = { ...newPlan, id: docRef.id };
        setDayPlans((prev) => [...prev, planWithId]);

        setSelectedItem(item);
        fetchRecommendations(item);

    };

    const handleDeleteFromDay = async (id: string) => {
        await deleteDoc(doc(db, "tripItinerary", id));
        setDayPlans((prev) => prev.filter((item) => item.id !== id));
    };

    const formatTime = (minutes: number) => {
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        return `${h}h ${m}min`;
    };

    return (
        <main className="max-w-3xl mx-auto p-6">
            <h1 className="text-2xl font-bold mb-4">Itinerary for {trip?.city}</h1>
            {trip && (
                <p className="mb-4 text-gray-600">
                    {trip.days} day{trip.days !== 1 && "s"} starting from {trip.startDate || "(no date)"}
                </p>
            )}

            {trip && [...Array(trip.days)].map((_, index) => {
                const day = index + 1;
                const dayItems = dayPlans.filter((item) => item.day === day);
                const remainingTime = 14 * 60 - dayItems.reduce((sum, item) => sum + item.duration, 0);

                return (
                    <div key={day} className="mb-6">
                        <h2 className="text-xl font-semibold mb-2">Day {day}</h2>
                        <p className="text-sm mb-2 text-gray-600">Remaining time: {formatTime(remainingTime)}</p>
                        <ul className="space-y-2">
                            {dayItems.map((item) => (
                                <li key={item.id} className="bg-base-100 p-3 rounded shadow flex justify-between items-center">
                                    <div>
                                        <strong>{item.name}</strong>
                                        <span className="ml-2 text-sm">({item.tag}, {item.duration} min)</span>
                                    </div>
                                    <button
                                        className="btn btn-xs btn-error"
                                        onClick={() => handleDeleteFromDay(item.id)}
                                    >
                                        Delete
                                    </button>
                                </li>
                            ))}
                        </ul>

                        <button
                            className="btn btn-sm btn-primary mt-3"
                            onClick={() => setShowPopupDay(day)}
                        >
                            ➕ Add to this day
                        </button>

                    </div>
                );
            })}

            {showPopupDay && (
                <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
                    <div className="bg-base-100 rounded-xl shadow-xl p-6 w-full max-w-3xl flex flex-col gap-6">
                        <div className="flex gap-6">
                            {/* Left side: Available items */}
                            <div className="w-1/2">
                                <h3 className="text-lg font-semibold mb-4">Add to Day {showPopupDay}</h3>
                                <ul className="space-y-2 max-h-96 overflow-y-auto">
                                    {availableItems.map((item) => (
                                        <li key={item.id} className="flex justify-between items-center bg-base-200 p-2 rounded">
                                            <div>
                                                {item.name}{" "}
                                                <span className="ml-1 text-xs text-gray-500">({item.duration} min)</span>
                                            </div>
                                            <button
                                                className="btn btn-xs btn-success"
                                                onClick={() => {
                                                    handleAssignToDay(item, showPopupDay);
                                                }}
                                            >
                                                Add
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* Right side: Recommendations */}
                            <div className="w-1/2">
                                <h3 className="text-lg font-semibold mb-4">Recommended</h3>
                                <ul className="space-y-2 max-h-96 overflow-y-auto">
                                    {recommendedItems.map((item) => (
                                        <li key={item.id} className="flex justify-between items-center bg-base-200 p-2 rounded">
                                            <div>
                                                <strong>{item.name}</strong>
                                                <span className="ml-2 text-xs text-gray-500">
                                                    ({item.duration} min · {item.distance?.toFixed(1)} km)
                                                </span>
                                            </div>
                                            <button
                                                className="btn btn-xs btn-success"
                                                onClick={() => {
                                                    handleAssignToDay(item, showPopupDay);
                                                }}
                                            >
                                                Add
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        <div className="text-center">
                            <button
                                className="btn btn-sm"
                                onClick={() => {
                                    setShowPopupDay(null);
                                    setSelectedItem(null);
                                    setRecommendedItems([]);
                                }}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}


            <div className="text-center mt-8">
                <button onClick={() => router.back()} className="btn btn-outline">
                    ⬅ Back
                </button>
            </div>
        </main>
    );
}
