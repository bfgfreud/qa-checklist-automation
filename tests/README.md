# Testing Domain - QA Checklist Automation

**Agent**: `qa-automation`
**Last Updated**: 2025-01-14

## Overview
This folder contains all automated tests for the QA Checklist Automation project, including unit tests, integration tests, and end-to-end tests.

## Folder Structure
```
tests/
├── unit/                   # Unit tests
│   ├── frontend/          # Frontend component & hook tests
│   ├── backend/           # Backend service & utility tests
│   └── shared/            # Shared utility tests
├── integration/           # Integration tests
│   └── api/              # API endpoint tests
├── e2e/                  # End-to-end tests
│   ├── module-management.spec.ts
│   ├── project-creation.spec.ts
│   ├── checklist-builder.spec.ts
│   └── checklist-execution.spec.ts
├── fixtures/             # Test data
│   ├── modules.ts
│   ├── projects.ts
│   └── checklists.ts
└── utils/                # Test utilities
    ├── test-helpers.ts
    └── setup.ts
```

## Current Tasks
- [ ] Set up testing infrastructure (Jest, Playwright)
- [ ] Configure test environment and mocks
- [ ] Write unit tests for backend services
- [ ] Write unit tests for frontend components
- [ ] Write integration tests for API endpoints
- [ ] Write E2E tests for critical user flows
- [ ] Integrate tests into CI/CD pipeline
- [ ] Set up test coverage reporting
- [ ] Create test fixtures and utilities
- [ ] Document testing guidelines

## Testing Stack
- **Unit Tests**: Jest + React Testing Library
- **E2E Tests**: Playwright
- **API Tests**: Playwright API Testing
- **Mocking**: MSW (Mock Service Worker)
- **Coverage**: Jest Coverage
- **CI/CD**: GitHub Actions

## Test Coverage Goals
- **Overall**: 80%+ code coverage
- **Backend Services**: 90%+ (critical business logic)
- **Frontend Components**: 70%+
- **API Routes**: 100% (all endpoints tested)
- **E2E**: All critical user flows covered

## Unit Tests

### Backend Services (`/tests/unit/backend/`)

#### moduleService.test.ts
```typescript
describe('moduleService', () => {
  describe('getAllModules', () => {
    it('should return all modules with testcases', async () => {
      // Arrange
      const mockModules = [{ id: '1', name: 'Auth', testcases: [] }]
      jest.spyOn(supabase, 'from').mockReturnValue(mockModules)

      // Act
      const result = await moduleService.getAllModules()

      // Assert
      expect(result).toEqual(mockModules)
    })
  })

  describe('createModule', () => {
    it('should create a new module', async () => { })
    it('should throw error if name already exists', async () => { })
  })

  // Similar tests for update, delete, etc.
})
```

#### projectService.test.ts
Test all CRUD operations for projects

#### checklistService.test.ts
```typescript
describe('checklistService', () => {
  describe('generateChecklist', () => {
    it('should generate checklist from selected modules', async () => {
      // Test the core business logic
    })

    it('should maintain order of modules and testcases', async () => { })
  })

  describe('getProgress', () => {
    it('should calculate completion percentage correctly', async () => {
      // Mock checklist items with different statuses
      // Verify calculation
    })
  })
})
```

### Frontend Components (`/tests/unit/frontend/`)

#### ModuleTable.test.tsx
```typescript
import { render, screen, fireEvent } from '@testing-library/react'
import { ModuleTable } from '@/frontend/components/modules/ModuleTable'

describe('ModuleTable', () => {
  const mockModules = [
    { id: '1', name: 'Authentication', description: 'Auth tests' }
  ]

  it('should render modules in table', () => {
    render(<ModuleTable modules={mockModules} />)
    expect(screen.getByText('Authentication')).toBeInTheDocument()
  })

  it('should call onEdit when edit button clicked', () => {
    const onEdit = jest.fn()
    render(<ModuleTable modules={mockModules} onEdit={onEdit} />)

    fireEvent.click(screen.getByTestId('edit-button-1'))
    expect(onEdit).toHaveBeenCalledWith('1')
  })

  it('should call onDelete when delete button clicked', () => { })
})
```

#### ChecklistBuilder.test.tsx
Test drag-and-drop functionality

#### ProgressBar.test.tsx
Test progress calculation and display

## Integration Tests

### API Endpoints (`/tests/integration/api/`)

#### modules.api.test.ts
```typescript
import { createMocks } from 'node-mocks-http'
import { GET, POST } from '@/backend/api/modules/route'

describe('Modules API', () => {
  describe('GET /api/modules', () => {
    it('should return all modules', async () => {
      const { req, res } = createMocks({ method: 'GET' })

      const response = await GET(req)
      const data = await response.json()

      expect(data.success).toBe(true)
      expect(Array.isArray(data.data)).toBe(true)
    })
  })

  describe('POST /api/modules', () => {
    it('should create module with valid data', async () => {
      const { req } = createMocks({
        method: 'POST',
        body: { name: 'New Module', description: 'Test' }
      })

      const response = await POST(req)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.success).toBe(true)
      expect(data.data.name).toBe('New Module')
    })

    it('should return 400 with invalid data', async () => {
      const { req } = createMocks({
        method: 'POST',
        body: { name: '' } // Invalid: empty name
      })

      const response = await POST(req)
      expect(response.status).toBe(400)
    })

    it('should return 409 if module name already exists', async () => { })
  })
})
```

#### Similar tests for projects and checklists APIs

## End-to-End Tests

### Module Management Flow (`/tests/e2e/module-management.spec.ts`)
```typescript
import { test, expect } from '@playwright/test'

test.describe('Module Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/modules')
  })

  test('should create a new module', async ({ page }) => {
    // Click "Add Module" button
    await page.click('button:has-text("Add Module")')

    // Fill form
    await page.fill('[name="name"]', 'New Test Module')
    await page.fill('[name="description"]', 'Test description')

    // Submit
    await page.click('button:has-text("Save")')

    // Verify module appears in table
    await expect(page.locator('text=New Test Module')).toBeVisible()
  })

  test('should edit existing module', async ({ page }) => {
    // Click edit button on first module
    await page.click('[data-testid="edit-button"]:first-child')

    // Update name
    await page.fill('[name="name"]', 'Updated Module Name')
    await page.click('button:has-text("Save")')

    // Verify update
    await expect(page.locator('text=Updated Module Name')).toBeVisible()
  })

  test('should delete module', async ({ page }) => {
    // Click delete button
    await page.click('[data-testid="delete-button"]:first-child')

    // Confirm deletion
    await page.click('button:has-text("Confirm")')

    // Verify module is removed
    await expect(page.locator('text=Deleted Module')).not.toBeVisible()
  })

  test('should add testcase to module', async ({ page }) => {
    // Open module details
    await page.click('text=Authentication')

    // Add testcase
    await page.click('button:has-text("Add Testcase")')
    await page.fill('[name="name"]', 'New Test Case')
    await page.click('button:has-text("Save")')

    // Verify testcase appears
    await expect(page.locator('text=New Test Case')).toBeVisible()
  })
})
```

### Project Creation Flow (`/tests/e2e/project-creation.spec.ts`)
```typescript
test.describe('Project Creation', () => {
  test('should create a new test project', async ({ page }) => {
    await page.goto('/projects')

    await page.click('button:has-text("New Project")')
    await page.fill('[name="name"]', 'Patch 1.2.3')
    await page.fill('[name="version"]', '1.2.3')
    await page.click('button:has-text("Create")')

    await expect(page.locator('text=Patch 1.2.3')).toBeVisible()
  })

  test('should navigate to project details', async ({ page }) => { })
})
```

### Checklist Builder Flow (`/tests/e2e/checklist-builder.spec.ts`)
```typescript
test.describe('Checklist Builder', () => {
  test.beforeEach(async ({ page }) => {
    // Create a test project first
    // Navigate to builder
  })

  test('should drag module to checklist', async ({ page }) => {
    await page.goto('/projects/1/builder')

    // Drag module from left panel to right panel
    const module = page.locator('[data-testid="module-auth"]')
    const dropZone = page.locator('[data-testid="checklist-drop-zone"]')

    await module.dragTo(dropZone)

    // Verify module appears in selected list
    await expect(dropZone.locator('text=Authentication')).toBeVisible()
  })

  test('should generate checklist from selected modules', async ({ page }) => {
    // Select modules
    // Click generate
    // Verify checklist created
  })

  test('should maintain order of dragged modules', async ({ page }) => { })
})
```

### Checklist Execution Flow (`/tests/e2e/checklist-execution.spec.ts`)
```typescript
test.describe('Checklist Execution', () => {
  test('should check/uncheck checklist items', async ({ page }) => {
    await page.goto('/projects/1/checklist')

    // Check first item
    await page.check('[data-testid="checkbox-1"]')

    // Verify checked state persists
    await page.reload()
    await expect(page.locator('[data-testid="checkbox-1"]')).toBeChecked()
  })

  test('should update item status', async ({ page }) => {
    // Open status dropdown
    await page.click('[data-testid="status-dropdown-1"]')

    // Select "In Progress"
    await page.click('text=In Progress')

    // Verify status updated
    await expect(page.locator('[data-testid="status-badge-1"]')).toHaveText('In Progress')
  })

  test('should update progress bar when items completed', async ({ page }) => {
    // Get initial progress
    const initialProgress = await page.locator('[data-testid="progress-percentage"]').textContent()

    // Complete an item
    await page.check('[data-testid="checkbox-1"]')
    await page.click('[data-testid="status-dropdown-1"]')
    await page.click('text=Completed')

    // Verify progress increased
    const newProgress = await page.locator('[data-testid="progress-percentage"]').textContent()
    expect(parseInt(newProgress!)).toBeGreaterThan(parseInt(initialProgress!))
  })

  test('should add notes to checklist item', async ({ page }) => {
    await page.click('[data-testid="notes-button-1"]')
    await page.fill('[data-testid="notes-input"]', 'Test notes')
    await page.click('button:has-text("Save")')

    await expect(page.locator('text=Test notes')).toBeVisible()
  })
})
```

## Test Fixtures

### `/tests/fixtures/modules.ts`
```typescript
export const mockModules = [
  {
    id: '1',
    name: 'Authentication',
    description: 'Login and auth tests',
    testcases: [
      { id: '1-1', name: 'Login with valid credentials' },
      { id: '1-2', name: 'Login with invalid credentials' },
    ]
  },
  {
    id: '2',
    name: 'User Management',
    description: 'User CRUD operations',
    testcases: [
      { id: '2-1', name: 'Create new user' },
      { id: '2-2', name: 'Update user profile' },
    ]
  }
]
```

### Similar fixtures for projects, checklists

## Test Utilities

### `/tests/utils/test-helpers.ts`
```typescript
export function createMockModule(overrides = {}) {
  return {
    id: '1',
    name: 'Test Module',
    description: 'Test description',
    created_at: new Date().toISOString(),
    ...overrides
  }
}

export function setupTestDatabase() {
  // Seed test data
  // Return cleanup function
}
```

## Configuration

### jest.config.js
```javascript
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/tests/utils/setup.ts'],
  moduleNameMapper: {
    '^@/frontend/(.*)$': '<rootDir>/frontend/$1',
    '^@/backend/(.*)$': '<rootDir>/backend/$1',
    '^@/shared/(.*)$': '<rootDir>/shared/$1',
  },
  collectCoverageFrom: [
    'frontend/**/*.{ts,tsx}',
    'backend/**/*.{ts,tsx}',
    'shared/**/*.{ts,tsx}',
    '!**/*.d.ts',
  ],
  coverageThresholds: {
    global: {
      branches: 70,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
}
```

### playwright.config.ts
```typescript
import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  use: {
    baseURL: 'http://localhost:3000',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  webServer: {
    command: 'npm run dev',
    port: 3000,
    reuseExistingServer: true,
  },
})
```

## Running Tests

### Unit Tests
```bash
npm test                    # Run all unit tests
npm run test:watch          # Watch mode
npm run test:coverage       # With coverage report
```

### Integration Tests
```bash
npm run test:integration
```

### E2E Tests
```bash
npm run test:e2e           # Headless
npm run test:e2e:ui        # With UI
```

### All Tests
```bash
npm run test:all
```

## Bug Reporting

When a bug is found, create a report:

### Bug Report Template
```markdown
## Bug Report

**File**: /frontend/components/ModuleTable.tsx:45
**Severity**: High
**Found By**: QA Agent (E2E Test)

### Steps to Reproduce
1. Navigate to /modules
2. Click "Add Module"
3. Leave name field empty
4. Click "Save"

### Expected Behavior
Form should show validation error: "Name is required"

### Actual Behavior
Form submits and creates module with empty name

### Error Logs
[Error logs here]

### Screenshots
[Attach screenshot]

### Suggested Fix
Add validation in ModuleForm component before submission
```

## Development Workflow

### 1. Before Writing Tests
- Read this README
- Review code to understand functionality
- Check existing tests for patterns
- Create test plan for the feature

### 2. Writing Tests
- Start with unit tests (services, utilities)
- Write integration tests (API endpoints)
- Write E2E tests (user flows)
- Use fixtures for consistent test data
- Follow AAA pattern (Arrange, Act, Assert)

### 3. After Writing Tests
- Run tests locally and ensure they pass
- Check coverage report
- Update this README if needed
- Coordinate with DevOps Agent for CI integration

### 4. Bug Testing
- Write regression test for the bug
- Verify test fails (reproduces bug)
- After fix, verify test passes
- Keep regression test in suite

## CI/CD Integration

Tests run automatically in GitHub Actions:
- On every push: Unit tests, linting, type-check
- On PR: Full test suite including integration tests
- Before deployment: E2E tests in preview environment

## Communication

### With Frontend Agent
- Request `data-testid` attributes for E2E tests
- Report UI bugs with screenshots
- Suggest UX improvements for testability

### With Backend Agent
- Report API bugs with request/response details
- Suggest improvements for testability
- Coordinate on test data setup

### With DevOps Agent
- Integrate test runner into CI/CD
- Set up test environment and database
- Configure test reporting

### With Coordinator
- Report test coverage metrics
- Report critical bugs immediately
- Provide testing status updates

## Best Practices

1. **Test Behavior, Not Implementation**
   - Focus on what the code does, not how

2. **Keep Tests Independent**
   - Each test should run in isolation
   - Don't rely on test execution order

3. **Use Descriptive Test Names**
   - `it('should create module with valid data')` ✓
   - `it('test 1')` ✗

4. **Mock External Dependencies**
   - Mock Supabase, API calls, external services
   - Use MSW for API mocking in E2E tests

5. **Clean Up After Tests**
   - Reset database state
   - Clear mocks
   - Remove test files

## Resources
- [Jest Documentation](https://jestjs.io/)
- [React Testing Library](https://testing-library.com/react)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Best Practices](https://testingjavascript.com/)

## Notes
- Run tests before pushing code
- Write tests for all new features
- Update tests when requirements change
- Aim for meaningful tests, not just coverage numbers
- Dogfood our QA tool - use it to track our own testing!
