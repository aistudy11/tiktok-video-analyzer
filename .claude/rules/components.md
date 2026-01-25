---
paths:
  - "**/components/**/*"
  - "**/blocks/**/*"
  - "**/ui/**/*"
  - "**/views/**/*"
  - "**/pages/**/*"
  - "**/page.tsx"
  - "**/page.ts"
  - "**/layout.tsx"
  - "**/layout.ts"
universal: false
framework_deps: []
---

# Frontend Components Rules (Path-Activated)

Automatically activated when working with component files.
This rule is **framework-agnostic** and applies to React, Vue, Svelte, Angular, or any component-based UI framework.

## Component Creation vs Modification

### When Data Structure Changes → Create New Component

```typescript
// ❌ WRONG: Trying to force old component for new data
<Textarea value={complexStructuredData} />

// ✅ CORRECT: Create dedicated component
<StructuredDataEditor data={complexStructuredData} />
```

### Data Completeness Guarantee

```typescript
// ❌ WRONG: Using only partial data
setFormData(data.basicInfo) // Lost `metadata` field

// ✅ CORRECT: Preserve complete data
setBasicInfo(data.basicInfo)
setMetadata(data.metadata)
setOptions(data.options)
```

## Architecture Principles

- **Composition over inheritance** - Use dependency injection and composition
- **Interfaces over singletons** - Enable testing and flexibility
- **Explicit over implicit** - Clear data flow and dependencies
- **Props down, events up** - Unidirectional data flow

## UI Completeness

A feature is NOT done until:
1. User can SEE the change
2. User can USE the feature
3. UI shows ALL the data
4. Appropriate new components created (don't force old ones)

## Implementation Verification

Before claiming a UI feature is "complete":

```
□ API returns expected data (console.log verified)
□ Frontend receives data (network tab verified)
□ State stores data (DevTools verified)
□ Component uses data (props/state verified)
□ UI displays data (screenshot verified)
□ User can interact (manual test verified)
```

## Warning Signs of Incomplete Implementation

- Data is fetched but not displayed
- Types defined but data not used
- Backend updated but frontend unchanged
- "It should work now" without visual confirmation
- Props passed but never rendered

## Component Design Guidelines

### Single Responsibility
```typescript
// ❌ WRONG: Component does too much
<UserDashboard />  // handles auth, data, UI, side effects

// ✅ CORRECT: Separated concerns
<UserDashboardLayout>
  <UserProfile data={userData} />
  <UserStats stats={stats} />
  <UserActions onAction={handleAction} />
</UserDashboardLayout>
```

### Props Interface Design
```typescript
// ❌ WRONG: Overly coupled to data source
interface Props {
  apiResponse: ApiResponse;  // Coupled to API shape
}

// ✅ CORRECT: Interface matches component's needs
interface Props {
  title: string;
  items: Item[];
  onSelect: (item: Item) => void;
}
```

---

## Checklist (After component changes)

- [ ] Component renders all received data
- [ ] State changes reflect in UI
- [ ] User interactions work correctly
- [ ] No data loss in prop passing
- [ ] Loading/error states handled
- [ ] Accessibility basics covered (if applicable)
- [ ] Component is testable (clear inputs/outputs)

## Verification Commands

```bash
# Find unused props
rg "interface.*Props" src/ -A 10 -g "*.{ts,tsx,vue,svelte}"

# Check for incomplete data usage (React example)
rg "data\." src/ -g "*.{tsx,jsx}"

# Find components without error handling
rg "isLoading|isError|loading|error" src/ -g "*.{ts,tsx,vue,svelte}"

# Find data fetched but potentially unused
rg "useQuery|useSWR|fetch\(" src/ -g "*.{ts,tsx}" -C 5

# Check for console.log left in components (should be empty in prod)
rg "console\." src/components/ -g "*.{ts,tsx,vue,svelte}"
```
