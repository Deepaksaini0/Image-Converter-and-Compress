# Design Guidelines: SEO Auditing SaaS Platform

## Design Approach
**Hybrid System:** Drawing from Linear's typography clarity, Stripe's professional restraint, and Material Design's data visualization components. Optimized for dashboard efficiency with clean information hierarchy.

## Typography System
- **Primary Font:** Inter (Google Fonts) - exceptional clarity for data-heavy interfaces
- **Monospace Font:** JetBrains Mono - for code snippets and HTML output
- **Scale:**
  - Hero/Display: text-5xl to text-6xl, font-bold
  - Section Headers: text-3xl to text-4xl, font-semibold
  - Card Titles: text-xl, font-semibold
  - Body: text-base, font-normal
  - Small/Meta: text-sm, font-medium
  - Code blocks: text-sm, font-mono

## Layout & Spacing
**Spacing Units:** Consistently use 4, 6, 8, 12, 16, 24 (p-4, mb-6, gap-8, py-12, px-16, mt-24)
**Container Strategy:**
- Marketing pages: max-w-7xl with px-6
- Dashboard areas: Full-width with internal max-w-screen-2xl
- Content sections: max-w-4xl for optimal readability

## Component Library

### Navigation
**Top Navigation Bar:**
- Fixed header with logo left, main nav center, CTA + user menu right
- Height: h-16, backdrop-blur effect
- Items: Products, Features, Pricing, Docs, Blog

### Hero Section (Landing Page)
**Layout:** Two-column asymmetric split (40% text / 60% visual)
- Left: Headline, subheading, dual CTA buttons (primary + secondary), trust indicators (customer count)
- Right: Large hero image showing dashboard preview/SEO analytics visualization
- Height: min-h-screen with proper content padding
- Buttons on image: Implement glassmorphism backdrop-blur-md with semi-transparent backgrounds

### Dashboard Components

**Sidebar Navigation:**
- Width: w-64, collapsible to w-16
- Sections: Dashboard, Site Audits, Tools (with Text-to-HTML subsection), Reports, Settings
- Icons: Heroicons (use CDN)

**SEO Audit Cards:**
- Grid layout: grid-cols-1 md:grid-cols-2 lg:grid-cols-3
- Each card: Metric title, large number display, trend indicator, sparkline chart placeholder
- Padding: p-6, rounded-xl borders

**Text-to-HTML Converter Interface:**
- Split-pane layout (50/50 on desktop, stacked mobile)
- Left pane: Textarea input with toolbar (paste, clear, formatting options)
- Right pane: Live HTML preview with code syntax highlighting
- Action bar between panes: Convert button, copy HTML, download options

**Data Tables:**
- Sticky header row
- Alternating row backgrounds for scannability
- Column sorting indicators
- Action buttons (view, edit) right-aligned per row
- Pagination footer

### Feature Sections (Landing)

**3-Column Feature Grid:**
- Icons top, title, description, "Learn more" link
- Features: Site Crawler, Keyword Analysis, Text-to-HTML, Performance Metrics, Backlink Checker, Report Generator

**2-Column Tools Showcase:**
- Left: Tool screenshot/preview
- Right: Description, bullet points, CTA
- Alternate image/text positions for each tool

**Testimonials:**
- 3-column grid with customer photo (circular), quote, name, company
- Include company logos row below

### Forms & Inputs
**Consistent Input Style:**
- Height: h-12 for text inputs
- Padding: px-4
- Border radius: rounded-lg
- Labels: text-sm, font-medium, mb-2
- Focus states: Prominent focus ring
- Validation: Inline error messages below inputs

**CTA Buttons:**
- Primary: Large (h-12 px-8), bold text
- Secondary: Same size, alternative treatment
- Spacing between: gap-4

## Icons
**Library:** Heroicons (CDN)
**Usage:** All navigation, feature cards, data table actions, form icons from Heroicons solid/outline variants

## Images Section

**Hero Image (Landing Page):**
- Description: Modern dashboard interface screenshot showing SEO metrics, colorful data visualizations, clean graphs and audit scores
- Placement: Right side of hero section, taking 60% width
- Treatment: Subtle elevation shadow, slight tilt (rotate-1), rounded corners

**Tool Preview Images:**
- Description: Interface screenshots of Text-to-HTML converter showing split-pane layout, SEO crawler results with data tables, keyword analysis charts
- Placement: Alternating left/right in tools showcase section
- Treatment: Browser window frame mockup style, subtle shadows

**Customer Logos:**
- Description: Grayscale company logos (SaaS companies, agencies, enterprises)
- Placement: Below hero as trust bar, in testimonials section
- Treatment: Opacity-60, evenly spaced grid

## Dashboard Layout Specifications
**Grid Structure:** 12-column responsive grid with gaps of gap-6
**Card Elevations:** Subtle shadows, no heavy drop-shadows
**Sidebar-Content Split:** Sidebar (fixed w-64) + Main content (flex-1 with max-width constraints)
**Responsive Breakpoints:** Mobile-first, stack at md:, full layout at lg:

## Animation Guidelines
**Minimal & Purposeful:**
- Page transitions: Subtle fade-ins only
- Hover states: Scale transforms for cards (scale-105), no color transitions needed
- Loading states: Skeleton screens for data tables, spinner for conversions
- NO scroll-triggered animations, parallax, or decorative motion