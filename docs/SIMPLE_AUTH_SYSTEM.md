# Simple Name-Based Authentication System

## Overview
Implemented a lightweight authentication system based on **name matching** rather than passwords. This allows multi-tester collaboration testing without the complexity of full authentication.

## How It Works

### 1. **Global Tester Context**
- **File**: `contexts/TesterContext.tsx`
- Manages current tester state across the entire app
- Stores tester name in localStorage for persistence
- Automatically finds existing tester by name or creates new one

### 2. **Current Tester Badge**
- **File**: `components/ui/CurrentTesterBadge.tsx`
- Displays in top-right corner of every page
- Click to edit name
- Auto-saves to localStorage

### 3. **Auto-Assignment**
- When you visit a project's working mode, system checks if you're assigned
- If not assigned, **automatically assigns you** to the project
- No manual "join" dialogs needed

### 4. **Name Matching Logic**
```typescript
// Case-insensitive name matching
const existingTester = testers.find(
  t => t.name.toLowerCase() === name.toLowerCase()
);

if (existingTester) {
  // Use existing tester
} else {
  // Create new tester with random color
}
```

## User Flow

1. **First Time User**:
   - Click "Set Your Name" badge in header
   - Type your name (e.g., "Alice")
   - System creates new tester with that name

2. **Existing User**:
   - Type the same name (e.g., "Alice" again)
   - System finds existing tester and uses it
   - All past test results are preserved

3. **Working on Projects**:
   - Navigate to any project's working mode
   - System auto-assigns you if not already assigned
   - Start testing immediately

## Benefits

✅ **Simple**: Just type your name, no passwords
✅ **Multi-Tester**: Different names = different testers
✅ **Persistent**: Name saved in localStorage
✅ **Auto-Assign**: Automatically joins projects
✅ **Reusable**: Same name = same tester identity

## Files Changed

### New Files
- `contexts/TesterContext.tsx` - Global state management
- `components/ui/CurrentTesterBadge.tsx` - Name selector UI
- `components/layout/ClientLayout.tsx` - App wrapper with context

### Modified Files
- `app/layout.tsx` - Wrapped with ClientLayout
- `app/projects/[projectId]/work/page.tsx` - Auto-assign logic, removed join dialog

## Testing Multi-Tester Collaboration

To test with multiple testers:

1. **Browser Tab 1** (Alice):
   - Set name to "Alice"
   - Create project, add module
   - Start working

2. **Browser Tab 2** (Bob):
   - Set name to "Bob"
   - Open same project
   - Start working

3. **Verify**:
   - Each tester sees their own results
   - Polling updates show other tester's progress
   - No data conflicts or flickering

## Future: Real Authentication

When ready to add real auth (NextAuth.js, Clerk, etc.):

1. Replace `TesterContext` with auth context
2. Link testers to user accounts in database
3. Remove localStorage, use server sessions
4. Keep auto-assign logic the same

## Technical Notes

- **localStorage key**: `currentTesterName`
- **Color assignment**: Random from 8 predefined colors
- **Case-insensitive**: "Alice" = "alice" = "ALICE"
- **No email required**: Email field is optional/empty
