/* ============================================================
   History Provider
   Initializes and manages undo/redo functionality
   Wrap your app with this provider to enable history tracking
   ============================================================ */

"use client";

import { useEffect } from "react";
import { useProjectHistory } from "@/store/use-project-history";

export function HistoryProvider({ children }: { children: React.ReactNode }) {
  // Initialize history tracking for project changes
  useProjectHistory();

  return <>{children}</>;
}
