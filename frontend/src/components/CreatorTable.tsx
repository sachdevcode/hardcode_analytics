import { useState, useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table';
import type { CreatorRow } from '../lib/api';

function fmtNum(n: number | null): string {
  if (n == null) return '—';
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return String(n);
}

function fmtRate(r: number | null): string {
  if (r == null) return '—';
  return r >= 0.01 ? r.toFixed(2) : r.toFixed(4);
}

function fmtDate(ts: number | null): string {
  if (ts == null) return '—';
  return new Date(ts * 1000).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

interface CreatorTableProps {
  creators: CreatorRow[];
  onSelectCreator: (creatorId: string, handle: string) => void;
  selectedCreatorId: string | null;
}

export function CreatorTable({
  creators,
  onSelectCreator,
  selectedCreatorId,
}: CreatorTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');

  const columns = useMemo<ColumnDef<CreatorRow>[]>(
    () => [
      {
        accessorKey: 'handle',
        header: 'Handle',
        cell: (ctx) => {
          const id = ctx.row.original.id;
          const handle = ctx.getValue() as string;
          const selected = id === selectedCreatorId;
          return (
            <button
              type="button"
              onClick={() => onSelectCreator(id, handle)}
              className={
                'text-left font-medium hover:text-accent-blue ' +
                (selected ? 'text-accent-blue' : 'text-white')
              }
            >
              {handle}
            </button>
          );
        },
      },
      { accessorKey: 'platform', header: 'Platform' },
      {
        accessorKey: 'subscribers',
        header: 'Subscribers',
        cell: (ctx) => (
          <span className="font-mono tabular-nums text-zinc-300">
            {fmtNum(ctx.getValue() as number | null)}
          </span>
        ),
      },
      {
        accessorKey: 'avg_views_30d',
        header: 'Avg Views',
        cell: (ctx) => (
          <span className="font-mono tabular-nums text-zinc-300">
            {fmtNum(ctx.getValue() as number | null)}
          </span>
        ),
      },
      {
        accessorKey: 'engagement_rate',
        header: 'Engagement',
        cell: (ctx) => (
          <span className="font-mono tabular-nums text-zinc-300">
            {fmtRate(ctx.getValue() as number | null)}
          </span>
        ),
      },
      { accessorKey: 'category', header: 'Category', cell: (ctx) => (ctx.getValue() as string) ?? '—' },
      {
        accessorKey: 'last_fetched_at',
        header: 'Last Updated',
        cell: (ctx) => (
          <span className="text-zinc-500">{fmtDate(ctx.getValue() as number | null)}</span>
        ),
      },
    ],
    [onSelectCreator, selectedCreatorId]
  );

  const table = useReactTable({
    data: creators,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  return (
    <div className="w-full">
      <div className="mb-3 flex items-center gap-2">
        <input
          type="text"
          placeholder="Filter creators…"
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="rounded border border-surface-500 bg-surface-700 px-3 py-1.5 text-sm text-white placeholder-zinc-500 focus:border-accent-blue focus:outline-none focus:ring-1 focus:ring-accent-blue"
        />
      </div>
      <div className="overflow-x-auto rounded-lg border border-surface-500">
        <table className="w-full min-w-[800px] border-collapse">
          <thead>
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((h) => (
                  <th
                    key={h.id}
                    className="border-b border-surface-500 bg-surface-700 px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-400"
                  >
                    <div
                      className={
                        h.column.getCanSort()
                          ? 'cursor-pointer select-none hover:text-zinc-200'
                          : ''
                      }
                      onClick={h.column.getToggleSortingHandler()}
                      onKeyDown={(e) =>
                        h.column.getCanSort() && (e.key === 'Enter' || e.key === ' ') && h.column.toggleSorting()
                      }
                      role={h.column.getCanSort() ? 'button' : undefined}
                      tabIndex={h.column.getCanSort() ? 0 : undefined}
                    >
                      {flexRender(h.column.columnDef.header, h.getContext())}
                      {{
                        asc: ' ↑',
                        desc: ' ↓',
                      }[h.column.getIsSorted() as string] ?? null}
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                className="border-b border-surface-500/50 hover:bg-surface-700/50"
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="whitespace-nowrap px-4 py-2.5 text-sm text-zinc-300">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
