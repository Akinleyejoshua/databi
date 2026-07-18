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
  const { setPreviewMode, setTheme, setCursorMode } = useUiStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setPreviewMode(true);
    setCursorMode("pan"); // Default to pan mode on share page
    setTheme("light"); // Force light mode for share page
    return () => {
      setPreviewMode(false);
    };
  }, [setPreviewMode, setTheme, setCursorMode]);

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
            color: "white"
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

      {/* Floating action menu (replaces the static badge to avoid overlap) */}
      <div style={{ position: "fixed", bottom: "24px", right: "24px", zIndex: 1000 }}>
        {/* Pop-out menu */}
        {menuOpen && (
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setMenuOpen(false)}
            style={{
              position: "absolute",
              bottom: "52px",
              right: 0,
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 18px",
              backgroundColor: "var(--color-bg-secondary)",
              borderRadius: "100px",
              textDecoration: "none",
              color: "var(--color-text)",
              fontSize: "14px",
              fontWeight: 600,
              whiteSpace: "nowrap",
              boxShadow: "0 8px 24px var(--color-shadow-strong)",
              animation: "share-menu-pop 0.18s ease"
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <rect x="2" y="2" width="8" height="8" rx="2" fill="#4169E1" />
              <rect x="14" y="2" width="8" height="8" rx="2" fill="#4169E1" opacity="0.6" />
              <rect x="2" y="14" width="8" height="8" rx="2" fill="#4169E1" opacity="0.4" />
              <rect x="14" y="14" width="8" height="8" rx="2" fill="#4169E1" opacity="0.8" />
            </svg>
            Build your own dashboard
          </a>
        )}

        {/* FAB toggle button */}
        <button
          aria-label="Menu"
          onClick={() => setMenuOpen((o) => !o)}
          style={{
            width: "40px",
            height: "40px",
            borderRadius: "50%",
            backgroundColor: "var(--color-primary)",
            color: "#fff",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 8px 24px var(--color-shadow-strong)",
            transition: "transform 0.2s ease"
          }}
        >
          {menuOpen ? (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          ) : (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="4" y1="7" x2="20" y2="7" />
              <line x1="4" y1="12" x2="20" y2="12" />
              <line x1="4" y1="17" x2="20" y2="17" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile responsive adjustments */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes share-menu-pop {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @media (max-width: 640px) {
          /* Keep the FAB clear of the sheets bar (40px) and floating toolbar */
          div[style*="position: fixed"] {
            bottom: 52px !important;
            right: 12px !important;
          }
        }
      `}} />
    </div>
  );
}
