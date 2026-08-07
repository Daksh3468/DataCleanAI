import React, { useState } from 'react';
import { X, Sliders, AlertCircle, Plus, Sparkles } from 'lucide-react';
import { CustomRule, RuleOperator, ErrorLevel } from '../types';

interface RuleBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveRule: (rule: Omit<CustomRule, 'id'>) => void;
  columns?: string[];
}

export const RuleBuilderModal: React.FC<RuleBuilderModalProps> = ({
  isOpen,
  onClose,
  onSaveRule,
  columns = ['age', 'email', 'annual_income', 'full_name', 'signup_date', 'country'],
}) => {
  const [ruleName, setRuleName] = useState('');
  const [column, setColumn] = useState(columns[0] || 'age');
  const [operator, setOperator] = useState<RuleOperator>('>=');
  const [threshold, setThreshold] = useState<string>('18');
  const [errorLevel, setErrorLevel] = useState<ErrorLevel>('CRITICAL');
  const [description, setDescription] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ruleName.trim()) {
      setFormError('Please enter a descriptive rule name.');
      return;
    }
    if (!column) {
      setFormError('Please select a target column.');
      return;
    }

    onSaveRule({
      name: ruleName.trim(),
      column,
      operator,
      threshold,
      error_level: errorLevel,
      description: description.trim() || `Validation condition on column [${column}]`,
      is_active: true,
    });

    // Reset & close
    setRuleName('');
    setDescription('');
    setFormError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white w-full max-w-xl rounded-2xl border border-slate-200 shadow-2xl overflow-hidden animate-modal-in">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200 bg-slate-50/80">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-600">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-slate-900">Create Business Quality Rule</h3>
              <p className="text-xs text-slate-500 font-medium">Define custom assertions & violation flags</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {formError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{formError}</span>
            </div>
          )}

          {/* Rule Name */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Rule Name *
            </label>
            <input
              type="text"
              placeholder="e.g. Adult Age Limit or Valid Email Regex"
              value={ruleName}
              onChange={(e) => {
                setRuleName(e.target.value);
                setFormError(null);
              }}
              className="glass-input w-full px-3.5 py-2 rounded-xl text-sm font-medium"
              required
            />
          </div>

          {/* Target Column & Operator & Threshold */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Target Column *
              </label>
              <select
                value={column}
                onChange={(e) => setColumn(e.target.value)}
                className="glass-input w-full px-3 py-2 rounded-xl text-sm bg-white font-medium"
              >
                {columns.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Operator *
              </label>
              <select
                value={operator}
                onChange={(e) => setOperator(e.target.value as RuleOperator)}
                className="glass-input w-full px-3 py-2 rounded-xl text-sm bg-white font-medium"
              >
                <option value=">">&gt; (Greater than)</option>
                <option value="<">&lt; (Less than)</option>
                <option value=">=">&gt;= (Greater or equal)</option>
                <option value="<=">&lt;= (Less or equal)</option>
                <option value="==">== (Equal to)</option>
                <option value="!=">!= (Not equal to)</option>
                <option value="contains">Contains substring</option>
                <option value="not_contains">Does not contain</option>
                <option value="is_null">Is Null / Missing</option>
                <option value="not_null">Is Not Null</option>
                <option value="regex">Regex Match</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Threshold / Value
              </label>
              <input
                type="text"
                placeholder="18 or @domain.com"
                value={threshold}
                onChange={(e) => setThreshold(e.target.value)}
                className="glass-input w-full px-3 py-2 rounded-xl text-sm font-mono"
              />
            </div>
          </div>

          {/* Error Severity Level */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Severity Level
            </label>
            <div className="grid grid-cols-3 gap-3">
              {(['CRITICAL', 'WARNING', 'INFO'] as ErrorLevel[]).map((level) => {
                const isSelected = errorLevel === level;
                return (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setErrorLevel(level)}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${
                      isSelected
                        ? level === 'CRITICAL'
                          ? 'bg-rose-50 border-rose-500 text-rose-700 shadow-xs'
                          : level === 'WARNING'
                          ? 'bg-amber-50 border-amber-500 text-amber-700 shadow-xs'
                          : 'bg-sky-50 border-sky-500 text-sky-700 shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    <span>{level}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Rule Description
            </label>
            <textarea
              placeholder="Explain the business reason for this data quality check..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="glass-input w-full px-3.5 py-2 rounded-xl text-xs font-medium"
            />
          </div>

          {/* Live Syntax Preview */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center space-x-1">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>Generated SQL/Logic Expression</span>
            </div>
            <code className="text-xs font-mono text-indigo-700 font-semibold block">
              WHERE NOT ({column} {operator} {typeof threshold === 'string' ? `'${threshold}'` : threshold}) THEN RAISE {errorLevel}
            </code>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors shadow-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-500/20 transition-all flex items-center space-x-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Create Rule</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RuleBuilderModal;
