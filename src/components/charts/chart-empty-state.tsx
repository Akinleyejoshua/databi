"use client";

import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  LineChart,
  PieChart,
  ScatterChart,
  Box,
  Target,
  Flame,
  Calendar,
  Layers,
  Table2,
  Package,
  TrendingDown,
  Filter,
  GitBranch,
  Palette,
  Activity,
  ListOrdered,
  type LucideProps,
} from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  bar: BarChart3,
  line: LineChart,
  pie: PieChart,
  scatter: ScatterChart,
  box: Box,
  target: Target,
  flame: Flame,
  calendar: Calendar,
  layers: Layers,
  table: Table2,
  package: Package,
  trendingDown: TrendingDown,
  filter: Filter,
  branch: GitBranch,
  palette: Palette,
  activity: Activity,
  list: ListOrdered,
};

export function ChartEmptyState({
  icon = "bar",
  message,
  height = 300,
}: {
  icon?: keyof typeof ICONS | LucideIcon;
  message: string;
  height?: number;
}) {
  const Icon = (typeof icon === "string" ? ICONS[icon] : icon) ?? BarChart3;
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "12px",
        height: `${height}px`,
        color: "var(--color-text-tertiary)",
        textAlign: "center",
        padding: "0 16px",
      }}
    >
      <Icon size={32} strokeWidth={1.5} />
      <span style={{ fontSize: "13px", maxWidth: "240px" }}>{message}</span>
    </div>
  );
}

export type { LucideProps };
