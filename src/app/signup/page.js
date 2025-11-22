"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("user"); // default role
  const [bio, setBio] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [err, setErr] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!username) {
      setErr("Username is required");
      return;
    }

    try {
      // check if username exists on server
      const res = await fetch('/api/users');
      const existing = await res.json();
      if (existing.find(u => u.username === username)) {
        setErr('Username already exists');
        return;
      }

      const newUser = { username, email, password, role };
      // persist to data/users.json via API
      const postRes = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser),
      });
      if (!postRes.ok) throw new Error('Failed to save user');

      // if role is creator, also add to creators.json with bio + optional image (base64)
      if (role === 'creator') {
        let imageBase64 = '';
        if (imageFile) {
          imageBase64 = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(imageFile);
          });
        }
        const creatorEntry = {
          id: `creator-${Date.now()}`,
          name: username,
          username,
          bio: bio || '',
          image: imageBase64 || '/uploads/default-avatar.png',
        };
        await fetch('/api/creators', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(creatorEntry),
        });
      }

      // set token as username so users can login with username
      localStorage.setItem('token', username);
      localStorage.setItem('username', username);
      localStorage.setItem('role', role);
      // notify same-tab listeners that auth changed
      window.dispatchEvent(new Event('authChanged'));
      router.push('/redirect');
    } catch (err) {
      console.error(err);
      setErr('Failed to save user');
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white text-black rounded shadow">
      <h1 className="text-2xl font-bold mb-4">Signup</h1>
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
          type="email"
          placeholder="Email (optional)"
          className="w-full p-2 border rounded"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          className="w-full p-2 border rounded"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="w-full p-2 border rounded"
        >
          <option value="user">User</option>
          <option value="creator">Creator</option>
        </select>
        {role === 'creator' && (
          <div className="mt-2 space-y-2">
            <textarea
              placeholder="Short bio"
              className="w-full p-2 border rounded"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
            />
            <div>
              <label className="text-sm">Profile image (optional)</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setImageFile(e.target.files && e.target.files[0])}
                className="w-full mt-1"
              />
            </div>
          </div>
        )}
        {err && <p className="text-danger">{err}</p>}
        <button type="submit" className="btn btn-primary">Signup</button>
      </form>
    </div>
  );
}
