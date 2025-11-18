# Checklist API Reference

Quick reference for all Checklist feature API endpoints.

## Base URL
```
/api/projects/[projectId]/checklist
```

---

## Endpoints

### 1. Get Project Checklist
**GET** `/api/projects/[projectId]/checklist`

Get complete checklist with all modules and test results for a project.

**Response:**
```typescript
{
  success: true,
  data: {
    projectId: string
    projectName: string
    modules: ChecklistModuleWithResults[]
    totalModules: number
    totalTests: number
    pendingTests: number
    passedTests: number
    failedTests: number
    skippedTests: number
    overallProgress: number  // 0-100%
  }
}
```

**Status Codes:**
- `200` - Success
- `400` - Invalid project ID
- `404` - Project not found
- `500` - Server error

---

### 2. Add Module to Checklist
**POST** `/api/projects/[projectId]/checklist`

Add a module instance to the project's checklist.

**Request Body:**
```json
{
  "moduleId": "uuid",
  "instanceLabel": "Optional custom label"
}
```

**Response:**
```typescript
{
  success: true,
  data: {
    id: string
    projectId: string
    moduleId: string
    moduleName: string
    instanceLabel?: string
    instanceNumber: number
    orderIndex: number
    testResults: ChecklistTestResult[]
    totalTests: number
    pendingTests: number
    passedTests: number
    failedTests: number
    skippedTests: number
    progress: number
    createdAt: string
    updatedAt: string
  }
}
```

**Status Codes:**
- `201` - Module added successfully
- `400` - Validation failed
- `404` - Project or module not found
- `500` - Server error

---

### 3. Remove Module from Checklist
**DELETE** `/api/projects/[projectId]/checklist/[checklistModuleId]`

Remove a module instance from the checklist (cascades to all test results).

**Response:**
```json
{
  "success": true,
  "message": "Module removed from checklist successfully"
}
```

**Status Codes:**
- `200` - Success
- `400` - Invalid ID
- `500` - Server error

---

### 4. Reorder Checklist Modules
**POST** `/api/projects/[projectId]/checklist/reorder`

Update the display order of modules in the checklist.

**Request Body:**
```json
{
  "modules": [
    { "id": "checklist-module-uuid-1", "orderIndex": 0 },
    { "id": "checklist-module-uuid-2", "orderIndex": 1 },
    { "id": "checklist-module-uuid-3", "orderIndex": 2 }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Checklist modules reordered successfully"
}
```

**Status Codes:**
- `200` - Success
- `400` - Validation failed or modules don't belong to project
- `500` - Server error

---

### 5. Update Test Result
**PUT** `/api/projects/[projectId]/checklist/results/[resultId]`

Update the execution status and notes for a test case.

**Request Body:**
```json
{
  "status": "Pass",
  "notes": "Optional test notes",
  "testedBy": "Optional tester email/ID"
}
```

**Valid Status Values:**
- `"Pending"` - Not yet tested
- `"Pass"` - Test passed
- `"Fail"` - Test failed
- `"Skipped"` - Test skipped

**Response:**
```typescript
{
  success: true,
  data: {
    id: string
    projectChecklistModuleId: string
    testcaseId: string
    testcaseTitle: string
    testcaseDescription?: string
    testcasePriority: 'High' | 'Medium' | 'Low'
    status: TestStatus
    notes?: string
    testedBy?: string
    testedAt?: string  // Auto-set when status changes from Pending
    createdAt: string
    updatedAt: string
  }
}
```

**Status Codes:**
- `200` - Success
- `400` - Validation failed or invalid ID
- `404` - Test result not found
- `500` - Server error

---

### 6. Get Progress Statistics
**GET** `/api/projects/[projectId]/checklist/progress`

Get aggregated progress statistics for the project.

**Response:**
```typescript
{
  success: true,
  data: {
    projectId: string
    totalModules: number
    totalTests: number
    pendingTests: number
    passedTests: number
    failedTests: number
    skippedTests: number
    overallProgress: number  // 0-100%
    moduleStats: [
      {
        moduleId: string
        moduleName: string
        instanceLabel?: string
        totalTests: number
        pendingTests: number
        passedTests: number
        failedTests: number
        skippedTests: number
        progress: number  // 0-100%
      }
    ]
  }
}
```

**Status Codes:**
- `200` - Success
- `400` - Invalid project ID
- `404` - Project not found
- `500` - Server error

---

## Error Response Format

All endpoints return errors in this format:

```json
{
  "success": false,
  "error": "Human-readable error message",
  "details": [  // Only for validation errors
    {
      "path": ["fieldName"],
      "message": "Validation error message"
    }
  ]
}
```

---

## Common HTTP Status Codes

| Code | Meaning | When Used |
|------|---------|-----------|
| 200 | OK | Successful GET/PUT/DELETE |
| 201 | Created | Successful POST (creation) |
| 400 | Bad Request | Validation failed or invalid input |
| 404 | Not Found | Resource doesn't exist |
| 500 | Internal Server Error | Server-side error |

---

## Example Usage Flows

### Flow 1: Create a New Checklist for a Project

1. **Get all available modules**
   ```
   GET /api/modules
   ```

2. **Add modules to project checklist**
   ```
   POST /api/projects/{projectId}/checklist
   Body: { "moduleId": "module-uuid-1" }

   POST /api/projects/{projectId}/checklist
   Body: { "moduleId": "module-uuid-2", "instanceLabel": "Ayaka" }
   ```

3. **Get the complete checklist**
   ```
   GET /api/projects/{projectId}/checklist
   ```

---

### Flow 2: Execute Tests and Track Progress

1. **Get checklist**
   ```
   GET /api/projects/{projectId}/checklist
   ```

2. **Update test results as you execute them**
   ```
   PUT /api/projects/{projectId}/checklist/results/{resultId}
   Body: { "status": "Pass", "notes": "All assertions passed" }

   PUT /api/projects/{projectId}/checklist/results/{resultId}
   Body: { "status": "Fail", "notes": "Login timeout" }
   ```

3. **Check progress**
   ```
   GET /api/projects/{projectId}/checklist/progress
   ```

---

### Flow 3: Reorder Checklist Modules

1. **Get current checklist**
   ```
   GET /api/projects/{projectId}/checklist
   ```

2. **Reorder based on user's drag-drop**
   ```
   POST /api/projects/{projectId}/checklist/reorder
   Body: {
     "modules": [
       { "id": "checklist-module-3", "orderIndex": 0 },
       { "id": "checklist-module-1", "orderIndex": 1 },
       { "id": "checklist-module-2", "orderIndex": 2 }
     ]
   }
   ```

3. **Get updated checklist**
   ```
   GET /api/projects/{projectId}/checklist
   ```

---

## Type Definitions

All TypeScript types are available in:
```
shared/types/checklist.ts
```

Import in frontend:
```typescript
import type {
  ProjectChecklist,
  ChecklistModuleWithResults,
  ChecklistTestResult,
  TestStatus
} from '@/shared/types/checklist'
```

---

## Notes

- All UUIDs are validated before processing
- The `tested_at` timestamp is automatically set by the database when status changes from `Pending`
- Deleting a module instance automatically deletes all associated test results (CASCADE)
- Instance numbers are auto-calculated when adding a module
- Progress percentages are calculated as: (Non-Pending Tests / Total Tests) × 100
