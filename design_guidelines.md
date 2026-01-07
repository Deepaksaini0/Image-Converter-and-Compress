# Design Guidelines: SEO Auditing SaaS Platform with Email Signature Generator

## Design Approach
**Hybrid System:** Linear's typography clarity + Stripe's professional restraint + Material Design's data visualization. Enhanced with minimalist email signature aesthetics drawing from professional corporate identity systems.

## Typography System
- **Primary Font:** Inter (Google Fonts) - exceptional clarity for data-heavy interfaces and signature text
- **Monospace Font:** JetBrains Mono - for code snippets, HTML output, and signature code blocks
- **Scale:**
  - Display: text-5xl to text-6xl, font-bold
  - Section Headers: text-3xl to text-4xl, font-semibold
  - Card Titles: text-xl, font-semibold
  - Body: text-base, font-normal
  - Signature Names: text-lg to text-2xl, font-semibold
  - Signature Titles/Roles: text-sm, font-medium
  - Meta/Contact Info: text-xs to text-sm, font-normal
  - Code blocks: text-sm, font-mono

## Layout & Spacing
**Spacing Units:** 4, 6, 8, 12, 16, 24 (p-4, mb-6, gap-8, py-12, px-16, mt-24)
**Container Strategy:**
- Marketing pages: max-w-7xl with px-6
- Dashboard areas: Full-width with internal max-w-screen-2xl
- Signature editor: max-w-5xl centered
- Preview panes: max-w-2xl

## Component Library

### Navigation
**Top Navigation Bar:**
- Fixed header (h-16), backdrop-blur effect
- Logo left, main nav center: Products, Features, Pricing, Docs, Blog
- Right: CTA + user menu
- Icons: Heroicons via CDN

**Sidebar Navigation (Dashboard):**
- Width: w-64, collapsible to w-16
- Sections: Dashboard, Site Audits, Tools (Text-to-HTML, Email Signature Generator), Reports, Settings
- Active state indicators for current tool

### Hero Section (Landing Page)
**Layout:** Asymmetric two-column (40% text / 60% visual)
- Left: Bold headline emphasizing "Professional SEO + Brand Tools", subheading, dual CTAs (primary "Start Free Trial" + secondary "View Demo"), trust indicators ("10,000+ professionals")
- Right: Hero image showing dashboard with SEO metrics AND signature preview overlay
- Height: min-h-screen with py-24 padding
- CTA buttons on image: Glassmorphism backdrop-blur-md treatment

### Email Signature Generator Interface

**Template Selection Grid:**
- 3-column grid (grid-cols-1 md:grid-cols-2 lg:grid-cols-3) with gap-6
- Each template card: Preview thumbnail, template name, "Use Template" button
- Templates: Minimal (text-only), Classic (with divider lines), Modern (with icons), Corporate (with headshot), Bold (accent color bar), Executive (with logo)
- Hover state: Card elevation with scale-105

**Signature Editor (Split-Pane Layout):**
- Left Panel (40%): Customization form with sections:
  - Personal Info: Name, Title, Company, Department fields (h-12 inputs)
  - Contact Details: Phone, Email, Website inputs with icon prefixes
  - Social Links: LinkedIn, Twitter, GitHub toggles with URL inputs
  - Visual Options: Headshot upload area, logo upload, accent color picker
  - Typography: Font selector dropdown, size controls
- Right Panel (60%): Live signature preview with pixel-perfect rendering, white background card with p-8, border for email context simulation
- Bottom Action Bar: "Copy HTML", "Copy Outlook Format", "Download Image", "Save Template" buttons in row with gap-4

**Template Preview Cards:**
- Clean white backgrounds with subtle borders
- Actual signature rendering at scale
- Typography hierarchy clearly visible
- Contact info with proper icon alignment (Heroicons)
- Divider lines where appropriate (border-t, border-gray-300)

### SEO Dashboard Components

**Audit Cards Grid:** grid-cols-1 md:grid-cols-2 lg:grid-cols-3, each card with metric title, large number display, trend indicator, sparkline placeholder, p-6, rounded-xl

**Text-to-HTML Converter:** Split-pane (50/50 desktop, stacked mobile), left textarea input with toolbar, right HTML preview with syntax highlighting, action bar with Convert/Copy/Download buttons

**Data Tables:** Sticky headers, alternating row backgrounds, column sorting, action buttons right-aligned, pagination footer

### Landing Page Sections

**4-Column Feature Grid:**
- Features: Site Crawler, Keyword Analysis, Text-to-HTML, Email Signature Generator, Performance Metrics, Backlink Checker, Report Generator, Brand Consistency Tools
- Each card: Heroicons icon top, title (text-xl), description (3-4 lines), "Learn more" link
- Grid: grid-cols-1 md:grid-cols-2 lg:grid-cols-4 with gap-8

**Tools Showcase (2-Column Alternating):**
- Row 1: SEO Crawler screenshot left, description + bullets right
- Row 2: Email Signature editor screenshot right, description + bullets left
- Row 3: Text-to-HTML interface left, description + bullets right
- Each tool CTA button below description

**Testimonials:** 3-column grid, customer circular photo, quote, name, company, with company logos row below (opacity-60, grayscale)

**Pricing Section:** 3-column card comparison (Starter, Professional, Enterprise) with feature lists, prominent pricing, CTA buttons

### Forms & Inputs
- Text inputs: h-12, px-4, rounded-lg
- Labels: text-sm, font-medium, mb-2
- File uploads: Dashed border dropzone with "Upload" text and file icon
- Color picker: Custom input with color swatch preview
- Dropdowns: Consistent h-12 height with chevron icon
- Primary buttons: h-12, px-8, font-semibold
- Secondary buttons: Same size, alternative treatment
- Focus rings: Prominent on all interactive elements

## Images Section

**Hero Image (Landing):**
- Dashboard screenshot showing SEO analytics with floating signature preview card overlay in corner
- Placement: Right side (60% width)
- Treatment: Subtle shadow, slight tilt (rotate-1), rounded-xl

**Email Signature Template Previews:**
- 6 professional signature layout screenshots showing different styles
- Placement: Template selection grid
- Treatment: White backgrounds, actual rendered signatures, border for definition

**Tool Interface Screenshots:**
- Signature editor showing split-pane with form + live preview
- Text-to-HTML converter interface
- SEO crawler data table results
- Placement: Alternating in tools showcase section
- Treatment: Browser window mockup frames, subtle shadows

**Trust Indicators:**
- Company logos (grayscale, opacity-60) below hero
- Customer headshots in testimonials (circular w-16 h-16)

## Dashboard Layout
**Grid:** 12-column responsive with gap-6
**Sidebar-Content:** Fixed sidebar (w-64) + flex-1 main content
**Card Elevations:** Subtle shadows, rounded-xl borders
**Responsive:** Mobile-first, stack at md:, full layout at lg:

## Animation Guidelines
**Minimal & Purposeful:**
- Card hover: scale-105 transform
- Loading states: Skeleton screens for tables, spinners for conversions
- Button states: Built-in hover/active (no custom interactions on blurred buttons)
- NO scroll animations, parallax, or decorative motion