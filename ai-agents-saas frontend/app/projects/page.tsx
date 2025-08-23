"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const fetchProjects = async () => {
    setLoading(true);
    const res = await fetch("http://localhost:5000/api/users/projects", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setProjects(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  useEffect(() => {
    fetchProjects();
    // eslint-disable-next-line
  }, []);

  const createProject = async (e: any) => {
    e.preventDefault();
    setError("");
    const res = await fetch("http://localhost:5000/api/users/projects", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name, description }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.message || JSON.stringify(data) || "Error creating project");
      return;
    }
    setName("");
    setDescription("");
    fetchProjects();
  };

  const updateStatus = async (id: string, status: string) => {
    await fetch(`http://localhost:5000/api/users/projects/${id}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status }),
    });
    fetchProjects();
  };

  const deleteProject = async (id: string) => {
    await fetch(`http://localhost:5000/api/users/projects/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    fetchProjects();
  };

  return (
    <div className="max-w-3xl mx-auto py-10 px-4">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">My Projects</h1>
        <Link href="/dashboard" className="text-blue-600 underline text-sm font-medium">Back to Dashboard</Link>
      </div>
      <form onSubmit={createProject} className="mb-8 flex flex-col gap-2 bg-white p-4 rounded shadow">
        <input
          className="border rounded px-3 py-2"
          placeholder="Project Name"
          value={name}
          onChange={e => setName(e.target.value)}
          required
        />
        <textarea
          className="border rounded px-3 py-2"
          placeholder="Description (optional)"
          value={description}
          onChange={e => setDescription(e.target.value)}
        />
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded mt-2 hover:bg-blue-700 transition">Create Project</button>
        {error && <div className="text-red-600 text-sm mt-1">{error}</div>}
      </form>
      {loading ? (
        <div>Loading projects...</div>
      ) : (
        <div className="space-y-4">
          {projects.length === 0 && <div>No projects found.</div>}
          {projects.map((project: any) => (
            <div key={project._id} className="border rounded p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-2 bg-white shadow-sm">
              <div>
                <div className="font-semibold text-lg flex items-center gap-2">
                  {project.name}
                  <span className={`ml-2 px-2 py-1 rounded text-xs font-semibold ${project.status === "active" ? "bg-blue-100 text-blue-700" : project.status === "archived" ? "bg-yellow-100 text-yellow-700" : "bg-green-100 text-green-700"}`}>{project.status.charAt(0).toUpperCase() + project.status.slice(1)}</span>
                </div>
                <div className="text-gray-600 text-sm">{project.description}</div>
              </div>
              <div className="flex gap-2 mt-2 md:mt-0">
                {project.status !== "active" && (
                  <button className="px-2 py-1 bg-blue-200 rounded hover:bg-blue-300 transition" onClick={() => updateStatus(project._id, "active")}>Activate</button>
                )}
                {project.status !== "archived" && (
                  <button className="px-2 py-1 bg-yellow-200 rounded hover:bg-yellow-300 transition" onClick={() => updateStatus(project._id, "archived")}>Archive</button>
                )}
                {project.status !== "completed" && (
                  <button className="px-2 py-1 bg-green-200 rounded hover:bg-green-300 transition" onClick={() => updateStatus(project._id, "completed")}>Complete</button>
                )}
                <button className="px-2 py-1 bg-red-200 rounded hover:bg-red-300 transition" onClick={() => deleteProject(project._id)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 