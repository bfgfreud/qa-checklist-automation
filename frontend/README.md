# Frontend Domain - QA Checklist Automation

**Agent**: `frontend-dev`
**Last Updated**: 2025-01-14

## Overview
This folder contains all frontend code for the QA Checklist Automation tool, including UI components, pages, hooks, and styling.

## Folder Structure
```
frontend/
├── app/                    # Next.js App Router pages
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home page
│   ├── modules/           # Module library pages
│   ├── projects/          # Test projects pages
│   └── checklists/        # Checklist execution pages
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   ├── modules/          # Module-specific components
│   ├── projects/         # Project-specific components
│   └── checklists/       # Checklist-specific components
├── hooks/                # Custom React hooks
├── styles/               # Global styles
└── public/               # Static assets
```

## Current Tasks
- [ ] Initialize Next.js project structure
- [ ] Set up Tailwind CSS configuration
- [ ] Create base UI components library
- [ ] Build Module Library page
- [ ] Build Test Projects page
- [ ] Implement Drag-and-Drop Checklist Builder
- [ ] Build Checklist Execution view
- [ ] Implement Progress tracking UI

## Tech Stack
- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Forms**: react-hook-form + zod
- **Drag-and-Drop**: @dnd-kit/core, @dnd-kit/sortable
- **Tables**: @tanstack/react-table
- **Icons**: lucide-react

## Key Components to Build

### UI Components (`/components/ui/`)
- `Button` - Primary button component
- `Card` - Card container
- `Input` - Form input field
- `Table` - Data table wrapper
- `Modal` - Modal dialog
- `Badge` - Status badge
- `ProgressBar` - Progress indicator

### Feature Components

#### Module Management (`/components/modules/`)
- `ModuleTable` - Display modules with actions
- `ModuleForm` - Create/edit module form
- `TestCaseList` - List testcases under module

#### Project Management (`/components/projects/`)
- `ProjectCard` - Project card for list view
- `ProjectForm` - Create/edit project form
- `ProjectList` - List all projects

#### Checklist (`/components/checklists/`)
- `ChecklistBuilder` - Drag-and-drop builder interface
- `ChecklistItem` - Individual checklist item with checkbox
- `ChecklistProgress` - Progress bar and stats
- `StatusDropdown` - Status selector (Not Started, In Progress, Completed, Blocked)

## Pages to Build

### 1. Home Page (`/app/page.tsx`)
- Dashboard overview
- Quick stats
- Recent projects

### 2. Module Library (`/app/modules/page.tsx`)
- Table of all base modules
- Add/Edit/Delete actions
- View testcases for each module

### 3. Projects List (`/app/projects/page.tsx`)
- Grid/List of all test projects
- Create new project button
- Filter and search

### 4. Project Detail (`/app/projects/[id]/page.tsx`)
- Project information
- Navigation to builder and checklist

### 5. Checklist Builder (`/app/projects/[id]/builder/page.tsx`)
- Drag-and-drop interface
- Module library on left
- Selected modules on right
- Generate checklist button

### 6. Checklist Execution (`/app/projects/[id]/checklist/page.tsx`)
- List of checklist items
- Checkboxes and status dropdowns
- Progress bar
- Notes section

## API Integration

### Backend API Routes
Consume these APIs (created by Backend Agent):

#### Modules
- `GET /backend/api/modules` - Get all modules
- `POST /backend/api/modules` - Create module
- `PUT /backend/api/modules/[id]` - Update module
- `DELETE /backend/api/modules/[id]` - Delete module
- `GET /backend/api/modules/[id]/testcases` - Get testcases

#### Projects
- `GET /backend/api/projects` - Get all projects
- `POST /backend/api/projects` - Create project
- `GET /backend/api/projects/[id]` - Get project details
- `PUT /backend/api/projects/[id]` - Update project
- `DELETE /backend/api/projects/[id]` - Delete project

#### Checklists
- `POST /backend/api/projects/[id]/checklist/generate` - Generate checklist
- `GET /backend/api/projects/[id]/checklist` - Get checklist
- `PUT /backend/api/projects/[id]/checklist/[itemId]` - Update status

### API Client Pattern
```typescript
// Example: /frontend/hooks/useModules.ts
export function useModules() {
  const [modules, setModules] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/backend/api/modules')
      .then(res => res.json())
      .then(data => setModules(data.data))
      .finally(() => setLoading(false))
  }, [])

  return { modules, loading }
}
```

## Styling Guidelines

### Tailwind CSS
- Use Tailwind utility classes
- Create custom classes sparingly in `/styles/globals.css`
- Follow mobile-first approach

### Color Palette
- Primary: Blue (`bg-blue-600`, `text-blue-600`)
- Success: Green (`bg-green-500`)
- Warning: Yellow (`bg-yellow-500`)
- Error: Red (`bg-red-500`)
- Neutral: Gray (`bg-gray-100`, `text-gray-700`)

### Status Colors
- Not Started: Gray
- In Progress: Blue
- Completed: Green
- Blocked: Red

## Development Workflow

### 1. Before Starting a Task
- Read this README
- Check `/shared/types/` for type definitions
- Review API spec in `/docs/api-spec.md` (when available)

### 2. During Development
- Create components in appropriate folders
- Use TypeScript for all files
- Import shared types from `/shared/types/`
- Test UI on different screen sizes
- Handle loading and error states

### 3. After Completing a Task
- Update this README with progress
- Push to feature branch
- Report to Coordinator
- Update task checklist above

## Code Standards

### TypeScript
- Always type props and state
- Use interfaces for component props
- Export types when shared

### Components
- Use functional components with hooks
- Extract reusable logic into custom hooks
- Keep components small and focused

### File Naming
- Components: `PascalCase.tsx`
- Hooks: `useCamelCase.ts`
- Pages: Next.js convention (lowercase)

## Testing
- Manual testing on Chrome, Firefox, Safari
- Test responsive design (mobile, tablet, desktop)
- Test keyboard navigation
- Add `data-testid` attributes for QA Agent

## Git Workflow
- Branch: `feature/frontend-<feature-name>`
- Commit: `feat(ui): <description>`
- Push frequently

## Communication

### With Backend Agent
- Discuss API contracts and data structures
- Request new endpoints if needed
- Report API issues

### With DevOps Agent
- Request environment variables
- Report build issues
- Coordinate on deployment

### With QA Agent
- Add test-friendly attributes
- Fix reported UI bugs
- Coordinate on test scenarios

### With Coordinator
- Report progress on tasks
- Ask for clarification on requirements
- Escalate blockers

## Resources
- [Next.js Docs](https://nextjs.org/docs)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [React Hook Form](https://react-hook-form.com/)
- [@dnd-kit](https://dndkit.com/)
- [TanStack Table](https://tanstack.com/table)

## Notes
- Focus on user experience and accessibility
- Keep UI consistent across all pages
- Mobile-first, responsive design
- Handle errors gracefully with user-friendly messages
