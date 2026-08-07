import React, { useState } from 'react';
import { Terminal, Play, Database, Table, Sparkles, RefreshCcw, AlertCircle } from 'lucide-react';
import { api } from '../services/api';
import { Dataset } from '../types';

interface SQLConsoleProps {
  dataset?: Dataset | null;
}

export const SQLConsole: React.FC<SQLConsoleProps> = ({ dataset }) => {
  const [query, setQuery] = useState('SELECT * FROM dataset LIMIT 10;');
  const [isExecuting, setIsExecuting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [queryResult, setQueryResult] = useState<any | null>(null);

  // Build smart preset queries dynamically from the actual uploaded columns
  const sampleQueries = React.useMemo(() => {
    const cols = dataset?.columns ?? [];
    if (cols.length === 0) {
      return [{ label: 'Sample 10 Rows', sql: 'SELECT * FROM dataset LIMIT 10;' }];
    }

    const colList = cols.map((c) => `"${c}"`).join(', ');

    // Heuristic: guess numeric columns (contain keywords or are positioned after first col)
    const numericKeywords = ['age', 'income', 'salary', 'price', 'amount', 'count', 'score',
      'value', 'total', 'quantity', 'rate', 'percent', 'pct', 'revenue', 'cost', 'fee', 'weight',
      'height', 'size', 'rank', 'year', 'month', 'day', 'id'];
    const numericCols = cols.filter((c) =>
      numericKeywords.some((kw) => c.toLowerCase().includes(kw))
    );

    // Heuristic: guess categorical / group-by columns
    const categoricalKeywords = ['country', 'city', 'state', 'region', 'category', 'type',
      'status', 'gender', 'department', 'group', 'class', 'role', 'tag', 'label', 'source',
      'segment', 'tier', 'level', 'team', 'product', 'brand', 'platform', 'channel'];
    const catCols = cols.filter((c) =>
      categoricalKeywords.some((kw) => c.toLowerCase().includes(kw))
    );

    // Heuristic: nullable / quality-check columns
    const nullableKeywords = ['email', 'phone', 'address', 'note', 'comment', 'description',
      'remark', 'url', 'link', 'image', 'photo', 'avatar'];
    const nullableCols = cols.filter((c) =>
      nullableKeywords.some((kw) => c.toLowerCase().includes(kw))
    );

    const presets: { label: string; sql: string }[] = [];

    // 1. Always: full sample
    presets.push({ label: 'Sample 10 Rows', sql: `SELECT * FROM dataset LIMIT 10;` });

    // 2. Row count + nulls per column
    const nullChecks = cols
      .slice(0, 5)
      .map((c) => `COUNT(*) - COUNT("${c}") AS "${c}_nulls"`)
      .join(',\n  ');
    presets.push({
      label: 'Null Count per Column',
      sql: `SELECT\n  COUNT(*) AS total_rows,\n  ${nullChecks}\nFROM dataset;`,
    });

    // 3. Numeric summary if we found numeric cols
    if (numericCols.length > 0) {
      const aggParts = numericCols
        .slice(0, 3)
        .map((c) => `AVG("${c}") AS avg_${c}, MIN("${c}") AS min_${c}, MAX("${c}") AS max_${c}`)
        .join(',\n  ');
      presets.push({
        label: 'Numeric Summary',
        sql: `SELECT\n  COUNT(*) AS total_rows,\n  ${aggParts}\nFROM dataset;`,
      });
    }

    // 4. Group-by if we found categorical cols
    if (catCols.length > 0) {
      const gc = catCols[0];
      presets.push({
        label: `Group by ${gc}`,
        sql: `SELECT "${gc}", COUNT(*) AS count\nFROM dataset\nGROUP BY "${gc}"\nORDER BY count DESC\nLIMIT 20;`,
      });
    }

    // 5. Filter nulls on a nullable col if found
    if (nullableCols.length > 0) {
      const nc = nullableCols[0];
      presets.push({
        label: `Filter Missing ${nc}`,
        sql: `SELECT ${colList}\nFROM dataset\nWHERE "${nc}" IS NULL OR TRIM("${nc}") = ''\nLIMIT 50;`,
      });
    }

    // 6. Duplicate detection on first 2 cols
    const dupCols = cols.slice(0, Math.min(2, cols.length)).map((c) => `"${c}"`).join(', ');
    presets.push({
      label: 'Find Duplicates',
      sql: `SELECT ${dupCols}, COUNT(*) AS occurrences\nFROM dataset\nGROUP BY ${dupCols}\nHAVING COUNT(*) > 1\nORDER BY occurrences DESC;`,
    });

    return presets;
  }, [dataset?.columns]);


  const handleRunQuery = async (queryToRun?: string) => {
    const activeQuery = queryToRun ?? query;
    if (!activeQuery.trim()) return;
    setQuery(activeQuery);
    setIsExecuting(true);
    setError(null);

    try {
      const res = await api.executeSQL(activeQuery, dataset?.upload_id);
      if (res.success) {
        setQueryResult(res);
      } else {
        setError(res.error || 'Failed to execute SQL query.');
      }
    } catch (err: any) {
      setError(err?.message || 'Error executing SQL query.');
    } finally {
      setIsExecuting(false);
    }
  };

  // Auto-run initial sample query when active dataset changes
  React.useEffect(() => {
    if (dataset?.upload_id) {
      handleRunQuery('SELECT * FROM dataset LIMIT 10;');
    }
  }, [dataset?.upload_id]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-slate-900 text-white shrink-0">
            <Terminal className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-heading font-extrabold text-slate-900 text-lg flex items-center space-x-2">
              <span>DuckDB In-Memory SQL Console</span>
              <span className="text-[10px] uppercase tracking-wider font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-md">
                Fast DuckDB v0.9
              </span>
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Execute raw SQL queries directly on table <code className="font-mono text-indigo-600 bg-slate-100 px-1 py-0.5 rounded">dataset</code>
            </p>
          </div>
        </div>

        <button
          onClick={() => handleRunQuery()}
          disabled={isExecuting}
          className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-indigo-600 text-white font-bold text-xs shadow-xs transition-colors flex items-center space-x-2 shrink-0 disabled:opacity-50 cursor-pointer"
        >
          {isExecuting ? (
            <>
              <RefreshCcw className="w-4 h-4 animate-spin" />
              <span>Executing Query...</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-white" />
              <span>Run SQL Query</span>
            </>
          )}
        </button>
      </div>

      {/* Preset Query Chips */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider shrink-0">Presets:</span>
        {sampleQueries.map((item, i) => (
          <button
            key={i}
            onClick={() => handleRunQuery(item.sql)}
            className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 font-mono text-xs font-medium border border-slate-200 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Query Input Box */}
      <div className="relative">
        <textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          rows={3}
          className="w-full p-4 font-mono text-xs text-slate-900 bg-slate-900/5 border border-slate-300 rounded-xl focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 transition-all resize-y"
          placeholder="SELECT * FROM dataset WHERE age > 18;"
        />
      </div>

      {/* Error Notice */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span className="font-mono">{error}</span>
        </div>
      )}

      {/* Execution Results Grid */}
      {queryResult && (
        <div className="space-y-3 pt-2">
          <div className="flex justify-between items-center text-xs font-medium text-slate-500">
            <span className="flex items-center space-x-1.5 font-bold text-slate-800">
              <Table className="w-4 h-4 text-indigo-600" />
              <span>Query Output ({queryResult.row_count} rows returned)</span>
            </span>
            <span className="font-mono text-[11px] text-slate-400">Engine: {queryResult.engine}</span>
          </div>

          <div className="data-table-container max-h-72 overflow-y-auto">
            <table className="data-table">
              <thead>
                <tr>
                  {queryResult.columns.map((col: string) => (
                    <th key={col}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {queryResult.data.map((row: any, rIdx: number) => (
                  <tr key={rIdx}>
                    {queryResult.columns.map((col: string) => (
                      <td key={col} className="font-mono text-xs">
                        {row[col] === null || row[col] === undefined ? (
                          <span className="text-rose-400 font-bold italic">null</span>
                        ) : (
                          String(row[col])
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default SQLConsole;
