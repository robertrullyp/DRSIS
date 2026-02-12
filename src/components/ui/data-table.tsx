import React from "react";

type DataTableProps = {
  children: React.ReactNode;
  minWidthClassName?: string;
  className?: string;
};

type DataTableSectionProps = {
  children: React.ReactNode;
  className?: string;
};

type DataTableCellProps = React.TdHTMLAttributes<HTMLTableCellElement> & {
  children: React.ReactNode;
};

type DataTablePaginationProps = {
  page: number;
  pageSize: number;
  total: number;
  visibleCount: number;
  itemLabel: string;
  hasPrev: boolean;
  hasNext: boolean;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  pageSizeOptions?: number[];
  className?: string;
};

function cx(...parts: Array<string | undefined | false>) {
  return parts.filter(Boolean).join(" ");
}

export function DataTable({ children, minWidthClassName = "min-w-[960px]", className = "" }: DataTableProps) {
  return (
    <div className={cx("overflow-auto rounded-md border", className)}>
      <table className={cx("w-full text-sm", minWidthClassName)}>{children}</table>
    </div>
  );
}

export function DataTableHead({ children, className = "" }: DataTableSectionProps) {
  return <thead className={cx("bg-muted/50", className)}>{children}</thead>;
}

export function DataTableHeaderCell({ children, className = "" }: DataTableCellProps) {
  return <th className={cx("border-b p-2 text-left align-middle", className)}>{children}</th>;
}

export function DataTableRow({ children, className = "" }: DataTableSectionProps) {
  return <tr className={className}>{children}</tr>;
}

export function DataTableCell({ children, className = "", ...props }: DataTableCellProps) {
  return (
    <td className={cx("border-b p-2 align-top", className)} {...props}>
      {children}
    </td>
  );
}

export function DataTableEmptyRow({ message, colSpan }: { message: string; colSpan: number }) {
  return (
    <DataTableRow>
      <DataTableCell className="p-3 text-muted-foreground" colSpan={colSpan}>
        {message}
      </DataTableCell>
    </DataTableRow>
  );
}

export function DataTablePagination({
  page,
  pageSize,
  total,
  visibleCount,
  itemLabel,
  hasPrev,
  hasNext,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50],
  className = "",
}: DataTablePaginationProps) {
  return (
    <div className={cx("flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3 text-sm", className)}>
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">Page size</span>
        <select className="rounded-md border px-2 py-1.5 text-sm" value={pageSize} onChange={(event) => onPageSizeChange(Number(event.target.value))}>
          {pageSizeOptions.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
      </div>
      <div className="text-xs text-muted-foreground">
        Menampilkan {visibleCount} dari total {total} {itemLabel}.
      </div>
      <div className="flex items-center gap-2">
        <button type="button" className="rounded border px-3 py-1.5 text-xs hover:bg-muted/70 disabled:opacity-50" disabled={!hasPrev} onClick={() => onPageChange(page - 1)}>
          Sebelumnya
        </button>
        <span className="text-xs text-muted-foreground">Halaman {page}</span>
        <button type="button" className="rounded border px-3 py-1.5 text-xs hover:bg-muted/70 disabled:opacity-50" disabled={!hasNext} onClick={() => onPageChange(page + 1)}>
          Berikutnya
        </button>
      </div>
    </div>
  );
}
