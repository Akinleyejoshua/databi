"use client";

import { useState, useEffect, useCallback } from "react";
import styles from "./color-picker.module.css";

/* ---------- Color helpers ---------- */

function hexToRgb(hex: string): [number, number, number] {
  let h = hex.replace("#", "").trim();
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  const num = parseInt(h.padEnd(6, "0").slice(0, 6), 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

function rgbToHex(r: number, g: number, b: number): string {
  return (
    "#" +
    [r, g, b]
      .map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0"))
      .join("")
  );
}

function parseColor(value: string): { hex: string; alpha: number } {
  if (!value) return { hex: "#ffffff", alpha: 1 };
  // var(...) — can't parse, treat as opaque placeholder
  if (value.trim().startsWith("var(")) return { hex: "#ffffff", alpha: 1 };

  const rgba = value.match(/rgba?\(([^)]+)\)/i);
  if (rgba) {
    const parts = rgba[1].split(",").map((p) => p.trim());
    const [r, g, b] = parts;
    const a = parts[3] !== undefined ? parseFloat(parts[3]) : 1;
    return { hex: rgbToHex(Number(r), Number(g), Number(b)), alpha: isNaN(a) ? 1 : a };
  }

  let h = value.replace("#", "").trim();
  if (h.length === 8) {
    const a = parseInt(h.slice(6, 8), 16) / 255;
    return { hex: "#" + h.slice(0, 6), alpha: isNaN(a) ? 1 : a };
  }
  if (h.length === 4) h = h.split("").map((c) => c + c).join("");
  if (/^[0-9a-fA-F]{6}$/.test(h)) return { hex: "#" + h, alpha: 1 };

  return { hex: "#ffffff", alpha: 1 };
}

function toRgba(hex: string, alpha: number): string {
  const [r, g, b] = hexToRgb(hex);
  const a = Math.round(alpha * 100) / 100;
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

/* ---------- Component ---------- */

export function ColorPicker({
  value,
  onChange,
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  label?: string;
}) {
  const isVar = !!value && value.trim().startsWith("var(");
  const { hex, alpha } = parseColor(value);
  const [localHex, setLocalHex] = useState(hex);
  const [localAlpha, setLocalAlpha] = useState(alpha);

  useEffect(() => {
    const p = parseColor(value);
    setLocalHex(p.hex);
    setLocalAlpha(p.alpha);
  }, [value]);

  const emit = useCallback(
    (h: string, a: number) => {
      setLocalHex(h);
      setLocalAlpha(a);
      onChange(toRgba(h, a));
    },
    [onChange]
  );

  if (isVar) {
    return (
      <div className={styles.picker}>
        <div className={styles.swatch} style={{ background: value }}>
          <span className={styles.varTag}>auto</span>
        </div>
        <input
          className="input"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{ flex: 1, height: "32px", fontSize: "12px" }}
        />
      </div>
    );
  }

  return (
    <div className={styles.picker}>
      <label className={styles.swatch} style={{ background: toRgba(localHex, localAlpha) }}>
        <input
          type="color"
          value={localHex}
          onChange={(e) => emit(e.target.value, localAlpha)}
          className={styles.colorInput}
        />
      </label>
      <input
        className="input"
        value={toRgba(localHex, localAlpha)}
        onChange={(e) => {
          const p = parseColor(e.target.value);
          emit(p.hex, p.alpha);
        }}
        style={{ flex: 1, height: "32px", fontSize: "12px" }}
      />
      <div className={styles.alphaWrap} title="Opacity">
        <input
          type="range"
          min={0}
          max={100}
          value={Math.round(localAlpha * 100)}
          onChange={(e) => emit(localHex, Number(e.target.value) / 100)}
          className={styles.alpha}
        />
        <span className={styles.alphaVal}>{Math.round(localAlpha * 100)}%</span>
      </div>
    </div>
  );
}
