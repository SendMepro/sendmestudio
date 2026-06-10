# FIX: Sidebar Hydration Mismatch

## Problem
React hydration mismatch in `<Sidebar>` component.
- **Server** renders `data-open="false"` (all groups collapsed)
- **Client** renders `data-open="true"` (some groups open)

This caused the console warning:
> `Warning: Prop \`data-open\` did not match. Server: "false" Client: "true"`

## Root Cause
File: `src/app/components/Sidebar.tsx`

The `openGroups` state was initialized with a **lazy initializer** that read `window.localStorage` directly:

```ts
// BAD: runs synchronously during first client render, differs from server
const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
  if (typeof window !== "undefined") {
    const saved = window.localStorage.getItem("sidebar-groups");
    if (saved) return JSON.parse(saved);
  }
  return {};
});
```

The `typeof window !== "undefined"` guard does **not** help hydration because:
1. During SSR, `window` is `undefined` → returns `{}` → all groups closed → `data-open="false"`
2. During client hydration's **first render**, `window` **is** defined → reads localStorage → returns saved state with some groups open → `data-open="true"`
3. React compares the two renders → **hydration mismatch**

## Fix
Replaced the synchronous `localStorage` read in `useState` initializer with a two-part approach:

1. **State starts empty** (`{}`) — identical on both server and first client render
2. **`useEffect` after mount** reads `localStorage` and updates state
3. **Persistence effect** watches `openGroups` changes and writes to `localStorage`

```ts
// GOOD: same default on server & first client render
const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
const [mounted, setMounted] = useState(false);

useEffect(() => {
  setMounted(true);
  try {
    const saved = window.localStorage.getItem("sidebar-groups");
    if (saved) {
      setOpenGroups(JSON.parse(saved) as Record<string, boolean>);
    }
  } catch { /* fall through */ }
}, []);

useEffect(() => {
  if (!mounted) return;
  try {
    window.localStorage.setItem("sidebar-groups", JSON.stringify(openGroups));
  } catch { /* quota exceeded */ }
}, [openGroups, mounted]);
```

Also cleaned up `toggleGroup` — removed inline `localStorage.setItem` since the effect handles persistence:

```ts
const toggleGroup = useCallback((id: string) => {
  setOpenGroups((prev) => ({ ...prev, [id]: !prev[id] }));
}, []);
```

## Files Changed
- `src/app/components/Sidebar.tsx` — hydration-safe state initialization

## Verification
- `npx tsc --noEmit` — **No new errors** (only 2 pre-existing errors in unrelated files)
- Behavior unchanged: collapsed/expanded groups persist to `localStorage` correctly after mount
- Hydration warning eliminated: server and client first render produce identical markup
