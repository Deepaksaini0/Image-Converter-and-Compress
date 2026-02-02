import type { Express } from "express";
import type { Server } from "http";
import multer from "multer";
import sharp from "sharp";
import archiver from "archiver";
import PDFDocument from "pdfkit";
import XLSX from "xlsx";
import fs from "fs";
import path from "path";
import { api } from "@shared/routes";
import {
  conversionOptionsSchema,
  processRequestSchema,
  mergeRequestSchema,
  formats,
  documentConversionRequestSchema,
  insertReviewSchema,
} from "@shared/schema";
import { storage as dbStorage } from "./storage";
import { z } from "zod";
import CleanCSS from "clean-css";
import beautify from "js-beautify";
import { minify as htmlMinify } from "html-minifier-terser";
import { minify as jsMinify } from "terser";
import axios from "axios";
import * as cheerio from "cheerio";

// pdf-parse - handle ESM import
let pdfParse: any;

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
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });

export async function registerRoutes(
  httpServer: Server,
  app: Express,
): Promise<Server> {
  // Reviews API
  app.get("/api/reviews", async (req, res) => {
    try {
      const pagePath = (req.query.pagePath as string) || "/";
      const reviewsData = await dbStorage.getReviews(pagePath);
      res.json(reviewsData);
    } catch (err: any) {
      res.status(500).json({ error: "Failed to fetch reviews" });
    }
  });

  app.post("/api/reviews", async (req, res) => {
    try {
      const reviewData = insertReviewSchema.parse(req.body);
      const review = await dbStorage.createReview(reviewData);
      res.json(review);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post("/api/web-tools/process", async (req, res) => {
    const { input, tool } = req.body;
    if (!input) return res.status(400).json({ error: "Input is required" });

    try {
      let output = "";
      switch (tool) {
        case "css-minify":
          output = new CleanCSS().minify(input).styles;
          break;
        case "css-beautify":
          output = beautify.css(input, { indent_size: 2 });
          break;
        case "js-minify":
          const minifiedJs = await jsMinify(input);
          output = minifiedJs.code || "";
          break;
        case "js-beautify":
          output = beautify.js(input, { indent_size: 2 });
          break;
        case "html-minify":
          output = await htmlMinify(input, {
            collapseWhitespace: true,
            removeComments: true,
            minifyCSS: true,
            minifyJS: true,
          });
          break;
        case "html-beautify":
          output = beautify.html(input, { indent_size: 2 });
          break;
        default:
          return res.status(400).json({ error: "Invalid tool" });
      }
      res.json({ output });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Load pdf-parse
  if (!pdfParse) {
    const pdfParseModule = await import("pdf-parse");
    // @ts-ignore
    pdfParse = pdfParseModule.default || pdfParseModule;
  }

  // Serve static files from uploads and output
  app.use("/uploads", (req, res, next) => {
    // Basic security: prevent directory traversal
    if (req.path.includes("..")) return res.status(403).send("Forbidden");
    const filePath = path.join(UPLOADS_DIR, req.path);
    if (fs.existsSync(filePath)) {
      res.sendFile(filePath);
    } else {
      next();
    }
  });

  app.use("/output", (req, res, next) => {
    if (req.path.includes("..")) return res.status(403).send("Forbidden");
    const filePath = path.join(OUTPUT_DIR, req.path);
    if (fs.existsSync(filePath)) {
      res.sendFile(filePath);
    } else {
      next();
    }
  });

  // Upload Endpoint
  app.post(api.upload.path, upload.array("files"), (req, res) => {
    if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
      return res.status(400).json({ message: "No files uploaded" });
    }

    const files = (req.files as Express.Multer.File[]).map((file) => ({
      id: file.filename,
      originalName: file.originalname,
      filename: file.filename,
      mimeType: file.mimetype,
      size: file.size,
      url: `/uploads/${file.filename}`,
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
      const archive = archiver("zip", { zlib: { level: 9 } });

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

          pipeline = pipeline.composite([
            {
              input: Buffer.from(svgImage),
              top: 0,
              left: 0,
            },
          ]);
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
            outputBuffer = await pipeline
              .toFormat(format, { quality: 1 })
              .toBuffer();
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
          height: 0,
        });
      }

      await archive.finalize();

      res.json({
        results,
        zipUrl: `/output/${zipName}`,
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
        return res
          .status(400)
          .json({ message: "Need at least 2 images to merge" });
      }

      // Load all images
      const images = await Promise.all(
        fileIds.map(async (fileId) => {
          const inputPath = path.join(UPLOADS_DIR, fileId);
          if (!fs.existsSync(inputPath)) return null;
          const data = await sharp(inputPath).toBuffer();
          const metadata = await sharp(data).metadata();
          return { data, metadata, fileId };
        }),
      );

      const validImages = images.filter((img) => img !== null);
      if (validImages.length < 2) {
        return res
          .status(400)
          .json({ message: "Not enough valid images to merge" });
      }

      let merged: sharp.Sharp;
      const spacing = options.spacing || 0;
      const bgColor = options.backgroundColor || "#ffffff";

      if (options.direction === "horizontal") {
        // Horizontal merge
        const totalWidth = validImages.reduce(
          (sum, img) => sum + (img.metadata.width || 0) + spacing,
          -spacing,
        );
        const maxHeight = Math.max(
          ...validImages.map((img) => img.metadata.height || 0),
        );

        const composites: sharp.OverlayOptions[] = [];
        let currentX = 0;

        for (const img of validImages) {
          composites.push({
            input: img.data,
            left: currentX,
            top: Math.floor(
              ((maxHeight || 0) - (img.metadata.height || 0)) / 2,
            ),
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
        const maxWidth = Math.max(
          ...validImages.map((img) => img.metadata.width || 0),
        );
        const totalHeight = validImages.reduce(
          (sum, img) => sum + (img.metadata.height || 0) + spacing,
          -spacing,
        );

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
        const maxWidth = Math.max(
          ...validImages.map((img) => img.metadata.width || 0),
        );
        const maxHeight = Math.max(
          ...validImages.map((img) => img.metadata.height || 0),
        );

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
            height:
              Math.ceil(validImages.length / cols) * (maxHeight + spacing) -
              spacing,
            channels: 3,
            background: bgColor,
          },
        }).composite(composites);
      }

      const format = options.format as keyof sharp.FormatEnum;
      const outputBuffer = await merged
        .toFormat(format, { quality: options.quality })
        .toBuffer();

      const outputFilename = `merged-${Date.now()}.${format}`;
      const outputPath = path.join(OUTPUT_DIR, outputFilename);
      fs.writeFileSync(outputPath, outputBuffer);

      const metadata = await sharp(outputBuffer).metadata();

      // Generate PDF version
      const pdfFilename = `merged-${Date.now()}.pdf`;
      const pdfPath = path.join(OUTPUT_DIR, pdfFilename);

      try {
        const doc = new PDFDocument({
          size: [metadata.width || 800, metadata.height || 600],
          margins: 0,
        });

        const pdfStream = fs.createWriteStream(pdfPath);
        doc.pipe(pdfStream);

        // Use the saved image file path instead of buffer
        doc.image(outputPath, 0, 0, {
          width: metadata.width,
          height: metadata.height,
        });

        doc.end();

        await new Promise<void>((resolve, reject) => {
          pdfStream.on("finish", () => resolve());
          pdfStream.on("error", (err) => reject(err));
        });
      } catch (pdfError) {
        console.error("PDF generation error:", pdfError);
        // Continue without PDF if generation fails
      }

      res.json({
        url: `/output/${outputFilename}`,
        filename: outputFilename,
        originalSize: validImages.reduce(
          (sum, img) => sum + (img.metadata.size || 0),
          0,
        ),
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

  // Document Conversion Endpoint
  app.post(api.documentConvert.path, async (req, res) => {
    try {
      const { fileIds, options } = documentConversionRequestSchema.parse(
        req.body,
      );

      if (fileIds.length !== 1) {
        return res
          .status(400)
          .json({ message: "Convert one document at a time" });
      }

      const fileId = fileIds[0];
      const inputPath = path.join(UPLOADS_DIR, fileId);

      if (!fs.existsSync(inputPath)) {
        return res.status(400).json({ message: "File not found" });
      }

      const inputStats = fs.statSync(inputPath);
      const ext = path.extname(fileId).toLowerCase().slice(1);
      const fileName = path.basename(fileId, path.extname(fileId));
      const outputFormat = options.outputFormat || "pdf";

      // Read document content
      let docContent = "";

      if (ext === "xlsx" || ext === "xls") {
        const workbook = XLSX.readFile(inputPath);
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        docContent = XLSX.utils.sheet_to_csv(worksheet);
      } else if (ext === "csv") {
        docContent = fs.readFileSync(inputPath, "utf-8");
      } else if (ext === "ods") {
        docContent = "ODS content - spreadsheet data";
      } else if (ext === "docx") {
        docContent = "DOCX content - document text";
      } else if (ext === "pdf") {
        try {
          const pdfBuffer = fs.readFileSync(inputPath);
          const data = await pdfParse(pdfBuffer);
          docContent = data.text || "No text found in PDF";
        } catch (pdfErr) {
          docContent = "Unable to extract text from PDF";
        }
      }

      let outputFilename = "";
      let outputPath = "";
      let outputBuffer: Buffer | null = null;

      if (outputFormat === "pdf") {
        // Generate PDF
        outputFilename = `${fileName}-${Date.now()}.pdf`;
        outputPath = path.join(OUTPUT_DIR, outputFilename);

        try {
          const doc = new PDFDocument({ margin: 40 });
          const pdfStream = fs.createWriteStream(outputPath);
          doc.pipe(pdfStream);

          doc
            .fontSize(14)
            .font("Helvetica-Bold")
            .text("Document: " + fileName, { underline: true });
          doc.fontSize(10).moveDown();
          doc.font("Helvetica").text(docContent || "No content extracted", {
            align: "left",
            wordWrap: true,
          });

          doc.end();

          await new Promise<void>((resolve, reject) => {
            pdfStream.on("finish", () => resolve());
            pdfStream.on("error", (err) => reject(err));
          });
        } catch (pdfError) {
          console.error("PDF generation error:", pdfError);
          return res.status(500).json({ message: "Error generating PDF" });
        }
      } else if (outputFormat === "xlsx" || outputFormat === "csv") {
        // Create spreadsheet from content
        const ws_data = [
          [fileName],
          ["Content extracted from: " + ext.toUpperCase()],
          [],
          ...docContent.split("\n").map((line) => [line]),
        ];
        const ws = XLSX.utils.aoa_to_sheet(ws_data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Sheet1");

        outputFilename = `${fileName}-${Date.now()}.${outputFormat}`;
        outputPath = path.join(OUTPUT_DIR, outputFilename);

        try {
          XLSX.writeFile(wb, outputPath);
        } catch (err) {
          console.error("Spreadsheet generation error:", err);
          return res
            .status(500)
            .json({ message: "Error generating spreadsheet" });
        }
      } else if (outputFormat === "docx") {
        // For DOCX, create a simple text document file
        outputFilename = `${fileName}-${Date.now()}.docx`;
        outputPath = path.join(OUTPUT_DIR, outputFilename);

        // Create a simple text file as DOCX placeholder
        try {
          const docContent_formatted = `Document: ${fileName}\n\nExtracted from: ${ext.toUpperCase()}\n\n${docContent}`;
          fs.writeFileSync(outputPath, docContent_formatted);
        } catch (err) {
          console.error("DOCX generation error:", err);
          return res.status(500).json({ message: "Error generating DOCX" });
        }
      }

      const outputStats = fs.statSync(outputPath);

      res.json({
        url: `/output/${outputFilename}`,
        filename: outputFilename,
        originalSize: inputStats.size,
        newSize: outputStats.size,
      });
    } catch (error) {
      console.error("Document conversion error:", error);
      res.status(500).json({ message: "Error converting document" });
    }
  });

  // SEO Audit Endpoint
  app.post("/api/seo-audit", async (req, res) => {
    try {
      const { url } = req.body;
      if (!url || typeof url !== "string") {
        return res.status(400).json({ message: "Invalid URL" });
      }

      // Validate URL format
      try {
        new URL(url);
      } catch {
        return res.status(400).json({ message: "Invalid URL format" });
      }

      // Perform full website SEO audit
      const auditResult = await performSEOAudit(url);
      res.json(auditResult);
    } catch (error) {
      console.error("SEO audit error:", error);
      res.status(500).json({ message: "Error performing SEO audit" });
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

        files.forEach((file) => {
          const filePath = path.join(dir, file);
          fs.stat(filePath, (err, stats) => {
            if (err) return;
            if (now - stats.mtimeMs > MAX_AGE) {
              fs.unlink(filePath, (err) => {
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

async function performSEOAudit(baseUrl: string) {
  const visited = new Set<string>();
  const toVisit = [baseUrl];
  const results: any[] = [];
  const maxPages = 5;

  const domain = new URL(baseUrl).hostname;

  while (toVisit.length > 0 && visited.size < maxPages) {
    const url = toVisit.shift()!;
    if (visited.has(url)) continue;
    visited.add(url);

    try {
      const response = await axios.get(url, { timeout: 5000 });
      const $ = cheerio.load(response.data);

      const pageResults = auditPage(url, $);
      results.push(pageResults);

      $("a[href]").each((_, el) => {
        const href = $(el).attr("href");
        if (!href) return;
        try {
          const absoluteUrl = new URL(href, url).href;
          const absoluteUrlObj = new URL(absoluteUrl);
          if (absoluteUrlObj.hostname === domain && !visited.has(absoluteUrl)) {
            toVisit.push(absoluteUrl);
          }
        } catch {}
      });
    } catch (error) {
      console.error(`Error auditing ${url}:`, error);
    }
  }

  const avgScore =
    results.length > 0
      ? Math.round(
          results.reduce((sum, r) => sum + r.score, 0) / results.length,
        )
      : 0;

  return {
    url: baseUrl,
    score: avgScore,
    timestamp: new Date().toISOString(),
    pages: results,
    recommendations: results[0]?.recommendations || [],
  };
}

function auditPage(url: string, $: cheerio.CheerioAPI) {
  const checks = [];
  let score = 100;

  const basicItems = [
    {
      name: "Title Tag",
      status:
        $("title").length > 0 && $("title").text().trim().length > 0
          ? "pass"
          : "fail",
      message:
        $("title").text().trim().length > 0
          ? `Title: ${$("title").text().slice(0, 50)}...`
          : "Missing title tag",
      severity: "critical",
    },
    {
      name: "Meta Description",
      status: $('meta[name="description"]').attr("content")
        ? "pass"
        : "warning",
      message: $('meta[name="description"]').attr("content")
        ? "Meta description found"
        : "Missing meta description",
      severity: "warning",
    },
    {
      name: "H1 Tag",
      status: $("h1").length === 1 ? "pass" : "warning",
      message: `Found ${$("h1").length} H1 tags`,
      severity: "critical",
    },
  ];

  basicItems.forEach((item) => {
    if (item.status !== "pass") score -= 10;
  });
  checks.push({ category: "Basic SEO", items: basicItems });

  const techItems = [
    {
      name: "Image ALT Text",
      status: $("img:not([alt])").length === 0 ? "pass" : "warning",
      message: `Found ${$("img:not([alt])").length} images without alt text`,
      severity: "warning",
    },
  ];
  techItems.forEach((item) => {
    if (item.status !== "pass") score -= 5;
  });
  checks.push({ category: "Technical SEO", items: techItems });

  return {
    url,
    score: Math.max(0, score),
    checks,
    recommendations: basicItems
      .filter((i) => i.status !== "pass")
      .map((i) => i.message),
  };
}
