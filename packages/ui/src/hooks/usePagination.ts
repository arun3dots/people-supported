import { useState, useMemo } from "react";

export interface PaginationState {
  currentPage: number;
  pageSize: number;
}

export function usePagination<T>(data: T[] | undefined, initialPageSize = 10) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  const paginatedData = useMemo(() => {
    if (!data) return [];
    const startIndex = (currentPage - 1) * pageSize;
    return data.slice(startIndex, startIndex + pageSize);
  }, [data, currentPage, pageSize]);

  const totalRecords = data?.length || 0;

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleLimitChange = (limit: string) => {
    setPageSize(parseInt(limit));
    setCurrentPage(1); // Reset to first page when limit changes
  };

  return {
    currentPage,
    pageSize,
    paginatedData,
    totalRecords,
    handlePageChange,
    handleLimitChange,
  };
}
