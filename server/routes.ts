import type { Express } from "express";
import type { Server } from "http";
import multer from "multer";
import sharp from "sharp";
import archiver from "archiver";
import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import { api } from "@shared/routes";
import { conversionOptionsSchema, processRequestSchema, mergeRequestSchema, formats } from "@shared/schema";
import { z } from "zod";

// Setup directories
const UPLOADS_DIR = path.join(process.cwd(), "uploads");
const OUTPUT_DIR = path.join(process.cwd(), "output");

if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR);
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR);

// Configure Multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOADS_DIR);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // Serve static files from uploads and output
  app.use('/uploads', (req, res, next) => {
    // Basic security: prevent directory traversal
    if (req.path.includes('..')) return res.status(403).send('Forbidden');
    const filePath = path.join(UPLOADS_DIR, req.path);
    if (fs.existsSync(filePath)) {
      res.sendFile(filePath);
    } else {
      next();
    }
  });

  app.use('/output', (req, res, next) => {
    if (req.path.includes('..')) return res.status(403).send('Forbidden');
    const filePath = path.join(OUTPUT_DIR, req.path);
    if (fs.existsSync(filePath)) {
      res.sendFile(filePath);
    } else {
      next();
    }
  });

  // Upload Endpoint
  app.post(api.upload.path, upload.array('files'), (req, res) => {
    if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
      return res.status(400).json({ message: "No files uploaded" });
    }

    const files = (req.files as Express.Multer.File[]).map(file => ({
      id: file.filename,
      originalName: file.originalname,
      filename: file.filename,
      mimeType: file.mimetype,
      size: file.size,
      url: `/uploads/${file.filename}`
    }));

    res.json(files);
  });

  // Process Endpoint
  app.post(api.process.path, async (req, res) => {
    try {
      const { fileIds, options } = processRequestSchema.parse(req.body);
      const results = [];
      const zipName = `batch-${Date.now()}.zip`;
      const zipPath = path.join(OUTPUT_DIR, zipName);
      const outputStream = fs.createWriteStream(zipPath);
      const archive = archiver('zip', { zlib: { level: 9 } });

      archive.pipe(outputStream);

      for (const fileId of fileIds) {
        const inputPath = path.join(UPLOADS_DIR, fileId);
        if (!fs.existsSync(inputPath)) continue;

        const originalStats = fs.statSync(inputPath);
        
        // Base Sharp instance
        let pipeline = sharp(inputPath);

        // Watermark
        if (options.watermarkText) {
          const metadata = await pipeline.metadata();
          const width = metadata.width || 1000;
          const height = metadata.height || 1000;
          
          // Simple SVG text watermark
          const fontSize = Math.floor(width * 0.05);
          const svgImage = `
            <svg width="${width}" height="${height}">
              <style>
                .title { fill: rgba(255, 255, 255, ${options.watermarkOpacity}); font-size: ${fontSize}px; font-weight: bold; }
              </style>
              <text x="95%" y="95%" text-anchor="end" class="title">${options.watermarkText}</text>
            </svg>
          `;
          
          pipeline = pipeline.composite([{
            input: Buffer.from(svgImage),
            top: 0,
            left: 0,
          }]);
        }

        // Keep metadata?
        if (options.keepMetadata) {
          pipeline = pipeline.withMetadata();
        }

        const format = options.format as keyof sharp.FormatEnum;
        let outputBuffer: Buffer;
        let finalQuality = options.quality;

        // Smart Compression (Binary Search)
        if (options.targetSizeKB) {
          const targetBytes = options.targetSizeKB * 1024;
          let minQ = 1;
          let maxQ = 100;
          let bestBuffer: Buffer | null = null;

          // Simple binary search for quality
          // Limit iterations to avoid timeout
          for (let i = 0; i < 7; i++) {
            const midQ = Math.floor((minQ + maxQ) / 2);
            const buffer = await pipeline
              .clone()
              .toFormat(format, { quality: midQ })
              .toBuffer();

            if (buffer.length <= targetBytes) {
              bestBuffer = buffer;
              finalQuality = midQ;
              minQ = midQ + 1; // Try higher quality
            } else {
              maxQ = midQ - 1; // Needs lower quality
            }
          }

          // If we couldn't meet target, use the smallest we found (minQ=1 usually)
          // or just the last attempt? bestBuffer contains the valid one.
          // If bestBuffer is null, it means even Q=1 is too big, use Q=1.
          if (!bestBuffer) {
             outputBuffer = await pipeline.toFormat(format, { quality: 1 }).toBuffer();
          } else {
             outputBuffer = bestBuffer;
          }

        } else {
          // Normal conversion
          outputBuffer = await pipeline
            .toFormat(format, { quality: options.quality })
            .toBuffer();
        }

        // Save output
        const outputFilename = `processed-${path.parse(fileId).name}.${format}`;
        const outputPath = path.join(OUTPUT_DIR, outputFilename);
        fs.writeFileSync(outputPath, outputBuffer);

        // Add to ZIP
        archive.file(outputPath, { name: outputFilename });

        // Add to results
        results.push({
          id: fileId,
          url: `/output/${outputFilename}`,
          filename: outputFilename,
          originalSize: originalStats.size,
          newSize: outputBuffer.length,
          format: format,
          width: 0, // could get from metadata if needed
          height: 0
        });
      }

      await archive.finalize();

      res.json({
        results,
        zipUrl: `/output/${zipName}`
      });

    } catch (error) {
      console.error("Processing error:", error);
      res.status(500).json({ message: "Error processing images" });
    }
  });

  // Merge Endpoint
  app.post(api.merge.path, async (req, res) => {
    try {
      const { fileIds, options } = mergeRequestSchema.parse(req.body);

      if (fileIds.length < 2) {
        return res.status(400).json({ message: "Need at least 2 images to merge" });
      }

      // Load all images
      const images = await Promise.all(
        fileIds.map(async (fileId) => {
          const inputPath = path.join(UPLOADS_DIR, fileId);
          if (!fs.existsSync(inputPath)) return null;
          const data = await sharp(inputPath).toBuffer();
          const metadata = await sharp(data).metadata();
          return { data, metadata, fileId };
        })
      );

      const validImages = images.filter((img) => img !== null);
      if (validImages.length < 2) {
        return res.status(400).json({ message: "Not enough valid images to merge" });
      }

      let merged: sharp.Sharp;
      const spacing = options.spacing || 0;
      const bgColor = options.backgroundColor || "#ffffff";

      if (options.direction === "horizontal") {
        // Horizontal merge
        const totalWidth = validImages.reduce((sum, img) => sum + (img.metadata.width || 0) + spacing, -spacing);
        const maxHeight = Math.max(...validImages.map((img) => img.metadata.height || 0));

        const composites: sharp.OverlayOptions[] = [];
        let currentX = 0;

        for (const img of validImages) {
          composites.push({
            input: img.data,
            left: currentX,
            top: Math.floor(((maxHeight || 0) - (img.metadata.height || 0)) / 2),
          });
          currentX += (img.metadata.width || 0) + spacing;
        }

        merged = sharp({
          create: {
            width: totalWidth,
            height: maxHeight || 100,
            channels: 3,
            background: bgColor,
          },
        }).composite(composites);
      } else if (options.direction === "vertical") {
        // Vertical merge
        const maxWidth = Math.max(...validImages.map((img) => img.metadata.width || 0));
        const totalHeight = validImages.reduce((sum, img) => sum + (img.metadata.height || 0) + spacing, -spacing);

        const composites: sharp.OverlayOptions[] = [];
        let currentY = 0;

        for (const img of validImages) {
          composites.push({
            input: img.data,
            left: Math.floor(((maxWidth || 0) - (img.metadata.width || 0)) / 2),
            top: currentY,
          });
          currentY += (img.metadata.height || 0) + spacing;
        }

        merged = sharp({
          create: {
            width: maxWidth || 100,
            height: totalHeight,
            channels: 3,
            background: bgColor,
          },
        }).composite(composites);
      } else {
        // Grid merge (2x2 or more)
        const cols = Math.ceil(Math.sqrt(validImages.length));
        const maxWidth = Math.max(...validImages.map((img) => img.metadata.width || 0));
        const maxHeight = Math.max(...validImages.map((img) => img.metadata.height || 0));

        const composites: sharp.OverlayOptions[] = [];
        validImages.forEach((img, index) => {
          const col = index % cols;
          const row = Math.floor(index / cols);
          composites.push({
            input: img.data,
            left: col * (maxWidth + spacing),
            top: row * (maxHeight + spacing),
          });
        });

        merged = sharp({
          create: {
            width: cols * (maxWidth + spacing) - spacing,
            height: Math.ceil(validImages.length / cols) * (maxHeight + spacing) - spacing,
            channels: 3,
            background: bgColor,
          },
        }).composite(composites);
      }

      const format = options.format as keyof sharp.FormatEnum;
      const outputBuffer = await merged.toFormat(format, { quality: options.quality }).toBuffer();

      const outputFilename = `merged-${Date.now()}.${format}`;
      const outputPath = path.join(OUTPUT_DIR, outputFilename);
      fs.writeFileSync(outputPath, outputBuffer);

      const metadata = await sharp(outputBuffer).metadata();

      // Generate PDF version
      const pdfFilename = `merged-${Date.now()}.pdf`;
      const pdfPath = path.join(OUTPUT_DIR, pdfFilename);
      const doc = new PDFDocument({
        size: [metadata.width || 800, metadata.height || 600],
        margins: 0
      });

      const pdfStream = fs.createWriteStream(pdfPath);
      doc.pipe(pdfStream);

      doc.image(outputBuffer, 0, 0, {
        width: metadata.width,
        height: metadata.height
      });

      doc.end();

      await new Promise((resolve, reject) => {
        pdfStream.on('finish', resolve);
        pdfStream.on('error', reject);
      });

      res.json({
        url: `/output/${outputFilename}`,
        filename: outputFilename,
        originalSize: validImages.reduce((sum, img) => sum + (img.metadata.size || 0), 0),
        newSize: outputBuffer.length,
        width: metadata.width || 0,
        height: metadata.height || 0,
        pdfUrl: `/output/${pdfFilename}`,
        pdfFilename: pdfFilename,
      });
    } catch (error) {
      console.error("Merge error:", error);
      res.status(500).json({ message: "Error merging images" });
    }
  });

  // Cleanup task: Remove files older than 30 minutes
  const CLEANUP_INTERVAL = 5 * 60 * 1000; // Check every 5 minutes
  const MAX_AGE = 30 * 60 * 1000; // 30 minutes

  setInterval(() => {
    console.log("Running cleanup task...");
    const now = Date.now();

    const cleanupDir = (dir: string) => {
      fs.readdir(dir, (err, files) => {
        if (err) return console.error(`Error reading ${dir}:`, err);

        files.forEach(file => {
          const filePath = path.join(dir, file);
          fs.stat(filePath, (err, stats) => {
            if (err) return;
            if (now - stats.mtimeMs > MAX_AGE) {
              fs.unlink(filePath, err => {
                if (err) console.error(`Error deleting ${file}:`, err);
                else console.log(`Deleted old file: ${file}`);
              });
            }
          });
        });
      });
    };

    cleanupDir(UPLOADS_DIR);
    cleanupDir(OUTPUT_DIR);
  }, CLEANUP_INTERVAL);

  return httpServer;
}
