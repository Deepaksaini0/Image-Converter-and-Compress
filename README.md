![image compress](https://github.com/user-attachments/assets/d080aca1-a3a4-4c10-b4f7-db612a4670c7)



# Image Convert & Compress

A comprehensive web application for image conversion, compression, merging, and PDF export with an intuitive user interface.

## Features

### 🔄 Image Conversion
- Convert between multiple image formats: JPEG, PNG, WebP, AVIF, and more
- Preserve image quality during conversion
- Batch convert multiple images at once

### 📉 Image Compression
- Compress images with adjustable quality control
- Real-time preview of compression results
- Support for all major image formats
- Visual quality comparison

### 🎨 Image Merge
- Merge multiple images in three layout modes:
  - **Horizontal**: Stack images side-by-side
  - **Vertical**: Stack images top-to-bottom
  - **Grid**: Arrange images in a grid layout
- Customizable spacing between images
- Choose background color for merged areas
- Support for 2+ images per merge

### 📄 PDF Export
- Export merged images as PDF documents
- Full-resolution image embedding
- Perfect for sharing and printing
- Automatic PDF generation alongside image export

### 💧 Watermark
- Add text watermarks to images
- Customize watermark text and opacity
- Position watermark on images
- Easy removal with dedicated button

### 🏷️ Additional Features
- Drag-and-drop file upload
- Real-time image previews
- Download individual processed images
- Automatic cleanup of temporary files (30 minutes)
- Responsive design for all devices

## Supported Image Formats

**Input Formats:**
- JPEG / JPG
- PNG
- WebP
- AVIF
- TIFF
- BMP
- And more

**Output Formats:**
- JPEG
- PNG
- WebP
- AVIF

## How to Use

### Converting Images
1. Click the **Convert** tab
2. Upload one or more images
3. Select your desired output format
4. Adjust quality if needed
5. Click "Convert" and download

### Compressing Images
1. Click the **Compress** tab
2. Upload your image(s)
3. Adjust the quality slider (0-100)
4. Preview the compression results
5. Download the compressed image

### Merging Images
1. Click the **Merge** tab
2. Upload 2 or more images
3. Choose a layout mode (Horizontal, Vertical, or Grid)
4. Adjust spacing and background color
5. Click "Merge Images"
6. Download as image or PDF

### Adding Watermarks
1. Click the **Watermark** tab
2. Upload an image
3. Enter your watermark text
4. Adjust opacity if needed
5. Click "Apply Watermark"
6. Download or remove and try again

## Technical Stack

**Frontend:**
- React with TypeScript
- TailwindCSS for styling
- Shadcn UI components
- TanStack React Query for data management
- Wouter for routing

**Backend:**
- Express.js
- Sharp for image processing
- PDFKit for PDF generation
- Multer for file uploads
- Zod for validation

**Database:**
- PostgreSQL for data persistence
- Drizzle ORM for type-safe database queries

## Getting Started

### Installation
```bash
npm install
```

### Development
```bash
npm run dev
```

The application will start on `http://localhost:5000`

### Build
```bash
npm run build
```

## Project Structure

```
├── client/src/
│   ├── pages/           # Application pages
│   ├── components/      # React components
│   ├── hooks/          # Custom React hooks
│   └── lib/            # Utility functions
├── server/
│   ├── routes.ts       # API endpoints
│   ├── storage.ts      # Data storage interface
│   └── index.ts        # Server setup
├── shared/
│   └── schema.ts       # Shared data types
└── public/
    └── uploads/        # Temporary file storage
```

## API Endpoints

- `POST /api/upload` - Upload images
- `POST /api/convert` - Convert images between formats
- `POST /api/compress` - Compress images
- `POST /api/merge` - Merge multiple images
- `POST /api/watermark` - Add watermarks to images
- `GET /uploads/*` - Access uploaded files
- `GET /output/*` - Access processed images

## Privacy & Security

- All files are processed locally on the server
- Temporary files are automatically deleted after 30 minutes
- No images are stored permanently
- Files are not shared with third parties

## Browser Compatibility

- Chrome/Edge (recommended)
- Firefox
- Safari
- Modern browsers with ES6+ support

## License

MIT License - See LICENSE file for details

## Support

For issues, feature requests, or questions, please create an issue on the project repository.

---

**Version**: 1.0.0  
**Last Updated**: December 2025
