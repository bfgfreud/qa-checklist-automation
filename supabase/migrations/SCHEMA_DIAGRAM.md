# Phase 1: Multi-Tester Schema Diagram

## Database Schema - Before Phase 1

```
┌─────────────────────┐
│   base_modules      │
│─────────────────────│
│ id (PK)            │
│ name               │
│ description        │
│ order_index        │
│ tags               │
│ created_by         │
└─────────────────────┘
         │
         │ 1:N
         │
         ▼
┌─────────────────────┐
│  base_testcases     │
│─────────────────────│
│ id (PK)            │
│ module_id (FK)     │
│ title              │
│ description        │
│ priority           │
│ order_index        │
└─────────────────────┘



┌─────────────────────┐
│   test_projects     │
│─────────────────────│
│ id (PK)            │
│ name               │
│ description        │
│ status             │
└─────────────────────┘
         │
         │ 1:N
         │
         ▼
┌─────────────────────────────────────┐
│   project_checklist_modules         │
│─────────────────────────────────────│
│ id (PK)                            │
│ project_id (FK)                    │
│ module_id (FK)                     │
│ instance_label                     │
│ instance_number                    │
│ order_index                        │
└─────────────────────────────────────┘
         │
         │ 1:N
         │
         ▼
┌──────────────────────────────────────┐
│   checklist_test_results (V1)        │
│──────────────────────────────────────│
│ id (PK)                             │
│ project_checklist_module_id (FK)    │
│ testcase_id (FK)                    │
│ status                              │
│ notes                               │
│ tested_by (text)                    │◄─── Single tester (text field)
│ tested_at                           │
└──────────────────────────────────────┘

UNIQUE: (project_checklist_module_id, testcase_id)
        ▲
        │
        └── One result per test case (BEFORE Phase 1)
```

---

## Database Schema - After Phase 1 (Multi-Tester)

```
┌─────────────────────┐
│   base_modules      │
│─────────────────────│
│ id (PK)            │
│ name               │
│ description        │
│ order_index        │
│ tags               │
│ created_by         │
└─────────────────────┘
         │
         │ 1:N
         │
         ▼
┌─────────────────────┐
│  base_testcases     │
│─────────────────────│
│ id (PK)            │
│ module_id (FK)     │
│ title              │
│ description        │
│ priority           │
│ order_index        │
└─────────────────────┘



┌──────────────────┐                ┌─────────────────────┐
│   testers        │                │   test_projects     │
│──────────────────│                │─────────────────────│
│ id (PK)         │                │ id (PK)            │
│ name            │                │ name               │
│ email (UNIQUE)  │                │ description        │
│ color           │                │ status             │
└──────────────────┘                └─────────────────────┘
         │                                    │
         │                                    │
         │          ┌─────────────────┐       │
         └──────────│ project_testers │───────┘
              N:M   │─────────────────│  N:M
                    │ project_id (FK) │
                    │ tester_id (FK)  │
                    │ assigned_at     │
                    └─────────────────┘
                    (Junction Table)


┌─────────────────────┐
│   test_projects     │
│─────────────────────│
│ id (PK)            │
│ name               │
│ description        │
│ status             │
└─────────────────────┘
         │
         │ 1:N
         │
         ▼
┌─────────────────────────────────────┐
│   project_checklist_modules         │
│─────────────────────────────────────│
│ id (PK)                            │
│ project_id (FK)                    │
│ module_id (FK)                     │
│ instance_label                     │
│ instance_number                    │
│ order_index                        │
└─────────────────────────────────────┘
         │
         │ 1:N
         │
         ▼
┌──────────────────────────────────────┐         ┌──────────────────┐
│   checklist_test_results (V2)        │    N:1  │   testers        │
│──────────────────────────────────────│─────────│──────────────────│
│ id (PK)                             │         │ id (PK)         │
│ project_checklist_module_id (FK)    │         │ name            │
│ testcase_id (FK)                    │         │ email (UNIQUE)  │
│ tester_id (FK) ◄───────────────────────────┐  │ color           │
│ status                              │         │ └──────────────────┘
│ notes                               │         │
│ tested_by (deprecated)              │         │
│ tested_at                           │         │
└──────────────────────────────────────┘         │
         │                                       │
         │ 1:N                                   │
         │                                       │
         ▼                                       │
┌─────────────────────────────┐                 │
│ test_case_attachments       │                 │
│─────────────────────────────│                 │
│ id (PK)                    │                 │
│ test_result_id (FK)        │                 │
│ file_url                   │                 │
│ file_name                  │                 │
│ file_type                  │                 │
│ file_size                  │                 │
│ uploaded_at                │                 │
└─────────────────────────────┘                 │
                                                │
UNIQUE: (project_checklist_module_id, testcase_id, tester_id)
        ▲
        │
        └── One result per TESTER per test case (AFTER Phase 1)
```

---

## Key Changes Highlighted

### New Entities (3)

#### 1. `testers` Table
```
┌──────────────────┐
│   testers        │
│──────────────────│
│ id (PK)         │ ◄── UUID
│ name            │ ◄── NOT NULL
│ email (UNIQUE)  │ ◄── Optional (for future OAuth)
│ color           │ ◄── Default: #FF6B35
│ created_at      │
└──────────────────┘
```

**Purpose:** Store tester information for multi-tester collaboration

#### 2. `project_testers` Junction Table
```
┌─────────────────┐
│ project_testers │
│─────────────────│
│ project_id (FK) │ ─┐
│ tester_id (FK)  │ ─┤ Composite PK
│ assigned_at     │  │
└─────────────────┘  │
                     │
     UNIQUE: (project_id, tester_id)
```

**Purpose:** Many-to-many relationship between projects and testers

#### 3. `test_case_attachments` Table
```
┌─────────────────────────────┐
│ test_case_attachments       │
│─────────────────────────────│
│ id (PK)                    │
│ test_result_id (FK)        │ ◄── Links to checklist_test_results
│ file_url                   │ ◄── Supabase Storage URL
│ file_name                  │ ◄── Original filename
│ file_type                  │ ◄── MIME type
│ file_size                  │ ◄── Bytes
│ uploaded_at                │
└─────────────────────────────┘
```

**Purpose:** Store image/file attachments for test results

### Modified Entity (1)

#### `checklist_test_results` - Before & After

**BEFORE:**
```
┌──────────────────────────────────────┐
│   checklist_test_results (V1)        │
│──────────────────────────────────────│
│ id (PK)                             │
│ project_checklist_module_id (FK)    │
│ testcase_id (FK)                    │
│ status                              │
│ notes                               │
│ tested_by (text)                    │ ◄── Plain text field
│ tested_at                           │
└──────────────────────────────────────┘

UNIQUE: (project_checklist_module_id, testcase_id)
```

**AFTER:**
```
┌──────────────────────────────────────┐
│   checklist_test_results (V2)        │
│──────────────────────────────────────│
│ id (PK)                             │
│ project_checklist_module_id (FK)    │
│ testcase_id (FK)                    │
│ tester_id (FK) ◄── NEW! NOT NULL    │ ◄── Foreign key to testers
│ status                              │
│ notes                               │
│ tested_by (deprecated)              │ ◄── Kept for backward compatibility
│ tested_at                           │
└──────────────────────────────────────┘

UNIQUE: (project_checklist_module_id, testcase_id, tester_id)
                                                     ▲
                                                     │
                                        NEW! Includes tester_id
```

---

## Multi-Tester Example

### Scenario: 3 Testers Testing the Same Checklist

**Project:** "Mobile App v2.5 Testing"
**Module:** "Sign In" (4 test cases)
**Testers:** Alice, Bob, Carol

### Database Records Created

#### Before Phase 1 (Single Tester)
```
checklist_test_results (4 rows)
┌────┬─────────┬──────────────────────┬──────────┬──────────┐
│ ID │ Module  │ Test Case            │ Status   │ Tester   │
├────┼─────────┼──────────────────────┼──────────┼──────────┤
│ 1  │ Sign In │ Google Sign In       │ Pending  │ (none)   │
│ 2  │ Sign In │ Apple Sign In        │ Pending  │ (none)   │
│ 3  │ Sign In │ Email Sign In        │ Pending  │ (none)   │
│ 4  │ Sign In │ Password Reset       │ Pending  │ (none)   │
└────┴─────────┴──────────────────────┴──────────┴──────────┘
Total: 4 rows
```

#### After Phase 1 (Multi-Tester)
```
checklist_test_results (12 rows = 4 tests × 3 testers)
┌────┬─────────┬──────────────────────┬──────────┬──────────┐
│ ID │ Module  │ Test Case            │ Status   │ Tester   │
├────┼─────────┼──────────────────────┼──────────┼──────────┤
│ 1  │ Sign In │ Google Sign In       │ Pass     │ Alice    │
│ 2  │ Sign In │ Google Sign In       │ Pass     │ Bob      │
│ 3  │ Sign In │ Google Sign In       │ Fail     │ Carol    │◄─ Different result!
│ 4  │ Sign In │ Apple Sign In        │ Pass     │ Alice    │
│ 5  │ Sign In │ Apple Sign In        │ Pending  │ Bob      │
│ 6  │ Sign In │ Apple Sign In        │ Pass     │ Carol    │
│ 7  │ Sign In │ Email Sign In        │ Pass     │ Alice    │
│ 8  │ Sign In │ Email Sign In        │ Pass     │ Bob      │
│ 9  │ Sign In │ Email Sign In        │ Pass     │ Carol    │
│ 10 │ Sign In │ Password Reset       │ Pending  │ Alice    │
│ 11 │ Sign In │ Password Reset       │ Pending  │ Bob      │
│ 12 │ Sign In │ Password Reset       │ Skipped  │ Carol    │
└────┴─────────┴──────────────────────┴──────────┴──────────┘
Total: 12 rows (4 tests × 3 testers)
```

**Key Insight:** Each tester has their own independent test results!

---

## Foreign Key Relationships

```
test_projects
    │
    ├──► project_checklist_modules (1:N)
    │        │
    │        └──► checklist_test_results (1:N)
    │                 │
    │                 ├──► testers (N:1)
    │                 │
    │                 └──► test_case_attachments (1:N)
    │
    └──► project_testers (1:N)
             │
             └──► testers (N:1)
```

**All foreign keys use `ON DELETE CASCADE`** for automatic cleanup.

---

## Data Flow: Creating a Multi-Tester Checklist

```
Step 1: Create Testers
┌──────────────────┐
│ INSERT testers   │
└──────────────────┘
         │
         ▼
┌──────────────────┐
│ Alice, Bob, Carol│
└──────────────────┘

Step 2: Assign Testers to Project
┌─────────────────────────┐
│ INSERT project_testers  │
└─────────────────────────┘
         │
         ▼
┌─────────────────────────┐
│ Project ←→ Alice        │
│ Project ←→ Bob          │
│ Project ←→ Carol        │
└─────────────────────────┘

Step 3: Add Module to Project
┌─────────────────────────────────┐
│ INSERT project_checklist_modules│
└─────────────────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│ "Sign In" module added      │
│ to project checklist        │
└─────────────────────────────┘

Step 4: Create Test Results for ALL Testers
┌──────────────────────────────────┐
│ FOR EACH tester IN (Alice, Bob,  │
│                     Carol):      │
│   FOR EACH testcase IN module:   │
│     INSERT test result           │
└──────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────┐
│ 4 test cases × 3 testers         │
│ = 12 checklist_test_results rows │
└──────────────────────────────────┘
```

---

## Index Strategy

### Performance Optimization Indexes

```
testers
├── idx_testers_email (UNIQUE lookups)

project_testers
├── idx_project_testers_project_id (Find testers for project)
└── idx_project_testers_tester_id (Find projects for tester)

test_case_attachments
├── idx_attachments_test_result (Primary query: get attachments for result)
├── idx_attachments_file_type (Filter by type)
└── idx_attachments_uploaded_at (Sort by time)

checklist_test_results
└── idx_test_results_tester_id (Join/filter by tester)
```

**Result:** Fast queries for all common operations

---

## Query Examples

### Get all testers for a project
```sql
SELECT t.*
FROM testers t
JOIN project_testers pt ON pt.tester_id = t.id
WHERE pt.project_id = '<project-id>';
```

### Get test results for a specific tester
```sql
SELECT *
FROM checklist_test_results
WHERE tester_id = '<tester-id>';
```

### Get progress by tester
```sql
SELECT
  t.name,
  COUNT(*) as total,
  COUNT(CASE WHEN ctr.status = 'Pass' THEN 1 END) as passed
FROM testers t
JOIN checklist_test_results ctr ON ctr.tester_id = t.id
GROUP BY t.id, t.name;
```

---

## Schema Version Summary

| Version | Tables | Multi-Tester | Attachments | Status |
|---------|--------|--------------|-------------|--------|
| V1 (Before) | 5 | ❌ No | ❌ No | Legacy |
| V2 (After Phase 1) | 8 | ✅ Yes | ✅ Yes | Current |

**Migration Path:** V1 → V2 (Phase 1 migrations)

---

**Diagram Version:** 1.0
**Last Updated:** 2025-01-18
**Schema Version:** V2 (Multi-Tester)
