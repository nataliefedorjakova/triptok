"use client";

import { useState } from "react";
import { auth } from "@/lib/firebase";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";

export default function AuthForm() {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      if (isRegister) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="max-w-sm mx-auto p-4 card bg-base-100 shadow">
      <h2 className="text-xl font-bold mb-4">{isRegister ? "Register" : "Sign In"}</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input type="email" placeholder="Email" className="input input-bordered" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input type="password" placeholder="Password" className="input input-bordered" value={password} onChange={(e) => setPassword(e.target.value)} required />
        {error && <div className="text-error text-sm">{error}</div>}
        <button className="btn btn-primary" type="submit">{isRegister ? "Register" : "Sign In"}</button>
        <button type="button" className="btn btn-sm btn-link text-xs" onClick={() => setIsRegister(!isRegister)}>
          {isRegister ? "Already have an account?" : "Need an account? Register"}
        </button>
      </form>
    </div>
  );
}
