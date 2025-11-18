# Frontend UX Architecture - Multi-Tester Collaboration

**Last Updated**: 2025-01-18
**Status**: Architectural Design Complete
**Decision**: Smart Polling (No Supabase Realtime)

---

## Overview

This document defines the frontend user experience architecture for multi-tester collaboration in the QA Checklist Automation tool. The system allows multiple testers to work on the same project checklist simultaneously without requiring expensive real-time subscriptions.

### Key Architectural Decisions

1. ✅ **Smart Polling** instead of Supabase Realtime (free tier optimization)
2. ✅ **Isolated Tester Fields** (no data conflicts)
3. ✅ **Optimistic UI Updates** (instant feedback for current user)
4. ✅ **Seamless Background Sync** (no page refreshes)
5. ✅ **Read-Only Visibility** of other testers' work

---

## Why No Supabase Realtime?

**Cost Optimization Decision**:
- Supabase Realtime requires paid subscription ($25/month minimum)
- This is a free tool for small QA teams (2-3 testers)
- Usage is occasional (not daily, continuous use)
- Smart polling provides 90% of real-time benefits at 0% cost

**Alternative: Smart Polling with React Query**:
- Poll backend every 5-10 seconds
- Negligible load with 2-3 users
- Well within Vercel/Supabase free tier limits
- Users still get near-instant updates from others

---

## Architecture: Isolated Tester Fields

### Database Design (Already Implemented in Phase 1 & 2)

Each tester has their own separate row in `checklist_test_results`:

```sql
checklist_test_results
├─ id (unique)
├─ project_checklist_module_id
├─ testcase_id
├─ tester_id ← UNIQUE PER TESTER
├─ status (Pending/Pass/Fail/Skipped)
├─ notes (text)
├─ tested_at (timestamp)
└─ UNIQUE (project_checklist_module_id, testcase_id, tester_id)
```

**Key Insight**: Since each tester updates their own row (determined by `tester_id`), there are **NO DATA CONFLICTS**.

#### Example: 3 Testers, 1 Test Case = 3 Database Rows

```
Test Case: "Login with valid credentials"

Row 1: (Alice's result)
- tester_id: alice-uuid
- status: Pass
- notes: "Works on Chrome"
- tested_at: 2025-01-18 10:30:00

Row 2: (Bob's result)
- tester_id: bob-uuid
- status: Fail
- notes: "Firefox error"
- tested_at: 2025-01-18 10:45:00

Row 3: (Carol's result)
- tester_id: carol-uuid
- status: Pass
- notes: "No issues"
- tested_at: 2025-01-18 11:00:00
```

When Alice updates her row, Bob's and Carol's rows are untouched. **No conflicts possible**.

---

## Smart Polling Strategy

### Implementation with React Query

```typescript
import { useQuery } from '@tanstack/react-query';

// Poll checklist every 5-10 seconds
const { data: checklist, refetch } = useQuery({
  queryKey: ['checklist', projectId],
  queryFn: () => fetchChecklist(projectId),

  // Polling configuration
  refetchInterval: 5000, // Poll every 5 seconds
  refetchIntervalInBackground: true, // Keep polling when tab inactive
  refetchOnWindowFocus: true, // Refetch when user returns to tab
  staleTime: 0, // Always consider data potentially stale

  // Prevent request spam
  retry: 1,
  retryDelay: 2000,
});
```

### User Experience Flow

1. **Alice updates her status** → Optimistic UI (instant local update)
2. **Backend saves Alice's change** → Success confirmation
3. **Every 5 seconds**, all users' browsers poll for updates
4. **Bob's browser receives update** → Sees Alice's new status
5. **Seamless merge** → Alice's row animates with new data
6. **Bob's work uninterrupted** → His own row stays focused

**No page refresh, no flickering, no disruption.**

---

## Cost Analysis: Polling is Free!

### Request Volume Estimate

**Scenario**: 3 testers working simultaneously for 2 hours

```
Polling frequency: Every 5 seconds = 12 requests/minute/tester
Duration: 2 hours = 120 minutes
Testers: 3

Requests per session:
3 testers × 12 req/min × 120 min = 4,320 requests

Monthly usage (5 sessions/week):
4,320 × 5 × 4 weeks = 86,400 requests/month
```

### Free Tier Limits

**Supabase Free Tier**:
- 500,000 requests/month
- **Usage**: ~86K/month = **17% of limit** ✅

**Vercel Free Tier**:
- 100,000 function invocations/month
- **Usage**: ~86K/month = **86% of limit** ✅ (still within)

**Verdict**: Completely free, even with 5-second polling!

### Optimization Options

If approaching limits:
- Increase interval to 10 seconds → 50% fewer requests
- Increase to 15 seconds → 66% fewer requests
- Still feels near-instant to users

---

## UI/UX Design

### Multi-Tester Test Case Row Layout

```
┌─────────────────────────────────────────────────────────────────┐
│ Test Case: "Login with valid credentials"                       │
│ ID: TC-001 | Module: Authentication                             │
│                                                                  │
│ Overall Status: [🔴 FAIL] ← Weakest across all testers         │
│ Progress: 2/3 testers completed                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│ ┌─ Alice Johnson (🟠 #FF6B35) ─────────────────────────────┐  │
│ │  Status: [🟢 Pass]                                        │  │
│ │  Tested: 2025-01-18 10:30 AM (5 minutes ago)             │  │
│ │  Notes: "Works perfectly on Chrome browser"              │  │
│ │  📎 Attachments: 2 images                                │  │
│ │  [View Images] [Expand Notes]                            │  │
│ └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│ ┌─ Bob Smith (🔵 #4ECDC4) ─────────────────────────────────┐  │
│ │  Status: [🔴 Fail]  ← EDITABLE (if current user is Bob)  │  │
│ │  Tested: 2025-01-18 10:45 AM (now)                       │  │
│ │  Notes: "Error on Firefox - see screenshot"             │  │
│ │  📎 Attachments: 1 image                                 │  │
│ │  [Upload More] [Edit Notes] [View Images]               │  │
│ └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│ ┌─ Carol Davis (🟡 #FFD93D) ──────────────────────────────┐  │
│ │  Status: [🟢 Pass]                                        │  │
│ │  Tested: 2025-01-18 11:00 AM (just now)                  │  │
│ │  Notes: "No issues detected"                             │  │
│ │  📎 Attachments: none                                    │  │
│ │  [View Details]                                          │  │
│ └──────────────────────────────────────────────────────────┘  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Visual Indicators

**Color Coding**:
- Each tester has a unique color (from `testers.color` in database)
- Tester's section is bordered with their color
- Current user's section is highlighted/emphasized

**Edit Permissions**:
- Current user can edit ONLY their own section (status, notes, attachments)
- Other testers' sections are **read-only** with subtle styling
- Hover shows "Alice's result - view only"

**Update Animations**:
- When polling detects changes, animate the updated section
- Subtle glow effect (0.5s fade)
- Toast notification: "Alice updated TC-001" (dismissable)

**Timestamps**:
- Show relative time: "5 minutes ago", "just now"
- Tooltip shows exact datetime on hover
- Last sync indicator in header: "Synced 3 seconds ago"

---

## Optimistic UI Updates

### User's Own Actions (Instant Feedback)

```typescript
const updateMutation = useMutation({
  mutationFn: (data) => updateTestResult(data),

  onMutate: async (newData) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries(['checklist', projectId]);

    // Snapshot current data
    const previousData = queryClient.getQueryData(['checklist', projectId]);

    // Optimistic update (INSTANT)
    queryClient.setQueryData(['checklist', projectId], (old) => {
      return updateResult(old, newData);
    });

    return { previousData }; // For rollback
  },

  onError: (err, variables, context) => {
    // Rollback on failure
    queryClient.setQueryData(['checklist', projectId], context.previousData);
    toast.error('Failed to update. Please try again.');
  },

  onSuccess: () => {
    // Success confirmation (optional)
    // toast.success('Saved');
  },

  onSettled: () => {
    // Refetch to ensure sync
    queryClient.invalidateQueries(['checklist', projectId]);
  },
});
```

**User Experience**:
1. Bob changes status from Pending → Fail
2. **Instant**: Dropdown shows Fail immediately (optimistic)
3. **Background**: API call to backend
4. **Success**: Data confirmed, stays as Fail
5. **Failure**: Reverts to Pending, shows error toast

---

## Conflict Handling (Rare but Possible)

### Scenario: Two Testers Edit Different Fields of Same Test

**Situation**:
- Alice and Bob are both assigned to Test Case TC-001
- Alice updates her status (her row)
- Bob updates his status (his row)
- **No conflict** - they edit separate database rows

### Scenario: Network Issues

**Situation**:
- Bob updates his status to Fail (optimistic update)
- Network request fails
- Optimistic update rolls back
- User sees error: "Failed to save. Please try again."

### Scenario: Stale Data (Edge Case)

**Situation**:
- Alice's browser hasn't polled in 10 seconds (tab was inactive)
- Bob updated his status 5 seconds ago
- Alice returns to tab → refetch triggers → sees Bob's update

**No conflicts**, just timing differences.

---

## Component Architecture

### Page Structure

```
ChecklistPageV2
├── Header
│   ├── Project Title
│   ├── Last Synced Indicator ("3 seconds ago")
│   └── Manual Refresh Button (optional)
├── Sidebar (Left)
│   ├── Available Modules List
│   ├── Drag-to-Add Functionality
│   └── Filter/Search
├── Main Content
│   ├── Progress Overview
│   │   ├── Overall Progress Bar
│   │   ├── Per-Tester Progress Bars
│   │   └── Statistics (Pass/Fail/Pending counts)
│   ├── Module Sections (Collapsible)
│   │   └── TestCaseRowV2 (multi-tester)
│   │       ├── Test Case Header
│   │       ├── Overall Status Badge
│   │       └── Tester Results (expandable cards)
│   │           ├── TesterResultCard (Alice - editable if current user)
│   │           ├── TesterResultCard (Bob - read-only)
│   │           └── TesterResultCard (Carol - read-only)
└── Footer
    └── Connection Status ("Online", "Syncing...")
```

### Key Components

**1. TestCaseRowV2.tsx**
```typescript
interface TestCaseRowV2Props {
  testCase: TestCase;
  results: TestResultWithTester[]; // All testers' results
  currentUserId: string; // To determine edit permissions
  onUpdate: (resultId, data) => Promise<void>;
}

// Shows:
// - Overall status (weakest across all testers)
// - Expandable cards for each tester
// - Current user's card is editable
// - Others' cards are read-only with view
```

**2. TesterResultCard.tsx**
```typescript
interface TesterResultCardProps {
  tester: Tester;
  result: TestResult;
  isEditable: boolean; // true if current user
  onStatusChange: (newStatus) => void;
  onNotesChange: (newNotes) => void;
  onAttachmentUpload: (file) => void;
}

// Shows:
// - Tester name + color badge
// - Status dropdown (editable or read-only)
// - Notes textarea (editable or read-only)
// - Attachments gallery with upload button
// - Timestamp
```

**3. ImageUploader.tsx**
```typescript
interface ImageUploaderProps {
  testResultId: string;
  onUploadComplete: (attachment) => void;
  maxFiles?: number; // Default: 5
  maxSize?: number; // Default: 5MB
}

// Features:
// - Drag-drop zone
// - File picker
// - Progress bar
// - Thumbnail preview
// - Validation (type, size)
```

**4. OverallStatusBadge.tsx**
```typescript
interface OverallStatusBadgeProps {
  results: TestResult[]; // All testers' results
}

// Calculates weakest status:
// Priority: Fail (4) > Skipped (3) > Pass (2) > Pending (1)
// Returns: Largest priority value = weakest status
```

---

## State Management

### React Query Setup

```typescript
// _app.tsx or layout.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 0,
      refetchInterval: 5000, // Global 5-second polling
      refetchIntervalInBackground: true,
      refetchOnWindowFocus: true,
      retry: 1,
    },
  },
});

export default function App({ Component, pageProps }) {
  return (
    <QueryClientProvider client={queryClient}>
      <Component {...pageProps} />
    </QueryClientProvider>
  );
}
```

### Custom Hooks

**useChecklist.ts**:
```typescript
export function useChecklist(projectId: string) {
  return useQuery({
    queryKey: ['checklist', projectId],
    queryFn: () => api.fetchChecklist(projectId),
  });
}
```

**useUpdateTestResult.ts**:
```typescript
export function useUpdateTestResult(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ resultId, testerId, status, notes }) =>
      api.updateTestResult(resultId, { testerId, status, notes }),

    onMutate: async (newData) => {
      // Optimistic update logic
    },

    onError: (err, variables, context) => {
      // Rollback logic
    },

    onSettled: () => {
      queryClient.invalidateQueries(['checklist', projectId]);
    },
  });
}
```

---

## Loading & Error States

### Initial Load
```
┌─────────────────────────────────────┐
│  Loading checklist...               │
│  [Spinner]                          │
│                                     │
│  Fetching test results...           │
└─────────────────────────────────────┘
```

### Background Sync
```
Header: [🔄 Syncing...] → [✓ Synced 2 seconds ago]
```

### Error State
```
┌─────────────────────────────────────┐
│  ⚠️ Failed to load checklist        │
│                                     │
│  [Retry Button]                     │
│                                     │
│  Error: Network timeout             │
└─────────────────────────────────────┘
```

### Optimistic Update Error
```
Toast Notification:
❌ Failed to save status change
[Retry] [Dismiss]
```

---

## Accessibility

### Keyboard Navigation
- Tab through test cases
- Enter to expand/collapse tester cards
- Arrow keys to navigate between fields
- Esc to close modals

### Screen Reader Support
- Announce status changes: "Test TC-001 marked as Fail by Bob"
- Announce updates from others: "Alice updated TC-002"
- ARIA labels for all interactive elements

### Color Blindness
- Don't rely solely on color for status (use icons too)
- Status icons: ✓ (Pass), ✗ (Fail), ⊘ (Skipped), ⏳ (Pending)

---

## Performance Optimizations

### Virtualization
For large checklists (100+ test cases):
```typescript
import { useVirtualizer } from '@tanstack/react-virtual';

// Only render visible rows
const virtualizer = useVirtualizer({
  count: testCases.length,
  getScrollElement: () => parentRef.current,
  estimateSize: () => 200, // Estimated row height
});
```

### Lazy Loading Images
```typescript
<img
  src={thumbnail}
  loading="lazy"
  alt="Test screenshot"
/>
```

### Debounced Notes Updates
```typescript
const debouncedUpdate = useMemo(
  () => debounce((notes) => updateNotes(notes), 1000),
  []
);
```

---

## Success Metrics

**User Experience**:
- ✅ Own updates feel instant (<50ms perceived latency)
- ✅ Others' updates appear within 5-10 seconds
- ✅ No page refreshes or flickering
- ✅ Works smoothly with 2-3 concurrent testers

**Performance**:
- ✅ Initial load <2 seconds
- ✅ Optimistic updates <50ms
- ✅ Background polling has no UI impact
- ✅ Works well with 100+ test cases

**Cost**:
- ✅ 100% free tier usage
- ✅ No paid subscriptions needed
- ✅ Scales to 5+ testers without issues

---

## Future Enhancements (Optional)

### If Budget Allows Supabase Realtime:
- Instant updates without polling
- True real-time collaboration
- Cursor presence (see where others are)
- Live typing indicators

### Additional Features:
- Conflict detection UI (rare but possible)
- Offline mode with sync queue
- Export reports with multi-tester breakdown
- Email notifications when assigned to project

---

## Summary

This architecture provides a **free**, **scalable**, and **user-friendly** multi-tester collaboration system without expensive real-time subscriptions. Users get near-instant feedback for their own actions and see others' updates within 5-10 seconds - fast enough for collaborative QA work.

**Key Principles**:
1. Each tester has isolated data (no conflicts)
2. Optimistic UI for instant feedback
3. Smart polling for near-real-time updates
4. Free tier friendly (well within limits)
5. Seamless UX (no page refreshes)

---

**Document Status**: Approved for Frontend Implementation
**Next Steps**:
1. Test backend APIs
2. Build frontend components following this architecture
3. Integrate with React Query polling
