# Next.js RemoteStorage Template

A clean, production-ready Next.js template for building apps with RemoteStorage.js integration. Based on the successful implementation from the angebote-next project.

## Features

- ✅ Next.js 14+ with App Router
- ✅ RemoteStorage.js for decentralized data storage
- ✅ Custom RemoteStorage module pattern
- ✅ React hooks for data synchronization
- ✅ RemoteStorage widget for user authentication
- ✅ Tailwind CSS with semantic color system
- ✅ Full dark mode support with theme persistence
- ✅ Comprehensive UI component library
- ✅ Responsive sidebar navigation
- ✅ PWA support (installable, service worker, web app manifest)
- ✅ TypeScript-ready structure
- ✅ Clean, extensible architecture

## PWA (Progressive Web App)

The app is set up as a PWA so users can install it on their home screen and use it like an app.

- **Install**: When the app is served over **HTTPS** (or localhost), browsers will offer “Install” or “Add to Home Screen”. On iOS Safari: Share → “Add to Home Screen”.
- **Manifest**: `src/app/manifest.js` defines the app name, theme color, and display mode. The manifest is served at `/manifest.webmanifest`.
- **Service worker**: `public/sw.js` is registered on load; it keeps the app installable. Replace or extend it if you want offline caching.
- **Icons**: Placeholder icons are in `public/icon-192.png` and `public/icon-512.png`. Replace them with your own 192×192 and 512×512 PNGs for a proper install icon.

## Quick Start

```bash
# Copy this template to your new project
cp -r nextjs-remotestorage-template my-new-project
cd my-new-project

# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see your app.

## Project Structure

```
├── app/
│   ├── layout.js           # Root layout with providers
│   ├── page.js             # Main page with RemoteStorage demo
│   └── globals.css         # Global styles & CSS variables
├── components/
│   ├── ui/                 # Reusable UI components
│   │   ├── Button.js       # Button with variants
│   │   ├── Card.js         # Card components
│   │   ├── Input.js        # Input & Textarea
│   │   ├── Badge.js        # Badge component
│   │   ├── Modal.js        # Modal dialog
│   │   └── index.js        # Component exports
│   ├── Sidebar.js          # Navigation sidebar
│   ├── ThemeProvider.js    # Theme context provider
│   └── RemoteStorageWidget.js  # RemoteStorage widget
├── contexts/
│   └── RemoteStorageContext.js # RemoteStorage React Context
├── hooks/
│   ├── use-remote-storage.js   # RemoteStorage initialization
│   └── use-data.js             # Data sync and CRUD operations
├── lib/
│   ├── remotestorage-module.js # Custom RemoteStorage module
│   └── utils.js                # Utility functions
├── DESIGN_SYSTEM.md        # UI design system documentation
├── CLAUDE.md               # Guide for AI agents
├── package.json
├── tailwind.config.js
├── postcss.config.js
└── next.config.mjs
```

## Key Concepts

### 1. RemoteStorage Module

Define your data schema and methods in `lib/remotestorage-module.js`:

```javascript
export const MyModule = {
  name: 'mymodule',
  builder: function (privateClient, publicClient) {
    // Declare data types
    privateClient.declareType('item', { ... })
    
    return {
      exports: {
        // Your CRUD methods
        saveItem: async function(item) { ... },
        loadItem: async function(id) { ... }
      }
    }
  }
}
```

### 2. Custom Hook for Data

Create a custom hook in `hooks/use-data.js` that wraps your module's methods and provides React state:

```javascript
export function useData(remoteStorage) {
  const [items, setItems] = useState([])
  const [isConnected, setIsConnected] = useState(false)
  
  // Load data when connected
  // Provide methods to save/update/delete
  // Handle optimistic updates
  
  return { items, saveItem, deleteItem, isConnected }
}
```

### 3. Provider Setup

Wrap your app in the `RemoteStorageProvider` in `app/layout.js`:

```javascript
<RemoteStorageProvider>
  {children}
</RemoteStorageProvider>
```

### 4. Use in Components

Access RemoteStorage in your components:

```javascript
'use client'
import { useRemoteStorageContext } from '@/contexts/RemoteStorageContext'

export default function MyComponent() {
  const { data, isConnected, saveItem } = useRemoteStorageContext()
  
  // Use your data and methods
}
```

## Customizing for Your Project

### Step 1: Define Your Data Schema

Edit `lib/remotestorage-module.js`:

1. Change the module name from `'mymodule'` to your module name
2. Define your data types using `declareType()`
3. Implement your CRUD methods in the `exports` object

### Step 2: Update the Data Hook

Edit `hooks/use-data.js`:

1. Update state variables to match your data
2. Implement load/save/delete methods
3. Add any business logic needed

### Step 3: Update the Context

Edit `contexts/RemoteStorageContext.js`:

1. Update the module import
2. Update `accessClaims` to match your module name
3. Update the context value to expose what you need

### Step 4: Build Your UI

Update `app/page.js` and create new components as needed.

## RemoteStorage Patterns

### Optimistic Updates

Update local state immediately for responsive UI, then sync to RemoteStorage:

```javascript
const saveItem = useCallback(async (item) => {
  // Optimistic update
  setItems(prev => [...prev, item])
  
  try {
    // Sync to RemoteStorage
    await remoteStorage.mymodule.saveItem(item)
  } catch (error) {
    // Revert on error
    loadAllData()
    throw error
  }
}, [remoteStorage])
```

### Preventing Reload Loops

Use a ref to prevent infinite loops when saving triggers a change event:

```javascript
const isSavingRef = useRef(false)

const save = async () => {
  isSavingRef.current = true
  await remoteStorage.mymodule.save(data)
  setTimeout(() => { isSavingRef.current = false }, 100)
}

// In change listener
if (isSavingRef.current) return
```

### Connection Status

Always check connection before operations:

```javascript
if (!remoteStorage?.mymodule || !isConnected) {
  throw new Error("Not connected to RemoteStorage")
}
```

## Testing RemoteStorage

1. **Local Testing**: Use https://remotestorage-widget.m5x5.com/ or similar test server
2. **Browser DevTools**: Check Application → IndexedDB for cached data
3. **Network Tab**: Monitor API calls to RemoteStorage server
4. **Test Scenarios**:
   - Connect/disconnect
   - Multiple devices syncing
   - Offline usage
   - Conflict resolution

## UI Components & Design System

This template includes a comprehensive design system with reusable components. See [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) for full documentation.

### Available Components

- **Button**: 5 variants (primary, secondary, destructive, outline, ghost)
- **Card**: Container with header, title, and content sections
- **Input/Textarea**: Form inputs with labels and error states
- **Badge**: Status indicators with multiple variants
- **Modal**: Full-featured dialog with backdrop

### Theme System

The app supports light, dark, and system themes:
- Theme preference is saved to RemoteStorage
- Automatic sync across devices
- Smooth transitions between themes
- Semantic color tokens for consistency

```javascript
import { useTheme } from "next-themes"

function MyComponent() {
  const { theme, setTheme } = useTheme()
  // Use theme state
}
```

## Dependencies

- `remotestoragejs@^2.0.0-beta.8` - Core RemoteStorage protocol
- `m5x5-remotestorage-widget@^1.8.0` - UI widget for connecting
- `@heroicons/react@^2.x` - Icon library
- `next-themes@^0.x` - Theme management
- `next@^14.2.15` - Next.js framework
- `react@^18.3.1` - React library
- `tailwindcss@^3.4.14` - CSS framework

## Additional Resources

- [RemoteStorage.js Documentation](https://remotestoragejs.readthedocs.io/)
- [RemoteStorage Protocol](https://remotestorage.io/)
- [Next.js Documentation](https://nextjs.org/docs)

## Tips

1. **Module Names**: Use lowercase, no special characters
2. **File Paths**: Use forward slashes, end folders with `/`
3. **Type Declarations**: Define all types upfront for better caching
4. **Error Handling**: Always handle 404s gracefully (file doesn't exist yet)
5. **Timestamps**: Use ISO format for consistency across timezones
6. **List Files**: Keep separate list files for quick metadata access

## Recipe Nutrition Optimization System

This project includes a Python-based recipe nutrition analysis and meal planning optimization system using the German BLS (Bundeslebensmittelschlüssel) database.

### Quick Start

```bash
# 1. Initial setup: Scrape recipes and create database (one-time or when adding new recipes)
python recipe_schema_extraction.py

# 2. Improve ingredient mappings (iterative, until match rate is satisfactory)
python recipe_unmatched_analysis.py          # Find unmatched ingredients
python add_mapping.py "ingredient" "BLS_Entry" "Category"  # Add mappings
python recipe_add_audit_trails.py            # Recalculate with new mappings

# 3. Generate optimized meal plan (anytime)
python optimization_meal_planner.py
```

### How It Works

**Single Source of Truth:** All nutrient data (including lactose) is calculated from BLS database in one place (`recipe_schema_extraction.py`). No separate lactose calculation needed.

**Workflow:**
1. **Recipe Scraping** → Fetches recipes from Cookidoo, matches ingredients to BLS database
2. **Ingredient Matching** → Maps recipe ingredients to BLS nutritional data (iteratively improve)
3. **Optimization** → OR-Tools linear programming selects optimal weekly meal plan

### Key Files

| File | Purpose |
|------|---------|
| `recipe_schema_extraction.py` | Scrapes recipes, matches ingredients to BLS, calculates ALL nutrients (including lactose) |
| `recipe_add_audit_trails.py` | Reprocesses existing recipes with updated ingredient mappings |
| `optimization_meal_planner.py` | Generates optimal weekly meal plan using linear programming |
| `ingredient_mappings.csv` | Central mapping file: recipe ingredients → BLS database entries |
| `recipe_database.csv` | Main recipe database with audit trails and nutrients |

### Ingredient Mapping Tools

```bash
# Find unmatched ingredients
python recipe_unmatched_analysis.py

# Validate a mapping before adding
python validate_mapping.py "ingredient_name"

# Add a single mapping
python add_mapping.py "chorizo" "Chorizo roh" "Proteins & Meat"

# Generate suggestions for top unmatched ingredients
python batch_mapping_suggester.py

# Bulk import approved mappings
python bulk_import_approved_mappings.py
```

### Configuration

Edit `optimization_config.py` to customize:
- **HOUSEHOLD_SIZE**: Number of people (default: 2)
- **MAX_LACTOSE_PER_MEAL**: Maximum lactose per meal in mg (default: 2000)
- **WEEKLY_GOALS**: Target values for calories, protein, vitamins, etc.

### Excluding Recipes

To exclude specific recipes from the optimization (e.g., recently eaten, missing ingredients):

1. List available recipes:
   ```bash
   python list_recipes.py                    # Show all recipes
   python list_recipes.py --sort-lactose     # Sort by lactose content
   python list_recipes.py --search "pasta"   # Search for specific recipes
   python list_recipes.py --low-lactose 500  # Show only low-lactose recipes
   ```

2. Edit `excluded_recipes.txt` and add recipe names (one per line, exact match)

3. Run optimization - excluded recipes will be skipped

Example `excluded_recipes.txt`:
```
# Recipes to exclude this week
Ravioli Cinque Pi
Käsespätzle mit Röstzwiebeln
Maissuppe mit Wienerli und Bürli
```

### Understanding the Data Flow

```
Cookidoo Recipe → Schema.org JSON
                       ↓
              Parse ingredients
                       ↓
         Match to BLS database (using ingredient_mappings.csv)
                       ↓
         Calculate ALL nutrients (calories, protein, lactose, etc.)
                       ↓
              Store in recipe_database.csv
                       ↓
         Optimization reads and selects optimal recipes
```

**Important:** Lactose is calculated automatically from BLS data along with all other nutrients. No separate calculation step needed.

### Common Tasks

**Add new recipes:**
```bash
# Add URLs to Lebensmittel - Cookidoo Export - Rezepte.csv
python recipe_schema_extraction.py
```

**Improve match rate:**
```bash
# Check current match rate
python recipe_unmatched_analysis.py

# Add missing mappings
python add_mapping.py "ingredient" "BLS_Entry" "Category"

# Recalculate with new mappings
python recipe_add_audit_trails.py

# Current match rate should improve
python recipe_unmatched_analysis.py
```

**Generate meal plan with different goals:**
```bash
# Edit optimization_config.py (change WEEKLY_GOALS)
python optimization_meal_planner.py
```

### Output Files

- `optimization_meal_plan.csv` - Selected recipes with nutritional breakdown
- `optimization_report.txt` - Detailed report with:
  - Lactose contributors per recipe
  - Lactose-free ingredients
  - Unmatched ingredients (potential missing data)
  - Weekly nutritional summary

### Notes

- **Match rate target:** Aim for >80% for accurate nutritional calculations
- **Lactose data:** Automatically included from BLS database (no separate calculation)
- **Unmatched ingredients:** Not included in nutritional totals (improve mappings to fix)
- **All nutrients:** Calculated once during recipe scraping from BLS database

## License

MIT - Use this template for any project!

