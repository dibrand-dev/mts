'use client';

import { Table } from '@tanstack/react-table';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';

interface DataTablePaginationProps<TData> {
  table: Table<TData>;
  pageSizeOptions?: number[];
  showPageSizeSelector?: boolean;
}

export function DataTablePagination<TData>({
  table,
  pageSizeOptions = [10, 25, 50, 100],
  showPageSizeSelector = true,
}: DataTablePaginationProps<TData>) {
  const totalRows = table.getFilteredRowModel().rows.length;
  const pageIndex = table.getState().pagination.pageIndex;
  const pageSize = table.getState().pagination.pageSize;

  const startRow = totalRows === 0 ? 0 : pageIndex * pageSize + 1;
  const endRow = Math.min((pageIndex + 1) * pageSize, totalRows);
  const pageCount = table.getPageCount();

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 sm:px-6 py-3.5 bg-slate-50/80 border-t border-slate-200 text-xs text-slate-600 select-none">
      {/* Left: Row range & total */}
      <div className="flex items-center gap-1.5 order-2 sm:order-1">
        <span>Mostrando</span>
        <strong className="text-[#0B1C30] font-semibold">{startRow}</strong>
        <span>a</span>
        <strong className="text-[#0B1C30] font-semibold">{endRow}</strong>
        <span>de</span>
        <strong className="text-[#0B1C30] font-semibold">{totalRows}</strong>
        <span>registros</span>
      </div>

      {/* Right / Center: Page size selector and page navigation */}
      <div className="flex items-center gap-4 sm:gap-6 order-1 sm:order-2 w-full sm:w-auto justify-between sm:justify-end">
        {showPageSizeSelector && (
          <div className="flex items-center gap-2">
            <span className="text-slate-500 whitespace-nowrap">Filas por pág:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                table.setPageSize(Number(e.target.value));
              }}
              className="bg-white border border-slate-300 rounded-md px-2 py-1 text-xs text-[#0B1C30] font-medium focus:outline-none focus:ring-1 focus:ring-[#1E5BB4] focus:border-[#1E5BB4] cursor-pointer shadow-2xs"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="flex items-center gap-1.5">
          <span className="text-slate-500 font-medium mr-1 whitespace-nowrap">
            Pág. <strong className="text-[#0B1C30]">{pageIndex + 1}</strong> de{' '}
            <strong className="text-[#0B1C30]">{pageCount || 1}</strong>
          </span>

          {/* First page */}
          <button
            type="button"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
            aria-label="Primera página"
            className="p-1 rounded-md border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-2xs cursor-pointer"
            title="Primera página"
          >
            <ChevronsLeft className="h-4 w-4" />
          </button>

          {/* Previous page */}
          <button
            type="button"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            aria-label="Página anterior"
            className="p-1 rounded-md border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-2xs cursor-pointer"
            title="Página anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          {/* Next page */}
          <button
            type="button"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            aria-label="Página siguiente"
            className="p-1 rounded-md border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-2xs cursor-pointer"
            title="Página siguiente"
          >
            <ChevronRight className="h-4 w-4" />
          </button>

          {/* Last page */}
          <button
            type="button"
            onClick={() => table.setPageIndex(pageCount - 1)}
            disabled={!table.getCanNextPage()}
            aria-label="Última página"
            className="p-1 rounded-md border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-2xs cursor-pointer"
            title="Última página"
          >
            <ChevronsRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
