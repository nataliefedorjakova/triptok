"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import {
    collection,
    addDoc,
    serverTimestamp,
    getDocs,
    query,
    where,
    deleteDoc,
    doc,
} from "firebase/firestore";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import Link from "next/link";

export default function TripsPage() {
    const [user, setUser] = useState<any>(null);
    const [city, setCity] = useState("Tokyo");
    const [days, setDays] = useState(3);
    const [startDate, setStartDate] = useState("");
    const [savedTrips, setSavedTrips] = useState<any[]>([]);
    const [selectedTripId, setSelectedTripId] = useState<string | null>(null);
    const [itineraryItems, setItineraryItems] = useState<any[]>([]);
    const [teamName, setTeamName] = useState<string | null>(null);
    const [loadingTeamName, setLoadingTeamName] = useState(true);

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, setUser);
        return () => unsub();
    }, []);

    useEffect(() => {
        const storedTeam = localStorage.getItem("selectedTeam");
        if (!storedTeam) {
            alert("Please select a team first.");
            window.location.href = "/";
        } else {
            setTeamName(storedTeam);
        }
    }, []);

    useEffect(() => {
        const fetchTrips = async () => {
            if (!user) return;

            const tripsQuery = query(collection(db, "userTrips"), where("userId", "==", user.uid));
            const tripSnapshot = await getDocs(tripsQuery);
            const trips = tripSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
            setSavedTrips(trips);

            const itineraryQuery = query(collection(db, "itinerary"), where("userId", "==", user.uid));
            const itinerarySnapshot = await getDocs(itineraryQuery);
            const items = itinerarySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
            setItineraryItems(items);
        };

        fetchTrips();
    }, [user]);

    const saveTrip = async () => {
        if (!user) return;
        await addDoc(collection(db, "userTrips"), {
            city,
            days,
            startDate,
            userId: user.uid,
            createdAt: serverTimestamp(),
        });
        alert("Trip saved!");
        const q = query(collection(db, "userTrips"), where("userId", "==", user.uid));
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setSavedTrips(data);
    };

    const deleteTrip = async (id: string) => {
        await deleteDoc(doc(db, "userTrips", id));
        setSavedTrips(savedTrips.filter((trip) => trip.id !== id));
    };
console.log("teamName from localStorage:", teamName);

    return (
        <div className="max-w-2xl mx-auto p-4 space-y-6">
            <h2 className="text-2xl font-bold">Plan Your Trip</h2>

            <div className="space-y-2">
                <div className="flex gap-2">
                    <input
                        className="input input-bordered w-1/2"
                        value={city}
                        placeholder="City"
                        onChange={(e) => setCity(e.target.value)}
                    />
                    <input
                        className="input input-bordered w-24"
                        type="number"
                        value={days}
                        onChange={(e) => setDays(Number(e.target.value))}
                        min={1}
                        placeholder="Days"
                    />
                    <input
                        className="input input-bordered w-36"
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                    />
                </div>
                <div className="text-center">
                    <button className="btn btn-primary mt-2" onClick={saveTrip}>Save Trip</button>
                </div>
            </div>

            <div>
                <label className="block mb-1 font-medium">Select Saved Trip:</label>
                <select
                    className="select select-bordered w-full mb-4"
                    value={selectedTripId ?? ""}
                    onChange={(e) => setSelectedTripId(e.target.value)}
                >
                    <option value="" disabled>
                        -- Select a Trip --
                    </option>
                    {savedTrips.map((trip) => (
                        <option key={trip.id} value={trip.id}>
                            {trip.city} ({trip.days} day{trip.days !== 1 && "s"})
                        </option>
                    ))}
                </select>
            </div>

            {savedTrips.length > 0 && (
                <div className="bg-base-200 p-4 rounded-lg shadow mt-6">
                    <h3 className="text-lg font-bold mb-2">Saved Trips</h3>
                    <ul className="space-y-4">
                        {savedTrips.map((trip) => (
                            <li key={trip.id} className="bg-base-100 p-4 rounded shadow">
                                <div className="flex justify-between items-center mb-2">
                                    <div>
                                        <strong>{trip.city}</strong> — {trip.days} day{trip.days !== 1 && "s"}<br />
                                        {trip.startDate && <span className="text-sm text-gray-500">Start: {trip.startDate}</span>}
                                    </div>
                                    <button className="btn btn-xs btn-error self-center" onClick={() => deleteTrip(trip.id)}>Delete</button>
                                </div>
                                <ul className="text-sm text-gray-700 list-disc list-inside">
                                    {itineraryItems.filter((item) => item.city === trip.city).map((item) => (
                                        <li key={item.id}>
                                            {item.name} <span className="ml-1 text-xs text-gray-500">({item.tag}, {item.duration} min)</span>
                                        </li>
                                    ))}
                                </ul>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
            {teamName && (
                <div className="text-center pt-6">
                    <Link href={`/team/${teamName}`} className="btn btn-secondary">
                        Back to Map
                    </Link>
                </div>
            )}
        </div>
    );
}