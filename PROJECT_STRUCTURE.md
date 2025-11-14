# Project Structure - QA Checklist Automation

## Folder Organization

```
qa-checklist-automation/
├── frontend/                    # Frontend Agent Domain
│   ├── README.md               # Frontend domain documentation
│   ├── app/                    # Next.js app router
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── modules/            # Module library pages
│   │   ├── projects/           # Test projects pages
│   │   └── checklists/         # Checklist execution pages
│   ├── components/             # React components
│   │   ├── ui/                 # Reusable UI components
│   │   ├── modules/            # Module-specific components
│   │   ├── projects/           # Project-specific components
│   │   └── checklists/         # Checklist-specific components
│   ├── hooks/                  # Custom React hooks
│   ├── styles/                 # Global styles, CSS modules
│   └── public/                 # Static assets
│
├── backend/                     # Backend Agent Domain
│   ├── README.md               # Backend domain documentation
│   ├── api/                    # API route handlers (Next.js API routes)
│   │   ├── modules/
│   │   ├── projects/
│   │   └── checklists/
│   ├── services/               # Business logic layer
│   │   ├── moduleService.ts
│   │   ├── projectService.ts
│   │   └── checklistService.ts
│   ├── models/                 # Data models and types
│   ├── validations/            # Zod schemas for validation
│   └── db/                     # Database utilities
│       ├── supabase.ts         # Supabase client
│       ├── migrations/         # SQL migration files
│       └── seeds/              # Seed data for development
│
├── integration/                 # DevOps/Integration Agent Domain
│   ├── README.md               # Integration documentation
│   ├── config/                 # Configuration files
│   │   ├── next.config.js
│   │   ├── tailwind.config.js
│   │   └── tsconfig.json
│   ├── scripts/                # Build and deployment scripts
│   ├── .github/
│   │   └── workflows/          # CI/CD workflows
│   └── docker/                 # Docker files (future)
│
├── tests/                       # QA Agent Domain
│   ├── README.md               # Testing documentation
│   ├── unit/                   # Unit tests
│   │   ├── frontend/
│   │   └── backend/
│   ├── integration/            # Integration tests
│   │   └── api/
│   ├── e2e/                    # End-to-end tests
│   │   ├── module-management.spec.ts
│   │   ├── project-creation.spec.ts
│   │   └── checklist-execution.spec.ts
│   ├── fixtures/               # Test data
│   └── utils/                  # Test utilities
│
├── shared/                      # Shared utilities (accessible by all)
│   ├── README.md               # Shared resources documentation
│   ├── types/                  # Shared TypeScript types
│   ├── constants/              # Application constants
│   └── utils/                  # Shared utility functions
│
├── docs/                        # Project documentation
│   ├── architecture.md
│   ├── api-spec.md
│   └── user-guide.md
│
├── .claude/                     # Claude Code configuration
│   ├── claude.md               # Main coordinator instructions
│   └── commands/               # Custom slash commands
│
├── .env.local                   # Local environment variables (gitignored)
├── .env.example                # Environment variable template
├── .gitignore
├── package.json
├── SETUP_GUIDE.md
└── README.md                   # Project README

```

## Agent Domain Assignments

### Frontend Agent
**Primary Folders**: `/frontend/**/*`
**Can Read**: `/backend/models/`, `/shared/`
**Cannot Modify**: `/backend/`, `/integration/`, `/tests/`

### Backend Agent
**Primary Folders**: `/backend/**/*`
**Can Read**: `/shared/`
**Cannot Modify**: `/frontend/`, `/integration/`, `/tests/`

### DevOps/Integration Agent
**Primary Folders**: `/integration/**/*`, root config files
**Can Read**: All folders (for integration purposes)
**Can Modify**: Configuration files, CI/CD, deployment scripts
**Cannot Modify**: Business logic in `/frontend/` or `/backend/`

### QA Agent
**Primary Folders**: `/tests/**/*`
**Can Read**: All folders (for testing purposes)
**Can Modify**: Only test files
**Cannot Modify**: Application code (but reports bugs)

### Shared Domain
**Primary Folders**: `/shared/**/*`
**Accessible By**: All agents
**Modified By**: Any agent with approval from Coordinator

## Benefits of This Structure

1. **Clear Boundaries**: Each agent knows exactly which folders they own
2. **Easy Navigation**: Developers can find code quickly
3. **README.md per Domain**: Each folder has documentation specific to that domain
4. **Reduced Conflicts**: Agents work in separate folders, fewer merge conflicts
5. **Scalability**: Easy to add new domains or split existing ones
6. **Testing Isolation**: Tests are separate but can access all code

## File Naming Conventions

### Frontend
- Components: `PascalCase.tsx` (e.g., `ModuleTable.tsx`)
- Hooks: `useCamelCase.ts` (e.g., `useModules.ts`)
- Styles: `kebab-case.css` or `ComponentName.module.css`

### Backend
- Services: `camelCase.ts` (e.g., `moduleService.ts`)
- Models: `PascalCase.ts` (e.g., `Module.ts`)
- API Routes: `route.ts` inside feature folders
- Validations: `camelCase.schema.ts` (e.g., `module.schema.ts`)

### Tests
- Unit: `fileName.test.ts` or `fileName.spec.ts`
- E2E: `feature-name.spec.ts`

## Import Path Aliases

Configure in `tsconfig.json`:
```json
{
  "compilerOptions": {
    "paths": {
      "@/frontend/*": ["./frontend/*"],
      "@/backend/*": ["./backend/*"],
      "@/shared/*": ["./shared/*"],
      "@/tests/*": ["./tests/*"]
    }
  }
}
```

Usage:
```typescript
// Instead of: import { Module } from '../../../backend/models/Module'
import { Module } from '@/backend/models/Module'
```
