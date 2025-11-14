# Backend Domain - QA Checklist Automation

**Agent**: `backend-dev`
**Last Updated**: 2025-01-14

## Overview
This folder contains all backend code including API routes, business logic, data models, validations, and database utilities.

## Folder Structure
```
backend/
├── api/                    # Next.js API routes
│   ├── modules/
│   │   └── route.ts       # GET, POST /api/modules
│   ├── projects/
│   │   └── route.ts       # GET, POST /api/projects
│   └── checklists/
│       └── route.ts       # GET, POST /api/checklists
├── services/              # Business logic layer
│   ├── moduleService.ts
│   ├── projectService.ts
│   └── checklistService.ts
├── models/                # Data models and types
│   ├── Module.ts
│   ├── Project.ts
│   └── Checklist.ts
├── validations/           # Zod validation schemas
│   ├── module.schema.ts
│   ├── project.schema.ts
│   └── checklist.schema.ts
└── db/                    # Database utilities
    ├── supabase.ts        # Supabase client
    ├── migrations/        # SQL migration files
    │   └── 001_initial_schema.sql
    └── seeds/             # Seed data for development
        └── dev-data.sql
```

## Current Tasks
- [ ] Design database schema
- [ ] Create Supabase client configuration
- [ ] Write initial database migration
- [ ] Implement Module Service (CRUD)
- [ ] Implement Project Service (CRUD)
- [ ] Implement Checklist Service (generation logic)
- [ ] Build Module API routes
- [ ] Build Project API routes
- [ ] Build Checklist API routes
- [ ] Create validation schemas

## Tech Stack
- **Runtime**: Node.js (Next.js API Routes)
- **Language**: TypeScript
- **Database**: Supabase (PostgreSQL)
- **ORM/Client**: Supabase JS Client
- **Validation**: Zod
- **Future**: Supabase Auth, Email (Resend)

## Database Schema

### Tables

#### 1. base_modules
Master library of test modules
```sql
CREATE TABLE base_modules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### 2. base_testcases
Sub-testcases under each module
```sql
CREATE TABLE base_testcases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  module_id UUID REFERENCES base_modules(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### 3. test_projects
Testing cycles/patches
```sql
CREATE TABLE test_projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  version VARCHAR(50),
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### 4. project_checklists
Generated checklist items for each project
```sql
CREATE TABLE project_checklists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES test_projects(id) ON DELETE CASCADE,
  module_id UUID REFERENCES base_modules(id),
  testcase_id UUID REFERENCES base_testcases(id),
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### 5. checklist_items
Individual checklist execution records
```sql
CREATE TABLE checklist_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES test_projects(id) ON DELETE CASCADE,
  checklist_id UUID REFERENCES project_checklists(id) ON DELETE CASCADE,
  status VARCHAR(50) DEFAULT 'not_started',
  notes TEXT,
  checked BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Indexes
```sql
CREATE INDEX idx_testcases_module ON base_testcases(module_id);
CREATE INDEX idx_project_checklists_project ON project_checklists(project_id);
CREATE INDEX idx_checklist_items_project ON checklist_items(project_id);
```

## API Endpoints

### Module Management

#### GET /backend/api/modules
Get all modules with their testcases
```typescript
Response: {
  success: true,
  data: [
    {
      id: "uuid",
      name: "Authentication",
      description: "Login and auth tests",
      testcases: [...]
    }
  ]
}
```

#### POST /backend/api/modules
Create a new module
```typescript
Request: {
  name: string,
  description?: string
}

Response: {
  success: true,
  data: { id, name, description, ... }
}
```

#### PUT /backend/api/modules/[id]
Update module
```typescript
Request: {
  name?: string,
  description?: string
}
```

#### DELETE /backend/api/modules/[id]
Delete module (cascades to testcases)

### Project Management

#### GET /backend/api/projects
Get all test projects

#### POST /backend/api/projects
Create new test project
```typescript
Request: {
  name: string,
  version?: string
}
```

#### GET /backend/api/projects/[id]
Get project details with checklist

#### PUT /backend/api/projects/[id]
Update project

#### DELETE /backend/api/projects/[id]
Delete project

### Checklist Management

#### POST /backend/api/projects/[id]/checklist/generate
Generate checklist from selected modules
```typescript
Request: {
  moduleIds: string[]
}

Response: {
  success: true,
  data: {
    checklistItems: [...]
  }
}
```

#### GET /backend/api/projects/[id]/checklist
Get project checklist with status

#### PUT /backend/api/projects/[id]/checklist/[itemId]
Update checklist item status
```typescript
Request: {
  status: 'not_started' | 'in_progress' | 'completed' | 'blocked',
  checked?: boolean,
  notes?: string
}
```

#### GET /backend/api/projects/[id]/progress
Get completion statistics
```typescript
Response: {
  success: true,
  data: {
    total: number,
    completed: number,
    inProgress: number,
    blocked: number,
    percentage: number
  }
}
```

## Service Layer

### moduleService.ts
```typescript
export const moduleService = {
  getAllModules: async () => { ... },
  getModuleById: async (id: string) => { ... },
  createModule: async (data: CreateModuleInput) => { ... },
  updateModule: async (id: string, data: UpdateModuleInput) => { ... },
  deleteModule: async (id: string) => { ... },

  // Testcase operations
  getTestCases: async (moduleId: string) => { ... },
  createTestCase: async (moduleId: string, data: CreateTestCaseInput) => { ... },
  updateTestCase: async (id: string, data: UpdateTestCaseInput) => { ... },
  deleteTestCase: async (id: string) => { ... },
}
```

### projectService.ts
```typescript
export const projectService = {
  getAllProjects: async () => { ... },
  getProjectById: async (id: string) => { ... },
  createProject: async (data: CreateProjectInput) => { ... },
  updateProject: async (id: string, data: UpdateProjectInput) => { ... },
  deleteProject: async (id: string) => { ... },
}
```

### checklistService.ts
```typescript
export const checklistService = {
  generateChecklist: async (projectId: string, moduleIds: string[]) => {
    // 1. Get all testcases for selected modules
    // 2. Create project_checklists records
    // 3. Create checklist_items records with default status
    // 4. Return generated checklist
  },

  getChecklist: async (projectId: string) => { ... },
  updateChecklistItem: async (itemId: string, data: UpdateChecklistItemInput) => { ... },
  getProgress: async (projectId: string) => {
    // Calculate completion statistics
  },
}
```

## Validation Schemas

### module.schema.ts
```typescript
import { z } from 'zod'

export const createModuleSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
})

export const updateModuleSchema = createModuleSchema.partial()

export type CreateModuleInput = z.infer<typeof createModuleSchema>
export type UpdateModuleInput = z.infer<typeof updateModuleSchema>
```

### Similar schemas for projects, checklists, etc.

## Error Handling

### Standard Error Response
```typescript
{
  success: false,
  error: {
    message: "Error message for user",
    code: "ERROR_CODE",
    details?: any // Optional debug info
  }
}
```

### HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `404` - Not Found
- `409` - Conflict (duplicate name, etc.)
- `500` - Internal Server Error

### Error Handling Pattern
```typescript
export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Validate
    const validated = createModuleSchema.parse(body)

    // Business logic
    const result = await moduleService.createModule(validated)

    return Response.json({ success: true, data: result }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({
        success: false,
        error: { message: 'Validation failed', code: 'VALIDATION_ERROR', details: error.errors }
      }, { status: 400 })
    }

    return Response.json({
      success: false,
      error: { message: 'Internal server error', code: 'INTERNAL_ERROR' }
    }, { status: 500 })
  }
}
```

## Supabase Configuration

### /backend/db/supabase.ts
```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY! // Server-side only

export const supabase = createClient(supabaseUrl, supabaseKey)
```

## Development Workflow

### 1. Before Starting a Task
- Read this README
- Check database schema
- Review `/shared/types/` for shared types

### 2. Database Changes
- Create migration file in `/backend/db/migrations/`
- Use timestamp naming: `001_initial_schema.sql`
- Test migration locally
- Apply to Supabase via DevOps Agent

### 3. Creating an API Endpoint
1. Define validation schema in `/backend/validations/`
2. Implement service function in `/backend/services/`
3. Create API route in `/backend/api/`
4. Test with manual requests or tests
5. Document in this README

### 4. After Completing a Task
- Update this README
- Push to feature branch
- Coordinate with Frontend Agent on API contract
- Report to Coordinator

## Code Standards

### TypeScript
- Always type function parameters and returns
- Use Zod schemas for runtime validation
- Export types for Frontend Agent

### Services
- Keep business logic in service layer
- Services should be pure functions when possible
- Handle errors gracefully

### API Routes
- Always validate input with Zod
- Use consistent response format
- Log errors for debugging

## Testing
- Unit tests for service functions
- Integration tests for API routes
- Mock Supabase in tests
- Coordinate with QA Agent

## Git Workflow
- Branch: `feature/backend-<feature-name>`
- Commit: `feat(api): <description>`
- Include migrations in commits

## Communication

### With Frontend Agent
- Provide API documentation
- Discuss data structure needs
- Coordinate on type definitions

### With DevOps Agent
- Request database setup
- Coordinate on migrations
- Manage environment variables

### With QA Agent
- Fix API bugs
- Provide test data endpoints
- Coordinate on test scenarios

### With Coordinator
- Report progress
- Escalate blockers
- Ask for clarification

## Resources
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [Supabase Docs](https://supabase.com/docs)
- [Zod Documentation](https://zod.dev/)

## Notes
- Keep services testable and pure
- Use database transactions for multi-step operations
- Cache frequently accessed data (future optimization)
- Monitor query performance
