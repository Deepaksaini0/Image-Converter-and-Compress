import { z } from 'zod';
import { 
  conversionOptionsSchema, 
  processRequestSchema, 
  processResponseSchema, 
  uploadedFileSchema 
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
