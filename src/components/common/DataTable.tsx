import React from 'react';

export interface ColumnDef<T> {
  key: string;
  header: string;
  align?: 'left' | 'right';
  render: (row: T) => React.ReactNode;
}

interface DataTableProps<T> {
  columns: ColumnDef<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  emptyTitle?: string;
  emptyAction?: React.ReactNode;
  onRowClick?: (row: T) => void;
}

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  emptyTitle = 'No records available',
  emptyAction,
  onRowClick,
}: DataTableProps<T>) {
  if (rows.length === 0) {
    return (
      <div className="aegion-glass p-10 text-center">
        <p className="text-sm text-[var(--aegion-platform-text-muted)]">{emptyTitle}</p>
        {emptyAction && <div className="mt-4">{emptyAction}</div>}
      </div>
    );
  }

  return (
    <div className="aegion-glass overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-[var(--aegion-platform-border)] text-xs font-medium text-[var(--aegion-platform-text-muted)]">
            {columns.map((col) => (
              <th
                key={col.key}
                className={`py-3 px-4 whitespace-nowrap ${
                  col.align === 'right' ? 'text-right' : 'text-left'
                }`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--aegion-platform-border)] text-sm text-[var(--aegion-platform-text)]">
          {rows.map((row) => (
            <tr
              key={rowKey(row)}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={`h-11 transition-colors ${
                onRowClick
                  ? 'cursor-pointer hover:bg-[var(--aegion-platform-accent-soft)]'
                  : 'hover:bg-[var(--aegion-platform-bg-alt)]'
              }`}
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={`py-2.5 px-4 ${
                    col.align === 'right' ? 'text-right tabular-nums' : 'text-left'
                  }`}
                >
                  {col.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
