/* ============================================================
   Share Page — Read-only public view
   ============================================================ */
"use client";

import { useEffect, useState, use } from "react";
import { useProjectStore } from "@/store/use-project-store";
import CanvasArea from "@/components/canvas/canvas-area";
import ThemeToggle from "@/components/layout/theme-toggle";
import { useUiStore } from "@/store/use-ui-store";
import type { Project } from "@/types";

export default function SharePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const setProject = useProjectStore((state) => state.setProject);
  const projectInStore = useProjectStore((state) => state.project);
  const { setPreviewMode, setTheme } = useUiStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setPreviewMode(true);
    setTheme("light"); // Force light mode for share page
    return () => {
      setPreviewMode(false);
    };
  }, [setPreviewMode, setTheme]);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const res = await fetch(`/api/share/${token}`);
        if (!res.ok) throw new Error("Project not found");
        const project: Project = await res.json();
        setProject(project);
      } catch {
        setError("This shared dashboard could not be found or has been removed.");
      } finally {
        setLoading(false);
      }
    };

    if (token) fetchProject();
  }, [token, setProject]);

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", gap: "12px", color: "var(--color-text-secondary)" }}>
        Loading shared dashboard...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", gap: "16px", color: "var(--color-text-secondary)" }}>
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.4">
          <circle cx="12" cy="12" r="10" />
          <line x1="15" y1="9" x2="9" y2="15" />
          <line x1="9" y1="9" x2="15" y2="15" />
        </svg>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div style={{ 
      height: "100vh", 
      width: "100vw",
      display: "flex", 
      flexDirection: "column",
      backgroundColor: "var(--color-bg)",
      overflow: "hidden"
    }}>
      {projectInStore && <CanvasArea />}
    </div>
  );
}
