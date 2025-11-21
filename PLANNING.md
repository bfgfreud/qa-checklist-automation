# QA Checklist Automation - V2 Rebuild Plan

**Last Updated**: 2025-01-18
**Status**: Phase 0 - Planning Complete, Ready to Execute

---

## 🎯 Project Goal

Build a real-time, multi-tester QA Checklist Automation tool with:
- **Google Sheets-like collaboration** (instant updates, minimal latency)
- **Multi-tester support** (multiple people test same checklist)
- **Image attachments** (upload screenshots per test result)
- **Clean, bug-free architecture** (proper state management)

---

## 📋 Why V2 Rebuild?

### V1 Problems
1. **State Management Bugs**: Add/delete modules didn't update UI properly
2. **Single-Tester Only**: Database didn't support multiple testers
3. **No Real-Time Sync**: Changes required page refresh
4. **No Image Support**: Couldn't attach screenshots
5. **Messy Codebase**: Duplicate files, poor organization

### V2 Solutions
1. **Optimistic UI + Realtime**: Instant updates with Supabase Realtime
2. **Multi-Tester Schema**: One result row per tester per test case
3. **Proper State Management**: React Query or Zustand (no useState bugs)
4. **Image Upload**: Supabase Storage integration
5. **Clean Structure**: Aggressive file cleanup and reorganization

---

## 🏗️ Architecture Decisions

### Database Model
```
Multi-Tester Approach:
- One row per tester per test case in checklist_test_results
- Example: 3 testers × 50 test cases = 150 database rows
- "Weakest status" calculated: Fail > Skipped > Pass > Pending
```

### Real-Time Strategy
```
Optimistic Updates + Supabase Realtime:
1. User clicks → UI updates instantly (optimistic)
2. API call happens in background
3. Supabase Realtime syncs changes from other users
4. Rollback if API fails
```

### Image Storage
```
Supabase Storage:
- Bucket: test-attachments
- Path: {project_id}/{test_result_id}/{filename}
- Public read access
- Automatic cleanup on test result deletion
```

---

## 📅 Development Phases

### Phase 0: Codebase Cleanup & Reorganization
**Owner**: DevOps Agent
**Duration**: ~4 hours
**Status**: NOT STARTED

#### Tasks
1. ✅ Analyze current directory structure
2. ⏳ Remove unnecessary files:
   - Old dev server instances
   - Debug/test files (nul, temp CSVs)
   - Corrupted .next folders
   - Duplicate/unused docs
3. ⏳ Reorganize to Next.js 14 convention:
   ```
   /app              # Pages & API routes (Next.js App Router)
   /components       # All React components
   /lib              # Services, utilities, helpers
   /types            # Shared TypeScript types
   /public           # Static assets
   /supabase         # Database migrations, schemas
   ```
4. ⏳ Update all imports after restructure
5. ⏳ Create cleanup report (what was removed/moved)
6. ⏳ Verify app runs (`npm run dev`)

#### Success Criteria
- [ ] Clean folder structure (no old frontend/backend/shared folders)
- [ ] All imports work
- [ ] Dev server starts without errors
- [ ] Build succeeds

---

### Phase 1: Database Schema - Multi-Tester Foundation
**Owner**: Backend Agent
**Duration**: ~6 hours
**Status**: NOT STARTED

#### New Tables

**1. testers**
```sql
CREATE TABLE testers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  color TEXT DEFAULT '#FF6B35',
  created_at TIMESTAMP DEFAULT NOW()
);
```

**2. project_testers** (junction table)
```sql
CREATE TABLE project_testers (
  project_id UUID REFERENCES test_projects(id) ON DELETE CASCADE,
  tester_id UUID REFERENCES testers(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (project_id, tester_id)
);
```

**3. test_case_attachments**
```sql
CREATE TABLE test_case_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_result_id UUID REFERENCES checklist_test_results(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER,
  uploaded_at TIMESTAMP DEFAULT NOW()
);
```

#### Modified Tables

**checklist_test_results** - Add tester support
```sql
-- Add tester_id column
ALTER TABLE checklist_test_results
  ADD COLUMN tester_id UUID REFERENCES testers(id) ON DELETE CASCADE;

-- Migrate existing data (create "Legacy Tester")
INSERT INTO testers (name, email) VALUES ('Legacy Tester', 'legacy@system');
UPDATE checklist_test_results
  SET tester_id = (SELECT id FROM testers WHERE email = 'legacy@system');

-- Make required
ALTER TABLE checklist_test_results ALTER COLUMN tester_id SET NOT NULL;

-- New composite unique constraint
ALTER TABLE checklist_test_results
  DROP CONSTRAINT IF EXISTS checklist_test_results_unique;
ALTER TABLE checklist_test_results
  ADD CONSTRAINT checklist_test_results_unique
  UNIQUE (project_checklist_module_id, testcase_id, tester_id);
```

#### Testing
- [ ] Run all migrations in Supabase SQL Editor
- [ ] Verify tables exist with `SHOW TABLES`
- [ ] Check foreign keys and constraints
- [ ] Test data migration (existing results have Legacy Tester)

---

### Phase 2: Backend Services & APIs
**Owner**: Backend Agent
**Duration**: ~12 hours
**Status**: NOT STARTED

#### New Services (`/lib/services/`)

**1. testerService.ts**
```typescript
- getAllTesters(): Promise<Tester[]>
- createTester(name, email, color): Promise<Tester>
- updateTester(id, data): Promise<Tester>
- deleteTester(id): Promise<void>
- getProjectTesters(projectId): Promise<Tester[]>
- assignTesterToProject(projectId, testerId): Promise<void>
- unassignTesterFromProject(projectId, testerId): Promise<void>
```

**2. attachmentService.ts**
```typescript
- uploadAttachment(testResultId, file): Promise<Attachment>
- getAttachments(testResultId): Promise<Attachment[]>
- deleteAttachment(attachmentId): Promise<void>
// Uses Supabase Storage bucket: test-attachments
```

**3. checklistService.ts** (modify existing)
```typescript
// NEW/MODIFIED METHODS:
- addModuleToChecklist(projectId, moduleId, instanceLabel):
  * Fetch assigned testers for project
  * Create test results for EACH tester × EACH test case

- getProjectChecklist(projectId):
  * Return test results grouped by test case
  * Include all tester statuses per test case
  * Calculate "weakest status" per test case

- getWeakestStatus(statuses[]):
  * Logic: Fail > Skipped > Pass > Pending

- updateTestResult(resultId, testerId, status, notes):
  * Update specific tester's result
  * Validate tester is assigned to project
```

#### New API Routes (`/app/api/`)

**Testers**
- `GET /api/testers` - List all testers
- `POST /api/testers` - Create tester (body: name, email, color)
- `PUT /api/testers/[id]` - Update tester
- `DELETE /api/testers/[id]` - Delete tester

**Project Testers**
- `GET /api/projects/[projectId]/testers` - Get assigned testers
- `POST /api/projects/[projectId]/testers` - Assign tester (body: testerId)
- `DELETE /api/projects/[projectId]/testers/[testerId]` - Unassign

**Attachments**
- `POST /api/test-results/[id]/attachments` - Upload image
- `GET /api/test-results/[id]/attachments` - List attachments
- `DELETE /api/attachments/[id]` - Delete attachment

**Modified**
- `GET /api/checklists/[projectId]` - Return multi-tester structure
- `PUT /api/test-results/[id]` - Include tester_id validation

#### Testing with Postman/Thunder Client
- [ ] Test tester CRUD (create, list, update, delete)
- [ ] Test project tester assignment
- [ ] Test add module → verify test results for all testers
- [ ] Test image upload to Supabase Storage
- [ ] Test weakest status calculation
- [ ] Document all API contracts (request/response examples)

---

### ~~Phase 3: Realtime Infrastructure~~ (SKIPPED)
**Owner**: N/A
**Duration**: N/A
**Status**: SKIPPED - Using Smart Polling Instead

#### Decision: No Supabase Realtime

**Reason**: Cost optimization for free-tier deployment
- Supabase Realtime requires paid subscription ($25/month minimum)
- Project is a free tool for small teams (2-3 testers)
- Occasional use (not daily/continuous)

**Alternative Approach**: Smart Polling with React Query
- Poll backend every 5-10 seconds (configurable)
- 100% free within Vercel/Supabase limits
- Near-instant updates (5-10 second latency acceptable for QA work)
- Optimistic UI for current user's actions (instant feedback)

**See**: `docs/FRONTEND_UX_ARCHITECTURE.md` for complete architecture

#### What We Use Instead

**1. React Query Polling** (Frontend)
```typescript
const { data: checklist } = useQuery({
  queryKey: ['checklist', projectId],
  queryFn: () => fetchChecklist(projectId),
  refetchInterval: 5000, // Poll every 5 seconds
  refetchIntervalInBackground: true,
  staleTime: 0,
});
```

**2. Optimistic UI Updates** (Frontend)
```typescript
// User's own updates are instant (optimistic)
const updateMutation = useMutation({
  mutationFn: (data) => updateTestResult(data),
  onMutate: async (newData) => {
    // Update local cache immediately
    queryClient.setQueryData(['checklist', projectId], (old) => ({
      ...old,
      ...newData,
    }));
  },
  onError: (err, variables, context) => {
    // Rollback on failure
    queryClient.setQueryData(['checklist', projectId], context.previousData);
  },
});
```

**3. Seamless Background Sync**
- Other testers' updates appear within 5-10 seconds
- No page refresh, no disruption
- Subtle animations for updates

#### Cost Analysis

**Polling Load** (3 testers, 2 hours/day, 5 days/week):
- 3 users × 12 requests/min × 120 min × 5 days × 4 weeks = 86,400 requests/month

**Free Tier Limits**:
- Supabase: 500,000 requests/month (17% usage) ✅
- Vercel: 100,000 invocations/month (86% usage) ✅

**Verdict**: Completely free, scalable to 5+ testers

#### Benefits Over Realtime

- ✅ $0 cost (vs $25+/month)
- ✅ Simpler implementation (no WebSocket management)
- ✅ Works offline (can queue updates)
- ✅ No connection limits
- ⚠️ 5-10 second latency (acceptable for QA collaboration)

#### Testing
- [ ] Verify 5-second polling works smoothly
- [ ] Test optimistic updates with rollback
- [ ] Open 2 browser windows → verify updates appear within 10 seconds
- [ ] Test with 3+ simultaneous users
- [ ] Monitor request volume stays within free tier

---

### Phase 4: Fresh Frontend Components (V2)
**Owner**: Frontend Agent / Coordinator
**Duration**: ~16 hours (Completed in ~20 hours with additional polish)
**Status**: ✅ COMPLETE (2025-01-21)

**Completion Notes**:
- All core features implemented: Overview, Edit, and Work modes
- Additional UI polish beyond original scope:
  - Ultra-compact multi-tester view (1-line per tester)
  - Colored tester badges matching avatar colors
  - Click-to-expand notes with line breaks
  - Fixed image icon positioning
  - Status filter fix for single vs multi-tester views
- See STATUS.md Session 3 for detailed changelog

#### New Pages

**1. Tester Management** (`/app/testers/page.tsx`)
- List all testers (table or card view)
- "Add Tester" button → Modal with form
- Form: name (required), email (optional), color picker
- Edit/Delete actions per tester
- Simple CRUD interface (no complex features yet)

#### New Components

**2. TesterSelector** (`/components/testers/TesterSelector.tsx`)
- Multi-select dropdown with checkboxes
- Shows assigned testers with color badges
- Add/remove testers from project
- Used in ProjectForm

**3. ChecklistPageV2** (`/app/projects/[projectId]/checklist-v2/page.tsx`)
```typescript
Features:
- Supabase Realtime subscription on mount
- Optimistic UI for all actions
- React Query or Zustand for state (NO useState for critical data)
- Loading skeletons
- Connection status indicator
```

**4. ModuleBuilderV2** (`/components/checklist/ModuleBuilderV2.tsx`)
```typescript
Features:
- Drag-and-drop available modules
- Optimistic add/remove (instant UI)
- "Syncing..." indicator during API calls
- Realtime updates when others add/remove modules
- No more state bugs!
```

**5. TestExecutionV2** (`/components/checklist/TestExecutionV2.tsx`)
```typescript
Features:
- Multi-tester view switcher: "All Testers" | "My View" (select tester)
- Stats use weakest status logic
- Realtime progress bar updates
- Tester filter dropdown
```

**6. TestCaseRowV2** (`/components/checklist/TestCaseRowV2.tsx`)
```
UI Layout:
┌─────────────────────────────────────────────────────────┐
│ 🔴 Login with valid credentials            [FAIL]       │ ← Overall (weakest)
├─────────────────────────────────────────────────────────┤
│ 👤 Alice   [✓ PASS]  10:30 AM  📎 2 images            │
│ 👤 Bob     [✗ FAIL]  10:45 AM  📝 Notes  📎 1 image    │ ← Determines overall
│ 👤 Carol   [✓ PASS]  11:00 AM                          │
│                                                          │
│ [Click to expand notes & images ▼]                      │
└─────────────────────────────────────────────────────────┘

Per-Tester Row Features:
- Status dropdown (Pending/Pass/Fail/Skipped)
- Auto-timestamp on status change
- Notes textarea (expandable)
- Image upload button + thumbnail gallery
- Optimistic updates + realtime sync
```

**7. ImageUploader** (`/components/ui/ImageUploader.tsx`)
- Drag-drop zone or file picker
- Multiple file support
- Upload to Supabase Storage
- Progress bar during upload
- Immediate thumbnail preview

**8. ImageGallery** (`/components/ui/ImageGallery.tsx`)
- Grid of thumbnails (150x150px)
- Click → Full-screen modal with zoom/pan
- Delete button per image
- Lightbox navigation (prev/next)

#### Testing
- [ ] Test each component in isolation
- [ ] Open 2 windows, verify realtime sync
- [ ] Update status in Window 1 → appears in Window 2
- [ ] Upload image → syncs across windows
- [ ] Add/delete module → updates all viewers
- [ ] Test with 100+ test cases (performance)

---

### Phase 5: Integration & Polish
**Owner**: All Agents
**Duration**: ~10 hours
**Status**: NOT STARTED

#### Connect Everything
1. **Update Routing**
   - Rename old `/checklist` → `/checklist-old` (backup)
   - Make `/checklist` point to ChecklistPageV2
   - Add "Tester Management" link in nav

2. **Data Migration** (if needed)
   - Ensure all existing test results have tester_id
   - Verify no orphaned records

3. **Performance Optimization**
   - Virtualization for long test lists (react-window)
   - Lazy load images (only visible thumbnails)
   - Debounce realtime updates (batch rapid changes)
   - Connection status indicator

4. **Error Handling**
   - Network errors → Retry with exponential backoff
   - Concurrent edits → Show "Someone else updated, refresh?"
   - Image upload failures → Clear error messages
   - API failures → Rollback optimistic updates

5. **Loading States**
   - Skeleton loaders for initial page load
   - Shimmer effects during fetch
   - Upload progress indicators
   - "Saving..." indicators

#### End-to-End Testing
- [ ] Create project with 3 testers
- [ ] Add 5 modules (50+ test cases)
- [ ] 3 people update statuses simultaneously
- [ ] Upload 10+ images across different tests
- [ ] Check realtime sync performance
- [ ] Test network offline/online scenarios
- [ ] Verify weakest status calculation

---

### Phase 6: Cleanup Old Code
**Owner**: DevOps Agent
**Duration**: ~4 hours
**Status**: NOT STARTED

#### Remove Old Files
- [ ] Delete `/app/projects/[projectId]/checklist/page.tsx` (old version)
- [ ] Delete old components:
  - `ModuleBuilder.tsx`
  - `TestExecution.tsx`
  - `TestCaseRow.tsx`
- [ ] Remove unused imports
- [ ] Remove debug `console.log` statements
- [ ] Delete unused service files

#### Final Reorganization
- [ ] Rename all V2 components (drop "V2" suffix)
- [ ] Update all internal imports
- [ ] Run build to verify no broken references
- [ ] Update documentation

---

## 🔧 Technical Patterns

### Optimistic Update Pattern
```typescript
// Example: Update test status
async function handleStatusChange(resultId, newStatus) {
  // 1. Optimistic UI update (instant)
  updateLocalState(resultId, newStatus);

  // 2. API call (background)
  try {
    await fetch(`/api/test-results/${resultId}`, {
      method: 'PUT',
      body: JSON.stringify({ status: newStatus })
    });
    // Success: Realtime will confirm or correct if needed
  } catch (error) {
    // 3. Rollback on failure
    revertLocalState(resultId);
    showError('Failed to update status');
  }
}

// Realtime subscription handles updates from OTHER users
supabase
  .channel('checklist')
  .on('postgres_changes', (payload) => {
    // Only update if change came from someone else
    if (payload.new.updated_by !== currentUserId) {
      updateLocalState(payload.new);
    }
  })
  .subscribe();
```

### Weakest Status Logic
```typescript
const statusPriority = {
  'Fail': 4,
  'Skipped': 3,
  'Pass': 2,
  'Pending': 1
};

function getWeakestStatus(results: TestResult[]) {
  return results.reduce((weakest, current) =>
    statusPriority[current.status] > statusPriority[weakest.status]
      ? current : weakest
  ).status;
}
```

---

## 📊 Success Metrics

### Performance
- [ ] Status updates feel instant (<100ms perceived latency)
- [ ] Realtime sync within 1 second
- [ ] Page loads <2 seconds
- [ ] Handles 100+ test cases smoothly

### Reliability
- [ ] Optimistic updates rollback gracefully on errors
- [ ] No state management bugs
- [ ] No duplicate API calls
- [ ] Proper error messages

### Features
- [ ] Multi-tester support working correctly
- [ ] Weakest status calculation accurate
- [ ] Image upload/display working
- [ ] Real-time collaboration functional

### Code Quality
- [ ] Clean folder structure
- [ ] No old/unused files
- [ ] All imports working
- [ ] Type-safe (no `any` types)
- [ ] Well-documented

---

## 🧪 Testing Loop (Per Phase)

After each phase:
1. **Backend Agent** builds feature → Tests with Postman
2. Reports API test results (sample requests/responses)
3. **Frontend Agent** builds UI → Manual browser testing
4. Verify multi-window realtime behavior
5. Document any issues found
6. Fix before moving to next phase

**No skipping phases!** Each phase must be complete and tested.

---

## ⏱️ Timeline Estimate

| Phase | Duration | Owner |
|-------|----------|-------|
| Phase 0: Cleanup | 4 hours | DevOps Agent |
| Phase 1: Database | 6 hours | Backend Agent |
| Phase 2: APIs | 12 hours | Backend Agent |
| ~~Phase 3: Realtime~~ | SKIPPED | N/A (Using Smart Polling) |
| Phase 4: Frontend | 16 hours | Frontend Agent |
| Phase 5: Integration | 10 hours | All Agents |
| Phase 6: Cleanup | 4 hours | DevOps Agent |
| **Total** | **58 hours** | **~7-8 working days** |

---

## 📝 Session Recovery Protocol

**To prevent losing progress again:**

1. **Always update STATUS.md** after completing tasks
2. **Commit frequently** to GitHub
3. **Document blockers** immediately in STATUS.md
4. **Keep PLANNING.md updated** with completed phases
5. **Save session logs** to `claude old session.md` before closing

---

## 🚀 Ready to Start?

Current phase: **Phase 0 - Codebase Cleanup**

Next action: Launch DevOps Agent to begin cleanup and reorganization.

---

**End of Planning Document**
