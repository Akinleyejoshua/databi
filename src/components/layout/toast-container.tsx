/* ============================================================
   Toast Container
   ============================================================ */
"use client";

import { useUiStore } from "@/store/use-ui-store";

export default function ToastContainer() {
  const { toasts, removeToast } = useUiStore();

  if (toasts.length === 0) return null;

  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`toast toast-${toast.type}`}
          onClick={() => removeToast(toast.id)}
        >
          <span>
            {toast.type === "success" ? "✅" : toast.type === "error" ? "❌" : "ℹ️"}
          </span>
          <span>{toast.message}</span>
        </div>
      ))}
    </div>
  );
}
