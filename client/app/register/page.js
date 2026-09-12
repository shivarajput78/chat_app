"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await register(name, email, password);
      router.push("/chat");
    } catch (err) {
      setError(err?.response?.data?.message || "Could not create account");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-panel">
      <form onSubmit={handleSubmit} className="w-full max-w-sm bg-panelLight rounded-2xl p-8 shadow-xl">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center font-bold text-panel">D</div>
          <h1 className="text-xl font-semibold text-white">chat-app</h1>
        </div>
        <p className="text-muted text-sm mb-6">Create an account to get started.</p>

        {error && <div className="bg-red-900/40 text-red-300 text-sm rounded-lg px-3 py-2 mb-4">{error}</div>}

        <label className="block text-sm text-muted mb-1">Name</label>
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full mb-4 rounded-lg bg-surface border border-line px-3 py-2 text-white outline-none focus:border-accent"
          placeholder="Your name"
        />

        <label className="block text-sm text-muted mb-1">Email</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full mb-4 rounded-lg bg-surface border border-line px-3 py-2 text-white outline-none focus:border-accent"
          placeholder="you@example.com"
        />

        <label className="block text-sm text-muted mb-1">Password</label>
        <input
          type="password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full mb-6 rounded-lg bg-surface border border-line px-3 py-2 text-white outline-none focus:border-accent"
          placeholder="At least 6 characters"
        />

        <button
          type="submit"
          disabled={busy}
          className="w-full bg-accent hover:bg-accentDeep transition text-panel font-medium rounded-lg py-2 disabled:opacity-60"
        >
          {busy ? "Creating account..." : "Create account"}
        </button>

        <p className="text-sm text-muted mt-4 text-center">
          Already have an account?{" "}
          <Link href="/login" className="text-accent hover:underline">
            Log in
          </Link>
        </p>
      </form>
    </div>
  );
}
