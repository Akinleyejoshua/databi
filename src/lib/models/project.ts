/* ============================================================
   Project Mongoose Model
   ============================================================ */

import mongoose, { Schema, type Document } from "mongoose";
import type { Project } from "@/types";

export interface IProject extends Omit<Project, "_id">, Document {}

const ProjectSchema = new Schema<IProject>(
  {
    name: { type: String, required: true },
    description: { type: String, default: "" },
    userId: { type: String, required: true, index: true },
    tables: { type: Schema.Types.Mixed, default: [] },
    relationships: { type: Schema.Types.Mixed, default: [] },
    measures: { type: Schema.Types.Mixed, default: [] },
    widgets: { type: Schema.Types.Mixed, default: [] },
    canvasSettings: {
      type: Schema.Types.Mixed,
      default: {
        backgroundColor: "#ffffff",
        width: 1200,
        cols: 24,
        rowHeight: 30,
      },
    },
    filters: { type: Schema.Types.Mixed, default: {} },
    shareToken: { type: String, unique: true, sparse: true },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc: unknown, ret: Record<string, unknown>) => {
        ret._id = String(ret._id);
        return ret;
      },
    },
  }
);

export const ProjectModel =
  mongoose.models.Project ||
  mongoose.model<IProject>("Project", ProjectSchema);
