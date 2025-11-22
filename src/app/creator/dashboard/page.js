"use client";

import { useState, useEffect, useRef } from "react";
import projectsData from "../../../data/projects.json";
import Modal from '../../../components/Modal';

export default function CreatorDashboard() {
  const [projects, setProjects] = useState([]);
  const [requests, setRequests] = useState([]);
  const [creatorInfo, setCreatorInfo] = useState(null);
  const [editingProject, setEditingProject] = useState(null);
  const [formData, setFormData] = useState({ title: "", description: "", image: "" });
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({ name: "", username: "", bio: "", image: "" });
  const [showAddProject, setShowAddProject] = useState(false);
  const [newProject, setNewProject] = useState({ title: "", description: "", image: "" });
  const [newProjectError, setNewProjectError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // Derive creatorId from signed-in username
        const username = localStorage.getItem('username');
        // Fetch creators list from API
        const creatorsRes = await fetch('/api/creators').catch(() => null);
        const creators = (creatorsRes && creatorsRes.ok) ? await creatorsRes.json() : [];
        let creatorId = null;
        let matchedCreator = null;
        if (username && Array.isArray(creators)) {
          // Match by explicit username field first, then by name (case-insensitive)
          matchedCreator = creators.find(c => (c.username && c.username === username) || (c.name && c.name.toLowerCase() === username.toLowerCase()));
          if (matchedCreator) creatorId = matchedCreator.id;
        }

        // Load canonical projects (prefer server)
        const projRes = await fetch('/api/projects').catch(() => null);
        const allProjects = (projRes && projRes.ok) ? await projRes.json() : (Array.isArray(projectsData) ? projectsData : []);

        const creatorProjects = creatorId ? allProjects.filter(p => p.creatorId === creatorId) : [];
        if (!cancelled) setProjects(creatorProjects);

        // set creator info for header
        if (!cancelled) setCreatorInfo(matchedCreator || null);

        // Collect requests for creator's projects
        const creatorRequests = [];
        creatorProjects.forEach(p => {
          (p.requests || []).forEach(r => creatorRequests.push({ ...r, projectId: p.id }));
        });
        if (!cancelled) setRequests(creatorRequests);
      } catch (err) {
        console.error('Failed to load creator dashboard', err);
        // fallback: no projects
        if (!cancelled) {
          setProjects([]);
          setRequests([]);
        }
      }
    })();
    return () => { cancelled = true };
  }, []);

  // NOTE: removed body class toggling to avoid layout reflows when modal opens.
  // The modal backdrop covers the UI and prevents interactions; no global body updates required.

  // Update profile form when creatorInfo loads
  useEffect(() => {
    if (creatorInfo) setProfileForm({ name: creatorInfo.name || '', username: creatorInfo.username || '', bio: creatorInfo.bio || '', image: creatorInfo.image || '' });
  }, [creatorInfo]);

  const bioRef = useRef(null);
  // focus bio textarea when entering profile edit mode
  useEffect(() => {
    if (editingProfile) {
      // small timeout to ensure textarea is in DOM
      setTimeout(() => bioRef.current && bioRef.current.focus(), 0);
    }
  }, [editingProfile]);

  const handleProfileChange = (e) => setProfileForm({ ...profileForm, [e.target.name]: e.target.value });

  const handleSaveProfile = async () => {
    if (!creatorInfo) return;
    try {
      const res = await fetch('/api/creators');
      const creators = res.ok ? await res.json() : [];
      const updated = creators.map(c => c.id === creatorInfo.id ? { ...c, ...profileForm } : c);
      await fetch('/api/creators', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updated) });
      setCreatorInfo({ ...creatorInfo, ...profileForm });
      setEditingProfile(false);
    } catch (err) {
      console.error('Failed to save profile', err);
    }
  };

  const handleNewProjectChange = (e) => setNewProject({ ...newProject, [e.target.name]: e.target.value });

  const handleAddProject = async () => {
    if (!creatorInfo) {
      alert('No creator context');
      return;
    }
    // client-side validation
    setNewProjectError('');
    if (!newProject.title || newProject.title.trim().length < 3) {
      setNewProjectError('Title must be at least 3 characters');
      return;
    }
    if (!newProject.description || newProject.description.trim().length < 10) {
      setNewProjectError('Description must be at least 10 characters');
      return;
    }
    if (newProject.image && newProject.image.trim() !== '') {
      try {
        // quick URL validity check
        // eslint-disable-next-line no-new
        new URL(newProject.image);
      } catch (err) {
        setNewProjectError('Image must be a valid URL');
        return;
      }
    }

    const proj = { id: `project-${Date.now()}`, creatorId: creatorInfo.id, title: newProject.title.trim(), description: newProject.description.trim(), image: newProject.image || '/uploads/default-project.jpg', requests: [] };
    setIsSubmitting(true);
    try {
      const projRes = await fetch('/api/projects');
      const allProjects = projRes.ok ? await projRes.json() : (Array.isArray(projectsData) ? projectsData : []);
      allProjects.push(proj);
      await fetch('/api/projects', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ projects: allProjects }) });
      // refresh projects list for this creator
      setProjects(prev => [proj, ...prev]);
      setNewProject({ title: '', description: '', image: '' });
      // close the modal
      setShowAddProject(false);
      setNewProjectError('');
    } catch (err) {
      console.error('Failed to add project', err);
      setNewProjectError('Failed to save project, please try again');
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleImageChange = (e) => {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onloadend = () => {
      setProfileForm((prev) => ({
        ...prev,
        image: reader.result, // base64 image string for preview or upload
      }));
    };
    reader.readAsDataURL(file);
  }
};

    const handleImageUpload = (e) => {
      const file = e.target.files[0];
      if (file) {
        // Optional: Preview the image
        const reader = new FileReader();
        reader.onloadend = () => {
          setNewProject((prev) => ({
            ...prev,
            image: reader.result, // This will be a base64 URL
          }));
        };
        reader.readAsDataURL(file);
      }
    };

  const handleEdit = (project) => {
    // open modal for edit with project data
    setEditingProject(project.id);
    setNewProject({ title: project.title || '', description: project.description || '', image: project.image || '' });
    setShowAddProject(true);
  };

  const handleSaveProjectModal = async () => {
    if (!creatorInfo || !editingProject) return;
    // validation (same as add)
    setNewProjectError('');
    if (!newProject.title || newProject.title.trim().length < 3) {
      setNewProjectError('Title must be at least 3 characters');
      return;
    }
    if (!newProject.description || newProject.description.trim().length < 10) {
      setNewProjectError('Description must be at least 10 characters');
      return;
    }
    if (newProject.image && newProject.image.trim() !== '') {
      try { new URL(newProject.image); } catch (err) { setNewProjectError('Image must be a valid URL'); return; }
    }

    setIsSubmitting(true);
    try {
      const projRes = await fetch('/api/projects');
      const allProjects = projRes.ok ? await projRes.json() : (Array.isArray(projectsData) ? projectsData : []);
      const existing = allProjects.find(p => p.id === editingProject) || {};
      const updatedProject = {
        id: editingProject,
        creatorId: creatorInfo.id,
        title: newProject.title.trim(),
        description: newProject.description.trim(),
        image: newProject.image || '/uploads/default-project.jpg',
        requests: existing.requests || [],
      };
      const merged = allProjects.map(p => p.id === editingProject ? updatedProject : p);
      await fetch('/api/projects', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ projects: merged }) });
      // update local list
      setProjects(prev => prev.map(p => p.id === editingProject ? updatedProject : p));
      setEditingProject(null);
      setShowAddProject(false);
      setNewProjectError('');
    } catch (err) {
      console.error('Failed to save project', err);
      setNewProjectError('Failed to save project. Try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const closeModal = () => {
    setShowAddProject(false);
    setEditingProject(null);
    setNewProject({ title: '', description: '', image: '' });
    setNewProjectError('');
    setIsSubmitting(false);
  };

  const handleSave = async () => {
    const updatedProjects = projects.map(p =>
      p.id === editingProject ? { ...p, ...formData } : p
    );
    setProjects(updatedProjects);

    // Build merged projects list from server canonical list then update server
    try {
      const projRes = await fetch('/api/projects');
      const existingAll = (projRes && projRes.ok) ? await projRes.json() : (Array.isArray(projectsData) ? projectsData : []);
      const merged = existingAll.map(p => (updatedProjects.find(up => up.id === p.id) ? { ...p, ...updatedProjects.find(up => up.id === p.id) } : p));
      updatedProjects.forEach(up => { if (!merged.some(m => m.id === up.id)) merged.push(up); });
      await fetch('/api/projects', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projects: merged }),
      });
    } catch (err) {
      console.error('Failed to persist projects to data file', err);
    }

    setEditingProject(null);
  };

  const handleDelete = async (projectId) => {
    if (!confirm("Are you sure you want to delete this project?")) return;
    const updatedProjects = projects.filter(p => p.id !== projectId);
    setProjects(updatedProjects);
    // remove from global projects set and persist
    try {
      const projRes = await fetch('/api/projects');
      const existingAll = (projRes && projRes.ok) ? await projRes.json() : (Array.isArray(projectsData) ? projectsData : []);
      const mergedAll = existingAll.filter(p => p.id !== projectId);
      await fetch('/api/projects', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projects: mergedAll }),
      });
    } catch (err) {
      console.error('Failed to persist delete to projects file', err);
    }
  };

  const handleChange = (e) => {
    setFormData({...formData, [e.target.name]: e.target.value});
  };

  return (
    <div className="max-w-5xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">Creator Dashboard</h1>

      {/* Creator header */}
      {creatorInfo ? (
        <div className="card p-4 mb-6 no-hover">
          <div className="flex items-center gap-4">
         <img
  src={profileForm.image || creatorInfo.image || '/uploads/default-avatar.png'}
  alt={creatorInfo.name}
  className="w-30 h-30 object-cover rounded-full shadow-md"
/>

            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">{creatorInfo.name}</h2>
                  <p className="text-sm muted">@{creatorInfo.username || creatorInfo.name}</p>
                </div>
                <div className="text-right">
                  <div className="text-sm muted">Projects</div>
                  <div className="text-xl font-bold">{projects.length}</div>
                </div>
              </div>
              <p className="mt-3 text-sm">{creatorInfo.bio}</p>
            </div>
            <div className="flex flex-col gap-2">
              <button onClick={() => setEditingProfile(p => !p)} className="btn btn-ghost">{editingProfile ? 'Cancel' : 'Edit Profile'}</button>
              <button onClick={() => { setEditingProject(null); setNewProject({ title: '', description: '', image: '' }); setShowAddProject(true); }} className="btn btn-primary">Add Project</button>
            </div>
          </div>

          {editingProfile && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
              <input name="name" value={profileForm.name} onChange={handleProfileChange} className="p-2 border rounded" placeholder="Display name" />
              <input name="username" value={profileForm.username} onChange={handleProfileChange} className="p-2 border rounded" placeholder="username" />
              <input
    type="file"
    accept="image/*"
    onChange={handleImageChange}
                className="p-2 border rounded"
                placeholder="Choose Profile Pic"
  />
              <textarea ref={bioRef} name="bio" value={profileForm.bio} onChange={handleProfileChange} className="p-2 border rounded md:col-span-2" placeholder="Short bio" />
              <div className="md:col-span-2 flex gap-2">
                <button onClick={handleSaveProfile} className="btn btn-primary">Save Profile</button>
                <button onClick={() => {
    // Reset the form to the original values
    setProfileForm({
      name: creatorInfo.name,
      username: creatorInfo.username,
      image: creatorInfo.image,
      bio: creatorInfo.bio,
    });
    setEditingProfile(false);
  }} className="btn btn-muted">Cancel</button>
              </div>
            </div>
          )}

          {/* Add Project modal is rendered at top-level of this file via Modal component */}
          <Modal open={showAddProject} onClose={closeModal} title={editingProject ? 'Edit Project' : 'New Project'}>
            <div className="mt-2">
              <input name="title" value={newProject.title} onChange={handleNewProjectChange} className="w-full p-2 border rounded mb-2" placeholder="Title" />
              <textarea name="description" value={newProject.description} onChange={handleNewProjectChange} className="w-full p-2 border rounded mb-2" placeholder="Description" />
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="w-full p-2 border rounded mb-2"
              />

              {newProjectError && <p className="text-danger mb-2">{newProjectError}</p>}
              <div className="flex gap-2 justify-end mt-2">
                <button onClick={editingProject ? handleSaveProjectModal : handleAddProject} disabled={isSubmitting} className="btn btn-primary">{isSubmitting ? 'Saving...' : (editingProject ? 'Save Changes' : 'Add Project')}</button>
              </div>
            </div>
          </Modal>
        </div>
      ) : (
        <div className="card p-4 mb-6">
          <p className="muted">No creator profile found for the signed-in account.</p>
        </div>
      )}

      {/* Projects */}
      <h2 className="text-2xl font-bold mb-2">Your Projects</h2>
      <div className="space-y-4">
        {projects.length === 0 && <p>No projects yet</p>}
        {projects.map(project => (
          <div key={project.id} className="card p-4">
            <img src={project.image || '/uploads/default-project.jpg'} alt={project.title} className="w-full h-40 object-cover rounded mb-3" />
            <div>
              <h3 className="font-bold text-xl">{project.title}</h3>
              <p className="muted">{project.description}</p>
              <div className="mt-2 space-x-2">
                <button onClick={() => handleEdit(project)} className="btn btn-primary">
                  Edit
                </button>
                <button onClick={() => handleDelete(project.id)} className="btn btn-danger">
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Requests */}
      <h2 className="text-2xl font-bold mt-8 mb-2">Requests</h2>
      <div className="space-y-4">
        {requests.length === 0 && <p>No requests yet</p>}
        {requests.map((r, idx) => (
          <div key={idx} className="card p-4">
            <p><strong>User:</strong> {r.user}</p>
            <p><strong>Message:</strong> {r.message}</p>
            {r.image && <img src={r.image} alt="Request Image" className="w-40 mt-2 rounded" />}
            <p><strong>Status:</strong> {r.status}</p>
            {r.status === "pending" && (
              <div className="mt-2 space-x-2">
                <button onClick={() => {
                  (async () => {
                    try {
                      const updated = [...requests];
                      updated[idx].status = 'accepted';
                      setRequests(updated);

                      // persist into projects.json
                      const projectsRes = await fetch('/api/projects');
                      const allProjects = await projectsRes.json();
                      const req = updated[idx];
                      const projIndex = allProjects.findIndex(p => p.id === req.projectId);
                      if (projIndex !== -1) {
                        const proj = allProjects[projIndex];
                        proj.requests = proj.requests || [];
                        const rIndex = proj.requests.findIndex(r => r.user === req.user && r.message === req.message && (r.image === req.image));
                        if (rIndex !== -1) {
                          proj.requests[rIndex].status = 'accepted';
                        } else {
                          const fallback = proj.requests.find(r => r.user === req.user);
                          if (fallback) fallback.status = 'accepted';
                        }
                        allProjects[projIndex] = proj;
                        await fetch('/api/projects', {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ projects: allProjects }),
                        });
                      }
                    } catch (err) {
                      console.error('Failed to persist request status', err);
                    }
                  })();
                }} className="btn btn-success">Accept</button>
                <button onClick={() => {
                  (async () => {
                    try {
                      const updated = [...requests];
                      updated[idx].status = 'rejected';
                      setRequests(updated);

                      const projectsRes = await fetch('/api/projects');
                      const allProjects = await projectsRes.json();
                      const req = updated[idx];
                      const projIndex = allProjects.findIndex(p => p.id === req.projectId);
                      if (projIndex !== -1) {
                        const proj = allProjects[projIndex];
                        proj.requests = proj.requests || [];
                        const rIndex = proj.requests.findIndex(r => r.user === req.user && r.message === req.message && (r.image === req.image));
                        if (rIndex !== -1) {
                          proj.requests[rIndex].status = 'rejected';
                        } else {
                          const fallback = proj.requests.find(r => r.user === req.user);
                          if (fallback) fallback.status = 'rejected';
                        }
                        allProjects[projIndex] = proj;
                        await fetch('/api/projects', {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ projects: allProjects }),
                        });
                      }
                    } catch (err) {
                      console.error('Failed to persist request status', err);
                    }
                  })();
                }} className="btn btn-danger">Reject</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
