# Performance Optimizations

**Last Updated**: 2025-01-18
**Status**: ✅ Parallel Fetching Implemented

---

## Current Optimizations

### ✅ 1. Parallel API Fetching (Implemented)

**Problem**: Sequential API calls were causing slow page loads
- Overview page: Project → Testers → Checklist (3 sequential calls = 2-3 seconds)
- Editing page: Project → Modules → Checklist (3 sequential calls = 2-3 seconds)

**Solution**: Use `Promise.all()` to fetch all data simultaneously

```typescript
// Before (Sequential - SLOW)
const projectRes = await fetch('/api/projects/...');
const testersRes = await fetch('/api/projects/.../testers');
const checklistRes = await fetch('/api/checklists/...');

// After (Parallel - FAST)
const [projectRes, testersRes, checklistRes] = await Promise.all([
  fetch('/api/projects/...'),
  fetch('/api/projects/.../testers'),
  fetch('/api/checklists/...'),
]);
```

**Impact**: ~30-40% faster page loads (3 seconds → ~2 seconds)

**Pages Updated**:
- ✅ `/projects/[projectId]` (Overview Mode)
- ✅ `/projects/[projectId]/edit` (Editing Mode)

---

### ✅ 2. Local-First Editing (Implemented)

**Problem**: Every add/remove module triggered immediate API call + refetch
- Adding module: 3-4 seconds per module
- User had to wait for each operation

**Solution**: Local draft state with batch save

```typescript
// All edits happen locally (instant)
setDraftModules([...draftModules, newModule]);

// API calls only when clicking "Save Changes"
await batchSaveChanges(modulesToAdd, modulesToDelete);
```

**Impact**: **Instant** feedback for all edit operations

**Documentation**: See `docs/LOCAL_FIRST_EDITING.md`

---

## Current Bottlenecks

### 1. Database Query Performance

**Issue**: API responses take 300-700ms on average
- `/api/checklists/[projectId]`: 600-900ms (joins + aggregations)
- `/api/projects/[projectId]/testers`: 200-400ms

**Cause**:
- Multiple table joins (modules → testcases → results)
- No database indexes on foreign keys
- No query result caching

**Evidence from logs**:
```
GET /api/checklists/01e4d154-... 200 in 767ms
GET /api/projects/01e4d154-.../testers 200 in 347ms
```

---

### 2. Projects List Page Waterfall Requests

**Issue**: Each project card makes separate API calls
- 7 projects = 14 API calls (7 for testers, 7 for checklists)
- Sequential due to React rendering

**Evidence from logs**:
```
GET /api/projects/d402893d-.../testers 200 in 341ms
GET /api/projects/86655439-.../testers 200 in 235ms
GET /api/checklists/d402893d-... 200 in 709ms
... (14 more similar calls)
```

---

### 3. No Client-Side Caching

**Issue**: Every page navigation refetches all data
- Navigate to project → Back to list → Project again = 3x fetches
- No cache = slow navigation

---

## Future Optimizations (Not Implemented)

### 🔮 Option 1: React Query (Recommended)

**What**: Replace manual fetch with `@tanstack/react-query`

**Benefits**:
- Automatic caching (5-10 minutes stale time)
- Background refetching
- Deduplication (same query = single request)
- Loading/error states built-in
- DevTools for debugging

**Example**:
```typescript
// Current
useEffect(() => {
  fetch('/api/projects/...').then(...)
}, [projectId]);

// With React Query
const { data, isLoading } = useQuery({
  queryKey: ['project', projectId],
  queryFn: () => fetch('/api/projects/...').then(r => r.json()),
  staleTime: 5 * 60 * 1000, // 5 minutes
});
```

**Impact**: 50-70% reduction in API calls, instant navigation with cached data

**Effort**: Medium (1-2 days to migrate all pages)

---

### 🔮 Option 2: Database Optimization

**What**: Add indexes, optimize queries, add caching layer

**Potential Improvements**:

1. **Add Database Indexes**:
```sql
CREATE INDEX idx_checklist_test_results_module ON checklist_test_results(project_checklist_module_id);
CREATE INDEX idx_project_checklist_modules_project ON project_checklist_modules(project_id);
CREATE INDEX idx_base_testcases_module ON base_testcases(module_id);
```

2. **Query Optimization**:
   - Reduce number of joins in checklist query
   - Use materialized views for aggregated stats
   - Paginate testcase results if > 100 items

3. **Server-Side Caching**:
   - Redis/Upstash for API responses (5-10 min TTL)
   - Invalidate cache on POST/PUT/DELETE

**Impact**: 40-60% faster API responses (700ms → 300ms)

**Effort**: High (requires database migration + caching infrastructure)

---

### 🔮 Option 3: API Response Optimization

**What**: Reduce payload size, combine endpoints

**Potential Improvements**:

1. **Combine Endpoints**:
```typescript
// Instead of 3 separate calls:
GET /api/projects/[id]
GET /api/projects/[id]/testers
GET /api/checklists/[id]

// Single call:
GET /api/projects/[id]?include=testers,checklist
```

2. **Paginate Large Responses**:
   - Limit testcases to 50 per page
   - Lazy load remaining data

3. **GraphQL** (Optional):
   - Let frontend request exactly what it needs
   - Avoids over-fetching

**Impact**: 30-50% reduction in data transfer, simpler client code

**Effort**: Medium (backend refactoring)

---

### 🔮 Option 4: Prefetching

**What**: Load data before user navigates

**Example with React Query**:
```typescript
// On Projects List, prefetch when hovering over project card
<ProjectCard
  onMouseEnter={() => {
    queryClient.prefetchQuery({
      queryKey: ['project', projectId],
      queryFn: () => fetchProject(projectId),
    });
  }}
/>
```

**Impact**: Instant page loads when navigating

**Effort**: Low (requires React Query first)

---

## Monitoring & Metrics

### Current Measurements (Manual)

**Projects List Page**:
- Initial load: ~2 seconds
- 7 projects × 2 API calls = 14 requests
- Total data transferred: ~150KB

**Project Overview Page**:
- Before optimization: 3 seconds (sequential)
- After optimization: ~2 seconds (parallel) ✅
- 3 API calls in parallel

**Editing Mode Page**:
- Before optimization: 3 seconds (sequential)
- After optimization: ~2 seconds (parallel) ✅
- 3 API calls in parallel

**Module Add Operation**:
- Before optimization: 3-4 seconds (API + refetch)
- After optimization: **Instant** (local-first) ✅

---

### Recommended Monitoring Tools

1. **React Query DevTools**
   - Shows cache status, query loading states
   - Essential if implementing React Query

2. **Chrome DevTools Network Tab**
   - Waterfall view of all requests
   - Shows timing for each API call

3. **Lighthouse Performance Audit**
   - Overall page performance score
   - First Contentful Paint, Time to Interactive

4. **Vercel Analytics** (if available)
   - Real user monitoring
   - P75, P95, P99 latencies

---

## Performance Budget

**Target Metrics** (not enforced, aspirational):

| Metric | Current | Target |
|--------|---------|--------|
| Projects List load | 2s | 1s |
| Project Overview load | 2s | 1s |
| Editing Mode load | 2s | 1s |
| Module add operation | Instant ✅ | Instant ✅ |
| API response time (P95) | 700ms | 300ms |
| Total page size | 150KB | 100KB |

---

## Summary

### ✅ What We've Done
1. **Parallel API fetching** - 30-40% faster page loads
2. **Local-first editing** - Instant feedback for all edits
3. **Naming display fix** - Show instance label only when different

### 🚧 What's Still Slow
1. Database queries (600-900ms average)
2. Projects List waterfall requests (14 sequential calls)
3. No client-side caching (refetch on every navigation)

### 🎯 Best Next Steps (if needed)
1. **React Query** - Biggest impact with moderate effort
2. **Database indexes** - Improves backend performance
3. **Prefetching** - Makes navigation feel instant

---

**Current status**: Performance is acceptable for development and moderate usage. Optimizations listed above are optional enhancements for production scale.

**End of Document**
