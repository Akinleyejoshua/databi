/* ============================================================
   Header Component — Top bar for the editor
   ============================================================ */
"use client";

import { useProjectStore } from "@/store/use-project-store";
import { useUiStore } from "@/store/use-ui-store";
import { useAuthStore } from "@/store/use-auth-store";
import { useSaveManager } from "@/hooks/use-save-manager";
import ThemeToggle from "./theme-toggle";
import styles from "./header.module.css";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";

export default function Header() {
  const { project, isSaving, updateProjectMeta } = useProjectStore();
  const { activeTab, setActiveTab, setPreviewMode, isPreviewMode, setShareModalOpen, autoSaveEnabled, setAutoSaveEnabled } = useUiStore();
  const { user, logout } = useAuthStore();
  const { handleSave, isDirty, unsavedChanges } = useSaveManager();
  
  const [showSaveDropdown, setShowSaveDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowSaveDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className={styles.header}>
      <div className={styles["header-left"]}>
        <Link href="/" className={styles.logo}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <rect x="2" y="2" width="8" height="8" rx="2" fill="#4169E1" />
            <rect x="14" y="2" width="8" height="8" rx="2" fill="#4169E1" opacity="0.6" />
            <rect x="2" y="14" width="8" height="8" rx="2" fill="#4169E1" opacity="0.4" />
            <rect x="14" y="14" width="8" height="8" rx="2" fill="#4169E1" opacity="0.8" />
          </svg>
          <span className={styles["logo-text"]}>Data BI</span>
        </Link>

        {project && (
          <div className={styles["project-name"]}>
            <span className={styles.separator}>/</span>
            <input
              className={styles["project-title-input"]}
              value={project.name}
              onChange={(e) => updateProjectMeta(e.target.value, project.description || "")}
              placeholder="Project Name"
              onBlur={() => {
                if (autoSaveEnabled && isDirty) handleSave();
              }}
            />
            {unsavedChanges && <span className={styles["unsaved-dot"]} title="Unsaved changes" />}
          </div>
        )}
      </div>

      {project && (
        <nav className={styles["header-tabs"]}>
          {(["data", "canvas", "preview"] as const).map((tab) => (
            <button
              key={tab}
              className={`${styles["tab-btn"]} ${
                activeTab === tab ? styles["tab-btn--active"] : ""
              }`}
              onClick={() => {
                setActiveTab(tab);
                setPreviewMode(tab === "preview");
              }}
            >
              {tab === "data" && (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <ellipse cx="12" cy="5" rx="9" ry="3" />
                  <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
                  <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
                </svg>
              )}
              {tab === "canvas" && (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <line x1="3" y1="9" x2="21" y2="9" />
                  <line x1="9" y1="21" x2="9" y2="9" />
                </svg>
              )}
              {tab === "preview" && (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
              <span>{tab.charAt(0).toUpperCase() + tab.slice(1)}</span>
            </button>
          ))}
        </nav>
      )}

      <div className={styles["header-right"]}>
        {project && (
          <>
           
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => setShareModalOpen(true)}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="18" cy="5" r="3" />
                <circle cx="6" cy="12" r="3" />
                <circle cx="18" cy="19" r="3" />
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
              </svg>
              Share
            </button>
            <div className={styles["save-container"]} ref={dropdownRef}>
              <div className={styles["save-split-btn"]}>
                <button
                  className={`btn btn-primary btn-sm ${styles["save-main-btn"]} ${isSaving ? styles.saving : ""}`}
                  onClick={handleSave}
                  disabled={isSaving || !isDirty}
                  title={isDirty ? "Save project (Ctrl+S)" : "No unsaved changes"}
                >
                  {isSaving ? (
                    <>
                      <span className={styles.spinner} />
                      Saving...
                    </>
                  ) : (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                        <polyline points="17 21 17 13 7 13 7 21" />
                        <polyline points="7 3 7 8 15 8" />
                      </svg>
                      Save
                    </>
                  )}
                </button>
                <button 
                  className={`btn btn-primary btn-sm ${styles["save-arrow-btn"]}`}
                  onClick={() => setShowSaveDropdown(!showSaveDropdown)}
                >
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </button>
              </div>

              {showSaveDropdown && (
                <div className={styles["save-dropdown"]}>
                  <div 
                    className={`${styles["dropdown-item"]} ${autoSaveEnabled ? styles["dropdown-item--active"] : ""}`}
                    onClick={() => {
                      setAutoSaveEnabled(!autoSaveEnabled);
                      setShowSaveDropdown(false);
                    }}
                  >
                    <div className={styles["dropdown-item-icon"]}>
                      {autoSaveEnabled ? (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="3">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      ) : (
                        <div className={styles["empty-check"]} />
                      )}
                    </div>
                    <div className={styles["dropdown-item-content"]}>
                      <span className={styles["dropdown-item-title"]}>Auto-save</span>
                      <span className={styles["dropdown-item-desc"]}>Sync changes instantly</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
        <ThemeToggle />
        {user && (
          <div className={styles["user-menu"]}>
            <div className={styles.avatar}>
              {user.name.charAt(0).toUpperCase()}
            </div>
            <button className="btn btn-ghost btn-sm" onClick={logout}>
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
