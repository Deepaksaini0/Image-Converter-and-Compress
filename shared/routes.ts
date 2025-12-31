import { z } from 'zod';
import { 
  conversionOptionsSchema, 
  processRequestSchema, 
  processResponseSchema, 
  uploadedFileSchema,
  mergeRequestSchema,
  mergeResponseSchema,
  documentConversionRequestSchema,
  documentConversionResponseSchema
} from './schema';

export const api = {
  upload: {
    method: 'POST' as const,
    path: '/api/upload',
    // Input is multipart/form-data, not JSON validated here
    responses: {
      200: z.array(uploadedFileSchema),
      400: z.object({ message: z.string() })
    }
  },
  process: {
    method: 'POST' as const,
    path: '/api/process',
    input: processRequestSchema,
    responses: {
      200: processResponseSchema,
      400: z.object({ message: z.string() }),
      500: z.object({ message: z.string() })
    }
  },
  merge: {
    method: 'POST' as const,
    path: '/api/merge',
    input: mergeRequestSchema,
    responses: {
      200: mergeResponseSchema,
      400: z.object({ message: z.string() }),
      500: z.object({ message: z.string() })
    }
  },
  documentConvert: {
    method: 'POST' as const,
    path: '/api/convert-document',
    input: documentConversionRequestSchema,
    responses: {
      200: documentConversionResponseSchema,
      400: z.object({ message: z.string() }),
      500: z.object({ message: z.string() })
    }
  },
  seoAudit: {
    method: 'POST' as const,
    path: '/api/seo-audit',
    input: z.object({ url: z.string().url() }),
    responses: {
      200: z.object({
        url: z.string(),
        score: z.number(),
        timestamp: z.string(),
        checks: z.array(z.object({
          category: z.string(),
          items: z.array(z.object({
            name: z.string(),
            status: z.enum(['pass', 'warning', 'fail']),
            message: z.string(),
            severity: z.enum(['critical', 'warning', 'info'])
          }))
        })),
        recommendations: z.array(z.string()),
        pageAudits: z.array(z.object({
          url: z.string(),
          issues: z.array(z.object({
            type: z.string(),
            message: z.string(),
            severity: z.enum(['critical', 'warning', 'info'])
          }))
        }))
      }),
      400: z.object({ message: z.string() }),
      500: z.object({ message: z.string() })
    }
  }
};

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
