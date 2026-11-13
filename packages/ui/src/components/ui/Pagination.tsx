"use client";

import * as React from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  MoreHorizontalIcon,
} from "lucide-react";

import { cn } from "@repo/ui/lib/utils";
import { Button, buttonVariants } from "./Button";

function PaginationRoot({ className, ...props }: React.ComponentProps<"nav">) {
  return (
    <nav
      role="navigation"
      aria-label="pagination"
      data-slot="pagination"
      className={cn("mx-auto flex w-full justify-center", className)}
      {...props}
    />
  );
}

function PaginationContent({
  className,
  ...props
}: React.ComponentProps<"ul">) {
  return (
    <ul
      data-slot="pagination-content"
      className={cn("flex flex-row items-center gap-1", className)}
      {...props}
    />
  );
}

function PaginationItem({ ...props }: React.ComponentProps<"li">) {
  return <li data-slot="pagination-item" {...props} />;
}

type PaginationLinkProps = {
  isActive?: boolean;
} & Pick<React.ComponentProps<typeof Button>, "size"> &
  React.ComponentProps<"a">;

function PaginationLink({
  className,
  isActive,
  size = "icon",
  ...props
}: PaginationLinkProps) {
  return (
    <a
      aria-current={isActive ? "page" : undefined}
      data-slot="pagination-link"
      data-active={isActive}
      className={cn(
        buttonVariants({
          variant: isActive ? "outline" : "ghost",
          size,
        }),
        className,
      )}
      {...props}
    />
  );
}

function PaginationPrevious({
  className,
  ...props
}: React.ComponentProps<typeof PaginationLink>) {
  return (
    <PaginationLink
      aria-label="Go to previous page"
      size="default"
      className={cn("gap-1 px-2.5 sm:pl-2.5", className)}
      {...props}
    >
      <ChevronLeft className="size-4" />
      <span className="hidden sm:block">Previous</span>
    </PaginationLink>
  );
}

function PaginationNext({
  className,
  ...props
}: React.ComponentProps<typeof PaginationLink>) {
  return (
    <PaginationLink
      aria-label="Go to next page"
      size="default"
      className={cn("gap-1 px-2.5 sm:pr-2.5", className)}
      {...props}
    >
      <span className="hidden sm:block">Next</span>
      <ChevronRight className="size-4" />
    </PaginationLink>
  );
}

function PaginationEllipsis({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      aria-hidden
      data-slot="pagination-ellipsis"
      className={cn("flex size-9 items-center justify-center", className)}
      {...props}
    >
      <MoreHorizontalIcon className="size-4" />
      <span className="sr-only">More pages</span>
    </span>
  );
}

// Custom Standardized Pagination component (Matching Figma & ResidentTable design)
type CustomPaginationProps = {
  pageNumber?: number;
  pageSize: number;
  totalRecords: number;
  limit: string;
  disabled?: boolean;
  entityName?: string;
  className?: string;
  showLimitSelector?: boolean;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: string) => void;
};

export function PaginationComponent({
  pageNumber = 1,
  pageSize,
  totalRecords,
  limit,
  disabled = false,
  entityName = "records",
  className,
  showLimitSelector = true,
  onPageChange,
  onLimitChange,
}: Readonly<CustomPaginationProps>) {
  if (totalRecords <= 0) return null;

  const totalPages = Math.ceil(totalRecords / pageSize) || 1;
  const startItem = totalRecords === 0 ? 0 : (pageNumber - 1) * pageSize + 1;
  const endItem = Math.min(pageNumber * pageSize, totalRecords);

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (pageNumber <= 3) {
        pages.push(1, 2, 3, "...", totalPages);
      } else if (pageNumber >= totalPages - 2) {
        pages.push(1, "...", totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, "...", pageNumber - 1, pageNumber, pageNumber + 1, "...", totalPages);
      }
    }
    return pages;
  };

  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row items-center justify-between gap-4 w-full py-2 px-2 font-['Outfit',sans-serif]",
        className
      )}
    >
      {/* Summary Text */}
      <div className="text-md font-normal text-[#141F1E] shrink-0">
        Showing {startItem} to {endItem} of {totalRecords} {entityName}
      </div>

      {/* Page Navigation Buttons */}
      <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
        {/* Previous Button */}
        <button
          onClick={() => onPageChange(pageNumber - 1)}
          disabled={disabled || pageNumber === 1}
          className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-[#141F1E] hover:bg-gray-100 disabled:opacity-40 transition-all shrink-0 cursor-pointer disabled:cursor-not-allowed border-0 shadow-none"
          aria-label="Previous page"
        >
          <ChevronLeft className="w-4 h-4 stroke-[1.75]" />
        </button>

        {/* Page Numbers */}
        <div className="flex items-center gap-1 sm:gap-1.5">
          {getPageNumbers().map((item, index) => {
            if (typeof item === "number") {
              const isActive = pageNumber === item;
              return (
                <button
                  key={index}
                  disabled={disabled}
                  onClick={() => onPageChange(item)}
                  className={`w-8 h-8 rounded-lg text-md font-medium flex items-center justify-center transition-all shrink-0 cursor-pointer border-0 ${
                    isActive
                      ? "bg-[#4A706A] text-white"
                      : "bg-white text-[#141F1E] hover:bg-gray-100"
                  }`}
                >
                  {item}
                </button>
              );
            }
            return (
              <span
                key={index}
                className="w-6 sm:w-8 h-8 text-md font-normal text-[#5D5D5D] flex items-center justify-center shrink-0"
              >
                ...
              </span>
            );
          })}
        </div>

        {/* Next Button */}
        <button
          onClick={() => onPageChange(pageNumber + 1)}
          disabled={disabled || pageNumber === totalPages}
          className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-[#141F1E] hover:bg-gray-100 disabled:opacity-40 transition-all shrink-0 cursor-pointer disabled:cursor-not-allowed border-0 shadow-none"
          aria-label="Next page"
        >
          <ChevronRight className="w-4 h-4 stroke-[1.75]" />
        </button>
      </div>

      {/* Rows Per Page Selector (Conditional) */}
      {showLimitSelector && (
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <span className="text-md leading-[16px] font-normal text-[#5D5D5D]">
            Rows <span className="hidden xs:inline">per page</span>
          </span>
          <div className="relative w-[60px] sm:w-[65px] h-[36px]">
            <select
              value={limit}
              disabled={disabled}
              onChange={(e) => onLimitChange(e.target.value)}
              className="w-full h-full bg-white border border-[#E0E0E0] rounded-xl pl-2.5 sm:pl-3 pr-6 sm:pr-7 text-md font-medium text-[#141F1E] appearance-none focus:outline-none cursor-pointer"
            >
              {[5, 8, 10, 20, 50, 100].map((num) => (
                <option key={num} value={String(num)}>
                  {num}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-[#141F1E] absolute right-2 sm:right-2.5 top-1/2 -translate-y-1/2 pointer-events-none stroke-[1.75]" />
          </div>
        </div>
      )}
    </div>
  );
}
export {
  PaginationRoot,
  PaginationContent,
  PaginationLink,
  PaginationItem,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
  PaginationComponent as Pagination,
};