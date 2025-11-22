"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function ProjectCard({ project }) {
  const [requestCounts, setRequestCounts] = useState({ pending: 0, accepted: 0, rejected: 0 });
  const router = useRouter();

  useEffect(() => {
    // Count requests from the project's requests array (canonical source)
    const projectRequests = Array.isArray(project.requests) ? project.requests : [];
    const validStatuses = new Set(["pending", "accepted", "rejected"]);
    const counts = { pending: 0, accepted: 0, rejected: 0 };
    projectRequests.forEach(r => {
      if (r && typeof r.status === "string" && validStatuses.has(r.status)) {
        counts[r.status] = (counts[r.status] || 0) + 1;
      }
    });
    setRequestCounts(counts);
  }, [project.id]);

  const total = requestCounts.pending + requestCounts.accepted + requestCounts.rejected;
  const acceptedPercent = total ? (requestCounts.accepted / total) * 100 : 0;

  return (
    <div
      className="card overflow-hidden cursor-pointer hover:shadow-lg transition"
      role="button"
      tabIndex={0}
      onClick={() => router.push(`/project/${project.id}`)}
      onKeyDown={(e) => { if (e.key === 'Enter') router.push(`/project/${project.id}`); }}
    >
      <img src={project.image} alt={project.title} className="w-full h-48 object-cover" />
      <div className="p-3">
        <h3 className="font-bold text-lg">{project.title}</h3>
        <p className="text-sm muted">{project.description}</p>

        {/* Reach / Progress Bar */}
        <div className="mt-3">
          <p className="text-sm muted">Accepted Requests: {requestCounts.accepted}/{total}</p>
          <div className="w-full bg-gray-200 h-2 rounded mt-1">
            <div
              className="h-2 rounded"
              style={{ background: 'var(--primary)', width: `${acceptedPercent}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
