# Module Library Guide

## Overview
The Module Library is a comprehensive management interface for organizing test cases into reusable modules. It provides full CRUD operations, bulk import/export, and advanced features like tagging and duplicate detection.

**Location:** `/app/modules/page.tsx`

## Key Features

### 1. Module Management
- **Create/Edit/Delete Modules**
  - Name (required, unique validation)
  - Description (optional)
  - Icon (emoji picker)
  - Tags (multi-tag support with JSONB storage)
  - Created By (for future auth integration)

### 2. Test Case Management
- **CRUD Operations** for test cases within modules
  - Title (required)
  - Description (optional)
  - Priority (High/Medium/Low)
- **Drag-and-Drop Reordering**
  - Within modules
  - Between modules (moves test case to different module)
- **Order Persistence** via `order_index` field

### 3. Draft Mode
- **Local State Management** before saving
  - All changes are held in draft state
  - Visual indicator shows unsaved changes
  - Save button commits all changes to database
  - Cancel/revert functionality
- **Duplicate Name Detection**
  - Real-time validation
  - Prevents duplicate module names
  - Clear error messaging

### 4. CSV Import/Export

#### Export Format
```csv
Module Name,Module Description,Module Icon,Module Tags,Test Case Title,Test Case Description,Test Case Priority
Sign In,Authentication flows,🔐,"auth,security",Google Sign In,Google OAuth works,High
Sign In,Authentication flows,🔐,"auth,security",Apple Sign In,Apple OAuth works,High
Payment Flow,Payment processing,💳,"payment,critical",Credit Card,CC payment works,High
```

**Export Features:**
- RFC 4180 compliant CSV
- UTF-8 encoding (supports emojis)
- Proper escaping for commas, quotes, newlines
- Timestamped filenames
- Module fields repeat for each test case row

#### Import Features
- **Preview Modal** shows changes before applying
  - Statistics (new modules, updated modules, test cases)
  - List of affected modules
  - Warning for test case replacement
- **Replace Mode**: Existing modules get test cases replaced (not merged)
- **Tags Support**: Comma-separated tags in CSV
- **Error Handling**: Validation and feedback

### 5. Search & Filter
- **Real-time Search** across module names and descriptions
- **Case-insensitive** matching
- **Highlight Results** in the UI

### 6. Collapse/Expand
- **Individual Module** toggle
- **Expand All** / **Collapse All** buttons
- **State Persistence** during session

## Technical Architecture

### Database Schema

**base_modules table:**
```sql
- id: UUID (primary key)
- name: TEXT (unique, not null)
- description: TEXT
- order_index: INTEGER (for drag-drop ordering)
- tags: JSONB (array of strings)
- created_by: TEXT (user ID/email)
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

**base_testcases table:**
```sql
- id: UUID (primary key)
- module_id: UUID (foreign key to base_modules, CASCADE delete)
- title: TEXT (not null)
- description: TEXT
- priority: TEXT (CHECK: 'High', 'Medium', 'Low')
- order_index: INTEGER (for drag-drop ordering)
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

### Service Layer
**Location:** `/backend/services/moduleService.ts`

**Key Functions:**
- `getAllModules()` - Fetches all modules with nested test cases
- `getModuleById(id)` - Fetches single module with test cases
- `createModule(input)` - Creates new module
- `updateModule(id, input)` - Updates module
- `deleteModule(id)` - Deletes module (cascades to test cases)
- `reorderModules(input)` - Updates order_index for multiple modules
- `createTestCase(input)` - Creates test case within module
- `updateTestCase(id, input)` - Updates test case
- `deleteTestCase(id)` - Deletes test case
- `reorderTestCases(input)` - Updates order_index for test cases

**Important Note: JSONB Tag Parsing**
Supabase doesn't always auto-parse JSONB fields. The service layer includes explicit `JSON.parse()` logic:

```typescript
// Parse tags from JSONB if it's a string, otherwise use as-is
let parsedTags: string[] = [];
if (typeof module.tags === 'string') {
  try {
    parsedTags = JSON.parse(module.tags);
  } catch (e) {
    console.error('Error parsing tags for module:', module.id, e);
    parsedTags = [];
  }
} else if (Array.isArray(module.tags)) {
  parsedTags = module.tags;
}
```

This is applied in both `getAllModules()` (lines 58-77) and `getModuleById()` (lines 113-130).

### API Endpoints
**Location:** `/app/api/modules/route.ts` and `/app/api/modules/[id]/route.ts`

- `GET /api/modules` - Get all modules
- `POST /api/modules` - Create module
- `GET /api/modules/:id` - Get single module
- `PUT /api/modules/:id` - Update module
- `DELETE /api/modules/:id` - Delete module
- `POST /api/modules/reorder` - Reorder modules
- `GET /api/modules/:id/testcases` - Get test cases for module
- `POST /api/modules/:id/testcases` - Create test case
- `PUT /api/modules/:id/testcases/:testcaseId` - Update test case
- `DELETE /api/modules/:id/testcases/:testcaseId` - Delete test case
- `POST /api/modules/:id/testcases/reorder` - Reorder test cases

### Frontend State Management
- **Draft State** (`draftModules`) - Local state for unsaved changes
- **Saved State** (`modules`) - Synced with database
- **Dirty Flag** (`isDirty`) - Tracks if there are unsaved changes
- **Drag-and-Drop** using `@dnd-kit/core` and `@dnd-kit/sortable`

### Validation Layer
**Location:** `/backend/validations/module.schema.ts`

Uses Zod schemas for type-safe validation:
- `createModuleSchema` - Validates module creation
- `updateModuleSchema` - Validates module updates
- `createTestCaseSchema` - Validates test case creation
- `updateTestCaseSchema` - Validates test case updates
- `reorderModulesSchema` - Validates reordering operations

### Type Definitions
**Location:** `/shared/types/module.ts`

Shared types between frontend and backend:
- `Module` - Module interface
- `TestCase` - Test case interface
- `Priority` - 'High' | 'Medium' | 'Low'
- `CreateModuleDto`, `UpdateModuleDto` - DTOs for API
- `CreateTestCaseDto`, `UpdateTestCaseDto` - DTOs for API
- `ReorderModulesDto`, `ReorderTestCasesDto` - DTOs for reordering

## Database Migrations

### Initial Setup
**File:** `SUPABASE_SETUP_SIMPLE.sql`
- Creates `base_modules` and `base_testcases` tables
- Adds indexes for performance
- Inserts sample data

### Tags & Created By Migration
**File:** `MIGRATION_ADD_TAGS_CREATED_BY.sql`
- Adds `tags` (JSONB) column to `base_modules`
- Adds `created_by` (TEXT) column to `base_modules`
- Creates GIN index on tags for fast filtering
- Includes verification queries

## Known Issues & Solutions

### Issue: Tags Not Displaying After Save
**Root Cause:** Supabase client doesn't auto-parse JSONB to JavaScript arrays in all cases.

**Solution:** Explicit `JSON.parse()` in service layer (see moduleService.ts lines 58-77 and 113-130).

### Issue: Next.js Build Cache Errors
**Symptom:** "Cannot find module './XXX.js'" errors after updates.

**Solution:** Clear `.next` cache and rebuild:
```bash
rd /s /q .next
npm run dev
```

## Future Enhancements
- User authentication integration (use `created_by` field)
- Tag filtering in UI
- Bulk test case operations
- Module templates
- Export to other formats (JSON, Excel)
- Import validation preview improvements
- Undo/redo for draft changes

## Related Documentation
- [CSV Import/Export Guide](./CSV_IMPORT_EXPORT.md)
- [Main README](../README.md)
