import OpenAI from "openai";
import type { Express } from "express";
import type { Server } from "http";
import multer from "multer";
import sharp from "sharp";
import archiver from "archiver";
import PDFDocument from "pdfkit";
import ExcelJS from "exceljs";
import fs from "fs";
import path from "path";
// @ts-ignore
import potrace from "potrace";
import { promisify } from "util";

const trace = promisify(potrace.trace);
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

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 200 * 1024 * 1024 } // Increased limit to 200MB
});

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
      const reviewData = insertReviewSchema.parse({
        ...req.body,
        ipAddress: req.ip || req.headers["x-forwarded-for"] || "unknown",
      });
      const review = await dbStorage.createReview(reviewData);
      res.json(review);
    } catch (err: any) {
      console.error("Review error:", err);
      res.status(400).json({ error: err.message });
    }
  });

  // Page Speed Analyzer
  app.post("/api/seo/page-speed", async (req, res) => {
    try {
      const { url } = req.body;
      if (!url) return res.status(400).json({ error: "URL is required" });
      let fullUrl = url;
      if (!fullUrl.startsWith("http")) fullUrl = "https://" + fullUrl;

      const start = Date.now();
      const response = await axios.get(fullUrl, {
        timeout: 15000,
        maxRedirects: 5,
        validateStatus: () => true,
        headers: { "User-Agent": "Mozilla/5.0 (compatible; PageSpeedBot/1.0)", "Accept-Encoding": "gzip, deflate, br" },
        responseType: "text",
      });
      const ttfb = Date.now() - start;

      const html: string = response.data || "";
      const htmlSize = Buffer.byteLength(html, "utf8");

      // Count resources
      const scriptMatches = html.match(/<script[^>]+src=/gi) || [];
      const styleMatches = html.match(/<link[^>]+stylesheet/gi) || [];
      const imgMatches = html.match(/<img[^>]+src=/gi) || [];
      const iframeMatches = html.match(/<iframe[^>]+src=/gi) || [];

      const headers = response.headers;
      const isCompressed = !!(headers["content-encoding"] && /gzip|br|deflate/.test(String(headers["content-encoding"])));
      const hasCache = !!(headers["cache-control"] || headers["expires"]);
      const cacheControl = String(headers["cache-control"] || "");
      const isHttps = fullUrl.startsWith("https://");
      const hasXRobots = !!headers["x-robots-tag"];
      const contentType = String(headers["content-type"] || "");
      const isHtml = contentType.includes("text/html");
      const server = String(headers["server"] || "Unknown");
      const hasHsts = !!headers["strict-transport-security"];

      // Extract meta info
      const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
      const descMatch = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)/i) || html.match(/<meta[^>]+content=["']([^"']*)[^>]+name=["']description["']/i);
      const canonicalMatch = html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']*)/i);
      const viewportMatch = html.match(/<meta[^>]+name=["']viewport["']/i);
      const h1Matches = html.match(/<h1[^>]*>/gi) || [];

      const title = titleMatch ? titleMatch[1].trim() : null;
      const description = descMatch ? descMatch[1].trim() : null;
      const canonical = canonicalMatch ? canonicalMatch[1].trim() : null;
      const hasViewport = !!viewportMatch;
      const h1Count = h1Matches.length;

      // Performance score calculation
      const issues: { type: "error" | "warning" | "info"; message: string; impact: string }[] = [];
      let scorePenalty = 0;

      if (ttfb > 1500) { issues.push({ type: "error", message: `Slow TTFB: ${ttfb}ms (target < 600ms)`, impact: "High impact on Core Web Vitals" }); scorePenalty += 25; }
      else if (ttfb > 600) { issues.push({ type: "warning", message: `Moderate TTFB: ${ttfb}ms (target < 600ms)`, impact: "Moderate impact on Core Web Vitals" }); scorePenalty += 10; }

      if (!isCompressed) { issues.push({ type: "error", message: "No compression detected (gzip/brotli)", impact: "Can reduce transfer size by 60-80%" }); scorePenalty += 20; }
      if (!hasCache) { issues.push({ type: "warning", message: "No cache-control headers found", impact: "Repeat visitors re-download resources" }); scorePenalty += 10; }
      if (!isHttps) { issues.push({ type: "error", message: "Page not served over HTTPS", impact: "Security risk + Google ranking penalty" }); scorePenalty += 15; }
      if (!hasHsts) { issues.push({ type: "warning", message: "HSTS header missing", impact: "Reduced HTTPS security" }); scorePenalty += 5; }
      if (scriptMatches.length > 10) { issues.push({ type: "warning", message: `${scriptMatches.length} external scripts detected`, impact: "Each script blocks rendering" }); scorePenalty += 10; }
      if (styleMatches.length > 5) { issues.push({ type: "warning", message: `${styleMatches.length} external stylesheets detected`, impact: "Render-blocking resources" }); scorePenalty += 5; }
      if (htmlSize > 100000) { issues.push({ type: "warning", message: `Large HTML size: ${Math.round(htmlSize / 1024)}KB`, impact: "Consider minification" }); scorePenalty += 5; }
      if (!hasViewport) { issues.push({ type: "error", message: "No viewport meta tag found", impact: "Not mobile-friendly" }); scorePenalty += 15; }
      if (!title) { issues.push({ type: "error", message: "No <title> tag found", impact: "Critical for SEO" }); scorePenalty += 10; }
      if (title && title.length > 60) { issues.push({ type: "warning", message: `Title too long: ${title.length} chars (max 60)`, impact: "May be truncated in search results" }); scorePenalty += 5; }
      if (!description) { issues.push({ type: "warning", message: "No meta description found", impact: "Missed CTR opportunity in search results" }); scorePenalty += 5; }
      if (h1Count === 0) { issues.push({ type: "error", message: "No <h1> tag found", impact: "Critical for SEO structure" }); scorePenalty += 10; }
      if (h1Count > 1) { issues.push({ type: "warning", message: `Multiple <h1> tags (${h1Count})`, impact: "Only one H1 recommended per page" }); scorePenalty += 5; }

      if (issues.length === 0) issues.push({ type: "info", message: "No issues detected — great job!", impact: "Page looks well-optimized" });

      const score = Math.max(0, Math.min(100, 100 - scorePenalty));

      res.json({
        url: fullUrl,
        ttfb,
        htmlSize,
        htmlSizeKb: Math.round(htmlSize / 1024),
        status: response.status,
        isCompressed,
        hasCache,
        cacheControl,
        isHttps,
        hasHsts,
        server,
        scriptCount: scriptMatches.length,
        styleCount: styleMatches.length,
        imageCount: imgMatches.length,
        iframeCount: iframeMatches.length,
        hasViewport,
        title,
        description,
        canonical,
        h1Count,
        score,
        issues,
      });
    } catch (err: any) {
      res.status(500).json({ error: "Failed to analyze page: " + err.message });
    }
  });

  // HTTP Header Checker
  app.post("/api/seo/http-headers", async (req, res) => {
    try {
      const { url } = req.body;
      if (!url) return res.status(400).json({ error: "URL is required" });
      let fullUrl = url;
      if (!fullUrl.startsWith("http")) fullUrl = "https://" + fullUrl;
      const r = await axios.head(fullUrl, {
        timeout: 10000,
        maxRedirects: 0,
        validateStatus: () => true,
        headers: { "User-Agent": "Mozilla/5.0" },
      });
      const importantHeaders = [
        "content-type", "x-robots-tag", "cache-control", "content-encoding",
        "strict-transport-security", "x-frame-options", "x-content-type-options",
        "content-security-policy", "server", "last-modified", "etag",
        "access-control-allow-origin", "link", "vary",
      ];
      const allHeaders = Object.entries(r.headers).map(([key, value]) => ({
        key,
        value: Array.isArray(value) ? value.join(", ") : String(value),
        important: importantHeaders.includes(key.toLowerCase()),
      }));
      res.json({ status: r.status, statusText: r.statusText, headers: allHeaders });
    } catch (err: any) {
      res.status(500).json({ error: "Failed to fetch headers: " + err.message });
    }
  });

  // Redirect Chain Checker
  app.post("/api/seo/redirect-chain", async (req, res) => {
    try {
      const { url } = req.body;
      if (!url) return res.status(400).json({ error: "URL is required" });
      let currentUrl = url;
      if (!currentUrl.startsWith("http")) currentUrl = "https://" + currentUrl;
      const chain: { url: string; status: number; statusText: string }[] = [];
      let hops = 0;
      while (hops < 10) {
        const r = await axios.head(currentUrl, {
          timeout: 8000,
          maxRedirects: 0,
          validateStatus: () => true,
          headers: { "User-Agent": "Mozilla/5.0" },
        });
        chain.push({ url: currentUrl, status: r.status, statusText: r.statusText });
        if (r.status >= 300 && r.status < 400 && r.headers.location) {
          currentUrl = new URL(r.headers.location, currentUrl).href;
          hops++;
        } else {
          break;
        }
      }
      res.json({ chain, redirectCount: chain.length - 1 });
    } catch (err: any) {
      res.status(500).json({ error: "Failed to check redirects: " + err.message });
    }
  });

  // Broken Link Checker
  app.post("/api/seo/broken-links", async (req, res) => {
    try {
      const { url } = req.body;
      if (!url) return res.status(400).json({ error: "URL is required" });

      let baseUrl = url;
      if (!baseUrl.startsWith("http")) baseUrl = "https://" + baseUrl;

      const origin = new URL(baseUrl).origin;

      const pageRes = await axios.get(baseUrl, { timeout: 10000, headers: { 'User-Agent': 'Mozilla/5.0' } });
      const $ = cheerio.load(pageRes.data);
      const links: string[] = [];

      $("a[href]").each((_, el) => {
        const href = $(el).attr("href");
        if (!href) return;
        try {
          const abs = new URL(href, baseUrl).href;
          if (!links.includes(abs) && links.length < 80) links.push(abs);
        } catch {}
      });

      const results = await Promise.all(links.map(async (link) => {
        try {
          const r = await axios.head(link, { timeout: 8000, maxRedirects: 5, validateStatus: () => true, headers: { 'User-Agent': 'Mozilla/5.0' } });
          return { url: link, status: r.status, broken: r.status >= 400, type: link.startsWith(origin) ? "internal" : "external" };
        } catch (e: any) {
          return { url: link, status: 0, broken: true, error: e.message, type: link.startsWith(origin) ? "internal" : "external" };
        }
      }));

      const broken = results.filter(r => r.broken);
      res.json({ total: results.length, brokenCount: broken.length, results });
    } catch (err: any) {
      res.status(500).json({ error: "Failed to check links: " + err.message });
    }
  });

  // Content Readability Analyzer
  app.post("/api/seo/readability", async (req, res) => {
    try {
      const { text } = req.body;
      if (!text) return res.status(400).json({ error: "Text is required" });

      const sentences = text.split(/[.!?]+/).filter((s: string) => s.trim().length > 0);
      const words = text.split(/\s+/).filter((w: string) => w.trim().length > 0);
      const syllableCount = (word: string) => {
        word = word.toLowerCase().replace(/[^a-z]/g, "");
        if (word.length <= 3) return 1;
        word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, "");
        word = word.replace(/^y/, "");
        const m = word.match(/[aeiouy]{1,2}/g);
        return m ? m.length : 1;
      };
      const totalSyllables = words.reduce((sum: number, w: string) => sum + syllableCount(w), 0);
      const avgWordsPerSentence = words.length / Math.max(sentences.length, 1);
      const avgSyllablesPerWord = totalSyllables / Math.max(words.length, 1);

      const fleschEase = 206.835 - (1.015 * avgWordsPerSentence) - (84.6 * avgSyllablesPerWord);
      const fleschKincaidGrade = (0.39 * avgWordsPerSentence) + (11.8 * avgSyllablesPerWord) - 15.59;

      let level = "Very Difficult";
      let levelColor = "red";
      if (fleschEase >= 90) { level = "Very Easy"; levelColor = "green"; }
      else if (fleschEase >= 80) { level = "Easy"; levelColor = "green"; }
      else if (fleschEase >= 70) { level = "Fairly Easy"; levelColor = "lime"; }
      else if (fleschEase >= 60) { level = "Standard"; levelColor = "yellow"; }
      else if (fleschEase >= 50) { level = "Fairly Difficult"; levelColor = "orange"; }
      else if (fleschEase >= 30) { level = "Difficult"; levelColor = "red"; }

      const suggestions: string[] = [];
      if (avgWordsPerSentence > 20) suggestions.push("Try to shorten your sentences. Aim for under 20 words per sentence.");
      if (avgSyllablesPerWord > 1.5) suggestions.push("Use simpler, shorter words to improve readability.");
      if (fleschKincaidGrade > 12) suggestions.push("Content reads at a college level. Consider simplifying for a wider audience.");
      if (words.length < 300) suggestions.push("Add more content — pages with 300+ words tend to rank better.");
      if (sentences.length < 5) suggestions.push("Break your text into more sentences for better readability.");

      res.json({
        wordCount: words.length,
        sentenceCount: sentences.length,
        syllableCount: totalSyllables,
        avgWordsPerSentence: Math.round(avgWordsPerSentence * 10) / 10,
        avgSyllablesPerWord: Math.round(avgSyllablesPerWord * 10) / 10,
        fleschEase: Math.round(fleschEase * 10) / 10,
        fleschKincaidGrade: Math.round(fleschKincaidGrade * 10) / 10,
        level,
        levelColor,
        suggestions,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/seo/suggest-keywords", async (req, res) => {
    try {
      const { title } = req.body;
      if (!title) return res.status(400).json({ error: "Title is required" });

      const openai = new OpenAI({
        apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
        baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
      });

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are an SEO expert. Given a page title, provide exactly 20 high-performing, relevant Google keywords as a comma-separated list. No introductory text."
          },
          {
            role: "user",
            content: `Title: ${title}`
          }
        ]
      });

      const content = response.choices[0].message.content || "";
      const keywords = content.split(",").map(kw => kw.trim()).filter(kw => kw.length > 0);

      res.json({ keywords });
    } catch (err: any) {
      console.error("OpenAI Error:", err);
      res.status(500).json({ error: "Failed to generate keywords: " + (err.message || "Unknown error") });
    }
  });

  app.post("/api/seo/social-preview", async (req, res) => {
    try {
      const { url } = req.body;
      if (!url) return res.status(400).json({ error: "URL is required" });

      const response = await axios.get(url, { timeout: 8000 });
      const $ = cheerio.load(response.data);

      const preview = {
        title: $('meta[property="og:title"]').attr('content') || $('title').text() || "",
        description: $('meta[name="description"]').attr('content') || $('meta[property="og:description"]').attr('content') || "",
        image: $('meta[property="og:image"]').attr('content') || "",
        site_name: $('meta[property="og:site_name"]').attr('content') || "",
        url: url
      };

      res.json(preview);
    } catch (err: any) {
      res.status(500).json({ error: "Failed to fetch social preview: " + err.message });
    }
  });

  app.post("/api/seo/keyword-density", async (req, res) => {
    try {
      const { text } = req.body;
      if (!text || typeof text !== "string") {
        return res.status(400).json({ error: "Text is required" });
      }

      const words = text
        .toLowerCase()
        .replace(/[^\w\s]/g, "")
        .split(/\s+/)
        .filter(word => word.length > 2);

      const totalWords = words.length;
      const counts: Record<string, number> = {};
      words.forEach(word => {
        counts[word] = (counts[word] || 0) + 1;
      });

      const density = Object.entries(counts)
        .map(([word, count]) => ({
          word,
          count,
          percentage: ((count / totalWords) * 100).toFixed(2)
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 20);

      res.json({ totalWords, density });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/seo/parse-sitemap", async (req, res) => {
    try {
      const { xml } = req.body;
      if (!xml || typeof xml !== "string") {
        return res.status(400).json({ error: "Sitemap XML is required" });
      }

      const $ = cheerio.load(xml, { xmlMode: true });
      const urls: string[] = [];
      $("url > loc").each((_, el) => {
        urls.push($(el).text().trim());
      });

      res.json({ count: urls.length, urls });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/generate-sitemap", async (req, res) => {
    try {
      let { url } = req.body;
      if (!url) return res.status(400).json({ error: "URL is required" });

      // Normalize URL
      if (!url.startsWith("http")) url = "https://" + url;
      const urlObj = new URL(url);
      const domain = urlObj.origin;
      const visited = new Set<string>();
      const toVisit = [domain];
      const maxPages = 2000;

      console.log(`Starting sitemap generation for: ${domain}`);

      while (toVisit.length > 0 && visited.size < maxPages) {
        const currentUrl = toVisit.shift()!;
        if (visited.has(currentUrl)) continue;
        visited.add(currentUrl);

        try {
          const response = await axios.get(currentUrl, { 
            timeout: 10000,
            headers: {
              'User-Agent': 'Mozilla/5.0 (compatible; SitemapGenerator/1.0)'
            }
          });
          const $ = cheerio.load(response.data);

          $("a[href]").each((_, el) => {
            const href = $(el).attr("href");
            if (!href) return;
            try {
              const linkUrl = new URL(href, currentUrl);
              const absoluteUrl = linkUrl.origin + linkUrl.pathname.replace(/\/$/, "");
              
              if (linkUrl.origin === domain && 
                  !visited.has(absoluteUrl) && 
                  !toVisit.includes(absoluteUrl) &&
                  !absoluteUrl.match(/\.(jpg|jpeg|png|gif|pdf|zip|gz|exe)$/i)) {
                toVisit.push(absoluteUrl);
              }
            } catch {}
          });
        } catch (err: any) {
          console.error(`Sitemap crawl error for ${currentUrl}:`, err.message);
        }
      }

      console.log(`Crawled ${visited.size} pages for ${domain}`);

      const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${Array.from(visited).map(page => {
  const isHome = page === domain || page === domain + "/";
  return `  <url>
    <loc>${page}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>${isHome ? 'daily' : 'weekly'}</changefreq>
    <priority>${isHome ? '1.00' : '0.8'}</priority>
  </url>`;
}).join('\n')}
</urlset>`;

      res.header('Content-Type', 'application/xml');
      res.send(sitemap);
    } catch (err: any) {
      console.error("Sitemap generation error:", err);
      res.status(500).json({ error: err.message });
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

        if (format === 'svg' as any) {
          try {
            const pngBuffer = await pipeline.toFormat('png').toBuffer();
            const svgContent = await trace(pngBuffer);
            outputBuffer = Buffer.from(svgContent);
          } catch (e) {
            console.error("SVG tracing error:", e);
            outputBuffer = await pipeline.toFormat('png').toBuffer();
          }
        } else if (options.targetSizeKB) {
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
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(inputPath);
        const worksheet = workbook.worksheets[0];
        const rows: string[] = [];
        if (worksheet) {
          worksheet.eachRow((row) => {
            const values = row.values as (string | number | null)[];
            rows.push(values.slice(1).map(v => v ?? "").join(","));
          });
        }
        docContent = rows.join("\n");
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
        const wsData = [
          [fileName],
          ["Content extracted from: " + ext.toUpperCase()],
          [],
          ...docContent.split("\n").map((line) => [line]),
        ];

        outputFilename = `${fileName}-${Date.now()}.${outputFormat}`;
        outputPath = path.join(OUTPUT_DIR, outputFilename);

        try {
          if (outputFormat === "csv") {
            const csvContent = wsData.map(row => row.join(",")).join("\n");
            fs.writeFileSync(outputPath, csvContent, "utf-8");
          } else {
            const wb = new ExcelJS.Workbook();
            const ws = wb.addWorksheet("Sheet1");
            wsData.forEach(row => ws.addRow(row));
            await wb.xlsx.writeFile(outputPath);
          }
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
          ? `Title: ${$("title").text().trim()}`
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
    if (item.status === "fail") score -= 20;
    else if (item.status === "warning") score -= 10;
  });
  checks.push({ category: "Basic SEO", items: basicItems });

  const techItems = [
    {
      name: "Image ALT Text",
      status: $("img:not([alt])").length === 0 ? "pass" : "warning",
      message: `Found ${$("img:not([alt])").length} images without alt text`,
      severity: "warning",
    },
    {
      name: "Canonical Tag",
      status: $('link[rel="canonical"]').length > 0 ? "pass" : "warning",
      message: $('link[rel="canonical"]').length > 0 ? "Canonical tag present" : "Missing canonical tag",
      severity: "medium",
    },
    {
      name: "Viewport Tag",
      status: $('meta[name="viewport"]').length > 0 ? "pass" : "fail",
      message: $('meta[name="viewport"]').length > 0 ? "Viewport meta tag present" : "Missing viewport tag (Mobile Friendly)",
      severity: "critical",
    },
    {
      name: "Robots Meta Tag",
      status: $('meta[name="robots"]').length > 0 ? "pass" : "warning",
      message: $('meta[name="robots"]').length > 0 ? "Robots meta tag found" : "Missing robots meta tag",
      severity: "medium",
    },
  ];
  techItems.forEach((item) => {
    if (item.status === "fail") score -= 10;
    else if (item.status === "warning") score -= 5;
  });
  checks.push({ category: "Technical SEO", items: techItems });

  const whiteLabelItems = [
    {
      name: "Internal Links",
      status: $("a[href^='/'], a[href^='" + url + "']").length > 0 ? "pass" : "warning",
      message: `Found ${$("a[href^='/'], a[href^='" + url + "']").length} internal links`,
      severity: "medium",
    },
    {
      name: "Social Tags (Open Graph)",
      status: $('meta[property^="og:"]').length > 0 ? "pass" : "warning",
      message: `${$('meta[property^="og:"]').length} OG tags found`,
      severity: "low",
    },
    {
      name: "Favicon",
      status: $('link[rel*="icon"]').length > 0 ? "pass" : "warning",
      message: $('link[rel*="icon"]').length > 0 ? "Favicon found" : "Missing favicon",
      severity: "low",
    }
  ];
  whiteLabelItems.forEach((item) => {
    if (item.status !== "pass") score -= 2;
  });
  checks.push({ category: "White Label SEO", items: whiteLabelItems });

  return {
    url,
    score: Math.max(0, score),
    checks,
    recommendations: [...basicItems, ...techItems, ...whiteLabelItems]
      .filter((i) => i.status !== "pass")
      .map((i) => i.message),
  };
}
