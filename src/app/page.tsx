"use client"
import creatorsData from "../data/creators.json";
import projectsData from "../data/projects.json";
import CreatorCard from "../components/CreatorCard";
import ProjectCard from "../components/ProjectCard";

import { useState, useEffect } from "react";
export default function Home() {
  const [projects, setProjects] = useState(projectsData);
  const [creators, setCreators] = useState(creatorsData);
  const [search, setSearch] = useState("");
  const [filterCreator, setFilterCreator] = useState("");
  const [page, setPage] = useState(0);
  const itemsPerPage = 6;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // Prefer server-side persisted projects/creators
        const [projRes, creatorsRes] = await Promise.all([
          fetch('/api/projects').catch(() => null),
          fetch('/api/creators').catch(() => null),
        ]);

        if (projRes && projRes.ok) {
          const projJson = await projRes.json();
          if (!cancelled) setProjects(Array.isArray(projJson) ? projJson : projectsData);
        } else {
          // fallback to localStorage (edits) or static import
          const savedProjects = JSON.parse(localStorage.getItem('projectsData') || 'null');
          if (!cancelled) setProjects(Array.isArray(savedProjects) ? savedProjects : projectsData);
        }

        if (creatorsRes && creatorsRes.ok) {
          const creatorsJson = await creatorsRes.json();
          if (!cancelled) setCreators(Array.isArray(creatorsJson) ? creatorsJson : creatorsData);
        } else {
          if (!cancelled) setCreators(creatorsData);
        }
      } catch (err) {
        // On any error, fall back to local copies
        const savedProjects = JSON.parse(localStorage.getItem('projectsData') || 'null');
        if (!cancelled) setProjects(Array.isArray(savedProjects) ? savedProjects : projectsData);
        if (!cancelled) setCreators(creatorsData);
      }
    })();
    return () => { cancelled = true };
  }, []);

  // Reset page when filters change
  useEffect(() => setPage(0), [search, filterCreator]);

  // Filtered projects based on search & selected creator
  const filteredProjects = projects.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(search.toLowerCase());
    const matchesCreator = filterCreator ? p.creatorId === filterCreator : true;
    return matchesSearch && matchesCreator;
  });

  const totalPages = Math.max(1, Math.ceil(filteredProjects.length / itemsPerPage));
  const pageProjects = filteredProjects.slice(page * itemsPerPage, (page + 1) * itemsPerPage);

  return (
    <div className="max-w-6xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">Explore Projects</h1>

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
          {creators.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* Project List */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {pageProjects.map(p => (
          <ProjectCard key={p.id} project={p} />
        ))}
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
    </div>
  );
}
