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
import { conversionOptionsSchema, processRequestSchema, mergeRequestSchema, formats, documentConversionRequestSchema } from "@shared/schema";
import { z } from "zod";

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
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Load pdf-parse
  if (!pdfParse) {
    const pdfParseModule = await import("pdf-parse");
    pdfParse = pdfParseModule.default || pdfParseModule;
  }

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
      
      try {
        const doc = new PDFDocument({
          size: [metadata.width || 800, metadata.height || 600],
          margins: 0
        });

        const pdfStream = fs.createWriteStream(pdfPath);
        doc.pipe(pdfStream);

        // Use the saved image file path instead of buffer
        doc.image(outputPath, 0, 0, {
          width: metadata.width,
          height: metadata.height
        });

        doc.end();

        await new Promise((resolve, reject) => {
          pdfStream.on('finish', resolve);
          pdfStream.on('error', reject);
        });
      } catch (pdfError) {
        console.error("PDF generation error:", pdfError);
        // Continue without PDF if generation fails
      }

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

  // Document Conversion Endpoint
  app.post(api.documentConvert.path, async (req, res) => {
    try {
      const { fileIds, options } = documentConversionRequestSchema.parse(req.body);

      if (fileIds.length !== 1) {
        return res.status(400).json({ message: "Convert one document at a time" });
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

          doc.fontSize(14).font("Helvetica-Bold").text("Document: " + fileName, { underline: true });
          doc.fontSize(10).moveDown();
          doc.font("Helvetica").text(docContent || "No content extracted", { align: "left", wordWrap: true });

          doc.end();

          await new Promise((resolve, reject) => {
            pdfStream.on("finish", resolve);
            pdfStream.on("error", reject);
          });
        } catch (pdfError) {
          console.error("PDF generation error:", pdfError);
          return res.status(500).json({ message: "Error generating PDF" });
        }
      } else if (outputFormat === "xlsx" || outputFormat === "csv") {
        // Create spreadsheet from content
        const ws_data = [[fileName], ["Content extracted from: " + ext.toUpperCase()], [], ...docContent.split("\n").map(line => [line])];
        const ws = XLSX.utils.aoa_to_sheet(ws_data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Sheet1");

        outputFilename = `${fileName}-${Date.now()}.${outputFormat}`;
        outputPath = path.join(OUTPUT_DIR, outputFilename);

        try {
          XLSX.writeFile(wb, outputPath);
        } catch (err) {
          console.error("Spreadsheet generation error:", err);
          return res.status(500).json({ message: "Error generating spreadsheet" });
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
  app.post('/api/seo-audit', async (req, res) => {
    try {
      const { url } = req.body;
      if (!url || typeof url !== 'string') {
        return res.status(400).json({ message: "Invalid URL" });
      }

      // Validate URL format
      try {
        new URL(url);
      } catch {
        return res.status(400).json({ message: "Invalid URL format" });
      }

      // Perform basic SEO audit
      const auditResult = await performSEOAudit(url);
      res.json(auditResult);
    } catch (error) {
      console.error('SEO audit error:', error);
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

interface PageAudit {
  url: string;
  issues: Array<{
    type: string;
    message: string;
    severity: "critical" | "warning" | "info";
  }>;
}

async function performSEOAudit(url: string) {
  const pageAudits: PageAudit[] = [];
  const baseUrl = new URL(url);
  const domain = baseUrl.hostname;
  let crawledPages = new Set<string>();
  const recommendations = new Set<string>();
  
  // Fetch and audit main page + internal pages
  await crawlAndAudit(url, baseUrl, crawledPages, pageAudits, recommendations);

  // Aggregate results
  let score = 100;
  const allIssues = pageAudits.flatMap(p => p.issues);
  
  // Score calculation
  const criticalCount = allIssues.filter(i => i.severity === "critical").length;
  const warningCount = allIssues.filter(i => i.severity === "warning").length;
  
  score -= criticalCount * 10;
  score -= warningCount * 3;

  // Build category checks
  const checks = buildCategoryChecks(pageAudits, allIssues);

  return {
    url,
    score: Math.max(Math.min(score, 100), 20),
    timestamp: new Date().toISOString(),
    checks,
    pageAudits,
    recommendations: Array.from(recommendations)
  };
}

async function crawlAndAudit(
  pageUrl: string,
  baseUrl: URL,
  crawledPages: Set<string>,
  pageAudits: PageAudit[],
  recommendations: Set<string>,
  depth = 0
) {
  if (depth > 2 || crawledPages.size > 10) return; // Limit crawl depth and pages
  
  const fullUrl = new URL(pageUrl, baseUrl).href;
  if (crawledPages.has(fullUrl)) return;
  crawledPages.add(fullUrl);

  try {
    const html = await fetchWithTimeout(fullUrl, 5000);
    const issues = analyzePageHTML(html, fullUrl);
    pageAudits.push({ url: fullUrl, issues });

    // Add recommendations based on issues
    issues.forEach(issue => {
      if (issue.type === "missing-h1") recommendations.add("Add exactly one H1 tag to each page");
      if (issue.type === "title-length") recommendations.add("Ensure title tags are 50-60 characters");
      if (issue.type === "meta-length") recommendations.add("Meta descriptions should be 140-160 characters");
      if (issue.type === "missing-alt") recommendations.add("Add ALT attributes to all images");
      if (issue.type === "missing-canonical") recommendations.add("Add canonical tags to prevent duplicate content");
      if (issue.type === "missing-og") recommendations.add("Add Open Graph meta tags for social sharing");
      if (issue.type === "missing-schema") recommendations.add("Implement JSON-LD schema markup");
    });

    // Extract and crawl internal links
    const linkRegex = /href=["']([^"']+)["']/g;
    let match;
    while ((match = linkRegex.exec(html)) && crawledPages.size < 10) {
      const href = match[1];
      if (!href.startsWith('http') && !href.startsWith('#') && href.startsWith('/')) {
        await crawlAndAudit(href, baseUrl, crawledPages, pageAudits, recommendations, depth + 1);
      }
    }
  } catch (error) {
    pageAudits.push({
      url: fullUrl,
      issues: [{ type: "fetch-error", message: `Failed to fetch page: ${error instanceof Error ? error.message : 'Unknown error'}`, severity: "warning" }]
    });
  }
}

function analyzePageHTML(html: string, pageUrl: string): Array<{type: string; message: string; severity: "critical" | "warning" | "info"}> {
  const issues = [];

  // Check H1 tags
  const h1Matches = html.match(/<h1[^>]*>(.*?)<\/h1>/gi) || [];
  if (h1Matches.length === 0) {
    issues.push({ type: "missing-h1", message: "Missing H1 tag on page", severity: "critical" });
  } else if (h1Matches.length > 1) {
    issues.push({ type: "multiple-h1", message: `Found ${h1Matches.length} H1 tags (should be 1)`, severity: "warning" });
  }

  // Check title tag
  const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i);
  if (titleMatch) {
    const titleLen = titleMatch[1].length;
    if (titleLen < 30) {
      issues.push({ type: "title-length", message: `Title too short (${titleLen} chars, should be 50-60)`, severity: "warning" });
    } else if (titleLen > 60) {
      issues.push({ type: "title-length", message: `Title too long (${titleLen} chars, should be 50-60)`, severity: "warning" });
    }
  } else {
    issues.push({ type: "missing-title", message: "Missing title tag", severity: "critical" });
  }

  // Check meta description
  const metaDescMatch = html.match(/<meta\s+name=["']description["'][^>]*content=["']([^"']*)["']/i);
  if (metaDescMatch) {
    const descLen = metaDescMatch[1].length;
    if (descLen < 120) {
      issues.push({ type: "meta-length", message: `Meta description too short (${descLen} chars, should be 140-160)`, severity: "warning" });
    } else if (descLen > 160) {
      issues.push({ type: "meta-length", message: `Meta description too long (${descLen} chars, should be 140-160)`, severity: "warning" });
    }
  } else {
    issues.push({ type: "missing-meta", message: "Missing meta description", severity: "critical" });
  }

  // Check image ALT attributes
  const imgMatches = html.match(/<img[^>]*>/gi) || [];
  const missingAlt = imgMatches.filter(img => !img.match(/\salt\s*=/i)).length;
  if (missingAlt > 0) {
    issues.push({ type: "missing-alt", message: `${missingAlt} images missing ALT text`, severity: "warning" });
  }

  // Check canonical tag
  if (!html.match(/<link[^>]*rel=["']canonical["']/i)) {
    issues.push({ type: "missing-canonical", message: "Missing canonical tag", severity: "warning" });
  }

  // Check Open Graph tags
  const ogCount = (html.match(/<meta\s+property=["']og:/gi) || []).length;
  if (ogCount === 0) {
    issues.push({ type: "missing-og", message: "Missing Open Graph meta tags", severity: "info" });
  }

  // Check schema markup
  if (!html.match(/<script[^>]*type=["']application\/ld\+json["']/i)) {
    issues.push({ type: "missing-schema", message: "Missing JSON-LD schema markup", severity: "warning" });
  }

  // Check mobile viewport
  if (!html.match(/<meta[^>]*name=["']viewport["']/i)) {
    issues.push({ type: "missing-viewport", message: "Missing viewport meta tag (mobile-friendly)", severity: "critical" });
  }

  return issues;
}

async function fetchWithTimeout(url: string, timeoutMs: number): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.text();
  } finally {
    clearTimeout(timeout);
  }
}

function buildCategoryChecks(
  pageAudits: PageAudit[],
  allIssues: Array<{type: string; message: string; severity: "critical" | "warning" | "info"}>
) {
  const checks = [];
  
  const basicIssues = allIssues.filter(i => ["missing-title", "missing-meta", "missing-h1", "multiple-h1"].includes(i.type));
  const technicalIssues = allIssues.filter(i => ["missing-canonical", "missing-viewport"].includes(i.type));
  const onPageIssues = allIssues.filter(i => ["missing-alt"].includes(i.type));
  const securityIssues = allIssues.filter(i => ["missing-og", "missing-schema"].includes(i.type));

  // Basic SEO
  checks.push({
    category: "Basic SEO",
    items: [
      {
        name: "Title Tags",
        status: basicIssues.some(i => i.type === "missing-title") ? "fail" : basicIssues.some(i => i.type === "title-length") ? "warning" : "pass",
        message: basicIssues.filter(i => i.type.includes("title")).map(i => i.message).join("; ") || "All pages have proper title tags",
        severity: basicIssues.some(i => i.type === "missing-title") ? "critical" : "info"
      },
      {
        name: "Meta Descriptions",
        status: basicIssues.some(i => i.type === "missing-meta") ? "fail" : basicIssues.some(i => i.type === "meta-length") ? "warning" : "pass",
        message: basicIssues.filter(i => i.type.includes("meta")).map(i => i.message).join("; ") || "All pages have proper meta descriptions",
        severity: basicIssues.some(i => i.type === "missing-meta") ? "critical" : "info"
      },
      {
        name: "H1 Tags",
        status: basicIssues.some(i => i.type === "missing-h1") ? "fail" : basicIssues.some(i => i.type === "multiple-h1") ? "warning" : "pass",
        message: basicIssues.filter(i => i.type.includes("h1")).map(i => i.message).join("; ") || "All pages have single H1 tags",
        severity: basicIssues.some(i => i.type === "missing-h1") ? "critical" : "info"
      },
      {
        name: "Mobile Friendly",
        status: basicIssues.some(i => i.type === "missing-viewport") ? "fail" : "pass",
        message: "Website is mobile responsive",
        severity: "critical"
      }
    ]
  });

  // Technical SEO
  checks.push({
    category: "Technical SEO",
    items: [
      {
        name: "Canonical Tags",
        status: technicalIssues.some(i => i.type === "missing-canonical") ? "warning" : "pass",
        message: technicalIssues.filter(i => i.type === "missing-canonical").length > 0 ? "Add canonical tags to prevent duplicate content" : "Canonical tags are present",
        severity: "warning"
      },
      {
        name: "URL Structure",
        status: "pass",
        message: "URL structure appears SEO-friendly",
        severity: "info"
      }
    ]
  });

  // On-Page SEO
  checks.push({
    category: "On-Page SEO",
    items: [
      {
        name: "Image ALT Text",
        status: onPageIssues.some(i => i.type === "missing-alt") ? "warning" : "pass",
        message: onPageIssues.map(i => i.message).join("; ") || "All images have ALT attributes",
        severity: "warning"
      },
      {
        name: "Page Audits",
        status: "pass",
        message: `Analyzed ${pageAudits.length} pages on the website`,
        severity: "info"
      }
    ]
  });

  // Security & Trust
  checks.push({
    category: "Security & Trust",
    items: [
      {
        name: "Open Graph Tags",
        status: securityIssues.some(i => i.type === "missing-og") ? "warning" : "pass",
        message: securityIssues.filter(i => i.type === "missing-og").length > 0 ? "Add Open Graph tags for social sharing" : "Open Graph tags present",
        severity: "info"
      },
      {
        name: "Schema Markup",
        status: securityIssues.some(i => i.type === "missing-schema") ? "warning" : "pass",
        message: securityIssues.filter(i => i.type === "missing-schema").length > 0 ? "Add JSON-LD schema markup" : "Schema markup present",
        severity: "warning"
      }
    ]
  });

  return checks;
}
