import { z } from 'zod';

/**
 * Amplop respons API. Blueprint mensyaratkan versioning via path (/v1/) dan
 * format konsisten untuk integrasi PWA, kasir, dan pihak ketiga.
 */
export const errorResponseSchema = z.object({
  statusCode: z.number().int(),
  code: z.string(),
  message: z.string(),
  details: z.record(z.string(), z.unknown()).optional(),
});

export type ErrorResponse = z.infer<typeof errorResponseSchema>;

export const paginatedSchema = <T extends z.ZodTypeAny>(item: T) =>
  z.object({
    data: z.array(item),
    meta: z.object({
      total: z.number().int().nonnegative(),
      page: z.number().int().positive(),
      pageSize: z.number().int().positive(),
    }),
  });
