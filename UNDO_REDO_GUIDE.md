# Undo/Redo Feature Guide

## Overview

This application includes a comprehensive undo/redo system that tracks all changes made to projects. Users can easily reverse or re-apply actions using keyboard shortcuts or the floating toolbar.

## Features

### 1. **Keyboard Shortcuts**
- **Undo**: `Ctrl+Z` (Windows/Linux) or `Cmd+Z` (Mac)
- **Redo**: `Ctrl+Shift+Z` or `Ctrl+Y` (Windows/Linux) or `Cmd+Shift+Z` (Mac)

### 2. **Floating Toolbar Buttons**
- Undo button (↶ icon) with tooltip showing "Undo (Ctrl+Z)"
- Redo button (↷ icon) with tooltip showing "Redo (Ctrl+Shift+Z)"
- Buttons are automatically disabled when no undo/redo is available

### 3. **Supported Operations**
The undo/redo system tracks changes for:
- Adding/removing tables
- Adding/removing widgets
- Updating widget properties (style, position, size)
- Adding/removing relationships
- Adding/removing measures
- Changing canvas settings
- Updating project metadata
- Widget layout changes (drag & drop, resize)

## Technical Implementation

### Architecture

The undo/redo system is built on three main components:

#### 1. **History Store** (`use-history-store.ts`)
- Zustand store that manages the history stack
- Maintains two arrays: `past` and `future`
- Stores up to 100 history states (configurable via `DEFAULT_HISTORY_SIZE`)

```typescript
interface HistoryStore {
  past: Project[];
  future: Project[];
  pushHistory: (project: Project) => void;
  undo: () => Project | null;
  redo: () => Project | null;
  canUndo: () => boolean;
  canRedo: () => boolean;
}
```

#### 2. **Project History Integration** (`use-project-history.ts`)
- Custom hook that integrates history tracking with the project store
- Automatically detects project state changes and pushes to history
- Provides `useHistoryShortcuts` hook for keyboard shortcut handling

```typescript
const { undo, redo, canUndo, canRedo } = useHistoryShortcuts();
```

#### 3. **Canvas Area Integration** (`canvas-area.tsx`)
- Displays undo/redo buttons in the floating toolbar
- Buttons are disabled when no actions are available
- Keyboard shortcuts are automatically handled

## File Structure

```
src/
├── store/
│   ├── use-history-store.ts       # Core history state management
│   ├── use-project-history.ts     # Integration hook with project store
│   └── use-project-store.ts       # (existing) Project state management
├── components/
│   └── canvas/
│       ├── canvas-area.tsx        # Updated with undo/redo buttons
│       └── canvas-area.module.css # Updated with button styles
└── lib/
    └── action-history.ts          # Optional: Manual action tracking utility
```

## Usage

### Basic Usage (Automatic)

The undo/redo system works automatically. No code changes needed to existing actions. Simply:

1. Use the keyboard shortcuts: `Ctrl+Z` and `Ctrl+Shift+Z`
2. Or click the toolbar buttons in the canvas editor

### Advanced Usage (Manual Action Tracking)

For more granular control or custom operations, use the `ActionHistoryManager`:

```typescript
import { ActionHistoryManager } from "@/lib/action-history";

const historyManager = new ActionHistoryManager();

// Record a custom action
historyManager.recordAction({
  id: generateId(),
  type: "customOperation",
  timestamp: Date.now(),
  description: "Custom operation description",
  undo: () => {
    // Code to undo the operation
  },
  redo: () => {
    // Code to redo the operation
  },
  metadata: { /* optional metadata */ }
});

// Trigger undo/redo manually
historyManager.undoAction();
historyManager.redoAction();

// Check availability
if (historyManager.canUndo()) {
  // Undo is available
}
```

## Configuration

### History Size Limit

To change the maximum number of history states (default is 100):

Edit `src/store/use-history-store.ts`:

```typescript
const DEFAULT_HISTORY_SIZE = 100; // Change this value
```

## Performance Considerations

### Snapshot-Based Approach
- The current implementation uses full project snapshots
- Each state change creates a complete copy of the project
- Suitable for projects up to ~10,000 widgets
- For larger projects, consider implementing action-based undo/redo

### Memory Usage
- 100 history states × average project size = memory overhead
- Monitor for performance issues with very large projects
- Can be optimized with incremental/delta-based history if needed

## Troubleshooting

### Undo/Redo Not Working
1. Ensure you're not typing in an input field (shortcuts are disabled in inputs)
2. Check that the canvas area has focus
3. Verify the buttons show as enabled in the toolbar

### Performance Issues
- Reduce `DEFAULT_HISTORY_SIZE` if memory is a concern
- Clear history more frequently if working with very large projects
- Consider implementing action-based history for enterprise use

## Future Enhancements

Potential improvements:
- [ ] Persistent history (save to localStorage or database)
- [ ] Collaborative undo/redo (track by user)
- [ ] Action-based history (smaller memory footprint)
- [ ] History timeline visualization
- [ ] Selective undo (undo specific actions, not just last action)
- [ ] Merge consecutive operations (e.g., multiple drag operations)

## Testing

### Manual Testing Checklist
- [ ] Keyboard shortcuts work (Ctrl+Z, Ctrl+Shift+Z)
- [ ] Toolbar buttons respond to clicks
- [ ] Buttons disable when no history is available
- [ ] Undo/redo reverses all types of changes (add, delete, modify)
- [ ] Redo works after undo
- [ ] New action clears future history

### Edge Cases
- Undo multiple times, then perform new action (should clear future)
- Undo/redo with no project loaded
- Undo/redo in preview mode (should work if enabled)
- Rapid undo/redo clicks

## References

- [Zustand Documentation](https://github.com/pmndrs/zustand)
- [Undo/Redo Patterns](https://en.wikipedia.org/wiki/Undo)
- [Command Pattern](https://refactoring.guru/design-patterns/command)
