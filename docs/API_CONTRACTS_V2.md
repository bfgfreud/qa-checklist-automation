# API Contracts V2 - Multi-Tester Support

**Version:** 2.0
**Last Updated:** 2025-01-18
**Status:** Phase 2 Complete - Backend Services & APIs

## Overview

This document defines the API contracts for the QA Checklist Automation system with **multi-tester support**. The system now allows multiple testers to collaborate on the same project checklist, with each tester having their own independent test results.

### Key Features
- **Multi-Tester Collaboration**: Assign multiple testers to a project
- **Individual Test Results**: Each tester maintains separate results for the same test cases
- **Weakest Status Calculation**: Overall test case status is the "weakest" across all testers
- **File Attachments**: Testers can upload screenshots/images for test results
- **Backward Compatibility**: Legacy endpoints still work for single-tester mode

---

## Table of Contents

1. [Testers API](#testers-api)
2. [Project-Tester Assignment API](#project-tester-assignment-api)
3. [Checklist API (Multi-Tester)](#checklist-api-multi-tester)
4. [Test Results API](#test-results-api)
5. [Attachments API](#attachments-api)
6. [Error Responses](#error-responses)
7. [Data Structures](#data-structures)

---

## Testers API

### POST /api/testers
**Description**: Create a new tester

**Request Body**:
```json
{
  "name": "Alice Johnson",
  "email": "alice@test.com",
  "color": "#FF6B35"
}
```

**Request Schema**:
- `name` (string, required): Tester's display name (1-100 characters)
- `email` (string, optional): Email address (must be unique, valid email format)
- `color` (string, optional): Hex color code for UI (default: `#FF6B35`)

**Response (201 Created)**:
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Alice Johnson",
    "email": "alice@test.com",
    "color": "#FF6B35",
    "created_at": "2025-01-18T10:30:00Z"
  }
}
```

**Error Responses**:
- `400 Bad Request`: Validation failed
- `409 Conflict`: Email already exists
- `500 Internal Server Error`: Server error

---

### GET /api/testers
**Description**: List all testers

**Response (200 OK)**:
```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Alice Johnson",
      "email": "alice@test.com",
      "color": "#FF6B35",
      "created_at": "2025-01-18T10:30:00Z"
    },
    {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "name": "Bob Smith",
      "email": "bob@test.com",
      "color": "#4ECDC4",
      "created_at": "2025-01-18T11:00:00Z"
    }
  ]
}
```

---

### GET /api/testers/[id]
**Description**: Get tester by ID

**Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Alice Johnson",
    "email": "alice@test.com",
    "color": "#FF6B35",
    "created_at": "2025-01-18T10:30:00Z"
  }
}
```

**Error Responses**:
- `404 Not Found`: Tester not found

---

### PUT /api/testers/[id]
**Description**: Update tester information

**Request Body**:
```json
{
  "name": "Alice Johnson-Smith",
  "color": "#E71D36"
}
```

**Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Alice Johnson-Smith",
    "email": "alice@test.com",
    "color": "#E71D36",
    "created_at": "2025-01-18T10:30:00Z"
  }
}
```

**Error Responses**:
- `404 Not Found`: Tester not found
- `409 Conflict`: Email already exists

---

### DELETE /api/testers/[id]
**Description**: Delete a tester (cascades to test results and project assignments)

**Response (200 OK)**:
```json
{
  "success": true
}
```

**Error Responses**:
- `404 Not Found`: Tester not found

---

## Project-Tester Assignment API

### POST /api/projects/[projectId]/testers
**Description**: Assign a tester to a project

**Request Body**:
```json
{
  "testerId": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Response (201 Created)**:
```json
{
  "success": true
}
```

**Error Responses**:
- `400 Bad Request`: Invalid testerId format
- `404 Not Found`: Project or tester not found
- `409 Conflict`: Tester already assigned to this project

---

### GET /api/projects/[projectId]/testers
**Description**: List all testers assigned to a project

**Response (200 OK)**:
```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Alice Johnson",
      "email": "alice@test.com",
      "color": "#FF6B35",
      "created_at": "2025-01-18T10:30:00Z"
    },
    {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "name": "Bob Smith",
      "email": "bob@test.com",
      "color": "#4ECDC4",
      "created_at": "2025-01-18T11:00:00Z"
    }
  ]
}
```

---

### DELETE /api/projects/[projectId]/testers/[testerId]
**Description**: Unassign a tester from a project (does NOT delete their test results)

**Response (200 OK)**:
```json
{
  "success": true
}
```

---

## Checklist API (Multi-Tester)

### GET /api/checklists/[projectId]?view=multi-tester
**Description**: Get project checklist with multi-tester structure

**Query Parameters**:
- `view` (string, optional): `"multi-tester"` for multi-tester view, omit for legacy view

**Response (200 OK)** - Multi-Tester View:
```json
{
  "success": true,
  "data": {
    "projectId": "770e8400-e29b-41d4-a716-446655440002",
    "projectName": "Patch 4.5 Testing",
    "assignedTesters": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "name": "Alice Johnson",
        "email": "alice@test.com",
        "color": "#FF6B35",
        "created_at": "2025-01-18T10:30:00Z"
      },
      {
        "id": "660e8400-e29b-41d4-a716-446655440001",
        "name": "Bob Smith",
        "email": "bob@test.com",
        "color": "#4ECDC4",
        "created_at": "2025-01-18T11:00:00Z"
      }
    ],
    "modules": [
      {
        "id": "880e8400-e29b-41d4-a716-446655440003",
        "projectId": "770e8400-e29b-41d4-a716-446655440002",
        "moduleId": "990e8400-e29b-41d4-a716-446655440004",
        "moduleName": "Login Testing",
        "moduleDescription": "Verify login functionality",
        "instanceLabel": "Main Login",
        "instanceNumber": 1,
        "orderIndex": 0,
        "createdAt": "2025-01-18T12:00:00Z",
        "updatedAt": "2025-01-18T12:00:00Z",
        "testCases": [
          {
            "testCase": {
              "id": "aa0e8400-e29b-41d4-a716-446655440005",
              "title": "Valid login with correct credentials",
              "description": "Enter valid username and password",
              "priority": "High"
            },
            "results": [
              {
                "id": "bb0e8400-e29b-41d4-a716-446655440006",
                "tester": {
                  "id": "550e8400-e29b-41d4-a716-446655440000",
                  "name": "Alice Johnson",
                  "email": "alice@test.com",
                  "color": "#FF6B35",
                  "created_at": "2025-01-18T10:30:00Z"
                },
                "status": "Pass",
                "notes": "Login successful in 2 seconds",
                "testedAt": "2025-01-18T14:00:00Z",
                "attachments": []
              },
              {
                "id": "cc0e8400-e29b-41d4-a716-446655440007",
                "tester": {
                  "id": "660e8400-e29b-41d4-a716-446655440001",
                  "name": "Bob Smith",
                  "email": "bob@test.com",
                  "color": "#4ECDC4",
                  "created_at": "2025-01-18T11:00:00Z"
                },
                "status": "Fail",
                "notes": "Login button not responding",
                "testedAt": "2025-01-18T14:30:00Z",
                "attachments": [
                  {
                    "id": "dd0e8400-e29b-41d4-a716-446655440008",
                    "test_result_id": "cc0e8400-e29b-41d4-a716-446655440007",
                    "file_url": "https://project.supabase.co/storage/v1/object/public/test-attachments/770e8400.../screenshot.png",
                    "file_name": "login-error-screenshot.png",
                    "file_type": "image/png",
                    "file_size": 152340,
                    "uploaded_at": "2025-01-18T14:31:00Z"
                  }
                ]
              }
            ],
            "overallStatus": "Fail"
          }
        ]
      }
    ]
  }
}
```

**Key Multi-Tester Concepts**:
- **`modules[].testCases[]`**: Each test case has multiple `results` (one per tester)
- **`overallStatus`**: Weakest status across all testers (Fail > Skipped > Pass > Pending)
- **`assignedTesters`**: All testers assigned to this project

**Error Responses**:
- `400 Bad Request`: Invalid project ID format
- `404 Not Found`: Project not found

---

## Test Results API

### PUT /api/checklists/test-results/[id]
**Description**: Update a test result (supports both legacy and multi-tester modes)

**Request Body (Multi-Tester Mode)**:
```json
{
  "testerId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "Pass",
  "notes": "Test completed successfully"
}
```

**Request Body (Legacy Mode)**:
```json
{
  "status": "Fail",
  "notes": "Button not clickable",
  "testedBy": "Alice Johnson"
}
```

**Request Schema**:
- `testerId` (string, optional): If provided, validates that the result belongs to this tester
- `status` (enum, required): `"Pending"` | `"Pass"` | `"Fail"` | `"Skipped"`
- `notes` (string, optional): Test notes (max 2000 characters)
- `testedBy` (string, optional): DEPRECATED - Use `testerId` instead

**Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "id": "bb0e8400-e29b-41d4-a716-446655440006",
    "projectChecklistModuleId": "880e8400-e29b-41d4-a716-446655440003",
    "testcaseId": "aa0e8400-e29b-41d4-a716-446655440005",
    "testcaseTitle": "Valid login with correct credentials",
    "testcaseDescription": "Enter valid username and password",
    "testcasePriority": "High",
    "status": "Pass",
    "notes": "Test completed successfully",
    "testedBy": "Alice Johnson",
    "testedAt": "2025-01-18T15:00:00Z",
    "createdAt": "2025-01-18T12:00:00Z",
    "updatedAt": "2025-01-18T15:00:00Z"
  }
}
```

**Error Responses**:
- `400 Bad Request`: Validation failed
- `403 Forbidden`: Tester ID mismatch (you can only update your own results)
- `404 Not Found`: Test result not found

---

## Attachments API

### POST /api/test-results/[id]/attachments
**Description**: Upload an attachment (image) for a test result

**Request**:
- **Content-Type**: `multipart/form-data`
- **Body**: FormData with `file` field

**Example (JavaScript)**:
```javascript
const formData = new FormData()
formData.append('file', file) // File object from <input type="file">

const response = await fetch('/api/test-results/bb0e8400.../attachments', {
  method: 'POST',
  body: formData
})
```

**Validation Rules**:
- **Allowed Types**: `image/png`, `image/jpeg`, `image/jpg`, `image/gif`, `image/webp`
- **Max Size**: 5MB
- **Storage**: Supabase Storage bucket `test-attachments`
- **Path**: `{projectId}/{testResultId}/{timestamp}_{filename}`

**Response (201 Created)**:
```json
{
  "success": true,
  "data": {
    "id": "dd0e8400-e29b-41d4-a716-446655440008",
    "test_result_id": "bb0e8400-e29b-41d4-a716-446655440006",
    "file_url": "https://project.supabase.co/storage/v1/object/public/test-attachments/770e8400.../1737206460_screenshot.png",
    "file_name": "login-error-screenshot.png",
    "file_type": "image/png",
    "file_size": 152340,
    "uploaded_at": "2025-01-18T14:31:00Z"
  }
}
```

**Error Responses**:
- `400 Bad Request`: Invalid file type or size
- `404 Not Found`: Test result not found

---

### GET /api/test-results/[id]/attachments
**Description**: Get all attachments for a test result

**Response (200 OK)**:
```json
{
  "success": true,
  "data": [
    {
      "id": "dd0e8400-e29b-41d4-a716-446655440008",
      "test_result_id": "bb0e8400-e29b-41d4-a716-446655440006",
      "file_url": "https://project.supabase.co/storage/v1/object/public/test-attachments/770e8400.../screenshot.png",
      "file_name": "login-error-screenshot.png",
      "file_type": "image/png",
      "file_size": 152340,
      "uploaded_at": "2025-01-18T14:31:00Z"
    }
  ]
}
```

---

### DELETE /api/attachments/[id]
**Description**: Delete an attachment (removes file from storage and database)

**Response (200 OK)**:
```json
{
  "success": true
}
```

**Error Responses**:
- `404 Not Found`: Attachment not found

---

## Error Responses

All error responses follow this format:

```json
{
  "success": false,
  "error": "Error message here",
  "details": [] // Optional - validation errors
}
```

### Common HTTP Status Codes

| Code | Meaning | Example |
|------|---------|---------|
| 200 | OK | Successful GET, PUT, DELETE |
| 201 | Created | Successful POST (resource created) |
| 400 | Bad Request | Validation failed, invalid input |
| 403 | Forbidden | Tester trying to update another tester's result |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Duplicate email, tester already assigned |
| 500 | Internal Server Error | Unexpected server error |

---

## Data Structures

### Tester
```typescript
interface Tester {
  id: string; // UUID
  name: string;
  email: string | null;
  color: string; // Hex color code
  created_at: string; // ISO timestamp
}
```

### TestCaseAttachment
```typescript
interface TestCaseAttachment {
  id: string; // UUID
  test_result_id: string; // UUID
  file_url: string; // Full public URL
  file_name: string;
  file_type: string; // MIME type
  file_size: number | null; // Bytes
  uploaded_at: string; // ISO timestamp
}
```

### TestStatus
```typescript
type TestStatus = 'Pending' | 'Pass' | 'Fail' | 'Skipped';
```

**Weakest Status Priority** (for calculating `overallStatus`):
1. **Fail** (highest priority / weakest)
2. **Skipped**
3. **Pass**
4. **Pending** (lowest priority / strongest)

**Example**:
- Alice: Pass, Bob: Pass → Overall: **Pass**
- Alice: Pass, Bob: Fail → Overall: **Fail**
- Alice: Pending, Bob: Skipped → Overall: **Skipped**

---

## Multi-Tester Workflow Example

### Step 1: Create Testers
```bash
POST /api/testers
{ "name": "Alice", "email": "alice@test.com", "color": "#FF6B35" }

POST /api/testers
{ "name": "Bob", "email": "bob@test.com", "color": "#4ECDC4" }
```

### Step 2: Create Project
```bash
POST /api/projects
{ "name": "Patch 4.5 Testing", "version": "4.5", "type": "Patch" }
```

### Step 3: Assign Testers to Project
```bash
POST /api/projects/{projectId}/testers
{ "testerId": "{aliceId}" }

POST /api/projects/{projectId}/testers
{ "testerId": "{bobId}" }
```

### Step 4: Add Module to Checklist
```bash
POST /api/checklists/modules
{ "projectId": "{projectId}", "moduleId": "{loginModuleId}" }
```

**Result**: System automatically creates test results for BOTH Alice and Bob for ALL test cases in the module

### Step 5: View Multi-Tester Checklist
```bash
GET /api/checklists/{projectId}?view=multi-tester
```

Returns data structured by Module > Test Case > Tester Results

### Step 6: Update Test Results
```bash
# Alice updates her result
PUT /api/checklists/test-results/{aliceResultId}
{ "testerId": "{aliceId}", "status": "Pass", "notes": "Works fine" }

# Bob updates his result
PUT /api/checklists/test-results/{bobResultId}
{ "testerId": "{bobId}", "status": "Fail", "notes": "Button broken" }
```

### Step 7: Upload Screenshot (Bob's failed test)
```bash
POST /api/test-results/{bobResultId}/attachments
FormData: { file: screenshot.png }
```

### Step 8: View Results
```bash
GET /api/checklists/{projectId}?view=multi-tester
```

Returns:
- Alice's result: Pass
- Bob's result: Fail (with screenshot attached)
- **Overall Status**: Fail (weakest)

---

## Supabase Storage Setup

### Bucket Configuration

**Bucket Name**: `test-attachments`

**Settings**:
- Public: Yes
- File size limit: 5MB
- Allowed MIME types: `image/png, image/jpeg, image/jpg, image/gif, image/webp`

**File Path Structure**:
```
test-attachments/
  └── {projectId}/
      └── {testResultId}/
          └── {timestamp}_{filename}
```

**Example Path**:
```
test-attachments/770e8400-e29b-41d4-a716-446655440002/bb0e8400-e29b-41d4-a716-446655440006/1737206460_screenshot.png
```

**Public URL Format**:
```
https://[project].supabase.co/storage/v1/object/public/test-attachments/[path]
```

---

## Frontend Integration Guide

### Fetching Multi-Tester Checklist

```typescript
async function getProjectChecklist(projectId: string) {
  const response = await fetch(`/api/checklists/${projectId}?view=multi-tester`)
  const { success, data, error } = await response.json()

  if (!success) {
    throw new Error(error)
  }

  return data // ProjectChecklistWithTesters
}
```

### Updating Test Result

```typescript
async function updateTestResult(
  resultId: string,
  testerId: string,
  status: 'Pending' | 'Pass' | 'Fail' | 'Skipped',
  notes?: string
) {
  const response = await fetch(`/api/checklists/test-results/${resultId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ testerId, status, notes })
  })

  const { success, data, error } = await response.json()

  if (!success) {
    if (response.status === 403) {
      throw new Error('You can only update your own test results')
    }
    throw new Error(error)
  }

  return data
}
```

### Uploading Attachment

```typescript
async function uploadAttachment(
  testResultId: string,
  file: File
) {
  const formData = new FormData()
  formData.append('file', file)

  const response = await fetch(`/api/test-results/${testResultId}/attachments`, {
    method: 'POST',
    body: formData // Don't set Content-Type header - browser sets it automatically
  })

  const { success, data, error } = await response.json()

  if (!success) {
    throw new Error(error)
  }

  return data // TestCaseAttachment
}
```

---

## Notes

### Backward Compatibility

All endpoints support **backward compatibility**:
- **Legacy mode**: Omit `testerId` or use `view=legacy` query parameter
- **Multi-tester mode**: Include `testerId` or use `view=multi-tester` query parameter

### Legacy Tester

If no testers are assigned to a project, the system automatically uses the **Legacy Tester** (`email: 'legacy@system'`) as a fallback. This ensures existing projects continue to work.

### Database Constraints

- **Unique Constraint**: `(project_checklist_module_id, testcase_id, tester_id)` - One result per tester per test case
- **Cascade Deletes**: Deleting a tester cascades to `project_testers` and `checklist_test_results`
- **Email Uniqueness**: Tester emails must be unique (if provided)

---

## Testing Checklist

- [ ] Create 3 testers
- [ ] Assign all 3 to a project
- [ ] Add module to checklist → Verify 3 × N test results created
- [ ] Update test result with `testerId` validation
- [ ] Upload attachment for a failed test
- [ ] Fetch multi-tester checklist
- [ ] Verify `overallStatus` calculation (Pass, Pass, Fail → Fail)
- [ ] Try to update another tester's result → 403 Forbidden
- [ ] Delete attachment → File removed from storage

---

**End of API Contracts V2**
