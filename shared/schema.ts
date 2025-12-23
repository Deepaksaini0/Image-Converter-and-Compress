import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// We don't strictly need a database for this stateless tool, 
// but we define Zod schemas here for API validation.

export const formats = [
  "jpeg", "png", "webp", "avif", "tiff", "gif", 
  "bmp", "ico", "jp2", "heif", "jxl" // Sharp supports these (some depend on libvips)
] as const;

export const conversionOptionsSchema = z.object({
  format: z.enum(formats).default("jpeg"),
  quality: z.number().min(1).max(100).default(80),
  targetSizeKB: z.number().optional().describe("Target size in KB for smart compression"),
  watermarkText: z.string().optional(),
  watermarkOpacity: z.number().min(0).max(1).default(0.5),
  keepMetadata: z.boolean().default(false)
});

export type ConversionOptions = z.infer<typeof conversionOptionsSchema>;

export const uploadedFileSchema = z.object({
  id: z.string(),
  originalName: z.string(),
  filename: z.string(),
  mimeType: z.string(),
  size: z.number(),
  url: z.string(),
});

export type UploadedFile = z.infer<typeof uploadedFileSchema>;

export const processRequestSchema = z.object({
  fileIds: z.array(z.string()),
  options: conversionOptionsSchema
});

export type ProcessRequest = z.infer<typeof processRequestSchema>;

export const processedResultSchema = z.object({
  id: z.string(), // Maps back to upload ID
  url: z.string(),
  filename: z.string(),
  originalSize: z.number(),
  newSize: z.number(),
  format: z.string(),
  width: z.number().optional(),
  height: z.number().optional()
});

export type ProcessedResult = z.infer<typeof processedResultSchema>;

export const processResponseSchema = z.object({
  results: z.array(processedResultSchema),
  zipUrl: z.string()
});

export type ProcessResponse = z.infer<typeof processResponseSchema>;
