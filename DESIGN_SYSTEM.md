# Design System Documentation

This document describes the comprehensive UI design system applied to this Next.js RemoteStorage template, based on the Leptum application design guidelines.

## Overview

The design system implements a modern, minimalist interface with full dark mode support, semantic color tokens, and reusable components following best practices.

## Color System

### Semantic Color Tokens

The application uses a sophisticated semantic color system with CSS variables defined in HSL format:

#### Light Mode
- **Background**: `hsl(0 0% 100%)` - Pure white
- **Foreground**: `hsl(222.2 84% 4.9%)` - Very dark blue-gray
- **Primary**: `hsl(222.2 47.4% 11.2%)` - Dark blue-gray
- **Muted**: `hsl(210 40% 96.1%)` - Very light blue-gray
- **Border**: `hsl(214.3 31.8% 91.4%)` - Light gray

#### Dark Mode
- **Background**: `hsl(222.2 84% 4.9%)` - Very dark blue-gray
- **Foreground**: `hsl(210 40% 98%)` - Very light blue-gray
- **Primary**: `hsl(210 40% 98%)` - Light
- **Muted**: `hsl(217.2 32.6% 17.5%)` - Medium dark blue-gray
- **Border**: `hsl(217.2 32.6% 17.5%)` - Same as muted

#### Status Colors
- **Success**: Green (`hsl(160 84.1% 39.4%)`)
- **Destructive**: Red (`hsl(0 84.2% 60.2%)`)
- **Accent**: Light blue-gray

## Typography

### Font Stack
- System fonts (defaults to -apple-system, BlinkMacSystemFont, etc.)
- Logo uses "Rye" font family (loaded from Google Fonts)

### Typography Scale
- **Page titles**: `text-3xl`, bold
- **Section headers**: `text-xl`, semibold
- **Card titles**: `text-lg`, medium/semibold
- **Body text**: `text-sm` to `text-base`
- **Metadata/labels**: `text-xs`

## Layout Structure

### Desktop (md breakpoint+)
- Vertical sidebar on left (56px/14rem width)
- Main content area grows to fill remaining space
- Content max-width constrained to 4xl (`max-w-4xl`)
- Flexbox layout: `flex md:flex-row`

### Mobile
- Bottom navigation bar (fixed)
- Content with extra bottom padding (`pb-20`) to avoid nav overlap
- Horizontal icon layout in bottom nav

### Sidebar Design
- Minimal width vertical bar (56px)
- Background: Card color with right border
- Structure:
  - Logo at top (single letter "L" in Rye font)
  - Centered navigation icons in middle
  - Theme toggle & Settings icon at bottom
- Icons: 24px (h-6) Heroicons in muted-foreground color
- Hover state: Icons transition to primary color

## Components

### Button
**Variants:**
- `primary`: Primary action (dark background, light text)
- `secondary`: Secondary action (muted background)
- `destructive`: Destructive actions (red)
- `outline`: Dashed outline for adding items
- `ghost`: Transparent with hover effect

**Sizes:**
- `sm`: Small (`px-3 py-1.5 text-xs`)
- `default`: Default (`px-4 py-2 text-sm`)
- `lg`: Large (`px-6 py-3 text-base`)

### Card
**Components:**
- `Card`: Container with border and padding
- `CardHeader`: Header section
- `CardTitle`: Title text
- `CardContent`: Content area

**Styling:**
- Border: 1px solid border color
- Border radius: `rounded-lg`
- Padding: `p-4`
- Background: Card color

### Input & Textarea
**Features:**
- Optional label
- Error state support
- Full width by default
- Border transitions on focus
- Muted background

**Styling:**
- Border radius: `rounded-lg`
- Padding: `px-3 py-2`
- Focus: Border color changes to primary

### Badge
**Variants:**
- `default`: Primary color (10% opacity background)
- `success`: Green
- `destructive`: Red
- `muted`: Muted gray

**Styling:**
- Border radius: `rounded-full`
- Padding: `px-2 py-1`
- Font size: `text-xs`

### Modal
**Components:**
- `Modal`: Container with backdrop
- `ModalHeader`: Header section
- `ModalTitle`: Title text
- `ModalContent`: Content area
- `ModalFooter`: Footer with actions

**Features:**
- Backdrop blur effect
- Click outside to close
- Close button in top-right
- Body scroll lock when open
- Smooth animations

## Design Principles

1. **Minimalism**: Clean, uncluttered interfaces with ample whitespace
2. **Semantic Colors**: CSS variables for consistent theming
3. **Dark Mode First**: Equal treatment of light and dark modes
4. **Tailwind-based**: Utility-first CSS approach
5. **Accessibility**: Proper contrast ratios, focus states, semantic HTML
6. **Responsive**: Mobile-first with breakpoint-specific layouts
7. **Subtle Depth**: Borders over shadows for hierarchy
8. **Consistent Spacing**: 4px grid system (Tailwind's default)
9. **Icon-driven**: Heavy use of Heroicons for navigation and actions
10. **State Clarity**: Clear visual feedback for active, hover, disabled states

## Icons

### Library
- **Heroicons** (`@heroicons/react`)
- Uses 24/outline variant for most icons

### Sizes
- `h-4 w-4`: Small icons (16px)
- `h-5 w-5`: Medium icons (20px)
- `h-6 w-6`: Navigation icons (24px)

### Colors
- Default: `text-muted-foreground`
- Hover: `text-primary` or specific colors
- Transitions: All color changes animated

## Dark Mode Implementation

### Technology
- **next-themes** package for theme management
- `ThemeProvider` wraps the entire app
- Supports system preference detection
- Manual toggle via Sidebar theme button

### Configuration
- Tailwind configured with `darkMode: "class"`
- CSS variables change in `.dark` class
- Smooth transitions between themes

## File Structure

```
components/
├── ui/
│   ├── Button.js         # Button component with variants
│   ├── Card.js           # Card components
│   ├── Input.js          # Input and Textarea
│   ├── Badge.js          # Badge component
│   ├── Modal.js          # Modal dialog
│   └── index.js          # Component exports
├── Sidebar.js            # Navigation sidebar
├── ThemeProvider.js      # Theme context provider
└── RemoteStorageWidget.js # RemoteStorage connection widget

app/
├── layout.js             # Root layout with providers
├── page.js               # Main application page
└── globals.css           # Global styles and CSS variables

tailwind.config.js        # Tailwind configuration with semantic colors
```

## Usage Examples

### Importing Components

```javascript
// Individual imports
import { Button } from "../components/ui/Button"
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/Card"

// Or from index
import { Button, Card, Input } from "../components/ui"
```

### Using Components

```javascript
// Button
<Button variant="primary" size="default">Save</Button>
<Button variant="destructive">Delete</Button>

// Card
<Card>
  <CardHeader>
    <CardTitle>My Card</CardTitle>
  </CardHeader>
  <CardContent>
    Content goes here
  </CardContent>
</Card>

// Input
<Input
  label="Email"
  type="email"
  placeholder="Enter email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
/>

// Badge
<Badge variant="success">Active</Badge>

// Modal
<Modal isOpen={isOpen} onClose={() => setIsOpen(false)}>
  <ModalHeader>
    <ModalTitle>Confirm Action</ModalTitle>
  </ModalHeader>
  <ModalContent>
    Are you sure?
  </ModalContent>
  <ModalFooter>
    <Button variant="secondary" onClick={() => setIsOpen(false)}>Cancel</Button>
    <Button variant="destructive">Confirm</Button>
  </ModalFooter>
</Modal>
```

## Customization

### Extending Colors

Add new colors in `app/globals.css`:

```css
:root {
  --your-color: 200 100% 50%;
}
```

Then add to `tailwind.config.js`:

```javascript
colors: {
  yourColor: "hsl(var(--your-color))",
}
```

### Creating New Components

Follow these guidelines:
1. Use semantic color tokens (not hardcoded colors)
2. Support dark mode automatically via CSS variables
3. Include hover and focus states
4. Use Tailwind utility classes
5. Export from `components/ui/index.js`

## Browser Support

- Modern browsers with CSS custom properties support
- Tailwind CSS PostCSS processing
- System font fallbacks for maximum compatibility

## Performance

- CSS-in-JS avoided for better performance
- Tailwind purges unused styles in production
- Minimal runtime JavaScript for theme switching
- Server-side rendering compatible

---

This design system provides a solid foundation for building modern, accessible, and visually consistent applications with full dark mode support.
