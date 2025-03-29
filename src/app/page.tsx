"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  addDoc,
  query,
  where,
  doc,
  setDoc,
} from "firebase/firestore";

export default function HomePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [teams, setTeams] = useState<string[]>([]);
  const [selectedTeam, setSelectedTeam] = useState("");
  const [newTeam, setNewTeam] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      if (u) {
        setUser(u);

        const q = query(collection(db, "teams"), where("members", "array-contains", u.uid));
        const snapshot = await getDocs(q);
        const teamList = snapshot.docs.map((doc) => doc.id);
        setTeams(teamList);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleTeamSelect = async () => {
    const teamToUse = selectedTeam !== "new" ? selectedTeam : newTeam.trim();
    if (!teamToUse || !user) return;

    if (selectedTeam === "new") {
      const newTeamRef = doc(db, "teams", teamToUse);
      await setDoc(newTeamRef, {
        name: teamToUse,
        members: [user.uid],
        createdAt: new Date().toISOString(),
      });
    }
    localStorage.setItem("selectedTeam", teamToUse);
    
    router.push(`/team/${encodeURIComponent(teamToUse)}`);
  };

  if (!user) return <p className="p-4">Loading...</p>;

  return (
    <main className="max-w-xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Select or Create a Team</h1>

      <div className="space-y-4">
        <select
          className="select select-bordered w-full"
          value={selectedTeam}
          onChange={(e) => setSelectedTeam(e.target.value)}
        >
          <option value="">-- Select Existing Team --</option>
          {teams.map((team) => (
            <option key={team} value={team}>{team}</option>
          ))}
          <option value="new">➕ Create New Team</option>
        </select>

        {selectedTeam === "new" && (
          <input
            className="input input-bordered w-full"
            placeholder="New Team Name"
            value={newTeam}
            onChange={(e) => setNewTeam(e.target.value)}
          />
        )}

        <button
          className="btn btn-primary w-full"
          onClick={handleTeamSelect}
          disabled={!selectedTeam || (selectedTeam === "new" && !newTeam.trim())}
        >
          Continue
        </button>
      </div>
    </main>
  );
}
