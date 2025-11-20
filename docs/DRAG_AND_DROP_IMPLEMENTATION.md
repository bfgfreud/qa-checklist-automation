# Drag-and-Drop Reordering Implementation

**Date**: November 20, 2025
**Session**: Implementing display_order and drag-and-drop reordering
**Status**: ✅ Complete - Committed (027c592)

## Problem Statement

Test cases were "jumping around" during polling in Work Mode because there was no explicit ordering stored in the database. The ordering needed to be implemented at all levels:

1. **Module Library** - Already had order_index (✅ Working)
2. **Project Edit Mode** - Missing drag-and-drop UI for reordering
3. **Project Work Mode** - Display should reflect the order set in Edit Mode

## Solution Overview

Implemented a comprehensive ordering system with drag-and-drop UI in Project Edit Mode, backed by explicit database ordering fields.

## Database Schema (Migration Already Run)

**Migration File**: `supabase/migrations/005_add_display_order_to_test_results.sql`

```sql
-- Add display_order column to checklist_test_results
ALTER TABLE checklist_test_results
ADD COLUMN display_order INTEGER;

-- Populate display_order for existing rows
WITH ordered_results AS (
  SELECT
    ctr.id,
    ROW_NUMBER() OVER (
      PARTITION BY ctr.project_checklist_module_id
      ORDER BY
        COALESCE(ctr.testcase_id::text, ctr.testcase_title),
        ctr.created_at
    ) - 1 AS row_order
  FROM checklist_test_results ctr
)
UPDATE checklist_test_results
SET display_order = ordered_results.row_order
FROM ordered_results
WHERE checklist_test_results.id = ordered_results.id;

-- Make NOT NULL and set default
ALTER TABLE checklist_test_results
ALTER COLUMN display_order SET NOT NULL;

ALTER TABLE checklist_test_results
ALTER COLUMN display_order SET DEFAULT 0;

-- Add index for performance
CREATE INDEX idx_test_results_display_order
ON checklist_test_results(project_checklist_module_id, display_order);
```

**Status**: ✅ Migration run in Supabase by user

## Backend Implementation

### 1. Service Layer

**File**: `lib/services/checklistService.ts:651-695`

```typescript
async reorderChecklistTestcases(
  moduleId: string,
  input: { testcases: Array<{ testcaseId: string; displayOrder: number }> }
): Promise<{ success: boolean; error?: string }>
```

**Key Features**:
- Validates module exists
- Updates display_order for each testcase
- **CRITICAL**: Updates ALL tester results for each testcase (multi-tester sync)
- Uses `eq('testcase_id', tc.testcaseId)` to update all rows with same testcase

**Multi-Tester Logic**:
```typescript
const updates = input.testcases.map(tc =>
  supabase
    .from('checklist_test_results')
    .update({ display_order: tc.displayOrder })
    .eq('project_checklist_module_id', moduleId)
    .eq('testcase_id', tc.testcaseId)  // Updates ALL testers
)
```

### 2. Validation Schema

**File**: `lib/validations/checklist.schema.ts:98-105`

```typescript
export const reorderChecklistTestcasesSchema = z.object({
  testcases: z.array(z.object({
    testcaseId: z.string().uuid('Invalid testcase ID'),
    displayOrder: z.number()
      .int('Display order must be an integer')
      .min(0, 'Display order must be non-negative')
  })).min(1, 'At least one testcase is required for reordering')
})
```

### 3. API Endpoint

**File**: `app/api/projects/[projectId]/checklist/modules/[moduleId]/testcases/reorder/route.ts`

**Route**: `POST /api/projects/[projectId]/checklist/modules/[moduleId]/testcases/reorder`

**Request Body**:
```json
{
  "testcases": [
    { "testcaseId": "uuid-1", "displayOrder": 0 },
    { "testcaseId": "uuid-2", "displayOrder": 1 },
    { "testcaseId": "uuid-3", "displayOrder": 2 }
  ]
}
```

**Response**:
```json
{
  "success": true,
  "message": "Checklist testcases reordered successfully"
}
```

## Frontend Implementation

### 1. Dependencies Added

**Package**: `@dnd-kit` (already installed)

**Imports**:
```typescript
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
```

### 2. SortableModule Component

**File**: `app/projects/[projectId]/edit/page.tsx:37-203`

**Features**:
- Drag handle with ⋮⋮ icon
- Visual feedback (opacity: 0.5 during drag)
- Smooth transitions
- Contains nested SortableContext for testcases

**Key Code**:
```typescript
const {
  attributes,
  listeners,
  setNodeRef,
  transform,
  transition,
  isDragging,
} = useSortable({ id: module.id });

const style = {
  transform: CSS.Transform.toString(transform),
  transition,
  opacity: isDragging ? 0.5 : 1,
};
```

### 3. SortableTestCase Component

**File**: `app/projects/[projectId]/edit/page.tsx:205-280`

**Features**:
- Nested sortable within each module
- Smaller drag handle for testcases
- Same visual feedback pattern
- Updates draft state immediately

### 4. Drag-and-Drop Integration

**File**: `app/projects/[projectId]/edit/page.tsx:312-358`

**Sensors Configuration**:
```typescript
const sensors = useSensors(
  useSensor(PointerSensor),      // Mouse/touch
  useSensor(KeyboardSensor, {    // Keyboard accessibility
    coordinateGetter: sortableKeyboardCoordinates,
  })
);
```

**Drag Handler**:
```typescript
const handleDragEnd = (event: DragEndEvent) => {
  const { active, over } = event;

  if (!over || active.id === over.id) return;

  const activeModule = draftModules.find((m) => m.id === active.id);

  if (activeModule) {
    // Reorder modules
    const oldIndex = draftModules.findIndex((m) => m.id === active.id);
    const newIndex = draftModules.findIndex((m) => m.id === over.id);
    const reorderedModules = arrayMove(draftModules, oldIndex, newIndex)
      .map((m, idx) => ({ ...m, orderIndex: idx }));
    setDraftModules(reorderedModules);
  } else {
    // Reorder testcases within module
    setDraftModules((prevModules) =>
      prevModules.map((module) => {
        const testResult = module.testResults.find((tr) => tr.id === active.id);
        if (testResult) {
          const oldIndex = module.testResults.findIndex((tr) => tr.id === active.id);
          const newIndex = module.testResults.findIndex((tr) => tr.id === over.id);
          const reorderedTestResults = arrayMove(module.testResults, oldIndex, newIndex);
          return { ...module, testResults: reorderedTestResults };
        }
        return module;
      })
    );
  }
};
```

### 5. Save Logic Integration

**File**: `app/projects/[projectId]/edit/page.tsx:737-808`

**Module Reordering**:
```typescript
const modulesNeedReordering = draftModules.some((dm, idx) => {
  const original = originalModules.find(om => om.id === dm.id);
  return original && original.orderIndex !== idx;
});

if (modulesNeedReordering) {
  const reorderPayload = {
    modules: draftModules
      .filter(m => !m._isDraft && !m._isDeleted)
      .map((m, idx) => ({ id: m.id, orderIndex: idx }))
  };

  await fetch(`/api/projects/${projectId}/checklist/reorder`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(reorderPayload),
  });
}
```

**Testcase Reordering**:
```typescript
for (const draftModule of draftModules) {
  if (draftModule._isDraft || draftModule._isDeleted) continue;

  const originalModule = originalModules.find(om => om.id === draftModule.id);
  if (!originalModule) continue;

  const testcasesNeedReordering = draftModule.testResults.some((tr, idx) => {
    const originalTr = originalModule.testResults.find(otr => otr.testcaseId === tr.testcaseId);
    if (!originalTr) return false;
    const originalIdx = originalModule.testResults.findIndex(otr => otr.testcaseId === tr.testcaseId);
    return originalIdx !== idx;
  });

  if (testcasesNeedReordering) {
    const testcaseOrderMap = new Map<string, number>();
    draftModule.testResults.forEach((tr, idx) => {
      if (tr.testcaseId && !testcaseOrderMap.has(tr.testcaseId)) {
        testcaseOrderMap.set(tr.testcaseId, idx);
      }
    });

    const reorderPayload = {
      testcases: Array.from(testcaseOrderMap.entries()).map(([testcaseId, displayOrder]) => ({
        testcaseId,
        displayOrder
      }))
    };

    await fetch(
      `/api/projects/${projectId}/checklist/modules/${draftModule.id}/testcases/reorder`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reorderPayload),
      }
    );
  }
}
```

## User Flow

### Reordering Modules

1. User opens Project in Edit Mode
2. Modules display in current `order_index` order
3. User grabs ⋮⋮ drag handle on module header
4. Drags module up or down
5. Module moves with visual feedback (opacity 0.5)
6. On drop, module snaps to new position
7. Draft state updates immediately (local-first)
8. User clicks "Save Changes"
9. Batch API call updates `order_index` for all affected modules
10. Order persists in Work Mode

### Reordering Testcases

1. User expands a module in Edit Mode
2. Testcases display in current `display_order` order
3. User grabs ⋮⋮ drag handle on testcase
4. Drags testcase up or down within the module
5. Testcase moves with visual feedback
6. On drop, testcase snaps to new position
7. Draft state updates immediately
8. User clicks "Save Changes"
9. API call updates `display_order` for ALL testers' test results
10. Order persists in Work Mode for all testers

## Multi-Tester Synchronization

**Critical Feature**: When testcases are reordered, the `display_order` is updated for ALL testers, not just one.

**Why**: In multi-tester mode, there's one test result row per tester per testcase. All testers must see testcases in the same order.

**Implementation**:
```typescript
// Updates ALL rows with same testcase_id
.eq('project_checklist_module_id', moduleId)
.eq('testcase_id', tc.testcaseId)
```

**Example**:
- Module has 3 testcases: A, B, C
- 2 testers assigned: Tester1, Tester2
- Database has 6 rows:
  - (Tester1, A, display_order: 0)
  - (Tester1, B, display_order: 1)
  - (Tester1, C, display_order: 2)
  - (Tester2, A, display_order: 0)
  - (Tester2, B, display_order: 1)
  - (Tester2, C, display_order: 2)

- User reorders to: C, A, B
- API updates ALL 6 rows:
  - (Tester1, C, display_order: 0)
  - (Tester1, A, display_order: 1)
  - (Tester1, B, display_order: 2)
  - (Tester2, C, display_order: 0)
  - (Tester2, A, display_order: 1)
  - (Tester2, B, display_order: 2)

## Accessibility

@dnd-kit provides built-in accessibility:

- **Keyboard Navigation**: Arrow keys to move items
- **Screen Reader Support**: Announces drag state and position
- **Focus Management**: Maintains focus during drag operations

**Keyboard Controls**:
- `Space`/`Enter`: Pick up item
- `Arrow Up/Down`: Move item
- `Space`/`Enter`: Drop item
- `Escape`: Cancel drag

## Testing Checklist

- [ ] Module drag-and-drop works (mouse)
- [ ] Module drag-and-drop works (keyboard)
- [ ] Testcase drag-and-drop works (mouse)
- [ ] Testcase drag-and-drop works (keyboard)
- [ ] Order persists after save
- [ ] Order reflects in Work Mode
- [ ] Multi-tester sync (all testers see same order)
- [ ] Works with custom modules
- [ ] Works with custom testcases
- [ ] Visual feedback shows during drag
- [ ] Undo works (cancel button)
- [ ] Order preserved when copying modules

## Known Limitations

1. **No Undo During Drag**: Once dropped, the only undo is to cancel and reload
2. **No Cross-Module Drag**: Can't drag testcases between modules (by design)
3. **No Drag in Work Mode**: Reordering only available in Edit Mode
4. **No Bulk Reorder**: Must drag items one at a time

## Future Enhancements

1. **Drag Between Modules**: Allow moving testcases to different modules
2. **Multi-Select Drag**: Select multiple testcases and drag together
3. **Reorder in Work Mode**: Quick reorder without entering Edit Mode
4. **Undo/Redo Stack**: Multi-level undo for drag operations
5. **Touch Optimizations**: Better mobile/tablet drag experience

## Files Changed

### Created
- `docs/DRAG_AND_DROP_IMPLEMENTATION.md` - This document

### Modified
- `app/projects/[projectId]/edit/page.tsx` - Added drag-and-drop UI
- `lib/services/checklistService.ts` - Fixed TypeScript error

### Previously Created (Earlier Session)
- `app/api/projects/[projectId]/checklist/modules/[moduleId]/testcases/reorder/route.ts` - API endpoint
- `lib/validations/checklist.schema.ts` - Validation schema
- `supabase/migrations/005_add_display_order_to_test_results.sql` - Database migration

## Deployment

**Commit**: `027c592`
**Date**: November 20, 2025
**Branch**: `main`
**Status**: ✅ Pushed to GitHub, auto-deployed to Vercel

**Vercel URL**: https://qa-checklist-automation.vercel.app/

## Migration Status

✅ **Database migration completed** by user in Supabase
✅ **Code deployed** to production
⏳ **Ready for testing**

## Next Steps

1. Test drag-and-drop in browser (modules and testcases)
2. Test multi-tester scenarios (verify all testers see same order)
3. Log any issues or edge cases discovered
4. Create test cases for QA automation

---

**Session Status**: Implementation complete, ready for testing
