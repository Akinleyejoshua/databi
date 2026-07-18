/* ============================================================
   Gradient Picker — two-stop gradient with angle control
   ============================================================ */
"use client";

import { useState } from "react";
import { ColorPicker } from "./color-picker";
import styles from "./color-picker.module.css";

interface Props {
  value: string; // e.g. linear-gradient(135deg, #4169e1, #2f52c7)
  onChange: (v: string) => void;
}

function parseGradient(value: string) {
  const angleMatch = value.match(/linear-gradient\(\s*([0-9]+)deg/);
  const colorMatches = value.match(/rgba?\([^)]*\)|#[0-9a-fA-F]{3,8}|var\([^)]*\)/g) || [];
  return {
    angle: angleMatch ? parseInt(angleMatch[1], 10) : 135,
    from: colorMatches[0] || "#4169e1",
    to: colorMatches[1] || "#2f52c7",
  };
}

export function GradientPicker({ value, onChange }: Props) {
  const { angle, from, to } = parseGradient(value);
  const [localAngle, setLocalAngle] = useState(angle);

  const build = (a: number, f: string, t: string) =>
    `linear-gradient(${a}deg, ${f}, ${t})`;

  return (
    <div className={styles.field}>
      <label className="label">Gradient</label>
      <div
        style={{
          height: "40px",
          borderRadius: "var(--space-2)",
          background: build(localAngle, from, to),
          marginBottom: "var(--space-3)",
        }}
      />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
        <ColorPicker value={from} onChange={(v) => onChange(build(localAngle, v, to))} />
        <ColorPicker value={to} onChange={(v) => onChange(build(localAngle, from, v))} />
      </div>
      <label className="label" style={{ display: "block", marginBottom: "4px" }}>
        Angle: {localAngle}°
      </label>
      <input
        type="range"
        min={0}
        max={360}
        value={localAngle}
        onChange={(e) => {
          const a = Number(e.target.value);
          setLocalAngle(a);
          onChange(build(a, from, to));
        }}
        style={{ width: "100%", accentColor: "var(--color-primary)" }}
      />
    </div>
  );
}
