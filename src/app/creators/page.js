"use client";

import { useState, useEffect } from "react";
import creatorsData from "../../data/creators.json";
import { useRouter } from "next/navigation";
import BackButton from "../../components/BackButton";

export default function CreatorListPage() {
  const [creators, setCreators] = useState([]);
  const [search, setSearch] = useState("");
  const router = useRouter();

  useEffect(() => {
    setCreators(creatorsData);
  }, []);

  const filteredCreators = creators.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto p-4">
      <div className="mb-3">
        <BackButton />
      </div>
      <h1 className="text-3xl font-bold mb-4">Creators</h1>

      <input
        type="text"
        placeholder="Search creators..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="p-2 border rounded w-full md:w-1/3 mb-4"
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {filteredCreators.map(c => (
          <div
            key={c.id}
            className="bg-white text-black p-4 rounded shadow cursor-pointer hover:shadow-lg"
            onClick={() => router.push(`/creator/${c.id}`)}
          >
            <img src={c.image} alt={c.name} className="w-full h-48 object-cover rounded mb-2" />
            <h3 className="font-bold text-xl">{c.name}</h3>
            <p>{c.bio}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
