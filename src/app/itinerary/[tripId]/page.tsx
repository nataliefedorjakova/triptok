"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import {
  collection,
  getDoc,
  getDocs,
  query,
  where,
  doc,
  updateDoc,
  addDoc,
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
  day?: number;
  team: string;
}

export default function ItineraryPage() {
  const { tripId } = useParams();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [trip, setTrip] = useState<Trip | null>(null);
  const [items, setItems] = useState<ItineraryItem[]>([]);
  const [showPopupDay, setShowPopupDay] = useState<number | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, setUser);
    return () => unsub();
  }, []);

  useEffect(() => {
    const fetchTrip = async () => {
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

      const snapshot = await getDocs(itineraryQuery);
      const cityItems: ItineraryItem[] = snapshot.docs.map((doc: any) => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name,
          duration: data.duration,
          tag: data.tag,
          city: data.city,
          day: data.day ?? undefined,
          team: data.team,
        };
      });

      setItems(cityItems);
    };

    fetchTrip();
  }, [user, tripId]);

  const handleAssignToDay = async (item: ItineraryItem, day: number) => {
    if (!trip || !user) return;

    const newItem = {
      name: item.name,
      duration: item.duration,
      tag: item.tag,
      city: item.city,
      day,
      userId: user.uid,
      team: trip.team,
      createdAt: new Date(),
    };

    const docRef = await addDoc(collection(db, "itinerary"), newItem);
    setItems((prev) => [...prev, { ...newItem, id: docRef.id }]);
  };

  const handleDeleteFromDay = async (id: string) => {
    await updateDoc(doc(db, "itinerary", id), { day: null });
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, day: undefined } : item)));
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
        const dayItems = items.filter((item) => item.day === day);
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
          <div className="bg-base-100 rounded-xl shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Add to Day {showPopupDay}</h3>
            <ul className="space-y-2 max-h-96 overflow-y-auto">
              {items.filter((item) => item.day === undefined).map((item) => (
                <li key={item.id} className="flex justify-between items-center bg-base-200 p-2 rounded">
                  <div>
                    {item.name} <span className="ml-1 text-xs text-gray-500">({item.duration} min)</span>
                  </div>
                  <button
                    className="btn btn-xs btn-success"
                    onClick={() => {
                      handleAssignToDay(item, showPopupDay);
                      setShowPopupDay(null);
                    }}
                  >
                    Add
                  </button>
                </li>
              ))}
            </ul>
            <div className="text-center mt-4">
              <button className="btn btn-sm" onClick={() => setShowPopupDay(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      <div className="text-center mt-8">
        <button onClick={() => router.back()} className="btn btn-outline">
          Back
        </button>
      </div>
    </main>
  );
}
