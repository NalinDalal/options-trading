"use client";
import { useEffect, useState } from "react";
import { API_URL } from "../page";

// Define the user type
interface User {
  id: string;
  email: string;
}

/**
 * Performs  me page operation.
 * @returns {React.JSX.Element} Description of return value
 */
export default function MePage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setLoading(false);
      return;
    }

    fetch(`${API_URL}/me`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.user) setUser(data.user);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-white overflow-hidden relative">
      {/* Ambient Background */}
      <div className="fixed inset-0 bg-slate-950">
        <div className="absolute top-20 left-20 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-2xl mx-auto pt-32 px-6">
        <h1 className="text-5xl font-bold mb-8">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
            Account Info
          </span>
        </h1>

        {loading ? (
          <div className="text-slate-400 animate-pulse text-lg">
            Loading your account…
          </div>
        ) : user ? (
          <div className="bg-slate-900/50 border border-slate-800 backdrop-blur-xl rounded-2xl p-8 shadow-2xl">
            <div className="mb-4">
              <div className="text-slate-400 text-sm">User ID</div>
              <div className="text-xl font-semibold">{user.id}</div>
            </div>

            <div className="mb-6">
              <div className="text-slate-400 text-sm">Email</div>
              <div className="text-xl font-semibold">{user.email}</div>
            </div>

            <button
              onClick={() => {
                localStorage.removeItem("token");
                window.location.reload();
              }}
              className="bg-red-600 hover:bg-red-700 px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              Logout
            </button>
          </div>
        ) : (
          <div className="text-slate-400 text-lg">
            You are not logged in.
            <br />
            <button
              onClick={() => (window.location.href = "/signin")}
              className="mt-4 text-blue-400 hover:text-blue-300 underline"
            >
              Go to login →
            </button>
          </div>
        )}
        <div className="mt-8 text-center">
          <button onClick={() => router.push("/trade")}>Trade</button>
        </div>
      </div>
    </div>
  );
}
