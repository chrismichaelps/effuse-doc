import { createQueryClient } from '@effuse/query';

/**
 * Shared query client.
 *
 * Documentation is public and immutable for the lifetime of a deploy, so one
 * cache is correct for every reader and safe to share across SSR requests.
 * Anything user-specific must not be cached here.
 */
export const queryClient = createQueryClient();
