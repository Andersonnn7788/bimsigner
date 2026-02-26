# BIM Signer — UI Design System (SKILL.md)

This file defines the design system and UI conventions for the BIM Signer frontend. Reference this when creating or modifying components to ensure visual consistency.

---

## Layout Architecture

### App Shell
```
┌─────────────────────────────────────────────────────────────────────┐
│  Header h-11 — BIM Signer branding + MediaPipe status              │
├──────────────────┬──────────────────┬──────────────────────────────┤
│  CameraPanel     │  AvatarPanel     │  OfficerControls             │
│  w-[34%]         │  w-[33%]         │  w-[33%]                     │
│  (webcam feed)   │  (avatar video)  │  (speech controls)           │
│  h-full flex-col │  h-full flex-col │  h-full flex-col             │
└──────────────────┴──────────────────┴──────────────────────────────┘
│  RecognitionBar h-14 — detected signs + AI interpretation          │
└─────────────────────────────────────────────────────────────────────┘
```

### Layout Rules
- `body { overflow: hidden }` — no page scroll, everything fits in viewport
- Main body: `flex h-screen flex-col`
- Three-column row: `flex flex-1 min-h-0 overflow-hidden`
- Each column: `shrink-0 overflow-hidden` with explicit width
- Each panel: `flex flex-col h-full`

---

## Color Palette (CSS Variables)

| Token | Value | Use |
|-------|-------|-----|
| `background` | slate-100 | Page background |
| `card` | white | Panel backgrounds |
| `foreground` | slate-900 | Primary text |
| `muted-foreground` | slate-500 | Secondary text, labels |
| `border` | slate-200 | Panel/section dividers |
| `primary` | blue-600 `oklch(0.546 0.245 264.376)` | CTAs, active states |
| `primary/10` | blue-600 at 10% opacity | Active background |
| `secondary` | slate-50 | Neutral badge/chip backgrounds |
| `destructive` | red-600 | Error states |
| `emerald-500` | `#10b981` | Success / detected signs |
| `red-500` | `#ef4444` | Listening/recording indicator |
| `amber-500` | `#f59e0b` | Live detection pulse |
| `violet-500` | `#8b5cf6` | Avatar stage indicator |

### Stage Indicator Colors
```tsx
SIGNING:     "bg-primary/20 text-primary border-primary/30"
TRANSLATING: "bg-amber-500/20 text-amber-600 border-amber-500/30"
SPEAKING:    "bg-emerald-500/20 text-emerald-600 border-emerald-500/30"
LISTENING:   "bg-red-500/20 text-red-600 border-red-500/30"
AVATAR:      "bg-violet-500/20 text-violet-600 border-violet-500/30"
```

---

## Typography

| Role | Class | Description |
|------|-------|-------------|
| App name | `text-sm font-bold tracking-tight` | BIM Signer header |
| Panel title | `.panel-title` | `text-xs font-semibold uppercase tracking-widest text-muted-foreground` |
| Body text | `text-sm` | General content |
| Caption / metadata | `text-xs text-muted-foreground` | Timestamps, counts |
| Monospace | `font-mono` | Technical values (confidence, landmarks) |

---

## Panel Structure

Every panel follows this HTML structure:

```tsx
<div className="flex flex-col h-full bg-card">
  {/* Panel header — always 40px tall */}
  <div className="flex h-10 shrink-0 items-center justify-between border-b border-border px-3">
    <div className="flex items-center gap-2">
      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      <span className="panel-title">Panel Name</span>
    </div>
    {/* Optional right-side badge/status */}
  </div>

  {/* Panel body — fills remaining height */}
  <div className="flex-1 min-h-0 overflow-hidden">
    {/* Content */}
  </div>
</div>
```

---

## shadcn/ui Components

### Installed
| Component | Import | Use |
|-----------|--------|-----|
| Button | `@/components/ui/button` | All interactive actions |
| Badge | `@/components/ui/badge` | Labels, sign chips, status |
| Card | `@/components/ui/card` | Sub-section containers |
| Progress | `@/components/ui/progress` | Loading bars |
| ScrollArea | `@/components/ui/scroll-area` | Scrollable text regions |
| Separator | `@/components/ui/separator` | Section dividers |

### Button Conventions
```tsx
// Primary CTA
<Button>Start Camera</Button>

// Secondary action
<Button variant="outline" size="sm">View Profile</Button>

// Ghost / tertiary
<Button variant="ghost" size="sm">View Full Profile</Button>

// Destructive / stop action
<Button className="bg-red-500 hover:bg-red-600 text-white">Stop Speaking</Button>

// Icon only
<Button variant="ghost" size="icon"><Icon /></Button>
```

### Badge Conventions
```tsx
// Neutral status
<Badge variant="secondary">BIM Signer</Badge>

// Active/primary status
<Badge variant="default">Active</Badge>

// Subtle outline
<Badge variant="outline" className="border-primary/30 text-primary">Sign</Badge>

// On dark backgrounds (camera overlay)
<Badge variant="secondary" className="bg-black/60 border-emerald-500/30 text-emerald-400 backdrop-blur-sm">
  Ready
</Badge>
```

---

## Loading States

```tsx
// Spinner (standard)
<div className="h-4 w-4 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />

// With text
<div className="flex items-center gap-2.5 text-muted-foreground">
  <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
  <p className="text-sm">Loading...</p>
</div>

// Full panel loading
<div className="flex flex-col items-center gap-3 text-muted-foreground">
  <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
  <p className="text-sm">Processing...</p>
</div>
```

---

## Sign Detection Chips

Used in CameraPanel (camera overlay) and RecognitionBar (bottom bar):

```tsx
// Camera overlay variant (dark background)
<div className={cn(
  "flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium backdrop-blur-sm transition-all duration-300",
  isDetected && "border-emerald-400/60 bg-emerald-900/70 text-emerald-300",
  isCurrent && "border-primary/60 bg-primary/20 text-primary ring-1 ring-primary/40",
  !isDetected && !isCurrent && "border-white/10 bg-black/50 text-white/40"
)}>
  {isDetected ? <Check className="h-3 w-3 text-emerald-400" /> : <span className="text-[9px]">{i+1}</span>}
  {sign}
</div>

// Bottom bar variant (light background)
<div className={cn(
  "flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium",
  isDetected && "border-emerald-400/60 bg-emerald-50 text-emerald-700",
  isCurrent && "border-primary/50 bg-primary/10 text-primary ring-1 ring-primary/30",
  !isDetected && !isCurrent && "border-border bg-muted/40 text-muted-foreground"
)}>
```

---

## Stage-to-UI Mapping

| Stage | CameraPanel | AvatarPanel | OfficerControls | RecognitionBar |
|-------|-------------|-------------|-----------------|----------------|
| SIGNING | Sign chips active, `SIGNING` badge | Idle placeholder | Mic disabled | Chips show progress |
| TRANSLATING | `TRANSLATING` badge (amber) | Loading spinner | Mic disabled | Spinner + "Translating..." |
| SPEAKING | `SPEAKING` badge (green) | Volume2 pulse animation | Mic disabled | Shows sentence |
| LISTENING | `LISTENING` badge (red) | Idle placeholder | Mic button active + red pulse | Shows sentence |
| AVATAR | `AVATAR` badge (violet) | AvatarPlayer video | Mic disabled | Shows sentence |

---

## Icon Usage (Lucide)

| Context | Icon |
|---------|------|
| Camera panel | `Camera` |
| Avatar panel | `UserRound` |
| Start mic | `Mic` |
| Stop mic | `MicOff` |
| Send message | `Send` |
| Sign detected | `Check` |
| Audio playing | `Volume2` |
| Live detection | `Zap` |
| Conversation | `MessageSquare` |
| Start (hero) | `Hand` |

---

## Animation Conventions

```tsx
// Pulsing indicator (active recording)
<span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />

// Ping ring (audio playing, mic active)
<span className="absolute h-4 w-4 animate-ping rounded-full bg-white/40" />

// Spin (loading)
<div className="h-4 w-4 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
```

---

## File Locations

| Component | Path |
|-----------|------|
| CameraPanel | `src/components/CameraPanel.tsx` |
| AvatarPanel | `src/components/AvatarPanel.tsx` |
| OfficerControls | `src/components/OfficerControls.tsx` |
| RecognitionBar | `src/components/RecognitionBar.tsx` |
| ConversationStrip | `src/components/ConversationStrip.tsx` |
| DetectionOverlay | `src/components/DetectionOverlay.tsx` |
| ConfidenceDisplay | `src/components/ConfidenceDisplay.tsx` |
| AvatarPlayer | `src/components/AvatarPlayer.tsx` |
| Stage machine | `src/lib/stageMachine.ts` |
| Constants | `src/lib/constants.ts` |
| API calls | `src/lib/api.ts` |
| Types | `src/types/index.ts` |
