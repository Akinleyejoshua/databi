/* ============================================================
   Keyboard Shortcuts Provider
   Global keyboard shortcut handler for entire application
   ============================================================ */

"use client";

import { useEffect } from "react";
import { useHistoryShortcuts } from "@/store/use-project-history";

export function KeyboardShortcutsProvider({ children }: { children: React.ReactNode }) {
  // Initialize keyboard shortcuts
  useHistoryShortcuts();

  return <>{children}</>;
}
