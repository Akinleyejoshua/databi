/* ============================================================
   Action History Tracker
   Optional helper for tracking specific operations/commands
   Use this for more granular undo/redo if needed
   ============================================================ */

export interface Action {
  id: string;
  type: string;
  timestamp: number;
  description: string;
  undo: () => void;
  redo: () => void;
  metadata?: Record<string, any>;
}

export class ActionHistoryManager {
  private past: Action[] = [];
  private future: Action[] = [];
  private maxSize: number;

  constructor(maxSize: number = 100) {
    this.maxSize = maxSize;
  }

  /**
   * Record an action in the history
   */
  recordAction(action: Action): void {
    this.past.push(action);
    if (this.past.length > this.maxSize) {
      this.past.shift();
    }
    this.future = [];
  }

  /**
   * Undo the last action
   */
  undoAction(): Action | null {
    if (this.past.length === 0) return null;

    const action = this.past.pop()!;
    action.undo();
    this.future.unshift(action);
    return action;
  }

  /**
   * Redo the last undone action
   */
  redoAction(): Action | null {
    if (this.future.length === 0) return null;

    const action = this.future.shift()!;
    action.redo();
    this.past.push(action);
    return action;
  }

  /**
   * Check if undo is available
   */
  canUndo(): boolean {
    return this.past.length > 0;
  }

  /**
   * Check if redo is available
   */
  canRedo(): boolean {
    return this.future.length > 0;
  }

  /**
   * Get history statistics
   */
  getStats() {
    return {
      pastCount: this.past.length,
      futureCount: this.future.length,
      maxSize: this.maxSize,
    };
  }

  /**
   * Clear all history
   */
  clear(): void {
    this.past = [];
    this.future = [];
  }
}

/**
 * Example usage in a component or store:
 *
 * const historyManager = new ActionHistoryManager();
 *
 * // When adding a widget:
 * const widgetId = generateId();
 * const previousWidgets = project.widgets;
 *
 * historyManager.recordAction({
 *   id: generateId(),
 *   type: "addWidget",
 *   timestamp: Date.now(),
 *   description: "Add widget",
 *   undo: () => {
 *     const projectStore = useProjectStore.getState();
 *     projectStore.setProject({
 *       ...project,
 *       widgets: previousWidgets
 *     });
 *   },
 *   redo: () => {
 *     const projectStore = useProjectStore.getState();
 *     projectStore.addWidget(newWidget);
 *   },
 *   metadata: { widgetId }
 * });
 */
