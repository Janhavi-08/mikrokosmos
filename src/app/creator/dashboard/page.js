"use client";

import { useState, useEffect, useRef } from "react";
import { getImageUrl } from '../../../lib/getImageUrl';
import projectsData from "../../../data/projects.json";
import Modal from '../../../components/Modal';

export default function CreatorDashboard() {
  const [projects, setProjects] = useState([]);
  const [requests, setRequests] = useState([]);
  const [projectPage, setProjectPage] = useState(0);
  const projectsPerPage = 6;
  const [requestsPage, setRequestsPage] = useState(0);
  const requestsPerPage = 6;
  const [creatorInfo, setCreatorInfo] = useState(null);
  const [editingProject, setEditingProject] = useState(null);
  const [formData, setFormData] = useState({ title: "", description: "", image: "" });
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({ name: "", username: "", bio: "", image: "" });
  const [profileImageFile, setProfileImageFile] = useState(null);
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

  // reset pagination when lists change
  useEffect(() => setProjectPage(0), [projects]);
  useEffect(() => setRequestsPage(0), [requests]);

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
      // Prepare form data to save; if a new profile image file was selected, upload it first
      const formToSave = { ...profileForm };
      if (profileImageFile) {
        const fd = new FormData();
        fd.append('image', profileImageFile);
        const upRes = await fetch('/api/upload', { method: 'POST', body: fd });
        if (!upRes.ok) {
          console.error('Profile image upload failed');
          return;
        }
        let upData;
        try { upData = await upRes.json(); } catch (e) { console.error('Invalid upload response', e); return; }
        if (upData.url) {
          // ensure the uploaded profile image is reachable before saving
          const ok = await verifyUrl(upData.url);
          if (ok) {
            formToSave.image = upData.url;
          } else {
            formToSave.image = upData.url; // still save url, but notify user
            window.dispatchEvent(new CustomEvent('toast', { detail: { message: 'Profile uploaded but image may not be immediately available', type: 'warning' } }));
          }
        }
      }

      const res = await fetch('/api/creators');
      const creators = res.ok ? await res.json() : [];
      const updated = creators.map(c => c.id === creatorInfo.id ? { ...c, ...formToSave } : c);
      await fetch('/api/creators', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updated) });
      setCreatorInfo({ ...creatorInfo, ...formToSave });
      setEditingProfile(false);
      window.dispatchEvent(new CustomEvent('toast', { detail: { message: 'Profile updated', type: 'success' } }));
    } catch (err) {
      console.error('Failed to save profile', err);
    }
  };


  // Handle text input changes
  const handleNewProjectChange = (e) => setNewProject({ ...newProject, [e.target.name]: e.target.value });

  // Verify a URL is reachable (HEAD) with a few retries — helpful in dev where file availability may be slightly delayed
  const verifyUrl = async (url, retries = 5, delayMs = 200) => {
    for (let i = 0; i < retries; i++) {
      try {
        const res = await fetch(url, { method: 'HEAD' });
        if (res.ok) return true;
      } catch (err) {
        // ignore and retry
      }
      await new Promise(r => setTimeout(r, delayMs));
    }
    return false;
  };

  // Handle image file upload for project
  const handleProjectImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('image', file);
    try {
      debugger;
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      if (!res.ok) {
        setNewProjectError('Image upload failed');
        return;
      }
      let data;
      try { data = await res.json(); } catch (e) { setNewProjectError('Invalid upload response'); return; }
      if (data.url) {
        const ok = await verifyUrl(data.url);
        if (ok) {
          setNewProject(prev => ({ ...prev, image: data.url }));
        } else {
          // still set it so user can try, but show an error/toast
          setNewProject(prev => ({ ...prev, image: data.url }));
          setNewProjectError('Uploaded but image not immediately available — try refreshing');
        }
      } else {
        setNewProjectError('Image upload failed');
      }
    } catch (err) {
      console.error('Upload error', err);
      setNewProjectError('Image upload failed');
    }
  };

  const handleAddProject = async () => {
    if (!creatorInfo) {
      alert('No creator context');
      return;
    }
          debugger;

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
      const img = newProject.image.trim();
      // allow relative uploads (starting with '/') or data URLs or absolute URLs
      if (!(img.startsWith('/') || img.startsWith('data:') || img.startsWith('http://') || img.startsWith('https://'))) {
        try {
          new URL(img);
        } catch (err) {
          setNewProjectError('Image must be a valid URL or uploaded file');
          return;
        }
      }
    }

    const proj = { id: `project-${Date.now()}`, creatorId: creatorInfo.id, title: newProject.title.trim(), description: newProject.description.trim(), image: newProject.image || getImageUrl('default-project.jpg'), requests: [] };
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
      window.dispatchEvent(new CustomEvent('toast', { detail: { message: 'Project added', type: 'success' } }));
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
      setProfileImageFile(file);
      // create preview URL
      const preview = URL.createObjectURL(file);
      setProfileForm((prev) => ({ ...prev, image: preview }));
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
      const img = newProject.image.trim();
      if (!(img.startsWith('/') || img.startsWith('data:') || img.startsWith('http://') || img.startsWith('https://'))) {
        try { new URL(img); } catch (err) { setNewProjectError('Image must be a valid URL or uploaded file'); return; }
      }
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
        image: newProject.image || getImageUrl('default-project.jpg'),
        requests: existing.requests || [],
      };
      const merged = allProjects.map(p => p.id === editingProject ? updatedProject : p);
      await fetch('/api/projects', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ projects: merged }) });
      // update local list
      setProjects(prev => prev.map(p => p.id === editingProject ? updatedProject : p));
      setEditingProject(null);
      setShowAddProject(false);
      setNewProjectError('');
      window.dispatchEvent(new CustomEvent('toast', { detail: { message: 'Project updated', type: 'success' } }));
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
      window.dispatchEvent(new CustomEvent('toast', { detail: { message: 'Project saved', type: 'success' } }));
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
      window.dispatchEvent(new CustomEvent('toast', { detail: { message: 'Project deleted', type: 'success' } }));
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
  src={profileForm.image || creatorInfo.image || 'default-avatar.png'}
  alt={creatorInfo.name}
  className="w-24 h-24 object-cover rounded-full shadow-md"
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
                onChange={handleProjectImageUpload}
                className="w-full p-2 border rounded mb-2"
              />
              {newProject.image && (
                <img src={newProject.image} alt="Project preview" className="w-32 h-20 object-cover rounded mb-2" />
              )}

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
        {(() => {
          const totalProjectPages = Math.max(1, Math.ceil(projects.length / projectsPerPage));
          const pageProjects = projects.slice(projectPage * projectsPerPage, (projectPage + 1) * projectsPerPage);
          return (
            <>
              {pageProjects.map(project => (
                <div key={project.id} className="card p-4">
                  <img src={project.image || getImageUrl('default-project.jpg')} alt={project.title} className="w-full h-40 object-cover rounded mb-3" />
                  <div>
                    <h3 className="font-bold text-xl">{project.title}</h3>
                    <p className="muted">{project.description}</p>
                    <div className="mt-2 space-x-2">
                      <button onClick={() => handleEdit(project)} className="btn btn-primary">Edit</button>
                      <button onClick={() => handleDelete(project.id)} className="btn btn-danger">Delete</button>
                    </div>
                  </div>
                </div>
              ))}
              <div className="flex items-center justify-between mt-2">
                <div className="text-sm muted">{projects.length} projects</div>
                <div className="flex items-center gap-3">
                  <button onClick={() => setProjectPage(p => Math.max(0, p - 1))} disabled={projectPage === 0} className="btn btn-ghost">Prev</button>
                  <div className="text-sm muted">Page {projectPage + 1} / {totalProjectPages}</div>
                  <button onClick={() => setProjectPage(p => Math.min(totalProjectPages - 1, p + 1))} disabled={projectPage + 1 >= totalProjectPages} className="btn btn-primary">Next</button>
                </div>
              </div>
            </>
          );
        })()}
      </div>

      {/* Requests */}
      <h2 className="text-2xl font-bold mt-8 mb-2">Requests</h2>
      <div className="space-y-4">
        {requests.length === 0 && <p>No requests yet</p>}
        {(() => {
          const totalReqPages = Math.max(1, Math.ceil(requests.length / requestsPerPage));
          const pageRequests = requests.slice(requestsPage * requestsPerPage, (requestsPage + 1) * requestsPerPage);
          return (
            <>
              {pageRequests.map((r, idx) => (
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
                              window.dispatchEvent(new CustomEvent('toast', { detail: { message: 'Request accepted', type: 'success' } }));
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
                              window.dispatchEvent(new CustomEvent('toast', { detail: { message: 'Request rejected', type: 'success' } }));
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
    </div>
  );
}
