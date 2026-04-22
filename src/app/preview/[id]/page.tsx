/* ============================================================
   Preview Page — Full-screen canvas-only view
   ============================================================ */
"use client";

import { useEffect, use } from "react";
import { useProjectStore } from "@/store/use-project-store";
import CanvasArea from "@/components/canvas/canvas-area";
import ThemeToggle from "@/components/layout/theme-toggle";
import ToastContainer from "@/components/layout/toast-container";
import { useUiStore } from "@/store/use-ui-store";
import Link from "next/link";

export default function PreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { loadProject, project, isLoading } = useProjectStore();
  const { setPreviewMode } = useUiStore();

  useEffect(() => {
    setPreviewMode(true);
    if (id) loadProject(id);
    return () => setPreviewMode(false);
  }, [id, loadProject, setPreviewMode]);

  if (isLoading || !project) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", gap: "12px", color: "var(--color-text-secondary)" }}>
        <div style={{ width: 32, height: 32, border: "3px solid var(--color-border)", borderTopColor: "var(--color-primary)", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
        Loading preview...
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh" }}>
      <div style={{ position: "fixed", top: 16, right: 16, zIndex: 100, display: "flex", gap: 8, alignItems: "center" }}>
        <ThemeToggle />
        <Link href={`/editor/${id}`} className="btn btn-secondary btn-sm">
          ← Back to Editor
        </Link>
      </div>
      <div style={{ padding: "16px 0" }}>
        <h1 style={{ textAlign: "center", fontSize: "20px", fontWeight: 700, marginBottom: 8 }}>{project.name}</h1>
      </div>
      <CanvasArea />
      <ToastContainer />
    </div>
  );
}
