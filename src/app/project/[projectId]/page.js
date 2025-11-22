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
  const [statusMsg, setStatusMsg] = useState("");
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

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImageFile(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleRequest = () => {
 debugger;
    if (!token || role !== "user") {
      router.push("/dashboard");
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

      const uploadData = await uploadRes.json();
      imagePath = uploadData.filePath; // e.g., /uploads/myimage.jpg
    }
        const projectsRes = await fetch('/api/projects');
        const projects = await projectsRes.json();
        const idx = projects.findIndex(p => p.id === projectId);
        if (idx === -1) {
          setStatusMsg('Project not found');
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
        await fetch('/api/projects', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ projects }),
        });

        setStatusMsg('Request sent!');
        setMessage('');
        setImageFile(null);
        const input = document.getElementById('request-image');
        if (input) input.value = '';
      } catch (err) {
        console.error(err);
        setStatusMsg('Failed to send request');
      }
    })();
  };

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
      <input
        type="file"
        accept="image/*"
        id="request-image"
        className="w-full mb-2"
        onChange={handleFileChange}
      />
      <button
        onClick={handleRequest}
        className="btn btn-primary"
      >
        Send Request
      </button>
      {statusMsg && <p className="text-success mt-2">{statusMsg}</p>}
    </div>
  );
}
