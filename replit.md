# Image Convert & Compress

## Overview

A comprehensive web application for image processing that supports conversion between formats, compression with quality control, merging multiple images, watermarking, and PDF export. The app uses Sharp for server-side image processing, providing high-quality results that browser-based solutions cannot match.

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

### API Structure
All API endpoints are defined in `shared/routes.ts` with Zod validation:
- `POST /api/upload` - Upload multiple files
- `POST /api/process` - Convert/compress images with options
- `POST /api/merge` - Merge multiple images into one
- `POST /api/convert-document` - Convert between document formats

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