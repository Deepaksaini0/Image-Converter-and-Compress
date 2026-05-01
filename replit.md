# Image Convert & Compress + SEO Tools

## Overview

A comprehensive web application combining image processing (conversion, compression, merging, watermarking, PDF export) with a full SEO tools suite (25+ tools) and an AI-powered free SEO audit landing page. The app uses Sharp for server-side image processing and OpenAI GPT-4 for AI features.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack React Query for server state, React useState for local state
- **Styling**: Tailwind CSS with shadcn/ui component library (New York style)
- **Animations**: Framer Motion for smooth transitions and micro-interactions
- **Build Tool**: Vite with React plugin

The frontend is a single-page application with three main modes:
1. **Convert Mode**: Format conversion and compression with quality slider
2. **Merge Mode**: Combine multiple images (horizontal, vertical, or grid layout)
3. **Document Mode**: Convert between document formats (PDF, XLSX, CSV, DOCX)

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Image Processing**: Sharp library for all image operations (conversion, compression, merging, watermarking)
- **File Upload**: Multer with disk storage to `uploads/` directory
- **PDF Generation**: PDFKit for creating PDF documents from images
- **Document Processing**: XLSX library for spreadsheet handling, pdf-parse for PDF reading
- **Archive Creation**: Archiver for ZIP file generation

### Pages / Routes
- `/` — Image Convert & Compress (Home)
- `/free-seo-audit` — AI-Powered Free SEO Audit (lead gen page)
- `/seo-audit` — Full SEO Audit Dashboard (25+ tools)
- `/seo-tools` — SEO Utility Tools (same tools, different layout)
- `/text-to-html` — Text to HTML converter
- `/web-tools` — Web utility tools
- `/faq` — FAQ page

### API Structure
Image processing:
- `POST /api/upload` - Upload multiple files
- `POST /api/process` - Convert/compress images with options
- `POST /api/merge` - Merge multiple images into one
- `POST /api/convert-document` - Convert between document formats
- `POST /api/image/remove-watermark` - Blur/lighten/darken a selected region

SEO tools (all under `/api/seo/`):
- `POST /api/seo-audit` - Full site crawl SEO audit (up to 1000 pages)
- `POST /api/seo/ai-full-audit` - AI-powered audit (5 pages, GPT-4 insights, downloadable report)
- `POST /api/seo/page-speed` - PageSpeed Insights via Google API
- `POST /api/seo/rank-check` - Keyword rank checking
- `POST /api/seo/broken-links` - Broken link checker
- `POST /api/seo/readability` - Readability score
- `POST /api/seo/ai-meta-tags` - AI meta tag generator
- `GET  /api/seo/core-web-vitals` - Core Web Vitals
- `POST /api/seo/word-count` - Word count checker
- `POST /api/seo/keyword-gap` - Competitor keyword gap analysis
- `POST /api/seo/content-match` - Content vs URL match tool
- `POST /api/seo/slug-generator` - URL slug generator
- `POST /api/seo/social-preview` - Social preview checker
- …and more

### Data Flow
1. Files uploaded via Multer → saved to `uploads/` directory
2. Processing requests reference uploaded files by ID
3. Sharp processes images → outputs saved to `output/` directory
4. Temporary files cleaned up after 30 minutes

### Database
- PostgreSQL with Drizzle ORM configured but minimally used
- Schema defined in `shared/schema.ts` primarily for Zod validation schemas
- The application is largely stateless - no persistent user data required

## External Dependencies

### Core Processing Libraries
- **Sharp**: High-performance image processing (format conversion, resizing, compression, compositing)
- **PDFKit**: PDF document generation
- **pdf-parse**: PDF text extraction
- **XLSX**: Excel/spreadsheet file handling
- **Archiver**: ZIP file creation for batch downloads

### Frontend Libraries
- **@tanstack/react-query**: Async state management and API caching
- **@radix-ui/***: Accessible UI primitives (dialogs, sliders, selects, tabs, etc.)
- **framer-motion**: Animation library
- **bytes**: Human-readable file size formatting
- **wouter**: Lightweight client-side routing

### Database & Infrastructure
- **PostgreSQL**: Database (configured via DATABASE_URL environment variable)
- **Drizzle ORM**: Database queries and schema management
- **Multer**: Multipart form data handling for file uploads

### Build & Development
- **Vite**: Frontend bundler with HMR
- **esbuild**: Server bundling for production
- **tsx**: TypeScript execution for development