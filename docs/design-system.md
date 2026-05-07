# WorkBee Design System

**Version:** 1.0 — May 2026  
**Stack:** React 18 · Tailwind CSS v3 · Radix UI · shadcn/ui  
**Audience:** UI/UX team — designers and frontend engineers

---

## Table of Contents

1. [Brand Identity](#1-brand-identity)
2. [Color System](#2-color-system)
3. [Typography](#3-typography)
4. [Spacing & Layout](#4-spacing--layout)
5. [Border Radius](#5-border-radius)
6. [Shadows & Elevation](#6-shadows--elevation)
7. [Component Library](#7-component-library)
8. [Iconography](#8-iconography)
9. [Animation](#9-animation)
10. [Internationalization](#10-internationalization)
11. [Accessibility](#11-accessibility)
12. [Do's & Don'ts](#12-dos--donts)

---

## 1. Brand Identity

WorkBee is a two-sided marketplace connecting clients with contractors. The brand is bold, direct, and built for trust. The visual identity leans dark with a high-contrast yellow accent — confident, not flashy.

**Brand pillars:** Local · Reliable · Fast  
**Current launch market:** Vilnius, Lithuania

### Logo Mark

The logo uses a D20 dice icon from `lucide-react` rendered in the primary yellow (`hsl(45, 98%, 51%)`). It appears in the sticky header at all times.

### Beta Badge

A compact pill badge sits next to the logo with the text `BETA`, styled with the primary yellow background and black text. It signals the product is in active development without undermining confidence.

### Vilnius Launch Pill

A subtle pill badge in the header (desktop only) shows "Launching in Vilnius first" with the Vilnius city logo. Hidden on mobile to preserve header real estate.

---

## 2. Color System

The entire color system uses CSS custom properties mapped to Tailwind utilities. All colors are defined as HSL triplets (no `hsl()` wrapper in the variable — Tailwind adds it).

### Core Tokens

| Token | CSS Variable | HSL Value | Hex Approx. | Usage |
|---|---|---|---|---|
| Background | `--background` | `0 0% 4%` | `#0A0A0A` | Page background |
| Foreground | `--foreground` | `0 0% 98%` | `#FAFAFA` | Body text |
| Card | `--card` | `0 0% 7%` | `#121212` | Card surfaces |
| Card Foreground | `--card-foreground` | `0 0% 98%` | `#FAFAFA` | Text on cards |
| Popover | `--popover` | `0 0% 7%` | `#121212` | Dropdowns, menus |
| Primary | `--primary` | `45 98% 51%` | `#F5C400` | Brand yellow, CTAs |
| Primary Foreground | `--primary-foreground` | `0 0% 0%` | `#000000` | Text on primary |
| Secondary | `--secondary` | `0 0% 15%` | `#262626` | Secondary surfaces |
| Secondary Foreground | `--secondary-foreground` | `0 0% 98%` | `#FAFAFA` | Text on secondary |
| Muted | `--muted` | `0 0% 12%` | `#1F1F1F` | Subtle backgrounds |
| Muted Foreground | `--muted-foreground` | `0 0% 65%` | `#A6A6A6` | Placeholder, captions |
| Accent | `--accent` | `45 98% 51%` | `#F5C400` | Same as primary |
| Accent Foreground | `--accent-foreground` | `0 0% 0%` | `#000000` | Text on accent |
| Destructive | `--destructive` | `0 84% 60%` | `#F03A3A` | Errors, delete actions |
| Destructive Foreground | `--destructive-foreground` | `0 0% 98%` | `#FAFAFA` | Text on destructive |
| Border | `--border` | `0 0% 15%` | `#262626` | Dividers, input borders |
| Input | `--input` | `0 0% 15%` | `#262626` | Input field borders |
| Ring | `--ring` | `45 98% 51%` | `#F5C400` | Focus rings |

### Sidebar Tokens

The sidebar uses the same palette but scoped under `sidebar-*` tokens for future independent theming:

| Token | Value |
|---|---|
| `--sidebar-background` | `0 0% 7%` |
| `--sidebar-primary` | `45 98% 51%` (yellow) |
| `--sidebar-accent` | `0 0% 12%` |
| `--sidebar-border` | `0 0% 15%` |

### Admin Panel Tokens

The admin dashboard has its own blue-tinted palette:

| Token | HSL Value | Usage |
|---|---|---|
| `--admin-bg` | `220 10% 4%` | Admin page background |
| `--admin-card` | `220 10% 8%` | Admin card surfaces |
| `--admin-border` | `220 10% 15%` | Admin borders |
| `--admin-sidebar` | `220 10% 6%` | Admin sidebar |
| `--admin-primary` | `210 100% 60%` | Admin CTAs (blue) |
| `--admin-success` | `142 71% 45%` | Status: active, paid |
| `--admin-warning` | `38 92% 50%` | Status: pending |
| `--admin-danger` | `348 83% 47%` | Status: rejected, error |

### How to Use Colors in Code

Always use Tailwind semantic tokens, never raw hex or hardcoded HSL:

```jsx
// Correct
<div className="bg-background text-foreground border-border">
<p className="text-muted-foreground">
<button className="bg-primary text-primary-foreground">

// Wrong — bypasses the token system
<div style={{ background: '#0A0A0A' }}>
<p className="text-gray-400">
```

For one-off inline use of admin tokens:
```jsx
<div className="bg-[hsl(var(--admin-card))] border border-[hsl(var(--admin-border))]">
```

Or use the pre-built utility classes:
```jsx
<div className="admin-card">   // bg + border + rounded-xl + shadow-sm
<div className="admin-panel">  // bg + text-foreground + min-h-screen
```

---

## 3. Typography

### Font Families

| Role | Family | Weights | Usage |
|---|---|---|---|
| **Headings** | Outfit | 300, 400, 500, 600, 700, 800 | All `h1`–`h6` elements |
| **Body** | Plus Jakarta Sans | 400, 500, 600, 700 | All body text, UI labels |
| **Code / Mono** | Roboto Mono | 400, 500, 700 | Code blocks, technical values |

Fonts are loaded from Google Fonts. `body` defaults to Plus Jakarta Sans. Headings automatically receive `font-family: Outfit` via the global CSS base layer — no class needed on `h1`–`h6`.

### Type Scale (Tailwind defaults)

| Class | Size | Line Height | Typical Use |
|---|---|---|---|
| `text-xs` | 12px | 16px | Captions, badges, metadata |
| `text-sm` | 14px | 20px | UI labels, form text, card descriptions |
| `text-base` | 16px | 24px | Body copy, inputs |
| `text-lg` | 18px | 28px | Sub-headings, card titles |
| `text-xl` | 20px | 28px | Section headings |
| `text-2xl` | 24px | 32px | Page titles, dialog headers |
| `text-3xl` | 30px | 36px | Hero headings |
| `text-4xl+` | 36px+ | — | Landing page hero only |

### Heading Defaults

All `h1`–`h6` elements receive:
- `font-family: Outfit`
- `text-balance` (prevents awkward single-word last lines)
- `tracking-tight` (tighter letter-spacing)

No additional class is needed for these properties.

### Font Weight Conventions

| Weight | Usage |
|---|---|
| 400 (regular) | Body text, descriptions |
| 500 (medium) | UI labels, navigation links |
| 600 (semibold) | Card titles, form labels, button text |
| 700 (bold) | Page headings, emphasis |
| 800 (extrabold) | Hero text only |

---

## 4. Spacing & Layout

### Container

The maximum page content width is **1400px**, centered with `2rem` (32px) horizontal padding:

```jsx
// Applied via Tailwind container utility
<div className="container mx-auto">
```

This is configured in `tailwind.config.js`:
```js
container: {
  center: true,
  padding: "2rem",
  screens: { "2xl": "1400px" }
}
```

### Spacing Scale

WorkBee uses Tailwind's default 4px base unit spacing scale. Common values used across the UI:

| Tailwind | px | Common use |
|---|---|---|
| `gap-1` / `p-1` | 4px | Icon padding, tight chip spacing |
| `gap-2` / `p-2` | 8px | Button icon gap, tag spacing |
| `gap-3` / `p-3` | 12px | Small card padding |
| `gap-4` / `p-4` | 16px | Default card padding, form field gaps |
| `gap-5` / `p-5` | 20px | Form field vertical spacing |
| `gap-6` / `p-6` | 24px | Card header/content/footer padding |
| `gap-8` / `p-8` | 32px | Section padding |
| `gap-12` / `p-12` | 48px | Large section separation |

### Responsive Breakpoints

| Prefix | Min-width | Notes |
|---|---|---|
| (none) | 0px | Mobile-first baseline |
| `sm:` | 640px | — |
| `md:` | 768px | Main responsive jump (2-column grids, desktop nav) |
| `lg:` | 1024px | Full header items visible |
| `xl:` | 1280px | — |
| `2xl:` | 1536px | — |

### Grid Patterns

Common layout patterns used across the app:

```jsx
// Two-column responsive grid (used in forms)
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">

// Card grid (contractor listing)
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">

// File preview grid
<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
```

---

## 5. Border Radius

WorkBee uses a consistent rounding scale anchored to `--radius: 0.75rem` (12px).

| Token | Value | Tailwind Class | Usage |
|---|---|---|---|
| `--radius` | 12px | `rounded-xl` | Cards, dialogs, large containers |
| `calc(--radius - 2px)` | 10px | `rounded-lg` | Buttons, inputs, selects, alerts |
| `calc(--radius - 4px)` | 8px | `rounded-md` | Badges, small chips, items |
| — | 4px | `rounded-sm` | Select items, tight elements |
| — | 9999px | `rounded-full` | Avatars, pill badges, circular buttons |

### Rounding by Component

| Component | Class |
|---|---|
| Page cards, auth cards | `rounded-2xl` |
| Buttons (primary) | `rounded-xl` |
| Inputs, selects, textareas | `rounded-lg` |
| Badges, chips | `rounded-md` or `rounded-full` |
| Avatars | `rounded-full` |
| File preview thumbnails | `rounded-lg` |
| Alert banners | `rounded-xl` |

---

## 6. Shadows & Elevation

WorkBee uses minimal shadows on a dark background — borders do the heavy lifting for separation.

| Class | Usage |
|---|---|
| `shadow-sm` | Form inputs, small interactive elements |
| `shadow` | Cards (default card component) |
| `shadow-md` | Dropdown menus, popovers |
| `shadow-xl` | Auth cards, dialog overlays |

For the sticky header, a combination of `backdrop-blur-md` and `border-b border-border` creates the frosted-glass separation effect without a hard shadow.

---

## 7. Component Library

All components live in `apps/web/src/components/ui/`. They are built on Radix UI primitives with Tailwind styling and CVA (class-variance-authority) for variants. All accept a `className` prop for overrides.

---

### Button

**File:** `src/components/ui/button.jsx`

```jsx
import { Button } from '@/components/ui/button'

<Button>Default</Button>
<Button variant="outline">Outline</Button>
<Button variant="destructive">Delete</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="link">Link</Button>
<Button size="sm">Small</Button>
<Button size="lg">Large</Button>
<Button size="icon"><SearchIcon /></Button>
<Button disabled>Disabled</Button>
```

| Prop | Values | Default |
|---|---|---|
| `variant` | `default` · `destructive` · `outline` · `secondary` · `ghost` · `link` | `default` |
| `size` | `default` · `sm` · `lg` · `icon` | `default` |
| `asChild` | `boolean` | `false` |
| `disabled` | `boolean` | — |

| Variant | Background | Text | Hover |
|---|---|---|---|
| `default` | `bg-primary` (#F5C400) | `text-primary-foreground` (black) | `bg-primary/90` |
| `destructive` | `bg-destructive` (red) | `text-destructive-foreground` (white) | `bg-destructive/90` |
| `outline` | `bg-background` | `text-foreground` | `bg-accent text-accent-foreground` |
| `secondary` | `bg-secondary` | `text-secondary-foreground` | `bg-secondary/80` |
| `ghost` | transparent | inherited | `bg-accent text-accent-foreground` |
| `link` | transparent | `text-primary` | underline |

| Size | Height | Padding |
|---|---|---|
| `sm` | 32px | px-3 |
| `default` | 36px | px-4 py-2 |
| `lg` | 40px | px-8 |
| `icon` | 36×36px | — |

**Loading state pattern:**
```jsx
<Button disabled={loading}>
  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
  Submit
</Button>
```

**Primary CTA pattern (full-width, rounded-xl):**
```jsx
<Button className="w-full rounded-xl h-11 font-semibold">
  Create Account
</Button>
```

---

### Input

**File:** `src/components/ui/input.jsx`

```jsx
import { Input } from '@/components/ui/input'

<Input type="text" placeholder="Enter value" />
<Input type="email" required />
<Input type="number" min="0" step="0.01" />
<Input disabled />
```

Default styling: `h-9 · w-full · rounded-md · border-input · bg-transparent · px-3 py-1 · text-base md:text-sm`

**Standard form field:**
```jsx
<div className="space-y-2">
  <Label htmlFor="email">Email</Label>
  <Input
    id="email"
    name="email"
    type="email"
    required
    className="bg-input border-border text-foreground rounded-lg"
  />
</div>
```

**With left accent border (form-heavy views):**
```jsx
<Input className="border-l-2 border-l-primary rounded-lg" />
```

---

### Textarea

**File:** `src/components/ui/textarea.jsx`

```jsx
import { Textarea } from '@/components/ui/textarea'

<Textarea placeholder="Describe what you need..." />
<Textarea className="min-h-[100px]" />
<Textarea className="min-h-[200px]" />
```

Default: `min-h-[60px] · rounded-md · border-input · bg-transparent · px-3 py-2`

The `min-h` class controls the initial height — override per-instance as needed.

---

### Select

**File:** `src/components/ui/select.jsx`

```jsx
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue
} from '@/components/ui/select'

<Select value={value} onValueChange={setValue}>
  <SelectTrigger className="bg-input border-border text-foreground rounded-lg">
    <SelectValue placeholder="Choose category" />
  </SelectTrigger>
  <SelectContent className="bg-card border-border">
    <SelectItem value="plumbing">Plumbing</SelectItem>
    <SelectItem value="electrical">Electrical</SelectItem>
  </SelectContent>
</Select>
```

Trigger height matches Input: `h-9`. Dropdown content uses `bg-popover`, `shadow-md`, and animated open/close transitions.

---

### Label

**File:** `src/components/ui/label.jsx`

```jsx
import { Label } from '@/components/ui/label'

<Label htmlFor="email">Email address</Label>
```

Styling: `text-sm · font-medium · leading-none`. Automatically dims when its peer input is disabled (`peer-disabled:opacity-70`).

Always pair with a form element using `htmlFor` / `id` for accessibility.

---

### Card

**File:** `src/components/ui/card.jsx`

```jsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'

<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <CardDescription>Supporting description text</CardDescription>
  </CardHeader>
  <CardContent>
    {/* main content */}
  </CardContent>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>
```

| Sub-component | Key styles |
|---|---|
| `Card` | `rounded-xl border bg-card text-card-foreground shadow` |
| `CardHeader` | `flex flex-col space-y-1.5 p-6` |
| `CardTitle` | `font-semibold leading-none tracking-tight` |
| `CardDescription` | `text-sm text-muted-foreground` |
| `CardContent` | `p-6 pt-0` |
| `CardFooter` | `flex items-center p-6 pt-0` |

**Auth card pattern (login, register):**
```jsx
<Card className="w-full max-w-md bg-card border-border rounded-2xl shadow-xl">
```

---

### Badge

**File:** `src/components/ui/badge.jsx`

```jsx
import { Badge } from '@/components/ui/badge'

<Badge>Default</Badge>
<Badge variant="secondary">Secondary</Badge>
<Badge variant="destructive">Rejected</Badge>
<Badge variant="outline">Outline</Badge>
```

| Variant | Background | Text |
|---|---|---|
| `default` | `bg-primary` (yellow) | black |
| `secondary` | `bg-secondary` | white |
| `destructive` | `bg-destructive` (red) | white |
| `outline` | transparent | `text-foreground` |

Size: always `text-xs font-semibold px-2.5 py-0.5 rounded-md`.

---

### Alert

**File:** `src/components/ui/alert.jsx`

```jsx
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'

// Error alert
<Alert variant="destructive" className="rounded-xl">
  <AlertCircle className="h-4 w-4" />
  <AlertTitle>Error</AlertTitle>
  <AlertDescription>Something went wrong.</AlertDescription>
</Alert>

// Success/info alert (custom colour)
<Alert className="rounded-xl bg-primary/10 text-primary border-primary/20">
  <AlertDescription>Password reset email sent.</AlertDescription>
</Alert>

// Warning alert
<Alert className="rounded-xl border-yellow-500/30 bg-yellow-500/10">
  <AlertDescription className="text-yellow-700 dark:text-yellow-400">
    Please verify your email.
  </AlertDescription>
</Alert>
```

When an icon is included as a direct child, it is automatically positioned `absolute left-4 top-4` and the description shifts right by `pl-7`.

---

### Avatar

**File:** `src/components/ui/avatar.jsx`

```jsx
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'

<Avatar>
  <AvatarImage src={user.avatarUrl} alt={user.name} />
  <AvatarFallback>
    <UserIcon className="h-5 w-5 text-muted-foreground" />
  </AvatarFallback>
</Avatar>
```

Default size: `h-10 w-10` (40px). Override with `className="h-8 w-8"` etc.  
Always provide a `AvatarFallback` — it renders when the image fails or is absent.

---

### Tabs

**File:** `src/components/ui/tabs.jsx`

```jsx
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'

<Tabs defaultValue="contractors">
  <TabsList>
    <TabsTrigger value="contractors">Contractors</TabsTrigger>
    <TabsTrigger value="projects">Projects</TabsTrigger>
  </TabsList>
  <TabsContent value="contractors">...</TabsContent>
  <TabsContent value="projects">...</TabsContent>
</Tabs>
```

`TabsList` styling: `h-9 bg-muted rounded-lg p-1`  
Active tab: `bg-background text-foreground shadow`  
Inactive tab: `text-muted-foreground`

---

### Separator

**File:** `src/components/ui/separator.jsx`

```jsx
import { Separator } from '@/components/ui/separator'

<Separator />                          // Horizontal (default)
<Separator orientation="vertical" />   // Vertical
```

Uses `bg-border` — a 1px line at `hsl(0 0% 15%)`.

---

### Skeleton

**File:** `src/components/ui/skeleton.jsx`

```jsx
import { Skeleton } from '@/components/ui/skeleton'

// Card loading state
<div className="space-y-3">
  <Skeleton className="h-48 w-full rounded-xl" />
  <Skeleton className="h-4 w-3/4" />
  <Skeleton className="h-4 w-1/2" />
</div>
```

Styling: `animate-pulse rounded-md bg-primary/10` — a subtle yellow-tinted pulse to stay on-brand.

---

### Spinner

**File:** `src/components/ui/spinner.jsx`

```jsx
import { Spinner } from '@/components/ui/spinner'

<Spinner />                              // Default h-4 w-4
<Spinner className="h-6 w-6" />
```

Uses the `Loader2` icon from lucide-react with `animate-spin`. For buttons, use the inline `<Loader2>` pattern directly (see Button section).

---

### Tooltip

**File:** `src/components/ui/tooltip.jsx`

```jsx
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

<TooltipProvider>
  <Tooltip>
    <TooltipTrigger asChild>
      <Button size="icon"><InfoIcon /></Button>
    </TooltipTrigger>
    <TooltipContent>
      <p>More information</p>
    </TooltipContent>
  </Tooltip>
</TooltipProvider>
```

Wrap the page (or layout) in `<TooltipProvider>` once — not per-tooltip.

---

### Dialog / Sheet

**File:** `src/components/ui/dialog.jsx` · `src/components/ui/sheet.jsx`

```jsx
// Centered modal
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Place a Bid</DialogTitle>
    </DialogHeader>
    {/* content */}
  </DialogContent>
</Dialog>

// Slide-in panel (from the right)
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'

<Sheet open={open} onOpenChange={setOpen}>
  <SheetContent side="right">
    <SheetHeader>
      <SheetTitle>Filters</SheetTitle>
    </SheetHeader>
  </SheetContent>
</Sheet>
```

Use `Dialog` for focused actions (bid, confirm, create). Use `Sheet` for supplementary panels (filters, settings).

---

### Dropdown Menu

**File:** `src/components/ui/dropdown-menu.jsx`

```jsx
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuSeparator
} from '@/components/ui/dropdown-menu'

<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="ghost" size="icon"><MoreVertical /></Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent align="end">
    <DropdownMenuItem>Edit</DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

---

### Toast / Sonner

**File:** `src/components/ui/toaster.jsx`  
**Hook:** `src/hooks/use-toast.js`

```jsx
import { useToast } from '@/hooks/use-toast'

const { toast } = useToast()

// Success
toast({ title: "Success", description: "Bid placed successfully." })

// Error
toast({ title: "Error", description: "Could not save.", variant: "destructive" })
```

`<Toaster />` is mounted once at the app root. Toasts auto-dismiss. Always include both `title` and `description`.

---

### Progress

**File:** `src/components/ui/progress.jsx`

```jsx
import { Progress } from '@/components/ui/progress'

<Progress value={75} className="h-2" />
```

The filled bar uses `bg-primary` (yellow). Use for onboarding steps, upload progress.

---

### Switch

**File:** `src/components/ui/switch.jsx`

```jsx
import { Switch } from '@/components/ui/switch'

<div className="flex items-center gap-2">
  <Switch checked={enabled} onCheckedChange={setEnabled} id="notifications" />
  <Label htmlFor="notifications">Email notifications</Label>
</div>
```

Checked state: `bg-primary`. Unchecked: `bg-input`.

---

### Checkbox & Radio Group

```jsx
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'

// Checkbox
<div className="flex items-center gap-2">
  <Checkbox id="terms" checked={accepted} onCheckedChange={setAccepted} />
  <Label htmlFor="terms">I agree to the terms</Label>
</div>

// Radio group
<RadioGroup value={userType} onValueChange={setUserType}>
  <div className="flex items-center gap-2">
    <RadioGroupItem value="client" id="client" />
    <Label htmlFor="client">Client</Label>
  </div>
  <div className="flex items-center gap-2">
    <RadioGroupItem value="contractor" id="contractor" />
    <Label htmlFor="contractor">Contractor</Label>
  </div>
</RadioGroup>
```

---

## 8. Iconography

All icons use **Lucide React** (`lucide-react@^0.469`). Never import SVGs directly — always use Lucide.

```jsx
import { Search, Star, MapPin, Loader2, ChevronDown } from 'lucide-react'

<Search className="h-4 w-4" />
<Star className="h-5 w-5 text-primary fill-primary" />
<MapPin className="h-4 w-4 text-muted-foreground" />
```

### Icon Size Conventions

| Context | Size class |
|---|---|
| Inside buttons | `h-4 w-4` (auto-applied by Button) |
| Standalone inline | `h-4 w-4` |
| Card/section icons | `h-5 w-5` |
| Empty state illustrations | `h-10 w-10` or `h-12 w-12` |
| Loading spinner | `h-4 w-4 animate-spin` |

### Lucide Icons in Use

| Icon | Usage |
|---|---|
| `Loader2` | Loading spinner in buttons and pages |
| `Star` / `StarHalf` | Ratings (fill yellow for filled stars) |
| `MapPin` | Location fields, contractor cards |
| `ChevronDown` / `ChevronUp` | Accordion, select dropdowns |
| `Check` | Select item indicator, success states |
| `X` | Dismiss, remove file, close |
| `UploadCloud` | File upload drop zone |
| `FileText` | PDF file preview |
| `MailCheck` | Email verification alert |
| `AlertCircle` | Error alerts |
| `Search` | Search inputs |
| `Settings` | Settings menu |
| `LogOut` | Logout action |
| `UserPlus` | Register / invite |

---

## 9. Animation

### Built-in Tailwind Animations

| Class | Effect | Use case |
|---|---|---|
| `animate-spin` | Continuous rotation | Loading spinners |
| `animate-pulse` | Opacity fade in/out | Skeleton loaders |
| `animate-bounce` | Vertical bounce | Attention indicators |
| `animate-accordion-down` | Height 0→auto (0.2s ease-out) | Accordion open |
| `animate-accordion-up` | Height auto→0 (0.2s ease-out) | Accordion close |

### Custom Keyframe Animations

**`animate-custom-pulse`** — Brand pulse for primary CTAs:
```css
/* 2s loop: subtle scale up + yellow glow ring + opacity */
0%, 100% { opacity: 1; transform: scale(1); box-shadow: 0 0 0 0 rgba(250,204,21,0.7); }
50%       { opacity: .9; transform: scale(1.02); box-shadow: 0 0 20px 10px rgba(250,204,21,0); }
```
Usage: `className="animate-custom-pulse"` — use sparingly on the most important single CTA on a page.

**`animate-roll-d20`** — Logo spin on click:
```css
/* 0.6s cubic spring: rotate 360° with scale bounce */
```
Usage: Applied to the header logo icon.

### Interaction Micro-animations

These are applied via Tailwind utility classes directly on elements:

```jsx
// Scale on press
<button className="active:scale-[0.98] transition-all duration-200">

// Scale on hover (for cards, avatars)
<div className="hover:scale-105 transition-transform duration-200">

// Smooth colour transitions (for nav links)
<a className="transition-colors duration-300">

// Smooth all transitions (for primary buttons)
<Button className="transition-all duration-200">
```

### Radix UI Animations

Select, Dialog, DropdownMenu, and Tooltip components from Radix UI include built-in `data-[state=open]` / `data-[state=closed]` animations via `tailwindcss-animate`:
- Fade in/out
- Zoom in/out (95%→100%)
- Slide from the appropriate edge

These are already configured — no extra work needed.

---

## 10. Internationalization

The app uses `react-i18next` for all user-facing strings. **No hardcoded English strings in JSX** — every label, placeholder, heading, and button goes through the translation system.

```jsx
import { useTranslation } from 'react-i18next'

const { t } = useTranslation()

<Label>{t('auth.email')}</Label>
<Button>{t('auth.login_btn')}</Button>
```

### Language Auto-detection

On the registration page, selecting a location via Google Places auto-switches the app language based on the country of the selected address:

| Country | Language |
|---|---|
| Lithuania (LT) | Lithuanian (`lt`) |
| Russia / Belarus / Ukraine (RU, BY, UA) | Russian (`ru`) |
| Poland (PL) | Polish (`pl`) |
| All others | English (`en`) |

Designers should provide copy in: **English, Lithuanian, Russian, Polish** at minimum.

---

## 11. Accessibility

The design system is built on **Radix UI** primitives which handle ARIA roles, keyboard navigation, and focus management out of the box. Key commitments:

- All interactive elements have visible focus rings (`focus-visible:ring-1 focus-visible:ring-ring`)
- Form inputs are always associated with a `<Label>` via `htmlFor`/`id`
- `Alert` components use `role="alert"` for screen reader announcements
- `Avatar` includes `AvatarFallback` for when images fail
- `Spinner` includes `role="status"` and `aria-label="Loading"`
- Disabled elements use `disabled:opacity-50 disabled:pointer-events-none`
- Colour contrast: primary yellow on black exceeds WCAG AA

**Designers:** When adding new patterns, verify focus ring visibility on the dark background and ensure interactive areas are at least 44×44px (mobile touch targets).

---

## 12. Do's & Don'ts

### Colors

| Do | Don't |
|---|---|
| Use `text-muted-foreground` for secondary text | Use `text-gray-400` or raw hex |
| Use `bg-primary text-primary-foreground` for CTAs | Use `bg-yellow-400` |
| Use `border-border` for dividers | Use `border-gray-700` |
| Use `bg-destructive` for delete/error actions | Use `bg-red-500` |

### Buttons

| Do | Don't |
|---|---|
| Use `variant="ghost"` for low-priority actions | Stack multiple `default` variant buttons |
| Use `size="icon"` for icon-only buttons | Put icons in buttons without accessible labels |
| Add `disabled={loading}` and a spinner | Leave buttons active during async operations |
| Round primary CTAs to `rounded-xl` | Mix border radius sizes randomly |

### Forms

| Do | Don't |
|---|---|
| Pair every input with a `<Label>` | Use placeholder text as the only label |
| Add `border-l-2 border-l-primary` on form-heavy pages | Skip the left accent on complex forms |
| Show validation errors in a `<Alert variant="destructive">` | Use browser default validation popups |
| Use `space-y-5` for vertical form field rhythm | Use arbitrary margins |

### Typography

| Do | Don't |
|---|---|
| Use Tailwind text scale classes | Set arbitrary `font-size` in px |
| Let headings auto-use Outfit via the base layer | Apply `font-[Outfit]` manually everywhere |
| Use `text-muted-foreground` for captions and metadata | Use `text-sm` alone without the colour token |

### Layout

| Do | Don't |
|---|---|
| Use semantic `gap-*` classes for spacing | Use `margin: px` in inline styles |
| Use the `container` class for page-level centering | Set `max-width` manually |
| Follow mobile-first: base → `md:` → `lg:` | Design desktop-first and add `sm:` overrides |

### New Components

When creating a new component:
1. Check if a Radix UI primitive covers the interaction — use it as the base
2. Apply only Tailwind token classes (no hardcoded colors)
3. Accept a `className` prop merged with `cn()` for overridability
4. Handle `disabled` state visually
5. If it has variants, use CVA — not conditional string concatenation

---

## Appendix: Quick Reference Card

```
Brand Yellow:   hsl(45, 98%, 51%)  →  bg-primary / text-primary
Background:     hsl(0, 0%, 4%)     →  bg-background
Card:           hsl(0, 0%, 7%)     →  bg-card
Border:         hsl(0, 0%, 15%)    →  border-border
Muted text:     hsl(0, 0%, 65%)    →  text-muted-foreground
Error:          hsl(0, 84%, 60%)   →  bg-destructive

Base radius:    0.75rem (12px)
Container max:  1400px
Font – Body:    Plus Jakarta Sans
Font – Heading: Outfit
Font – Code:    Roboto Mono
Icon library:   lucide-react
```
