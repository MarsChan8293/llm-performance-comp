# Planning Guide

A comprehensive LLM performance benchmarking platform for centralized performance data management, comparison, and analysis.

**Experience Qualities**:
1. **Efficient** - Streamline benchmark data entry through CSV batch import and manual input options
2. **Analytical** - Facilitate side-by-side performance comparison to identify optimal configurations
3. **Organized** - Provide searchable, filterable benchmark database for quick information retrieval

**Complexity Level**: Light Application (multiple features with basic state)
- The app manages benchmark data entries, supports CRUD operations, CSV batch import, and provides comparison views without requiring complex multi-page navigation or advanced state management beyond persistent storage.

## Essential Features

### Feature 1: CSV Batch Import
- **Functionality**: Upload CSV files containing multiple benchmark results with performance metrics (Process Num, Input Length, Output Length, TTFT, TPS, etc.)
- **Purpose**: Enable rapid bulk data entry from existing benchmark test outputs
- **Trigger**: User clicks "导入 CSV" button
- **Progression**: Click Import CSV → Upload file → File parsed and validated → User fills shared configuration (model name, server, chip, framework) → Preview parsed data → Confirm → Multiple benchmarks added to database
- **Success criteria**: CSV parsed correctly, all rows with valid data imported, shared configuration applied to all entries, success notification shows count

### Feature 2: Manual Benchmark Entry
- **Functionality**: Form to input single benchmark configuration and performance metrics
- **Purpose**: Add individual benchmark results or test entries manually
- **Trigger**: User clicks "手动添加" button
- **Progression**: Click Manual Add → Fill configuration form (model, server, chip, framework, test date) → Fill performance metrics (concurrency, input/output length, TTFT, TPOT, TPS) → Save → Data appears in list
- **Success criteria**: Data persists, displays in the benchmark list with all fields intact

### Feature 3: Benchmark List & Management
- **Functionality**: Searchable/filterable list showing all saved benchmarks with edit/delete capabilities
- **Purpose**: Allow users to browse, organize, and maintain their benchmark database
- **Trigger**: Automatic on app load
- **Progression**: App loads → Display benchmarks → User searches/filters → Matching results shown → User can select, edit, or delete entries
- **Success criteria**: All benchmarks visible, search works across all fields, CRUD operations succeed

### Feature 4: Performance Comparison
- **Functionality**: Select two benchmarks and view side-by-side performance metric comparison
- **Purpose**: Identify performance differences between configurations for optimization decisions
- **Trigger**: User selects two benchmarks and clicks "开始对比" or switches to Compare tab
- **Progression**: Select first benchmark → Select second benchmark → Click Compare → View comparison panel with metrics side-by-side → Differences highlighted with visual indicators
- **Success criteria**: Clear visual comparison showing all metrics, performance deltas calculated and displayed

## Edge Case Handling
- **Invalid CSV Format**: Display error message specifying missing columns or invalid data format
- **Empty CSV**: Show validation error requiring at least one valid data row
- **Corrupted CSV Data**: Skip invalid rows and notify user of skipped entries count
- **Duplicate Selections**: Prevent selecting more than 2 benchmarks for comparison with toast notification
- **Search with No Results**: Display friendly "no results" message with suggestion to adjust search terms
- **Delete Last Item**: Gracefully show empty state with call-to-action to add new data
- **Large CSV Files**: Handle parsing of 100+ row files with loading indicator

## Design Direction
The design should evoke professionalism, precision, and technical credibility. Users should feel confident that they're working with a robust analytical tool. The interface should balance data density with clarity, using visual hierarchy to guide attention to key metrics while maintaining a clean, focused workspace.

## Color Selection
Technical and precise color scheme with blue-purple foundation suggesting intelligence and reliability.

- **Primary Color**: Deep Purple-Blue (oklch(0.45 0.15 250)) - Communicates technical sophistication and intelligence, used for primary actions and key UI elements
- **Secondary Colors**: 
  - Dark Slate (oklch(0.35 0.02 250)) - Supporting actions and less prominent buttons
  - Soft Gray Background (oklch(0.96 0.01 250)) - Muted backgrounds and disabled states
- **Accent Color**: Vibrant Cyan-Blue (oklch(0.65 0.18 210)) - Highlights, focus states, and attention-drawing elements like selected benchmarks
- **Foreground/Background Pairings**:
  - Primary (oklch(0.45 0.15 250)): White text (oklch(0.99 0 0)) - Ratio 9.2:1 ✓
  - Accent (oklch(0.65 0.18 210)): White text (oklch(0.99 0 0)) - Ratio 5.1:1 ✓
  - Background (oklch(1 0 0)): Dark text (oklch(0.25 0.01 250)) - Ratio 13.8:1 ✓
  - Muted (oklch(0.96 0.01 250)): Medium text (oklch(0.50 0.01 250)) - Ratio 5.2:1 ✓

## Font Selection
Typefaces should convey technical precision while maintaining readability for dense data displays.

- **Primary Font**: Inter - Clean, modern sans-serif for body text and UI elements
- **Heading Font**: Space Grotesk - Distinctive geometric sans-serif for headings, conveying modernity and technical character
- **Monospace Font**: JetBrains Mono - For numeric data and technical specifications, ensuring consistent alignment

**Typographic Hierarchy**:
- H1 (Page Title): Space Grotesk Bold/32px/tight tracking
- H2 (Section Headers): Space Grotesk SemiBold/20px/normal tracking
- H3 (Card Titles): Space Grotesk Medium/16px/normal tracking
- Body Text: Inter Regular/14px/1.5 line-height
- Small Text (Metrics): Inter Medium/12px/1.4 line-height
- Monospace Data: JetBrains Mono Regular/14px for numeric values

## Animations
Animations should be subtle and purposeful, reinforcing user actions without causing delay or distraction.

- **Micro-interactions**: Button hover states with 150ms color transition, subtle scale on active state
- **Modal Transitions**: Dialogs fade in with 200ms duration, slide up slightly for polished appearance
- **List Updates**: New benchmark entries fade in from top with 300ms stagger
- **Comparison Panel**: Metrics animate in with subtle slide from sides when comparison loads
- **File Upload**: Drag-over state with border pulse, upload success with checkmark animation
- **Tab Switching**: Content crossfade with 200ms timing
- **Selection State**: Smooth border color transition and shadow expansion on card selection

## Component Selection

**Components**:
- **Dialog**: For add/edit benchmark forms and CSV import - full-width on mobile, max-width centered modal on desktop with scroll area
- **Tabs**: Switch between "All Benchmarks" list view and "Performance Comparison" view
- **Card**: Display individual benchmark entries with selectable state, edit/delete actions
- **Input**: Form fields with clear labels for configuration and metrics
- **Button**: Primary (add/import actions), Outline (secondary actions like compare), Ghost (icon-only actions)
- **Badge**: Display status indicators, selection count, data counts
- **ScrollArea**: For CSV data preview in import dialog
- **Alert**: Display validation errors and import warnings

**Customizations**:
- **Upload Zone**: Custom dashed border component with hover state for CSV drag-and-drop area
- **Metric Display Grid**: Custom layout showing performance metrics with icons and formatted numeric values
- **Comparison Metric Card**: Side-by-side metric display with delta calculation and visual indicator (↑/↓)

**States**:
- **Buttons**: Distinct hover (brightness increase), active (subtle scale), disabled (reduced opacity), focus (accent ring)
- **Cards**: Default shadow, hover (elevated shadow), selected (accent border with glow), disabled (grayscale)
- **Inputs**: Default border, focus (accent border with ring), error (destructive border), filled (subtle background)
- **File Upload Zone**: Default dashed border, hover (accent border), active drag-over (accent background tint)

**Icon Selection** (Phosphor Icons):
- **Plus**: Add new benchmark (bold weight)
- **FileArrowDown**: CSV import action (bold weight)
- **MagnifyingGlass**: Search functionality
- **ArrowsLeftRight**: Comparison action
- **ChartBar**: Empty state and branding
- **UploadSimple**: File upload zone
- **CheckCircle**: Success states (fill weight)
- **WarningCircle**: Error states (fill weight)
- **X**: Close/remove actions
- **Trash**: Delete benchmark
- **PencilSimple**: Edit action

**Spacing**:
- Container padding: p-4 (mobile), p-6 (desktop)
- Card gaps: gap-4
- Form field spacing: space-y-4
- Section spacing: space-y-6
- Grid gaps: gap-4
- Metric grid: grid-cols-2 md:grid-cols-3

**Mobile**:
- Single-column layout for benchmark cards
- Stacked form fields (no grid)
- Full-width dialogs with reduced padding
- Simplified comparison view (vertical stacking instead of side-by-side)
- Touch-optimized button sizes (min 44px height)
- Collapsible search on mobile with icon trigger
- Tab list scrolls horizontally if needed
