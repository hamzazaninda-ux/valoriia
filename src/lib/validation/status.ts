import { z } from 'zod';

// =============================================================================
// Status Action Schema
// =============================================================================
// Validates publish/unpublish action requests
export const StatusActionSchema = z.object({
  action: z.enum(['publish', 'unpublish'])
});

export type StatusAction = z.infer<typeof StatusActionSchema>;
