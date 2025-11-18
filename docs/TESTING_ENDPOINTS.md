# API Testing Guide - Quick Reference

**Phase 2**: Backend Services & APIs
**Date**: 2025-01-18

This guide provides sample requests for testing all Phase 2 endpoints using tools like **Postman**, **Thunder Client**, or **curl**.

---

## Environment Setup

**Base URL**: `http://localhost:3000` (development) or `https://qa-checklist-automation.vercel.app` (production)

**Required Headers** (for JSON endpoints):
```
Content-Type: application/json
```

---

## 1. Testers API

### Create Tester
```bash
POST /api/testers
Content-Type: application/json

{
  "name": "Alice Johnson",
  "email": "alice@test.com",
  "color": "#FF6B35"
}
```

**Expected**: 201 Created with tester object

---

### List All Testers
```bash
GET /api/testers
```

**Expected**: 200 OK with array of testers

---

### Get Tester by ID
```bash
GET /api/testers/{testerId}
```

**Replace**: `{testerId}` with actual UUID from create response

**Expected**: 200 OK with tester object

---

### Update Tester
```bash
PUT /api/testers/{testerId}
Content-Type: application/json

{
  "name": "Alice Johnson-Smith",
  "color": "#E71D36"
}
```

**Expected**: 200 OK with updated tester

---

### Delete Tester
```bash
DELETE /api/testers/{testerId}
```

**Expected**: 200 OK with success message

---

## 2. Project-Tester Assignment API

### Assign Tester to Project
```bash
POST /api/projects/{projectId}/testers
Content-Type: application/json

{
  "testerId": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Expected**: 201 Created

---

### List Assigned Testers
```bash
GET /api/projects/{projectId}/testers
```

**Expected**: 200 OK with array of assigned testers

---

### Unassign Tester from Project
```bash
DELETE /api/projects/{projectId}/testers/{testerId}
```

**Expected**: 200 OK with success message

---

## 3. Multi-Tester Checklist API

### Get Multi-Tester Checklist
```bash
GET /api/checklists/{projectId}?view=multi-tester
```

**Expected**: 200 OK with multi-tester structure

**Response Structure**:
```json
{
  "success": true,
  "data": {
    "projectId": "...",
    "projectName": "...",
    "assignedTesters": [...],
    "modules": [
      {
        "id": "...",
        "moduleName": "...",
        "testCases": [
          {
            "testCase": {...},
            "results": [
              {
                "id": "...",
                "tester": {...},
                "status": "Pass",
                "notes": "...",
                "attachments": [...]
              }
            ],
            "overallStatus": "Pass"
          }
        ]
      }
    ]
  }
}
```

---

### Get Legacy Checklist
```bash
GET /api/checklists/{projectId}
```

(Same as before, flat structure)

---

## 4. Test Results API

### Update Test Result (Multi-Tester Mode)
```bash
PUT /api/checklists/test-results/{resultId}
Content-Type: application/json

{
  "testerId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "Pass",
  "notes": "Test completed successfully"
}
```

**Expected**: 200 OK with updated result

**Error Cases**:
- 403 Forbidden: Tester ID mismatch
- 404 Not Found: Result not found

---

### Update Test Result (Legacy Mode)
```bash
PUT /api/checklists/test-results/{resultId}
Content-Type: application/json

{
  "status": "Fail",
  "notes": "Button not working",
  "testedBy": "Alice Johnson"
}
```

**Expected**: 200 OK with updated result

---

## 5. Attachments API

### Upload Attachment
```bash
POST /api/test-results/{resultId}/attachments
Content-Type: multipart/form-data

[FormData with 'file' field]
```

**Postman Instructions**:
1. Set method to POST
2. Select "Body" tab
3. Choose "form-data"
4. Add key: `file`, type: File
5. Click "Select Files" and choose an image

**curl Example**:
```bash
curl -X POST \
  http://localhost:3000/api/test-results/{resultId}/attachments \
  -F "file=@/path/to/screenshot.png"
```

**Expected**: 201 Created with attachment object

---

### List Attachments
```bash
GET /api/test-results/{resultId}/attachments
```

**Expected**: 200 OK with array of attachments

---

### Delete Attachment
```bash
DELETE /api/attachments/{attachmentId}
```

**Expected**: 200 OK with success message

---

## Complete Multi-Tester Workflow Test

### Step 1: Create 3 Testers
```bash
# Tester 1: Alice
POST /api/testers
{"name": "Alice", "email": "alice@test.com", "color": "#FF6B35"}
# Save aliceId from response

# Tester 2: Bob
POST /api/testers
{"name": "Bob", "email": "bob@test.com", "color": "#4ECDC4"}
# Save bobId from response

# Tester 3: Charlie
POST /api/testers
{"name": "Charlie", "email": "charlie@test.com", "color": "#95E1D3"}
# Save charlieId from response
```

---

### Step 2: Create Project
```bash
POST /api/projects
{
  "name": "Patch 4.5 Testing",
  "version": "4.5",
  "type": "Patch",
  "description": "Test multi-tester workflow"
}
# Save projectId from response
```

---

### Step 3: Assign All Testers to Project
```bash
POST /api/projects/{projectId}/testers
{"testerId": "{aliceId}"}

POST /api/projects/{projectId}/testers
{"testerId": "{bobId}"}

POST /api/projects/{projectId}/testers
{"testerId": "{charlieId}"}
```

---

### Step 4: Verify Assigned Testers
```bash
GET /api/projects/{projectId}/testers
```

**Expected**: Array of 3 testers

---

### Step 5: Add Module to Checklist
```bash
POST /api/checklists/modules
{
  "projectId": "{projectId}",
  "moduleId": "{existingModuleId}",
  "instanceLabel": "Login Tests"
}
```

**Expected**: System creates test results for 3 testers × N test cases

---

### Step 6: Fetch Multi-Tester Checklist
```bash
GET /api/checklists/{projectId}?view=multi-tester
```

**Verify**:
- `assignedTesters` has 3 testers
- Each test case has 3 `results` (one per tester)
- Each result has initial status `Pending`

---

### Step 7: Update Test Results
```bash
# Alice updates her result
PUT /api/checklists/test-results/{aliceResultId}
{
  "testerId": "{aliceId}",
  "status": "Pass",
  "notes": "Works perfectly"
}

# Bob updates his result
PUT /api/checklists/test-results/{bobResultId}
{
  "testerId": "{bobId}",
  "status": "Fail",
  "notes": "Button not clickable"
}

# Charlie updates his result
PUT /api/checklists/test-results/{charlieResultId}
{
  "testerId": "{charlieId}",
  "status": "Pass",
  "notes": "No issues found"
}
```

---

### Step 8: Upload Screenshot for Failed Test
```bash
POST /api/test-results/{bobResultId}/attachments
[Upload image file]
```

**Expected**: File uploaded to Supabase Storage

---

### Step 9: Verify Multi-Tester Checklist
```bash
GET /api/checklists/{projectId}?view=multi-tester
```

**Verify**:
- Alice's result: `Pass`
- Bob's result: `Fail` (with attachment)
- Charlie's result: `Pass`
- **`overallStatus`**: `Fail` (weakest status)

---

### Step 10: Test Tester Validation
```bash
# Try to update Alice's result with Bob's testerId
PUT /api/checklists/test-results/{aliceResultId}
{
  "testerId": "{bobId}",
  "status": "Skipped"
}
```

**Expected**: 403 Forbidden - "You can only update your own test results"

---

## Weakest Status Tests

Test the weakest status calculation logic:

### Test 1: All Pass
```bash
# All 3 testers: Pass
# Expected overallStatus: Pass
```

### Test 2: One Fail
```bash
# Alice: Pass, Bob: Fail, Charlie: Pass
# Expected overallStatus: Fail
```

### Test 3: One Skipped
```bash
# Alice: Pass, Bob: Skipped, Charlie: Pending
# Expected overallStatus: Skipped
```

### Test 4: Mix of Statuses
```bash
# Alice: Pending, Bob: Skipped, Charlie: Pass
# Expected overallStatus: Skipped (Skipped > Pass > Pending)
```

---

## Error Testing

### Invalid Tester ID Format
```bash
PUT /api/checklists/test-results/{resultId}
{"testerId": "invalid-uuid", "status": "Pass"}
```

**Expected**: 400 Bad Request - Validation failed

---

### Duplicate Email
```bash
POST /api/testers
{"name": "Alice2", "email": "alice@test.com"}
```

**Expected**: 409 Conflict - Email already exists

---

### Assign Non-Existent Tester
```bash
POST /api/projects/{projectId}/testers
{"testerId": "00000000-0000-0000-0000-000000000000"}
```

**Expected**: 404 Not Found - Tester not found

---

### Upload Invalid File Type
```bash
POST /api/test-results/{resultId}/attachments
[Upload PDF file]
```

**Expected**: 400 Bad Request - Invalid file type

---

### Upload Oversized File
```bash
POST /api/test-results/{resultId}/attachments
[Upload 10MB image]
```

**Expected**: 400 Bad Request - File size exceeds maximum

---

## Thunder Client / Postman Collection

### Sample Collection Structure

```
QA Checklist Automation - Phase 2
├── Testers
│   ├── Create Tester
│   ├── List All Testers
│   ├── Get Tester by ID
│   ├── Update Tester
│   └── Delete Tester
├── Project-Tester Assignment
│   ├── Assign Tester to Project
│   ├── List Assigned Testers
│   └── Unassign Tester
├── Checklist (Multi-Tester)
│   ├── Get Multi-Tester Checklist
│   └── Get Legacy Checklist
├── Test Results
│   ├── Update Result (Multi-Tester Mode)
│   └── Update Result (Legacy Mode)
└── Attachments
    ├── Upload Attachment
    ├── List Attachments
    └── Delete Attachment
```

---

## Expected Database State After Testing

### Testers Table
| id | name | email | color |
|----|------|-------|-------|
| uuid1 | Alice | alice@test.com | #FF6B35 |
| uuid2 | Bob | bob@test.com | #4ECDC4 |
| uuid3 | Charlie | charlie@test.com | #95E1D3 |

---

### Project_Testers Table
| project_id | tester_id | assigned_at |
|------------|-----------|-------------|
| projectUuid | aliceId | 2025-01-18... |
| projectUuid | bobId | 2025-01-18... |
| projectUuid | charlieId | 2025-01-18... |

---

### Checklist_Test_Results Table
If module has 50 test cases:
- 150 rows total (3 testers × 50 test cases)
- Each row has unique (module_id, testcase_id, tester_id)

---

### Test_Case_Attachments Table
| id | test_result_id | file_url | file_name | file_type |
|----|----------------|----------|-----------|-----------|
| uuid | bobResultId | https://... | screenshot.png | image/png |

---

## Debugging Tips

### Enable Request Logging
Check server console for:
- `[DEBUG]` logs from services
- `[WARN]` logs for legacy tester fallback
- `Error:` logs for failures

### Common Issues

**Issue**: "Project not found" when assigning tester
**Solution**: Verify project exists with `GET /api/projects`

**Issue**: "Email already exists" when creating tester
**Solution**: Use unique email or update existing tester

**Issue**: Attachment upload returns 404
**Solution**: Verify test result ID exists

**Issue**: 403 Forbidden on test result update
**Solution**: Ensure `testerId` matches the test result's `tester_id`

---

## Next Steps

After successful endpoint testing:
1. Document any bugs found
2. Fix issues and retest
3. Run complete multi-tester workflow test
4. Verify weakest status calculation
5. Test edge cases (no assigned testers, deleted testers, etc.)
6. Proceed to Phase 3: Frontend UI Components

---

**Testing Checklist**:
- [ ] All tester endpoints working
- [ ] All assignment endpoints working
- [ ] Multi-tester checklist returns correct structure
- [ ] Test result updates with tester validation working
- [ ] Attachment upload working (files in Supabase Storage)
- [ ] Weakest status calculation correct
- [ ] Error responses have correct status codes
- [ ] Legacy mode still works

---

**Report Status**: Ready for testing
**Date**: 2025-01-18
