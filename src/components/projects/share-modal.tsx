/* ============================================================
   Share Modal
   ============================================================ */
"use client";

import { useState } from "react";
import { useProjectStore } from "@/store/use-project-store";
import { useUiStore } from "@/store/use-ui-store";
import { v4 as uuidv4 } from "uuid";

export default function ShareModal() {
  const { isShareModalOpen, setShareModalOpen, addToast } = useUiStore();
  const { project, updateWidget, saveProject } = useProjectStore();
  const [isCopied, setIsCopied] = useState(false);

  if (!isShareModalOpen || !project) return null;

  const shareToken = project.shareToken;
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  const shareUrl = shareToken ? `${baseUrl}/share/${shareToken}` : "";

  const generateLink = async () => {
    const token = uuidv4().slice(0, 12);
    // Update project with share token via API
    try {
      const res = await fetch(`/api/projects/${project._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...project, shareToken: token }),
      });
      if (res.ok) {
        const updated = await res.json();
        useProjectStore.getState().setProject(updated);
        addToast("Share link generated!", "success");
      }
    } catch {
      addToast("Failed to generate link", "error");
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
    addToast("Link copied to clipboard", "success");
  };

  const exportProject = () => {
    const blob = new Blob([JSON.stringify(project, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${project.name.replace(/\s+/g, "-").toLowerCase()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    addToast("Project exported", "success");
  };

  return (
    <div className="modal-overlay" onClick={() => setShareModalOpen(false)}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "480px" }}>
        <div className="modal-header">
          <h2>Share & Export</h2>
          <button className="btn btn-ghost btn-icon" onClick={() => setShareModalOpen(false)}>✕</button>
        </div>
        <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div>
            <h3 style={{ fontSize: "14px", fontWeight: 600, marginBottom: "8px" }}>🔗 Share Link</h3>
            <p style={{ fontSize: "13px", color: "var(--color-text-secondary)", marginBottom: "12px" }}>
              Generate a read-only link for stakeholders to view your dashboard.
            </p>
            {shareUrl ? (
              <div style={{ display: "flex", gap: "8px" }}>
                <input className="input" value={shareUrl} readOnly style={{ flex: 1 }} />
                <button className="btn btn-primary btn-sm" onClick={copyLink}>
                  {isCopied ? "Copied!" : "Copy"}
                </button>
              </div>
            ) : (
              <button className="btn btn-primary" onClick={generateLink} style={{ width: "100%" }}>
                Generate Share Link
              </button>
            )}
          </div>

          <div className="divider" />

          <div>
            <h3 style={{ fontSize: "14px", fontWeight: 600, marginBottom: "8px" }}>📥 Export</h3>
            <button className="btn btn-secondary" onClick={exportProject} style={{ width: "100%" }}>
              Download Project as JSON
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
