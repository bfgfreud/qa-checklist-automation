# Shared Domain - QA Checklist Automation

**Accessible By**: All Agents
**Last Updated**: 2025-01-14

## Overview
This folder contains shared resources that are used across frontend, backend, and other domains. All agents can read and use these files.

## Folder Structure
```
shared/
├── types/              # Shared TypeScript type definitions
│   ├── module.ts
│   ├── project.ts
│   ├── checklist.ts
│   └── common.ts
├── constants/          # Application-wide constants
│   ├── status.ts
│   └── config.ts
└── utils/             # Shared utility functions
    ├── formatDate.ts
    └── validation.ts
```

## Purpose
- **types/**: Type definitions used by both frontend and backend
- **constants/**: Enums, static values, configuration constants
- **utils/**: Pure utility functions without side effects

## Shared Types

### `/shared/types/module.ts`
```typescript
export interface Module {
  id: string
  name: string
  description?: string
  order_index: number
  created_at: string
  updated_at: string
}

export interface TestCase {
  id: string
  module_id: string
  name: string
  description?: string
  order_index: number
  created_at: string
  updated_at: string
}

export interface ModuleWithTestCases extends Module {
  testcases: TestCase[]
}
```

### `/shared/types/project.ts`
```typescript
export interface Project {
  id: string
  name: string
  version?: string
  status: 'active' | 'completed' | 'archived'
  created_at: string
  updated_at: string
}

export interface ProjectWithStats extends Project {
  total_items: number
  completed_items: number
  progress_percentage: number
}
```

### `/shared/types/checklist.ts`
```typescript
export type ChecklistStatus = 'not_started' | 'in_progress' | 'completed' | 'blocked'

export interface ChecklistItem {
  id: string
  project_id: string
  module_name: string
  testcase_name: string
  status: ChecklistStatus
  checked: boolean
  notes?: string
  order_index: number
  updated_at: string
}

export interface ChecklistProgress {
  total: number
  not_started: number
  in_progress: number
  completed: number
  blocked: number
  percentage: number
}
```

### `/shared/types/common.ts`
```typescript
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: {
    message: string
    code: string
    details?: any
  }
}

export interface PaginationParams {
  page: number
  limit: number
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  hasMore: boolean
}
```

## Shared Constants

### `/shared/constants/status.ts`
```typescript
export const CHECKLIST_STATUSES = {
  NOT_STARTED: 'not_started',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  BLOCKED: 'blocked',
} as const

export const STATUS_LABELS: Record<string, string> = {
  not_started: 'Not Started',
  in_progress: 'In Progress',
  completed: 'Completed',
  blocked: 'Blocked',
}

export const STATUS_COLORS: Record<string, string> = {
  not_started: 'gray',
  in_progress: 'blue',
  completed: 'green',
  blocked: 'red',
}

export const PROJECT_STATUSES = {
  ACTIVE: 'active',
  COMPLETED: 'completed',
  ARCHIVED: 'archived',
} as const
```

### `/shared/constants/config.ts`
```typescript
export const APP_CONFIG = {
  APP_NAME: 'QA Checklist Automation',
  VERSION: '1.0.0',
  MAX_MODULES_PER_PROJECT: 100,
  MAX_TESTCASES_PER_MODULE: 500,
  DEFAULT_PAGE_SIZE: 20,
}

export const API_ENDPOINTS = {
  MODULES: '/backend/api/modules',
  PROJECTS: '/backend/api/projects',
  CHECKLISTS: '/backend/api/checklists',
}
```

## Shared Utilities

### `/shared/utils/formatDate.ts`
```typescript
export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function formatDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function timeAgo(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const seconds = Math.floor((new Date().getTime() - d.getTime()) / 1000)

  const intervals: Record<string, number> = {
    year: 31536000,
    month: 2592000,
    week: 604800,
    day: 86400,
    hour: 3600,
    minute: 60,
  }

  for (const [unit, secondsInUnit] of Object.entries(intervals)) {
    const interval = Math.floor(seconds / secondsInUnit)
    if (interval >= 1) {
      return `${interval} ${unit}${interval > 1 ? 's' : ''} ago`
    }
  }

  return 'just now'
}
```

### `/shared/utils/validation.ts`
```typescript
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

export function sanitizeInput(input: string): string {
  return input.trim().replace(/[<>]/g, '')
}
```

## Usage Guidelines

### For Frontend Agent
```typescript
// Import shared types
import { Module, ChecklistStatus } from '@/shared/types/module'
import { ApiResponse } from '@/shared/types/common'

// Import constants
import { STATUS_LABELS, STATUS_COLORS } from '@/shared/constants/status'

// Import utilities
import { formatDate } from '@/shared/utils/formatDate'

// Use in components
const StatusBadge = ({ status }: { status: ChecklistStatus }) => {
  return (
    <span className={`badge-${STATUS_COLORS[status]}`}>
      {STATUS_LABELS[status]}
    </span>
  )
}
```

### For Backend Agent
```typescript
// Import shared types
import { Module, Project } from '@/shared/types'
import { ApiResponse } from '@/shared/types/common'

// Use in API responses
export async function GET(): Promise<Response> {
  const modules = await moduleService.getAllModules()

  const response: ApiResponse<Module[]> = {
    success: true,
    data: modules
  }

  return Response.json(response)
}
```

### For Testing
```typescript
// Import for test fixtures
import { Module } from '@/shared/types/module'
import { CHECKLIST_STATUSES } from '@/shared/constants/status'

export const mockModule: Module = {
  id: '1',
  name: 'Test Module',
  order_index: 0,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}
```

## Modification Guidelines

### Who Can Modify?
All agents can propose changes, but modifications should be:
1. Discussed with Coordinator first
2. Documented in this README
3. Communicated to all agents
4. Backward compatible when possible

### What Should Go Here?
✅ **YES**:
- Type definitions used by 2+ domains
- Constants used application-wide
- Pure utility functions without dependencies
- Enums and configuration values

❌ **NO**:
- Domain-specific logic (goes in domain folders)
- UI components (goes in frontend/)
- Database operations (goes in backend/)
- API route handlers (goes in backend/)

### Adding New Shared Code

1. **Create the file** in appropriate folder
2. **Export clearly** with named exports
3. **Document with JSDoc** for clarity
4. **Update this README** with usage example
5. **Notify Coordinator** for team awareness

Example:
```typescript
/**
 * Calculates the completion percentage for a checklist
 * @param total - Total number of items
 * @param completed - Number of completed items
 * @returns Percentage (0-100)
 */
export function calculateProgress(total: number, completed: number): number {
  if (total === 0) return 0
  return Math.round((completed / total) * 100)
}
```

## Communication

### Proposing Changes
When proposing a change to shared code:
1. Notify Coordinator
2. Explain the use case
3. Check impact on other domains
4. Get approval before implementing

### Breaking Changes
If a change would break existing code:
1. Discuss with Coordinator
2. Create migration plan
3. Update all affected code
4. Document the change

## Version Control

### Git Workflow
- Changes to shared code should be in separate commits
- Commit message: `chore(shared): <description>`
- Example: `chore(shared): add calculateProgress utility`

### Backward Compatibility
- Avoid breaking changes when possible
- Use deprecation warnings before removing
- Maintain old types/functions for one version

## Current Shared Resources

### Types
- [x] Module types
- [x] Project types
- [x] Checklist types
- [x] Common API types

### Constants
- [x] Status values and labels
- [x] App configuration
- [ ] Validation rules (future)
- [ ] Error codes (future)

### Utilities
- [x] Date formatting
- [x] Basic validation
- [ ] String utilities (future)
- [ ] Number formatting (future)

## Future Additions

### Planned Types
- User types (when auth is added)
- Notification types (when notifications are added)
- Report types (for analytics)

### Planned Constants
- Error codes catalog
- Validation rules
- Feature flags

### Planned Utilities
- Text search/filter helpers
- Array manipulation utilities
- Local storage helpers

## Resources
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [Type Guards](https://www.typescriptlang.org/docs/handbook/2/narrowing.html)

## Notes
- Keep shared code simple and focused
- Avoid dependencies on specific frameworks
- Write pure functions when possible
- Document all exports with JSDoc
- This is the "contract" between all domains
