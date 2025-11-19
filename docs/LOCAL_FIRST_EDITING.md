# Local-First Editing Architecture

**Last Updated**: 2025-01-18
**Status**: ✅ Implemented in Editing Mode

---

## Overview

The Editing Mode (`/projects/[projectId]/edit`) uses a **local-first editing approach** where all changes are made instantly in the browser's local state, then batched and saved to the server only when the user clicks "Save Changes".

This provides:
- ⚡ **Instant feedback** - No waiting for server responses
- 🔄 **Batch operations** - Multiple changes sent in one request
- ✅ **Explicit save** - Users control when changes are persisted
- ↩️ **Easy undo** - Cancel button reverts all changes
- 🚫 **Reduced API calls** - Only save when user is ready

---

## How It Works

### 1. State Management

```typescript
// Original state from server (immutable reference)
const [originalModules, setOriginalModules] = useState<ChecklistModuleWithResults[]>([]);

// Draft state - all local edits happen here
const [draftModules, setDraftModules] = useState<DraftModule[]>([]);

// Track unsaved changes
const hasUnsavedChanges = JSON.stringify(draftModules) !== JSON.stringify(originalModules);
```

### 2. Draft Module Types

```typescript
type DraftModule = ChecklistModuleWithResults & {
  _isDraft?: boolean;    // Marks module as newly added (not yet saved to server)
  _isDeleted?: boolean;  // Marks module for deletion (hidden from UI)
};
```

### 3. Local Operations (Instant)

#### Adding a Module
- User clicks "+" on a module
- Dialog opens to customize instance name, priority, tags
- On submit: Module added to `draftModules` with `_isDraft: true`
- **No API call** - appears instantly with yellow "Unsaved" badge
- Temporary draft ID: `draft-${timestamp}`

#### Removing a Module
- User clicks delete button
- Confirmation prompt shown
- If module has `_isDraft: true` (not saved): Remove from array
- If module exists on server: Mark with `_isDeleted: true` (hidden from UI)
- **No API call** - happens instantly

### 4. Save Changes (Batch API Calls)

When user clicks "Save Changes":

1. **Identify changes**:
   - `modulesToAdd` = modules with `_isDraft: true`
   - `modulesToDelete` = modules with `_isDeleted: true`

2. **Execute deletions**:
   ```typescript
   for (const module of modulesToDelete) {
     await fetch(`/api/checklists/modules/${module.id}`, { method: 'DELETE' });
   }
   ```

3. **Execute additions**:
   ```typescript
   for (const module of modulesToAdd) {
     await fetch('/api/checklists/modules', {
       method: 'POST',
       body: JSON.stringify({ projectId, moduleId, instanceLabel }),
     });
   }
   ```

4. **Refresh from server**:
   - Fetch complete checklist to get real IDs
   - Update both `originalModules` and `draftModules`
   - Navigate back to project overview

### 5. Cancel Changes

When user clicks "Cancel":
- Confirmation prompt if `hasUnsavedChanges`
- Revert `draftModules` to clone of `originalModules`
- Navigate back to project overview
- All unsaved changes discarded

---

## Visual Indicators

### Unsaved Changes Warning
Header shows yellow warning icon with text "Unsaved changes" when `hasUnsavedChanges === true`

### Draft Module Badge
Newly added modules show yellow badge:
```jsx
{isDraft && (
  <span className="px-2 py-0.5 text-xs bg-yellow-500/20 text-yellow-400 rounded">
    Unsaved
  </span>
)}
```

### Draft Module Border
Modules with `_isDraft: true` have yellow border: `border-yellow-500/50`

### Deleted Modules
Modules with `_isDeleted: true` are filtered from display (not rendered)

---

## Navigation Guards

### Browser Navigation
```typescript
window.addEventListener('beforeunload', (e) => {
  if (hasUnsavedChanges) {
    e.preventDefault();
    e.returnValue = ''; // Shows browser's default "unsaved changes" dialog
  }
});
```

### Back Button Navigation
User clicks back arrow → routes to `/projects/[id]` (Cancel behavior not triggered)

**Note**: To add guard for back button, would need to intercept router.push and show confirmation

---

## Button States

### Save Changes Button
- **Disabled** when: `saving === true` OR `hasUnsavedChanges === false`
- **Text**: "Saving..." when saving, "Save Changes" otherwise
- **Action**: Batch save all changes to server

### Cancel Button
- **Disabled** when: `saving === true`
- **Text**: "Cancel"
- **Action**: Revert to original state (with confirmation if changes exist)

---

## Benefits

### For Users
1. **No lag** - Changes appear instantly
2. **Confidence** - Clear "Unsaved" indicators
3. **Control** - Explicit save/cancel actions
4. **Safety** - Browser warns before losing work

### For System
1. **Reduced API calls** - Batch operations instead of per-action
2. **Better performance** - No waiting for server responses
3. **Simpler state management** - No optimistic update rollbacks needed
4. **Lower costs** - Fewer database writes (especially for multi-tester test result creation)

---

## Future Enhancements

### Possible Additions
- **Auto-save draft** - Save to localStorage every 30s
- **Undo/Redo stack** - Track history of local changes
- **Conflict detection** - Warn if server data changed since load
- **Keyboard shortcuts** - Ctrl+S to save, Ctrl+Z to undo
- **Reorder modules** - Drag-and-drop with instant feedback
- **Edit testcases** - Add/remove/customize individual test cases

### Not Needed
- **Real-time collaboration** - Checklist editing is typically single-user
- **Polling for changes** - Users work independently on different projects
- **Optimistic updates** - Local-first approach eliminates the need

---

## Related Pages

This local-first approach is used in:
- ✅ **Editing Mode** (`/projects/[projectId]/edit`) - Add/remove modules

This approach is **NOT** used in:
- ❌ **Working Mode** (`/projects/[projectId]/work`) - Uses real-time polling for multi-tester collaboration
- ❌ **Project Overview** - Read-only display

---

## Technical Notes

### Why JSON.stringify for Change Detection?
Simple and effective for detecting changes in nested objects. Alternative would be deep equality check with lodash, but adds dependency.

### Why Clone with JSON.parse(JSON.stringify())?
Creates deep copy to prevent mutations. Alternative would be structuredClone() but has less browser support.

### Why Temporary IDs?
Draft modules need unique IDs for React keys and UI interactions. Server will assign real UUIDs on save.

### Why Not React Query?
Local-first editing doesn't benefit from caching or background refetching. Simple useState is sufficient.

---

## Code Location

**File**: `app/projects/[projectId]/edit/page.tsx`

**Key Functions**:
- `handleAddModule()` - Add to local draft
- `handleRemoveModule()` - Mark for deletion
- `handleSave()` - Batch save to server
- `handleCancel()` - Revert changes

**Key State**:
- `originalModules` - Server snapshot
- `draftModules` - Working copy
- `hasUnsavedChanges` - Computed flag

---

**End of Document**
