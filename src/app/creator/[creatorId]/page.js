"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import creatorsData from "../../../data/creators.json";
import projectsData from "../../../data/projects.json";
import BackButton from "../../../components/BackButton";

export default function CreatorPage() {
  const params = useParams();
  const creatorId = params.creatorId;

  const [creator, setCreator] = useState(null);
  const [projects, setProjects] = useState([]);
  const [requests, setRequests] = useState([]);
  const [role, setRole] = useState(null);

  useEffect(() => {
    const cr = creatorsData.find(c => c.id === creatorId);
    setCreator(cr);
    (async () => {
      try {
        const projectsRes = await fetch('/api/projects');
        const allProjects = await projectsRes.json();
        const crProjects = allProjects.filter(p => p.creatorId === creatorId);
        setProjects(crProjects);

        const roleFromStorage = localStorage.getItem('role');
        setRole(roleFromStorage);

        const username = localStorage.getItem('username');

if (roleFromStorage === 'creator') {
  // creator → show all incoming requests
  const crRequests = crProjects.flatMap(p =>
    (p.requests || []).map(r => ({ ...r, projectId: p.id }))
  );
  setRequests(crRequests);

} else if (roleFromStorage === 'user') {
  // user → show only requests the user sent
  const userRequests = allProjects.flatMap(p =>
    (p.requests || [])
      .filter(r => r.user === username)
      .map(r => ({ ...r, projectId: p.id, projectTitle: p.title }))
  );
  setRequests(userRequests);
}

      } catch (err) {
        console.error('Failed to load projects/requests', err);
      }
    })();
  }, [creatorId]);

  const handleRequestStatus = (index, status) => {
    (async () => {
      try {
        const updated = [...requests];
        updated[index].status = status;
        setRequests(updated);

        // Persist change into projects.json
        const projectsRes = await fetch('/api/projects');
        const allProjects = await projectsRes.json();
        // find the project that matches this request
        const req = updated[index];
        const projIndex = allProjects.findIndex(p => p.id === req.projectId);
        if (projIndex === -1) return;
        const proj = allProjects[projIndex];
        proj.requests = proj.requests || [];
        const rIndex = proj.requests.findIndex(r => r.user === req.user && r.message === req.message && (r.image === req.image));
        if (rIndex !== -1) {
          proj.requests[rIndex].status = status;
        } else {
          // fallback: try to match by user only
          const fallback = proj.requests.find(r => r.user === req.user);
          if (fallback) fallback.status = status;
        }

        allProjects[projIndex] = proj;
        await fetch('/api/projects', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ projects: allProjects }),
        });
      } catch (err) {
        console.error('Failed to update request status', err);
      }
    })();
  };

  if (!creator) return <p>Loading...</p>;

  return (
    <div className="max-w-5xl mx-auto p-4">
      <div className="mb-3">
        <BackButton />
      </div>
     <div className="shadow-lg rounded-lg overflow-hidden flex items-center p-6">
  <img
    src={creator.image || '/uploads/default-avatar.png'}
    alt={creator.name}
    className="w-32 h-32 object-cover rounded-full shadow-md"
  />

  {/* Right: Name & Bio */}
  <div className="ml-6">
    <h1 className="text-2xl font-bold text-gray-800 mb-2">{creator.name}</h1>
    <p className="text-gray-600">{creator.bio}</p>
  </div>
</div>


      <h2 className="text-2xl font-bold mb-2">Projects</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {projects.map(p => (
          <div key={p.id} className="card p-2">
            <img src={p.image} alt={p.title} className="w-full h-32 object-cover rounded mb-1" />
            <h3 className="font-bold">{p.title}</h3>
            <p className="text-sm muted">{p.description}</p>
          </div>
        ))}
      </div>

      <h2 className="text-2xl font-bold mb-2">Requests</h2>
      <div className="space-y-4">
        {requests.length === 0 && <p>No requests yet</p>}
        {requests.map((r, idx) => (
          <div key={idx} className="card p-3">
            <p><strong>User:</strong> {r.user}</p>
            <p><strong>Message:</strong> {r.message}</p>
            {r.image && <img src={r.image} alt="Request Image" className="w-40 mt-2 rounded" />}
            <p><strong>Status:</strong> {r.status}</p>
                {r.status === "pending" && role === "creator" && (
              <div className="mt-2 space-x-2" >
                <button
                  onClick={() => handleRequestStatus(idx, "accepted")}
                  className="btn btn-success"
                >
                  Accept
                </button>
                <button
                  onClick={() => handleRequestStatus(idx, "rejected")}
                  className="btn btn-danger"
                >
                  Reject
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
