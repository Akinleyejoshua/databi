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
      <div style={{ 
        display: "flex", 
        flexDirection: "column",
        alignItems: "center", 
        justifyContent: "center", 
        minHeight: "100vh", 
        gap: "24px", 
        backgroundColor: "var(--color-bg)",
        color: "var(--color-text)"
      }}>
        <div style={{ position: "relative", width: "64px", height: "64px" }}>
          {/* Pulsing circles for premium effect */}
          <div style={{ 
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            backgroundColor: "var(--color-primary)",
            opacity: 0.2,
            animation: "pulse-glow 2s infinite"
          }} />
          <div style={{ 
            position: "absolute",
            inset: "8px",
            borderRadius: "50%",
            backgroundColor: "var(--color-primary)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            boxShadow: "0 4px 12px rgba(65, 105, 225, 0.4)"
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 3v18h18" />
              <path d="m19 9-5 5-4-4-3 3" />
            </svg>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
          <h2 style={{ fontSize: "18px", fontWeight: 700, letterSpacing: "-0.02em" }}>Data BI</h2>
          <p style={{ 
            fontSize: "13px", 
            color: "var(--color-text-secondary)", 
            fontWeight: 500,
            opacity: 0.8,
            animation: "pulse-glow 1.5s infinite alternate"
          }}>
            Preparing your dashboard...
          </p>
        </div>
        
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes pulse-glow {
            0% { transform: scale(0.95); opacity: 0.2; }
            50% { transform: scale(1.1); opacity: 0.4; }
            100% { transform: scale(0.95); opacity: 0.2; }
          }
        `}} />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        display: "flex", 
        flexDirection: "column", 
        alignItems: "center", 
        justifyContent: "center", 
        minHeight: "100vh", 
        gap: "20px", 
        padding: "24px",
        textAlign: "center",
        backgroundColor: "var(--color-bg)",
        color: "var(--color-text-secondary)"
      }}>
        <div style={{ 
          width: "80px", 
          height: "80px", 
          borderRadius: "50%", 
          backgroundColor: "rgba(239, 68, 68, 0.1)", 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "center",
          color: "var(--color-danger)",
          marginBottom: "8px"
        }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="12" cy="12" r="10" />
            <path d="m15 9-6 6" />
            <path d="m9 9 6 6" />
          </svg>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <h2 style={{ fontSize: "20px", fontWeight: 700, color: "var(--color-text)" }}>Project Not Found</h2>
          <p style={{ fontSize: "14px", maxWidth: "320px", lineHeight: 1.6 }}>
            {error}
          </p>
        </div>
        <a 
          href="/" 
          className="btn btn-secondary"
          style={{ marginTop: "12px", borderRadius: "100px", padding: "0 24px" }}
        >
          Return to Workspace
        </a>
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
      {projectInStore && <CanvasArea isSharePage={true} />}
    </div>
  );
}
