# Guide for AI Agents

This document is specifically written for AI coding assistants (like Claude) to quickly understand and work with this Next.js RemoteStorage template.

## Project Overview

**What this is**: A Next.js 14 template for building applications with RemoteStorage.js integration, featuring a modern UI design system with full dark mode support.

**Key technologies**:
- Next.js 14 (App Router)
- RemoteStorage.js for decentralized storage
- Tailwind CSS with semantic color tokens
- next-themes for dark mode
- Heroicons for icons
- Custom UI component library

## Quick Architecture Reference

### Data Flow

```
User Action → Component → useRemoteStorageContext Hook
                              ↓
                     RemoteStorageContext
                              ↓
                    useData Hook (CRUD operations)
                              ↓
                    RemoteStorage Module
                              ↓
                    RemoteStorage Server (user's data)
```

### File Organization

**Core RemoteStorage Files**:
- `lib/remotestorage-module.js` - Define data schema and storage methods
- `hooks/use-remote-storage.js` - Initialize RemoteStorage client
- `hooks/use-data.js` - React hooks for data operations
- `contexts/RemoteStorageContext.js` - Context provider for app-wide access

**UI Components** (`components/ui/`):
- `Button.js` - Buttons with 5 variants
- `Card.js` - Cards with header/title/content
- `Input.js` - Inputs and textareas
- `Badge.js` - Status badges
- `Modal.js` - Dialog modals

**Layout**:
- `app/layout.js` - Root layout with ThemeProvider and RemoteStorageProvider
- `components/Sidebar.js` - Navigation sidebar (desktop vertical, mobile bottom)
- `components/ThemeProvider.js` - Theme context wrapper

## Working with RemoteStorage

### Understanding the Module Pattern

RemoteStorage uses a module pattern. The module in `lib/remotestorage-module.js` defines:

1. **Data Types**: Schema definitions with `declareType()`
2. **Storage Methods**: CRUD operations in the `exports` object
3. **Private vs Public**: Use `privateClient` for user-private data

**Current module name**: `mymodule`

### Common Tasks

#### 1. Adding a New Data Type

Edit `lib/remotestorage-module.js`:

```javascript
// Declare the type
privateClient.declareType('newtype', {
  type: 'object',
  properties: {
    id: { type: 'string' },
    name: { type: 'string' },
    created_at: { type: 'string' }
  },
  required: ['id', 'name']
})

// Add CRUD methods
exports: {
  saveNewType: async function(data) {
    const path = `newtypes/${data.id}.json`
    return privateClient.storeObject('newtype', path, data)
  },
  loadNewType: async function(id) {
    const path = `newtypes/${id}.json`
    return privateClient.getObject(path)
  }
}
```

#### 2. Using Data in Components

```javascript
'use client'
import { useRemoteStorageContext } from '@/contexts/RemoteStorageContext'

export default function MyComponent() {
  const {
    isConnected,    // boolean - connection status
    isLoading,      // boolean - loading state
    itemsList,      // array - list of items
    saveItem,       // function - save an item
    loadItem,       // function - load an item
    deleteItem,     // function - delete an item
    settings        // object - user settings
  } = useRemoteStorageContext()

  // Always check connection before operations
  if (!isConnected) {
    return <div>Please connect to RemoteStorage</div>
  }

  // Use the data and methods
}
```

#### 3. Adding New Context Data

Edit `hooks/use-data.js` to add new state/methods, then expose them in `contexts/RemoteStorageContext.js`:

```javascript
// In use-data.js
const [newData, setNewData] = useState([])

// Return it
return {
  newData,
  loadNewData: () => { /* ... */ }
}

// In RemoteStorageContext.js
const contextValue = useMemo(() => ({
  ...dataState,  // This includes newData
  // other values
}), [dataState])
```

## Working with the Design System

### Theme System

**Location**: Theme is managed by `next-themes` and persisted to RemoteStorage.

**Usage**:
```javascript
import { useTheme } from 'next-themes'

function MyComponent() {
  const { theme, setTheme } = useTheme()
  // theme can be: "light", "dark", or "system"
  setTheme("dark")
}
```

**Theme persistence**: The theme is saved to RemoteStorage in the settings. See `app/page.js` line 40-53 for the implementation.

### Color System

**Use semantic tokens** (defined in `app/globals.css` and `tailwind.config.js`):

```javascript
// Good - uses semantic tokens
<div className="bg-card text-card-foreground border border-border">

// Bad - hardcoded colors
<div className="bg-white text-black border border-gray-200">
```

**Available tokens**:
- `background` / `foreground` - Main background and text
- `card` / `card-foreground` - Card backgrounds
- `primary` / `primary-foreground` - Primary actions
- `muted` / `muted-foreground` - Muted backgrounds and text
- `border` - Border colors
- `destructive` / `destructive-foreground` - Destructive actions
- `success` / `success-foreground` - Success states

### Using Components

```javascript
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Input, Textarea } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Modal, ModalHeader, ModalTitle, ModalContent, ModalFooter } from '@/components/ui/Modal'

// Button variants
<Button variant="primary">Save</Button>
<Button variant="secondary">Cancel</Button>
<Button variant="destructive">Delete</Button>
<Button variant="outline">Add</Button>
<Button variant="ghost">More</Button>

// Button sizes
<Button size="sm">Small</Button>
<Button size="default">Default</Button>
<Button size="lg">Large</Button>

// Card structure
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>
    Content here
  </CardContent>
</Card>

// Inputs
<Input
  label="Email"
  type="email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  error={error}
/>

// Badge
<Badge variant="default">Active</Badge>
<Badge variant="success">Success</Badge>
<Badge variant="destructive">Error</Badge>

// Modal
<Modal isOpen={open} onClose={() => setOpen(false)}>
  <ModalHeader>
    <ModalTitle>Confirm</ModalTitle>
  </ModalHeader>
  <ModalContent>
    Are you sure?
  </ModalContent>
  <ModalFooter>
    <Button onClick={() => setOpen(false)}>Cancel</Button>
    <Button variant="destructive">Delete</Button>
  </ModalFooter>
</Modal>
```

### Icons

**Library**: `@heroicons/react/24/outline`

**Usage**:
```javascript
import { HomeIcon, Cog6ToothIcon, TrashIcon } from '@heroicons/react/24/outline'

<HomeIcon className="h-5 w-5 text-muted-foreground" />
<Cog6ToothIcon className="h-6 w-6" />
```

**Standard sizes**:
- `h-4 w-4` - Small (16px)
- `h-5 w-5` - Medium (20px)
- `h-6 w-6` - Navigation (24px)

## Common Pitfalls & Solutions

### 1. "use client" Directive

**Problem**: RemoteStorage uses browser APIs, so components need client-side rendering.

**Solution**: Add `"use client"` at the top of any component using RemoteStorage hooks.

### 2. Connection State

**Problem**: Operations fail when not connected.

**Solution**: Always check `isConnected` before RemoteStorage operations:

```javascript
if (!isConnected) {
  return <ConnectionRequired />
}
```

### 3. Reload Loops

**Problem**: Saving triggers change events which trigger reloads.

**Solution**: Use the `isSavingRef` pattern (see `hooks/use-data.js` line 13).

### 4. Theme Flash

**Problem**: Theme flashes on page load.

**Solution**: Already handled with `suppressHydrationWarning` in `app/layout.js`.

### 5. Dark Mode Colors

**Problem**: Hardcoded colors don't adapt to theme.

**Solution**: Use semantic tokens like `bg-card`, `text-foreground`, `border-border`.

## Testing Checklist

When making changes, test these scenarios:

- [ ] Light mode appearance
- [ ] Dark mode appearance
- [ ] System theme respects OS preference
- [ ] Theme persists after refresh
- [ ] Theme syncs to RemoteStorage when connected
- [ ] Mobile responsive (bottom nav appears)
- [ ] Desktop responsive (sidebar appears)
- [ ] RemoteStorage connect/disconnect flow
- [ ] Data CRUD operations
- [ ] Modal open/close
- [ ] Form validation and errors

## Development Commands

```bash
npm run dev      # Start dev server
npm run build    # Build for production
npm start        # Start production server
npm run lint     # Run ESLint
```

## File Modification Guide

### To Change App Title/Branding
- `app/layout.js` - Update `<title>` tag
- `app/page.js` - Update main heading

### To Add New Page
1. Create `app/newpage/page.js`
2. Add navigation link in `components/Sidebar.js`
3. Add route logic if needed

### To Modify Theme Colors
- `app/globals.css` - Edit CSS variables in `:root` and `.dark`
- Changes apply globally via semantic tokens

### To Add New UI Component
1. Create in `components/ui/NewComponent.js`
2. Follow existing patterns (use semantic colors, accept className prop)
3. Export from `components/ui/index.js`

## Important Notes for AI Agents

1. **Always preserve RemoteStorage functionality** - This is a core feature
2. **Use semantic color tokens** - Never hardcode colors like `bg-white` or `text-black`
3. **Maintain dark mode support** - Test changes in both themes
4. **Keep the responsive layout** - Sidebar (desktop) and bottom nav (mobile)
5. **Follow existing patterns** - Look at similar code before implementing new features
6. **Check DESIGN_SYSTEM.md** - For detailed UI guidelines
7. **Test with RemoteStorage** - Connect to a server and test data operations

## Getting Help

- **Design System**: See `DESIGN_SYSTEM.md`
- **Architecture**: See `ARCHITECTURE.md`
- **User Guide**: See `README.md`
- **RemoteStorage Docs**: https://remotestoragejs.readthedocs.io/

## Quick Reference: File Purposes

| File | Purpose |
|------|---------|
| `app/layout.js` | Root layout with providers |
| `app/page.js` | Main demo page |
| `app/globals.css` | Global styles & theme variables |
| `components/Sidebar.js` | Navigation sidebar |
| `components/ui/*` | Reusable UI components |
| `contexts/RemoteStorageContext.js` | RemoteStorage context |
| `hooks/use-data.js` | Data CRUD operations |
| `hooks/use-remote-storage.js` | RemoteStorage initialization |
| `lib/remotestorage-module.js` | Data schema & storage methods |
| `lib/utils.js` | Utility functions (cn helper) |
| `tailwind.config.js` | Tailwind with semantic colors |

---

**Last Updated**: This template has been fully configured with RemoteStorage integration and a comprehensive design system. The theme system is integrated with RemoteStorage for persistence. All UI components follow the design guidelines. You can start building features immediately using the existing patterns.
