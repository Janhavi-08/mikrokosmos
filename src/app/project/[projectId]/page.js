"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import projectsData from "../../../data/projects.json";
import creatorsData from "../../../data/creators.json";
import BackButton from "../../../components/BackButton";

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId;

  const [project, setProject] = useState(null);
  const [creator, setCreator] = useState(null);
  const [message, setMessage] = useState("");
  const [imageFile, setImageFile] = useState(null);
 const [token, setToken] = useState(null);
  const [role, setRole] = useState(null);

  useEffect(() => {
    setToken(localStorage.getItem("token"));
    setRole(localStorage.getItem("role"));
  }, []);
  // const token = localStorage.getItem("token"); // user must be logged in
  // const role = localStorage.getItem("role");

  useEffect(() => {
    const proj = projectsData.find(p => p.id === projectId);
    setProject(proj);

    if (proj) {
      const cr = creatorsData.find(c => c.id === proj.creatorId);
      setCreator(cr);
    }
  }, [projectId]);

  // Store the File object directly for upload
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
    }
  };

  const handleRequest = () => {
    if (!token || role !== "user") {
      router.push("/dashboard");
      return;
    }

    (async () => {
      try {
        let imagePath = null;
        if (imageFile) {
          const formData = new FormData();
          formData.append("image", imageFile);
          const uploadRes = await fetch("/api/upload", {
            method: "POST",
            body: formData,
          });
          if (!uploadRes.ok) {
            window.dispatchEvent(new CustomEvent('toast', { detail: { message: 'Image upload failed. Please try again.', type: 'error' } }));
            return;
          }
          let uploadData;
          try {
            uploadData = await uploadRes.json();
          } catch (e) {
            window.dispatchEvent(new CustomEvent('toast', { detail: { message: 'Image upload failed: Invalid server response.', type: 'error' } }));
            return;
          }
          imagePath = uploadData.url;
        }
        const projectsRes = await fetch('/api/projects');
        if (!projectsRes.ok) {
          window.dispatchEvent(new CustomEvent('toast', { detail: { message: 'Failed to load projects. Please try again.', type: 'error' } }));
          return;
        }
        let projects;
        try {
          projects = await projectsRes.json();
        } catch (e) {
          window.dispatchEvent(new CustomEvent('toast', { detail: { message: 'Failed to parse projects data.', type: 'error' } }));
          return;
        }
        const idx = projects.findIndex(p => p.id === projectId);
        if (idx === -1) {
          window.dispatchEvent(new CustomEvent('toast', { detail: { message: 'Project not found', type: 'error' } }));
          return;
        }
        const newRequest = {
          projectId,
          user: token,
          message,
          image: imagePath,
          status: 'pending',
        };
        projects[idx].requests = projects[idx].requests || [];
        projects[idx].requests.push(newRequest);
        // persist full projects array
        const putRes = await fetch('/api/projects', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ projects }),
        });
        if (!putRes.ok) {
          window.dispatchEvent(new CustomEvent('toast', { detail: { message: 'Failed to save request. Please try again.', type: 'error' } }));
          return;
        }
        window.dispatchEvent(new CustomEvent('toast', { detail: { message: 'Request sent', type: 'success' } }));
        setMessage('');
        setImageFile(null);
        const input = document.getElementById('request-image');
        if (input) input.value = '';
      } catch (err) {
        console.error(err);
        window.dispatchEvent(new CustomEvent('toast', { detail: { message: 'Failed to send request', type: 'error' } }));
      }
    })();
  };


  // Related projects: show up to 3 others in a single row
  const relatedProjects = projectsData.filter(
    p => p.id !== projectId && p.creatorId === (project ? project.creatorId : null)
  ).slice(0, 3);

  if (!project) return <p>Loading...</p>;

  return (
    <div className="max-w-lg mx-auto p-4 bg-white text-black rounded shadow">
      <div className="mb-3">
        <BackButton />
      </div>
      <img src={project.image} alt={project.title} className="w-full h-64 object-cover rounded mb-2" />
      <h1 className="text-2xl font-bold">{project.title}</h1>
      <p className="mb-4">{project.description}</p>

      {creator && (
        <button
          onClick={() => router.push(`/creator/${creator.id}`)}
          className="btn btn-primary mb-4"
        >
          View Creator
        </button>
      )}

      <h2 className="text-xl font-bold mt-4">Send Request</h2>
      <textarea
        placeholder="Message to creator"
        className="w-full p-2 border rounded mb-2"
        value={message}
        onChange={e => setMessage(e.target.value)}
      />
      <label htmlFor="request-image" className="btn btn-ghost w-full mb-2 cursor-pointer text-left">
        Add image for inspiration
        <input
          type="file"
          accept="image/*"
          id="request-image"
          className="hidden"
          onChange={handleFileChange}
        />
      </label>
      {imageFile && (
        <div className="mb-2"><span className="text-sm">Selected: {imageFile.name}</span></div>
      )}
      <button
        onClick={handleRequest}
        className="btn btn-primary"
      >
        Send Request
      </button>

      {/* Related Projects Row */}
      {relatedProjects.length > 0 && (
        <>
          <h2 className="text-xl font-bold mt-8 mb-2">More from this Creator</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {relatedProjects.map(rp => (
              <div key={rp.id} className="card overflow-hidden cursor-pointer" onClick={() => router.push(`/project/${rp.id}`)}>
                <img src={rp.image} alt={rp.title} className="w-full h-32 object-cover" />
                <div className="p-2">
                  <h3 className="font-bold text-md">{rp.title}</h3>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
