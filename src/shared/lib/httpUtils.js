/**
 * Utility functions for Http Client
 */

/**
 * Normalize pagination parameters for Spring Boot backend.
 * Spring Boot expects `page` (0-based) and `size`.
 * FE components usually send `page` (1-based) and `limit` / `size`.
 *
 * @param {Object} params - Original query parameters
 * @returns {Object} Normalized query parameters
 */
export function normalizePagination(params = {}) {
  const normalizedParams = { ...params };
  
  if (normalizedParams.limit !== undefined) {
    normalizedParams.size = normalizedParams.limit;
    delete normalizedParams.limit;
  }
  
  if (normalizedParams.page !== undefined) {
    // FE pages usually start at 1, BE expects 0-indexed pages
    normalizedParams.page = Math.max(0, parseInt(normalizedParams.page, 10) - 1);
  }
  
  return normalizedParams;
}
