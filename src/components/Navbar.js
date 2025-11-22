"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Navbar() {
  const [username, setUsername] = useState(null);
  const [role, setRole] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const readAuth = () => {
      const usernameFromStorage = localStorage.getItem("username");
      const roleFromStorage = localStorage.getItem("role");
      setUsername(usernameFromStorage);
      setRole(roleFromStorage);
    };

    // initial read
    readAuth();

    // update on storage events (other tabs) and on custom authChanged events (same tab)
    const handleStorage = (e) => {
      if (!e || (e.key && ["token", "username", "role"].includes(e.key))) {
        readAuth();
      }
    };

    const handleAuthChanged = () => readAuth();

    window.addEventListener("storage", handleStorage);
    window.addEventListener("authChanged", handleAuthChanged);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("authChanged", handleAuthChanged);
    };
  }, []);

  const handleLogout = () => {
    // Remove both authentication token and username to avoid exposing tokens in UI
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    localStorage.removeItem("role");
    // notify same-tab listeners
    window.dispatchEvent(new Event("authChanged"));
    setUsername(null);
    setRole(null);
    router.push("/");
  };
    

  return (
    <nav className="app-header px-4 py-3 flex justify-between items-center">
      <div className="flex items-center space-x-3">
        <div
          className="font-bold text-xl cursor-pointer"
          onClick={() => {
            if (username) {
              if (role === "creator") router.push("/creator/dashboard");
              else router.push("/dashboard");
            } else {
              router.push("/");
            }
          }}
        >
          Mikrokosmos
        </div>

        {username && (
          role === "creator" ? (
            <button
              onClick={() => router.push("/creator/dashboard")}
              className="btn btn-header"
            >
              Home
            </button>
          ) : (
            <button
              onClick={() => router.push("/dashboard")}
              className="btn btn-header"
            >
              Home
            </button>
          )
        )}
      </div>

      <div className="flex items-center space-x-4">
        {username ? (
          <>
            <span className="text-white">
              Logged in as <strong>{username}</strong> ({role})
            </span>
            <button
              onClick={handleLogout}
              className="btn btn-header"
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => router.push("/login")}
              className="btn btn-header"
            >
              Login
            </button>
            <button
              onClick={() => router.push("/signup")}
              className="btn btn-header"
            >
              Sign Up
            </button>
          </>
        )}
      </div>
    </nav>
  );
}
