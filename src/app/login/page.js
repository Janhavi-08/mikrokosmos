"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) {
        setErr('Invalid credentials');
        return;
      }
      const data = await res.json();
      const user = data.user;
      // store token and session info
      localStorage.setItem('token', user.username);
      localStorage.setItem('username', user.username);
      localStorage.setItem('role', user.role || 'user');
      window.dispatchEvent(new Event('authChanged'));
      router.push('/redirect');
    } catch (err) {
      console.error(err);
      setErr('Login failed');
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white text-black rounded shadow">
      <h1 className="text-2xl font-bold mb-4">Login</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          placeholder="Username"
          className="w-full p-2 border rounded"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          className="w-full p-2 border rounded"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {err && <p className="text-danger">{err}</p>}
        <button type="submit" className="btn btn-primary">Login</button>
      </form>
    </div>
  );
}
