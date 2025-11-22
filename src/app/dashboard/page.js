"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import projectsData from "../../data/projects.json";
import creatorsData from "../../data/creators.json";

export default function UserDashboard() {
  const router = useRouter();
  const [projects, setProjects] = useState([]);
  const [creators, setCreators] = useState(creatorsData);
  const [search, setSearch] = useState("");
  const [filterCreator, setFilterCreator] = useState("");
  const [page, setPage] = useState(0);
  const itemsPerPage = 6;
  const [requests, setRequests] = useState([]);
  const [requestsPage, setRequestsPage] = useState(0);
  const requestsPerPage = 6;
  const [token, setToken] = useState(null);
  const [role, setRole] = useState(null);
  // Creator pagination
  const [creatorPage, setCreatorPage] = useState(0);
  const creatorsPerPage = 6;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [projRes, creatorsRes] = await Promise.all([
          fetch('/api/projects').catch(() => null),
          fetch('/api/creators').catch(() => null),
        ]);

        let loadedProjects = [];
        if (projRes && projRes.ok) {
          loadedProjects = await projRes.json();
        } else {
          const saved = JSON.parse(localStorage.getItem('projectsData') || 'null');
          loadedProjects = Array.isArray(saved) ? saved : projectsData;
        }

        if (!cancelled) setProjects(loadedProjects);

        if (creatorsRes && creatorsRes.ok) {
          const creatorsJson = await creatorsRes.json();
          if (!cancelled) setCreators(creatorsJson);
        }

        // Read auth from localStorage
        const tokenLocal = localStorage.getItem('token');
        const roleLocal = localStorage.getItem('role');
        if (!cancelled) {
          setToken(tokenLocal);
          setRole(roleLocal);
        }

        // Build user's requests by scanning projects' requests arrays
        if (tokenLocal) {
          const userReqs = [];
          loadedProjects.forEach(p => {
            (p.requests || []).forEach(r => {
              if (r.user === tokenLocal) userReqs.push({ ...r, projectId: p.id });
            });
          });
          if (!cancelled) setRequests(userReqs);
        } else {
          if (!cancelled) setRequests([]);
        }
      } catch (err) {
        console.error('Failed to load dashboard data', err);
        const saved = JSON.parse(localStorage.getItem('projectsData') || 'null');
        if (!cancelled) setProjects(Array.isArray(saved) ? saved : projectsData);
        const tokenLocal = localStorage.getItem('token');
        const roleLocal = localStorage.getItem('role');
        if (!cancelled) {
          setToken(tokenLocal);
          setRole(roleLocal);
        }
      }
    })();
    return () => { cancelled = true };
  }, []);

  // Reset page when filters change
  useEffect(() => setPage(0), [search, filterCreator]);
  // Reset creator page if creators list changes
  useEffect(() => setCreatorPage(0), [creators]);
  useEffect(() => setRequestsPage(0), [requests]);

  if (!token) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <h1 className="text-3xl font-bold mb-4">Opp's Somthing went wrong!!!</h1>
        <p className="mb-4">Please log in to view and request projects.</p>
        <button onClick={() => router.push("/login")} className="btn btn-primary">Go to Login</button>
      </div>
    );
  }

  if (role !== "user") {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <h1 className="text-3xl font-bold mb-4">Only users can send requests!</h1>
        <p>You are not logged in as a user. Please switch accounts to view user dashboard.</p>
      </div>
    );
  }

  // Filtered projects based on search & selected creator
  const filteredProjects = projects.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(search.toLowerCase()) || p.description.toLowerCase().includes(search.toLowerCase());
    const matchesCreator = filterCreator ? p.creatorId === filterCreator : true;
    return matchesSearch && matchesCreator;
  });

  const totalPages = Math.max(1, Math.ceil(filteredProjects.length / itemsPerPage));
  const pageProjects = filteredProjects.slice(page * itemsPerPage, (page + 1) * itemsPerPage);

  // Pagination for creators
  const totalCreatorPages = Math.max(1, Math.ceil((Array.isArray(creators) ? creators.length : 0) / creatorsPerPage));
  const pageCreators = Array.isArray(creators)
    ? creators.slice(creatorPage * creatorsPerPage, (creatorPage + 1) * creatorsPerPage)
    : [];

  return (
    <div className="max-w-6xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">All Projects</h1>

      {/* Search & Filter */}
      <div className="flex flex-col md:flex-row items-center mb-6 space-y-2 md:space-y-0 md:space-x-4">
        <input
          type="text"
          placeholder="Search projects..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="p-2 border rounded w-full md:w-1/2"
        />
        <select
          value={filterCreator}
          onChange={e => setFilterCreator(e.target.value)}
          className="select-filter w-full md:w-1/4"
        >
          <option value="">All Creators</option>
          {Array.isArray(creators) && creators.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* 2 rows x 3 columns grid, max 6 per page */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Array.from({ length: Math.min(6, pageProjects.length) }).map((_, idx) => {
          const p = pageProjects[idx];
          if (!p) return null;
          return (
            <div key={p.id} className="card overflow-hidden">
              <img src={p.image} alt={p.title} className="w-full h-40 object-cover" />
              <div className="p-3">
                <h3 className="font-bold text-lg">{p.title}</h3>
                <p className="text-sm muted mb-3">{p.description}</p>
                <div className="flex space-x-2">
                  <button onClick={() => router.push(`/project/${p.id}`)} className="btn btn-primary">View Details</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination controls */}
      <div className="flex items-center justify-between mt-6">
        <div className="text-sm muted">{filteredProjects.length} projects</div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            className="btn btn-ghost"
          >
            Prev
          </button>
          <div className="text-sm muted">Page {page + 1} / {totalPages}</div>
          <button
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={page + 1 >= totalPages}
            className="btn btn-primary"
          >
            Next
          </button>
        </div>
      </div>

      {/* User Requests Section */}
      <h2 className="text-2xl font-bold mt-8 mb-4">Your Requests</h2>
      <div className="space-y-4 mb-6">
        {requests.length === 0 && <p>No requests yet.</p>}
        {(() => {
          const totalReqPages = Math.max(1, Math.ceil(requests.length / requestsPerPage));
          const pageRequests = requests.slice(requestsPage * requestsPerPage, (requestsPage + 1) * requestsPerPage);
          return (
            <>
              {pageRequests.map((r, idx) => {
                const proj = projects.find(p => p.id === r.projectId) || {};
                return (
                  <div key={idx} className="card p-4">
                    <p><strong>Project:</strong> <button onClick={() => router.push(`/project/${r.projectId}`)} className="text-primary underline">{proj.title || r.projectId}</button></p>
                    <p><strong>Message:</strong> {r.message}</p>
                    {r.image && <img src={r.image} alt="Request Image" className="w-40 mt-2 rounded" />}
                    <p><strong>Status:</strong> {r.status}</p>
                  </div>
                );
              })}
              <div className="flex items-center justify-between mt-2">
                <div className="text-sm muted">{requests.length} requests</div>
                <div className="flex items-center gap-3">
                  <button onClick={() => setRequestsPage(p => Math.max(0, p - 1))} disabled={requestsPage === 0} className="btn btn-ghost">Prev</button>
                  <div className="text-sm muted">Page {requestsPage + 1} / {totalReqPages}</div>
                  <button onClick={() => setRequestsPage(p => Math.min(totalReqPages - 1, p + 1))} disabled={requestsPage + 1 >= totalReqPages} className="btn btn-primary">Next</button>
                </div>
              </div>
            </>
          );
        })()}
      </div>

      {/* Creators Section */}
      <h2 className="text-2xl font-bold mt-8 mb-4">Creators</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {pageCreators.map(c => (
          <div key={c.id} className="card p-4 cursor-pointer hover:shadow-lg" onClick={() => router.push(`/creator/${c.id}`)}>
            <img src={c.image} alt={c.name} className="w-full h-40 object-cover rounded mb-2" />
            <h3 className="font-bold text-lg">{c.name}</h3>
            <p className="text-sm muted">{c.bio}</p>
          </div>
        ))}
      </div>
      {/* Creator Pagination controls */}
      <div className="flex items-center justify-between mt-4">
        <div className="text-sm muted">{Array.isArray(creators) ? creators.length : 0} creators</div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setCreatorPage(p => Math.max(0, p - 1))}
            disabled={creatorPage === 0}
            className="btn btn-ghost"
          >
            Prev
          </button>
          <div className="text-sm muted">Page {creatorPage + 1} / {totalCreatorPages}</div>
          <button
            onClick={() => setCreatorPage(p => Math.min(totalCreatorPages - 1, p + 1))}
            disabled={creatorPage + 1 >= totalCreatorPages}
            className="btn btn-primary"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
