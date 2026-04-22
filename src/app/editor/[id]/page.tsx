/* ============================================================
   Editor Page — Main BI editor
   ============================================================ */
"use client";

import { useEffect, use } from "react";
import { useProjectStore } from "@/store/use-project-store";
import { useUiStore } from "@/store/use-ui-store";
import { useAuthStore } from "@/store/use-auth-store";
import Header from "@/components/layout/header";
import Sidebar from "@/components/layout/sidebar";
import CanvasArea from "@/components/canvas/canvas-area";
import SettingsSidebar from "@/components/canvas/settings-sidebar";
import DataTableView from "@/components/data/data-table";
import UploadModal from "@/components/data/upload-modal";
import RelationshipsModal from "@/components/data/relationships-modal";
import MeasuresModal from "@/components/data/measures-modal";
import ShareModal from "@/components/projects/share-modal";
import ToastContainer from "@/components/layout/toast-container";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";

export default function EditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { loadProject, project, isLoading } = useProjectStore();
  const { activeTab, isPreviewMode, selectedTableId } = useUiStore();
  const { isAuthenticated, isLoading: authLoading, checkAuth } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/");
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (id && isAuthenticated) {
      loadProject(id).catch(() => {
        useUiStore.getState().addToast("Project not found or you don't have access.", "error");
        router.push("/");
      });
    }
  }, [id, isAuthenticated, loadProject, router]);

  if (authLoading || isLoading || !project) {
    return (
      <div className={styles["loading"]}>
        <div className={styles["loading-spinner"]} />
        <span>Loading project...</span>
      </div>
    );
  }

  return (
    <div className={styles["editor"]}>
      <Header />
      <div className={styles["editor-body"]}>
        {!isPreviewMode && <Sidebar />}

        <div className={styles["editor-main"]}>
          {activeTab === "data" && <DataTableView />}
          {(activeTab === "canvas" || activeTab === "preview") && <CanvasArea />}
        </div>

        {activeTab === "canvas" && !isPreviewMode && <SettingsSidebar />}
      </div>

      {/* Modals */}
      <UploadModal />
      <RelationshipsModal />
      <MeasuresModal />
      <ShareModal />
      <ToastContainer />
    </div>
  );
}
