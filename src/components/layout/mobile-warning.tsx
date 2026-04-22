/* ============================================================
   Mobile Warning Component
   ============================================================ */
"use client";

import { useState, useEffect } from "react";

export default function MobileWarning() {
  const [isMobile, setIsMobile] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  if (!isMobile || isDismissed) return null;

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      zIndex: 9999,
      backgroundColor: "var(--color-bg)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px",
      textAlign: "center"
    }}>
      <div style={{
        maxWidth: "400px",
        padding: "40px 24px",
        background: "var(--color-surface)",
        borderRadius: "24px",
        border: "1px solid var(--color-border)",
        boxShadow: "0 20px 50px var(--color-shadow-strong)"
      }}>
        <div style={{
          width: "64px",
          height: "64px",
          background: "var(--color-primary-glow)",
          borderRadius: "16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "32px",
          margin: "0 auto 24px"
        }}>
          🖥️
        </div>
        
        <h2 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "12px", color: "var(--color-text)" }}>
          Desktop Experience Recommended
        </h2>
        
        <p style={{ fontSize: "14px", color: "var(--color-text-secondary)", lineHeight: "1.6", marginBottom: "24px" }}>
          The Data BI Workspace is optimized for large screens to handle complex data modeling, 
          relationship mapping, and multi-widget canvas layouts that require precise interaction.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div style={{ 
            fontSize: "12px", 
            padding: "10px", 
            background: "var(--color-bg-secondary)", 
            borderRadius: "8px",
            color: "var(--color-text-tertiary)",
            marginBottom: "8px"
          }}>
            Please switch to a desktop or tablet for the full workspace experience.
          </div>
          
          <button 
            className="btn btn-primary" 
            style={{ width: "100%" }}
            onClick={() => setIsDismissed(true)}
          >
            Continue anyway (Limited UI)
          </button>
        </div>
      </div>
    </div>
  );
}
