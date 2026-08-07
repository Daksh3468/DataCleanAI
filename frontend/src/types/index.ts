// TypeScript definitions for DataCleanAI Platform

export interface Dataset {
  upload_id: string;
  filename: string;
  file_size: number;
  row_count: number;
  column_count: number;
  uploaded_at: string;
  columns: string[];
  sample_rows?: Record<string, any>[];
}

export interface UploadResponse {
  success: boolean;
  upload_id: string;
  filename: string;
  file_size: number;
  row_count: number;
  column_count: number;
  columns: string[];
  message: string;
}

export interface ColumnStats {
  name: string;
  type: string;
  count: number;
  missing_count: number;
  missing_percentage: number;
  unique_count: number;
  mean?: number | null;
  std?: number | null;
  min?: any;
  max?: any;
  top_values?: Record<string, number>;
  sample_values?: any[];
}

export interface QualityMetrics {
  completeness: number; // 0-100
  accuracy: number;     // 0-100
  consistency: number;  // 0-100
  timeliness: number;   // 0-100
  overall: number;      // 0-100 weighted average
}

export interface QualityScoreResponse {
  overall_score: number;
  dimension_scores: {
    completeness: number;
    accuracy: number;
    consistency: number;
    timeliness: number;
  };
  total_cells: number;
  missing_cells: number;
  duplicate_rows: number;
  outlier_count: number;
  invalid_formats: number;
  status: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR';
  score_delta?: number; // Pre vs Post score difference
}

export interface ProfileResponse {
  upload_id: string;
  filename: string;
  row_count: number;
  column_count: number;
  total_missing_cells: number;
  total_duplicate_rows: number;
  memory_usage_bytes: number;
  columns_stats: Record<string, ColumnStats>;
  quality_scores: QualityScoreResponse;
  data_preview: Record<string, any>[];
}

export type RuleOperator = '>' | '<' | '>=' | '<=' | '==' | '!=' | 'contains' | 'not_contains' | 'is_null' | 'not_null' | 'regex';
export type ErrorLevel = 'CRITICAL' | 'WARNING' | 'INFO';

export interface CustomRule {
  id: string;
  name: string;
  column: string;
  operator: RuleOperator;
  threshold: string | number;
  error_level: ErrorLevel;
  description: string;
  is_active: boolean;
  created_at?: string;
  violation_count?: number;
}

export interface RuleViolation {
  rule_id: string;
  rule_name: string;
  column: string;
  row_index: number;
  actual_value: any;
  expected_condition: string;
  error_level: ErrorLevel;
}

export interface EvaluateRulesResponse {
  total_evaluated: number;
  total_violations: number;
  passed_rules: number;
  failed_rules: number;
  violations: RuleViolation[];
  summary_by_rule: Record<string, number>;
}

export interface MissingValueStrategy {
  method: 'drop' | 'mean' | 'median' | 'mode' | 'constant';
  fill_value?: string | number;
  columns?: string[];
}

export interface DeduplicateStrategy {
  enabled: boolean;
  subset_columns?: string[];
  keep: 'first' | 'last' | false;
}

export interface OutlierStrategy {
  enabled: boolean;
  columns?: string[];
  method: 'zscore' | 'iqr';
  threshold: number; // e.g. 3.0 for zscore, 1.5 for IQR
  action: 'remove' | 'cap' | 'nullify';
}

export interface StringNormalizationStrategy {
  enabled: boolean;
  trim_whitespace: boolean;
  case_format?: 'lower' | 'upper' | 'title' | 'none';
  remove_special_chars: boolean;
  columns?: string[];
}

export interface TypeCastingStrategy {
  enabled: boolean;
  column_types?: Record<string, 'int' | 'float' | 'string' | 'datetime' | 'bool'>;
}

export interface CleaningOptions {
  missing_values: MissingValueStrategy;
  deduplication: DeduplicateStrategy;
  outliers: OutlierStrategy;
  string_normalization: StringNormalizationStrategy;
  type_casting: TypeCastingStrategy;
}

export interface ChangelogItem {
  id: string;
  timestamp: string;
  action: string;
  category: 'MISSING_VALUES' | 'DEDUPLICATION' | 'OUTLIERS' | 'NORMALIZATION' | 'TYPE_CASTING' | 'CUSTOM_RULE';
  affected_rows: number;
  affected_columns: string[];
  details: string;
}

export interface CleanResponse {
  success: boolean;
  message: string;
  original_rows: number;
  cleaned_rows: number;
  rows_removed: number;
  initial_quality_score: number;
  cleaned_quality_score: number;
  quality_gain: number;
  changelog: ChangelogItem[];
  preview: Record<string, any>[];
  download_urls: {
    csv: string;
    excel: string;
    html: string;
    pdf: string;
  };
}

