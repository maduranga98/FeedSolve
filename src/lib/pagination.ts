// Pagination utilities and helpers

export interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
}

export interface PaginationResult<T> {
  items: T[];
  pagination: PaginationState;
  hasMore: boolean;
  hasPrevious: boolean;
}

// Validate pagination parameters
export function validatePaginationParams(
  page: number,
  pageSize: number,
  total: number
): { page: number; pageSize: number } {
  const MAX_PAGE_SIZE = 500;

  // Ensure page is positive
  if (page < 1) {
    console.warn(`Invalid page number: ${page}, using 1`);
    page = 1;
  }

  // Ensure pageSize is reasonable
  if (pageSize < 1) {
    console.warn(`Invalid page size: ${pageSize}, using 50`);
    pageSize = 50;
  } else if (pageSize > MAX_PAGE_SIZE) {
    console.warn(`Page size too large: ${pageSize}, using ${MAX_PAGE_SIZE}`);
    pageSize = MAX_PAGE_SIZE;
  }

  // Ensure page doesn't exceed max pages
  const maxPage = Math.ceil(total / pageSize);
  if (page > maxPage) {
    console.warn(`Page ${page} exceeds max page ${maxPage}, using ${maxPage}`);
    page = Math.max(1, maxPage);
  }

  return { page, pageSize };
}

// Calculate offset for database query
export function getOffset(page: number, pageSize: number): number {
  return (page - 1) * pageSize;
}

// Create pagination result
export function createPaginationResult<T>(
  items: T[],
  page: number,
  pageSize: number,
  total: number
): PaginationResult<T> {
  const { page: validPage, pageSize: validPageSize } = validatePaginationParams(
    page,
    pageSize,
    total
  );

  return {
    items,
    pagination: {
      page: validPage,
      pageSize: validPageSize,
      total,
    },
    hasMore: validPage * validPageSize < total,
    hasPrevious: validPage > 1,
  };
}

// Get page range (e.g., showing items 1-50 of 250)
export function getPageRange(page: number, pageSize: number, total: number): string {
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  if (total === 0) {
    return 'No items';
  }

  return `Showing ${start}-${end} of ${total}`;
}

// Get visible page numbers for pagination (e.g., [1, 2, 3, ..., 10])
export function getPageNumbers(
  currentPage: number,
  totalPages: number,
  maxVisible: number = 7
): (number | string)[] {
  if (totalPages <= maxVisible) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages: (number | string)[] = [];
  const halfVisible = Math.floor(maxVisible / 2);

  let start = Math.max(1, currentPage - halfVisible);
  let end = Math.min(totalPages, start + maxVisible - 1);

  if (end - start + 1 < maxVisible) {
    start = Math.max(1, end - maxVisible + 1);
  }

  // Add first page
  if (start > 1) {
    pages.push(1);
    if (start > 2) {
      pages.push('...');
    }
  }

  // Add page range
  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  // Add last page
  if (end < totalPages) {
    if (end < totalPages - 1) {
      pages.push('...');
    }
    pages.push(totalPages);
  }

  return pages;
}

// Handle pagination change with validation
export function handlePageChange(
  newPage: number,
  currentTotal: number,
  pageSize: number
): number {
  const { page } = validatePaginationParams(newPage, pageSize, currentTotal);
  return page;
}

// Edge case: Handle empty results
export function handleEmptyResults<T>(
  items: T[],
  page: number,
  pageSize: number
): PaginationResult<T> {
  if (items.length === 0) {
    return createPaginationResult(items, 1, pageSize, 0);
  }

  return createPaginationResult(items, page, pageSize, items.length);
}

// Cursor-based pagination for large datasets
export interface CursorPaginationParams {
  cursor?: string;
  limit: number;
}

export interface CursorPaginationResult<T> {
  items: T[];
  nextCursor?: string;
  previousCursor?: string;
  hasMore: boolean;
}

// Generate cursor from item ID and timestamp
export function generateCursor(id: string, timestamp: number): string {
  return btoa(`${id}:${timestamp}`);
}

// Decode cursor
export function decodeCursor(cursor: string): { id: string; timestamp: number } | null {
  try {
    const decoded = atob(cursor);
    const [id, timestamp] = decoded.split(':');
    return { id, timestamp: parseInt(timestamp) };
  } catch {
    return null;
  }
}
