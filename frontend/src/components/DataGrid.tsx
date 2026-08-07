import React, { useState, useMemo } from 'react';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Copy,
  Check,
  AlertCircle,
  FileSpreadsheet,
} from 'lucide-react';

interface DataGridProps {
  data: Record<string, any>[];
  columns?: string[];
  title?: string;
  pageSize?: number;
  highlightNulls?: boolean;
}

export const DataGrid: React.FC<DataGridProps> = ({
  data = [],
  columns,
  title = 'Dataset Preview',
  pageSize: initialPageSize = 10,
  highlightNulls = true,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [copiedCell, setCopiedCell] = useState<string | null>(null);

  // Auto-detect columns if not provided
  const cols = useMemo(() => {
    if (columns && columns.length > 0) return columns;
    if (data && data.length > 0) return Object.keys(data[0]);
    return [];
  }, [columns, data]);

  // Filtered & Sorted Rows
  const processedData = useMemo(() => {
    let result = [...data];

    // Search filter
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      result = result.filter((row) =>
        Object.values(row).some((val) =>
          val !== null && val !== undefined && String(val).toLowerCase().includes(q)
        )
      );
    }

    // Sort
    if (sortColumn) {
      result.sort((a, b) => {
        const valA = a[sortColumn];
        const valB = b[sortColumn];

        if (valA === valB) return 0;
        if (valA === null || valA === undefined) return 1;
        if (valB === null || valB === undefined) return -1;

        if (typeof valA === 'number' && typeof valB === 'number') {
          return sortDirection === 'asc' ? valA - valB : valB - valA;
        }

        return sortDirection === 'asc'
          ? String(valA).localeCompare(String(valB))
          : String(valB).localeCompare(String(valA));
      });
    }

    return result;
  }, [data, searchQuery, sortColumn, sortDirection]);

  // Pagination logic
  const totalPages = Math.ceil(processedData.length / pageSize) || 1;
  const pageData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return processedData.slice(start, start + pageSize);
  }, [processedData, currentPage, pageSize]);

  const handleSort = (col: string) => {
    if (sortColumn === col) {
      if (sortDirection === 'asc') setSortDirection('desc');
      else setSortColumn(null);
    } else {
      setSortColumn(col);
      setSortDirection('asc');
    }
  };

  const copyToClipboard = (text: string, cellId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCell(cellId);
    setTimeout(() => setCopiedCell(null), 2000);
  };

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col space-y-4">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-2">
          <FileSpreadsheet className="w-5 h-5 text-indigo-600" />
          <h3 className="font-bold text-slate-900 text-base">{title}</h3>
          <span className="text-xs bg-slate-100 text-slate-600 border border-slate-200 px-2.5 py-0.5 rounded-full font-mono font-semibold">
            {processedData.length.toLocaleString()} rows
          </span>
        </div>

        {/* Search & Controls */}
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filter table..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="glass-input pl-9 pr-4 py-1.5 rounded-xl text-xs w-48 focus:w-60 transition-all shadow-xs"
            />
          </div>

          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="glass-input px-3 py-1.5 rounded-xl text-xs bg-white text-slate-700 shadow-xs"
          >
            <option value={10}>10 rows</option>
            <option value={25}>25 rows</option>
            <option value={50}>50 rows</option>
            <option value={100}>100 rows</option>
          </select>
        </div>
      </div>

      {/* Table Container */}
      <div className="data-table-container max-h-[480px]">
        <table className="data-table">
          <thead>
            <tr>
              <th className="w-12 text-center">#</th>
              {cols.map((col) => (
                <th
                  key={col}
                  onClick={() => handleSort(col)}
                  className="cursor-pointer hover:bg-slate-100 transition-colors select-none"
                >
                  <div className="flex items-center justify-between space-x-2">
                    <span className="font-semibold text-slate-700">{col}</span>
                    <span className="text-slate-400">
                      {sortColumn === col ? (
                        sortDirection === 'asc' ? (
                          <ArrowUp className="w-3.5 h-3.5 text-indigo-600" />
                        ) : (
                          <ArrowDown className="w-3.5 h-3.5 text-indigo-600" />
                        )
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-slate-400 group-hover:text-slate-600" />
                      )}
                    </span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageData.length > 0 ? (
              pageData.map((row, rIdx) => {
                const globalIdx = (currentPage - 1) * pageSize + rIdx + 1;
                return (
                  <tr key={rIdx} className="hover:bg-indigo-50/40 transition-colors border-b border-slate-100">
                    <td className="text-center font-mono text-xs text-slate-400 font-medium">{globalIdx}</td>
                    {cols.map((col) => {
                      const val = row[col];
                      const isNull = val === null || val === undefined;
                      const cellId = `${rIdx}-${col}`;

                      return (
                        <td key={col} className="group relative font-mono text-xs">
                          {isNull ? (
                            highlightNulls ? (
                              <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] bg-rose-50 text-rose-700 border border-rose-200 font-semibold italic">
                                <AlertCircle className="w-3 h-3" />
                                <span>null</span>
                              </span>
                            ) : (
                              <span className="text-slate-400 italic">null</span>
                            )
                          ) : (
                            <div className="flex items-center justify-between">
                              <span className="truncate max-w-[200px] text-slate-800" title={String(val)}>
                                {String(val)}
                              </span>
                              <button
                                onClick={() => copyToClipboard(String(val), cellId)}
                                className="opacity-0 group-hover:opacity-100 ml-2 p-1 text-slate-400 hover:text-indigo-600 transition-opacity"
                                title="Copy cell value"
                              >
                                {copiedCell === cellId ? (
                                  <Check className="w-3 h-3 text-emerald-600" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={cols.length + 1} className="text-center py-12 text-slate-500 text-sm">
                  No dataset rows match your search criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="flex items-center justify-between text-xs text-slate-600 pt-2 border-t border-slate-200">
        <div>
          Showing{' '}
          <span className="font-semibold text-slate-900">
            {processedData.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}
          </span>{' '}
          to{' '}
          <span className="font-semibold text-slate-900">
            {Math.min(currentPage * pageSize, processedData.length)}
          </span>{' '}
          of <span className="font-semibold text-slate-900">{processedData.length}</span> rows
        </div>

        <div className="flex items-center space-x-1">
          <button
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
            className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 shadow-xs"
          >
            <ChevronsLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 shadow-xs"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="px-3 font-semibold text-slate-700">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 shadow-xs"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage === totalPages}
            className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 shadow-xs"
          >
            <ChevronsRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default DataGrid;
