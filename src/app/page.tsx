/* ============================================================
   Home Page — Login + Projects List
   ============================================================ */
"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/use-auth-store";
import { useUiStore } from "@/store/use-ui-store";
import ThemeToggle from "@/components/layout/theme-toggle";
import ToastContainer from "@/components/layout/toast-container";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";

interface ProjectSummary {
  _id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export default function HomePage() {
  const { user, isAuthenticated, isLoading: authLoading, login, logout, checkAuth } = useAuthStore();
  const { addToast } = useUiStore();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [showNewProject, setShowNewProject] = useState(false);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchProjects();
    }
  }, [isAuthenticated]);

  const fetchProjects = async () => {
    setProjectsLoading(true);
    try {
      const res = await fetch("/api/projects", { cache: "no-store" });
      const data = await res.json();
      setProjects(data);
    } catch {
      addToast("Failed to load projects", "error");
    } finally {
      setProjectsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoginLoading(true);
    try {
      await login(email);
      addToast("Welcome to Data BI!", "success");
    } catch (err: unknown) {
      addToast(err instanceof Error ? err.message : "Login failed", "error");
    } finally {
      setLoginLoading(false);
    }
  };

  const [isCreating, setIsCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) return;
    setIsCreating(true);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newProjectName }),
      });
      if (res.ok) {
        const project = await res.json();
        router.push(`/editor/${project._id}`);
      } else {
        throw new Error("Creation failed");
      }
    } catch {
      addToast("Failed to create project", "error");
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteProject = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/projects/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      setProjects((prev) => prev.filter((p) => p._id !== id));
      addToast("Project deleted", "info");
    } catch {
      addToast("Failed to delete project", "error");
    } finally {
      setDeletingId(null);
    }
  };

  // --- Login Screen ---
  if (authLoading) {
    return (
      <div className={styles["loading-screen"]}>
        <div className={styles["loading-logo"]}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
            <rect x="2" y="2" width="8" height="8" rx="2" fill="#4169E1" />
            <rect x="14" y="2" width="8" height="8" rx="2" fill="#4169E1" opacity="0.6" />
            <rect x="2" y="14" width="8" height="8" rx="2" fill="#4169E1" opacity="0.4" />
            <rect x="14" y="14" width="8" height="8" rx="2" fill="#4169E1" opacity="0.8" />
          </svg>
          <span>Data BI</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className={styles["login-page"]}>
        <div className={styles["login-bg"]}>
          <div className={styles["login-orb"]} />
          <div className={styles["login-orb-2"]} />
        </div>
        <div className={styles["login-card"]}>
          <div className={styles["login-header"]}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
              <rect x="2" y="2" width="8" height="8" rx="2" fill="#4169E1" />
              <rect x="14" y="2" width="8" height="8" rx="2" fill="#4169E1" opacity="0.6" />
              <rect x="2" y="14" width="8" height="8" rx="2" fill="#4169E1" opacity="0.4" />
              <rect x="14" y="14" width="8" height="8" rx="2" fill="#4169E1" opacity="0.8" />
            </svg>
            <h1>Data BI</h1>
            <p>Business Intelligence Platform</p>
          </div>

          <form onSubmit={handleLogin} className={styles["login-form"]}>
            <div>
              <label className="label">Email Address</label>
              <input
                className="input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoFocus
                style={{ height: "44px", fontSize: "15px" }}
              />
            </div>
            <button className="btn btn-primary btn-lg" type="submit" disabled={loginLoading} style={{ width: "100%" }}>
              {loginLoading ? "Signing in..." : "Continue with Email"}
            </button>
          </form>

          <p className={styles["login-note"]}>
            No password needed — just enter your email to get started.
          </p>
        </div>

        <div className={styles["login-theme"]}>
          <ThemeToggle />
        </div>

        {/* Footer */}
        <div style={{ position: "absolute", bottom: "24px", padding: "16px", display: "flex", justifyContent: "center", alignItems: "center", fontSize: "13px", color: "var(--color-text-tertiary)", zIndex: 10 }}>
          Built by <a href="https://joshuapro.netlify.app" target="_blank" rel="noopener noreferrer" style={{ color: "#2563eb", fontWeight: 600, textDecoration: "none", marginLeft: "6px" }}>Joshua Akinleye</a>
        </div>

        <ToastContainer />
      </div>
    );
  }

  // --- Projects Dashboard ---
  return (
    <div className={styles["dashboard"]}>
      <header className={styles["dashboard-header"]}>
        <div className={styles["dashboard-logo"]}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <rect x="2" y="2" width="8" height="8" rx="2" fill="#4169E1" />
            <rect x="14" y="2" width="8" height="8" rx="2" fill="#4169E1" opacity="0.6" />
            <rect x="2" y="14" width="8" height="8" rx="2" fill="#4169E1" opacity="0.4" />
            <rect x="14" y="14" width="8" height="8" rx="2" fill="#4169E1" opacity="0.8" />
          </svg>
          <span>Data BI</span>
        </div>
        <div className={styles["dashboard-actions"]}>
          <ThemeToggle />
          <div className={styles["user-pill"]}>
            <span>{user?.email}</span>
            <button className="btn btn-ghost btn-sm" onClick={logout}>Logout</button>
          </div>
        </div>
      </header>

      <main className={styles["dashboard-main"]}>
        <div className={styles["dashboard-top"]}>
          <div>
            <h1 className={styles["dashboard-title"]}>Your Projects</h1>
            <p className={styles["dashboard-subtitle"]}>Create and manage your business intelligence dashboards</p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowNewProject(true)}>
            + New Project
          </button>
        </div>

        {showNewProject && (
          <div className={styles["new-project-bar"]}>
            <input
              className="input"
              placeholder="Project name..."
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !isCreating && handleCreateProject()}
              autoFocus
              disabled={isCreating}
            />
            <button className="btn btn-primary btn-sm" onClick={handleCreateProject} disabled={isCreating}>
              {isCreating ? "Creating..." : "Create"}
            </button>
            <button className="btn btn-ghost btn-sm" onClick={() => setShowNewProject(false)} disabled={isCreating}>Cancel</button>
          </div>
        )}

        {projectsLoading ? (
          <div className={styles["projects-grid"]}>
            {[1, 2, 3].map((i) => (
              <div key={i} className={`${styles["project-card"]} skeleton`} style={{ height: "180px" }} />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div className={styles["empty-projects"]}>
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.3">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <line x1="12" y1="8" x2="12" y2="16" />
              <line x1="8" y1="12" x2="16" y2="12" />
            </svg>
            <h3>No projects yet</h3>
            <p>Create your first dashboard to get started</p>
            <button className="btn btn-primary" onClick={() => setShowNewProject(true)}>Create Project</button>
          </div>
        ) : (
          <div className={styles["projects-grid"]}>
            {projects.map((p) => (
              <div key={p._id} className={styles["project-card"]}>
                <div className={styles["project-card-header"]}>
                  <div className={styles["project-icon"]}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4169E1" strokeWidth="2">
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <line x1="3" y1="9" x2="21" y2="9" />
                      <line x1="9" y1="21" x2="9" y2="9" />
                    </svg>
                  </div>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => handleDeleteProject(p._id)}
                    style={{ color: "var(--color-danger)" }}
                    disabled={deletingId === p._id}
                  >
                    {deletingId === p._id ? "⌛" : "🗑"}
                  </button>
                </div>
                <h3 className={styles["project-name"]}>{p.name}</h3>
                <p className={styles["project-desc"]}>{p.description || "No description"}</p>
                <span className={styles["project-date"]}>
                  Updated {new Date(p.updatedAt).toLocaleDateString()}
                </span>
                <div className={styles["project-actions"]}>
                  <button className="btn btn-primary btn-sm" onClick={() => router.push(`/editor/${p._id}`)}>
                    Open Editor
                  </button>
                  {/* <button className="btn btn-secondary btn-sm" onClick={() => router.push(`/preview/${p._id}`)}>
                    Preview
                  </button> */}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <div style={{ padding: "16px", display: "flex", justifyContent: "center", alignItems: "center", fontSize: "13px", color: "var(--color-text-tertiary)", marginTop: "auto", borderTop: "1px solid var(--color-border-light)" }}>
        Built by <a href="https://joshuapro.netlify.app" target="_blank" rel="noopener noreferrer" style={{ color: "#2563eb", fontWeight: 600, textDecoration: "none", marginLeft: "6px" }}>Joshua Akinleye</a>
      </div>

      <ToastContainer />
    </div>
  );
}
