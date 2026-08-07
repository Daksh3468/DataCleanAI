import React, { useState, useEffect } from 'react';
import {
  Sliders,
  Plus,
  Play,
  Trash2,
  AlertOctagon,
  AlertTriangle,
  Sparkles,
  RefreshCw,
  Search,
} from 'lucide-react';
import { api } from '../services/api';
import { CustomRule, EvaluateRulesResponse, Dataset } from '../types';
import { RuleBuilderModal } from '../components/RuleBuilderModal';

interface RulesPageProps {
  dataset?: Dataset | null;
}

export const RulesPage: React.FC<RulesPageProps> = ({ dataset }) => {
  const [rules, setRules] = useState<CustomRule[]>([]);
  const [evaluation, setEvaluation] = useState<EvaluateRulesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [evaluating, setEvaluating] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const loadRules = async () => {
    setLoading(true);
    try {
      const data = await api.getRules();
      setRules(data);
    } catch (err) {
      console.error('Failed to fetch business rules', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRules();
  }, []);

  const handleCreateRule = async (newRuleData: Omit<CustomRule, 'id'>) => {
    try {
      const created = await api.createRule(newRuleData);
      setRules((prev) => [...prev, created]);
    } catch (err) {
      console.error('Failed to create rule', err);
    }
  };

  const handleDeleteRule = async (id: string) => {
    try {
      await api.deleteRule(id);
      setRules((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      console.error('Failed to delete rule', err);
    }
  };

  const handleToggleRule = (id: string) => {
    setRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, is_active: !r.is_active } : r))
    );
  };

  const handleRunEvaluation = async () => {
    setEvaluating(true);
    try {
      const result = await api.evaluateRules(dataset?.upload_id);
      setEvaluation(result);
    } catch (err) {
      console.error('Failed to evaluate rules', err);
    } finally {
      setEvaluating(false);
    }
  };

  const filteredRules = rules.filter(
    (r) =>
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.column.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200/80 text-indigo-700 text-xs font-semibold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>Step 3: Custom Business Rules Engine</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Data Quality Business Rules
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 font-medium">
            Configure custom integrity constraints (e.g. <code className="text-indigo-700 font-mono font-bold">Age &gt;= 18</code>, email formatting, income ranges).
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 transition-all flex items-center space-x-1.5 shadow-xs"
          >
            <Plus className="w-4 h-4 text-indigo-600" />
            <span>New Custom Rule</span>
          </button>

          <button
            onClick={handleRunEvaluation}
            disabled={evaluating}
            className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-500/20 transition-all flex items-center space-x-2 disabled:opacity-50"
          >
            {evaluating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Evaluating Rules...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>Run Quality Audit</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Evaluation Results Banner (if evaluated) */}
      {evaluation && (
        <div className="bg-indigo-50/80 p-6 rounded-2xl border border-indigo-200 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-amber-100 border border-amber-200 text-amber-700">
                <AlertTriangle className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Rule Audit Evaluation Complete</h3>
                <p className="text-xs text-slate-600 font-medium">
                  Evaluated {evaluation.total_evaluated.toLocaleString()} rows against {rules.length} active business constraints
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="text-center px-4 py-2 bg-white rounded-xl border border-slate-200 shadow-xs">
                <div className="text-[11px] text-slate-500 font-medium">Violations Found</div>
                <div className="text-lg font-bold text-amber-600 font-mono">
                  {evaluation.total_violations}
                </div>
              </div>
              <div className="text-center px-4 py-2 bg-white rounded-xl border border-slate-200 shadow-xs">
                <div className="text-[11px] text-slate-500 font-medium">Rules Passed</div>
                <div className="text-lg font-bold text-emerald-600 font-mono">
                  {evaluation.passed_rules} / {rules.length}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rules List Table */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <Sliders className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-slate-900 text-base">Active Business Rule Definitions</h3>
            <span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full font-mono font-semibold border border-slate-200">
              {rules.length} rules
            </span>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search rule or column..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="glass-input pl-9 pr-4 py-1.5 rounded-xl text-xs w-56 shadow-xs"
            />
          </div>
        </div>

        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Active</th>
                <th>Rule Name</th>
                <th>Target Column</th>
                <th>Condition</th>
                <th>Threshold</th>
                <th>Severity</th>
                <th>Violations</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRules.length > 0 ? (
                filteredRules.map((rule) => {
                  const severityBadge =
                    rule.error_level === 'CRITICAL'
                      ? 'badge-rose'
                      : rule.error_level === 'WARNING'
                      ? 'badge-amber'
                      : 'badge-indigo';

                  return (
                    <tr key={rule.id} className="hover:bg-slate-50 transition-colors border-b border-slate-100">
                      <td>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={rule.is_active}
                            onChange={() => handleToggleRule(rule.id)}
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                        </label>
                      </td>
                      <td className="font-bold text-slate-900">
                        <div>{rule.name}</div>
                        <div className="text-[11px] text-slate-500 font-normal">{rule.description}</div>
                      </td>
                      <td className="font-mono text-xs text-indigo-700 font-bold">{rule.column}</td>
                      <td className="font-mono text-xs text-slate-800 font-bold">{rule.operator}</td>
                      <td className="font-mono text-xs text-slate-700">{String(rule.threshold)}</td>
                      <td>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${severityBadge}`}>
                          {rule.error_level}
                        </span>
                      </td>
                      <td className="font-mono text-xs font-bold text-amber-600">
                        {rule.violation_count ?? 0}
                      </td>
                      <td className="text-right">
                        <button
                          onClick={() => handleDeleteRule(rule.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Delete Rule"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-slate-500 text-sm">
                    No business rules created yet. Click "New Custom Rule" to build one!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Rule Violations Audit Summary Table */}
      {evaluation && evaluation.violations.length > 0 && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center space-x-2">
            <AlertOctagon className="w-5 h-5 text-amber-600" />
            <h3 className="font-bold text-slate-900 text-base">Detected Rule Violation Row Details</h3>
          </div>

          <div className="data-table-container max-h-[350px]">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Row #</th>
                  <th>Failed Rule</th>
                  <th>Column</th>
                  <th>Actual Value</th>
                  <th>Expected Condition</th>
                  <th>Severity</th>
                </tr>
              </thead>
              <tbody>
                {evaluation.violations.map((v, i) => (
                  <tr key={i} className="hover:bg-rose-50/50 border-b border-slate-100">
                    <td className="font-mono text-xs text-slate-400 font-medium">#{v.row_index}</td>
                    <td className="font-semibold text-slate-900">{v.rule_name}</td>
                    <td className="font-mono text-xs text-indigo-700 font-bold">{v.column}</td>
                    <td className="font-mono text-xs text-rose-600 font-bold">{String(v.actual_value)}</td>
                    <td className="font-mono text-xs text-slate-600">{v.expected_condition}</td>
                    <td>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                          v.error_level === 'CRITICAL'
                            ? 'badge-rose'
                            : v.error_level === 'WARNING'
                            ? 'badge-amber'
                            : 'badge-indigo'
                        }`}
                      >
                        {v.error_level}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Dialog */}
      <RuleBuilderModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSaveRule={handleCreateRule}
        columns={dataset?.columns || ['age', 'email', 'annual_income', 'full_name', 'country', 'signup_date']}
      />
    </div>
  );
};

export default RulesPage;
