import axios from 'axios';
import {
  UploadResponse,
  ProfileResponse,
  QualityScoreResponse,
  CustomRule,
  EvaluateRulesResponse,
  CleaningOptions,
  CleanResponse,
} from '../types';

const API_BASE_URL = 'http://localhost:8000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 60000,
});

// Minimal empty fallbacks – no mock data, no hardcoded datasets
let MOCK_RULES: CustomRule[] = [];

export const api = {
  // Reset all local session caches on new upload
  resetSession: () => {
    MOCK_RULES = [];
    if (typeof window !== 'undefined') {
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch (e) {
        // Ignore storage errors
      }
    }
  },

  // ─── 1. Upload Dataset ────────────────────────────────────────────────────
  uploadDataset: async (file: File, onProgress?: (pct: number) => void): Promise<UploadResponse> => {
    api.resetSession();

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await apiClient.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total && onProgress) {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress(percent);
          }
        },
      });

      const raw = response.data;
      // Normalize backend UploadSummaryResponse → frontend UploadResponse
      return {
        success: true,
        upload_id: String(raw.upload_id),
        filename: raw.filename,
        file_size: raw.file_size ?? 0,
        row_count: raw.row_count ?? 0,
        column_count: raw.column_count ?? 0,
        columns: raw.columns ?? [],
        message: raw.message ?? 'Uploaded successfully',
      };
    } catch (err) {
      // Offline fallback: parse CSV headers client-side so UI isn't broken
      console.warn('Backend API unreachable, parsing file client-side');
      let headers: string[] = [];
      let rowCount = 0;

      try {
        const text = await file.text();
        const lines = text.split('\n').filter((l) => l.trim().length > 0);
        if (lines.length > 0) {
          headers = lines[0].split(',').map((h) => h.trim().replace(/^["']|["']$/g, ''));
          rowCount = Math.max(0, lines.length - 1);
        }
      } catch (_) {}

      return {
        success: true,
        upload_id: `local_${Date.now()}`,
        filename: file.name,
        file_size: file.size,
        row_count: rowCount,
        column_count: headers.length,
        columns: headers,
        message: 'File parsed locally (backend unavailable)',
      };
    }
  },

  // ─── 2. Get Data Profile ──────────────────────────────────────────────────
  // Backend: GET /api/dataset/{upload_id}/profile
  // Returns: DatasetProfileResponse { upload_id, filename, row_count, col_count, columns: {name: ColumnProfile}, sample_rows }
  getProfile: async (uploadId?: string): Promise<ProfileResponse> => {
    if (!uploadId) throw new Error('No upload_id provided');
    const response = await apiClient.get(`/dataset/${uploadId}/profile`);
    const raw = response.data;

    // Normalize backend columns dict → frontend columns_stats format
    const columns_stats: ProfileResponse['columns_stats'] = {};
    for (const [colName, colData] of Object.entries<any>(raw.columns ?? {})) {
      columns_stats[colName] = {
        name: colData.name ?? colName,
        type: colData.dtype ?? 'unknown',
        count: (raw.row_count ?? 0) - (colData.missing_count ?? 0),
        missing_count: colData.missing_count ?? 0,
        missing_percentage: colData.missing_pct ?? 0,
        unique_count: colData.unique_count ?? 0,
        mean: colData.mean ?? null,
        std: colData.std ?? null,
        min: colData.min ?? null,
        max: colData.max ?? null,
        sample_values: colData.sample_values ?? [],
      };
    }

    return {
      upload_id: String(raw.upload_id),
      filename: raw.filename,
      row_count: raw.row_count ?? 0,
      column_count: raw.col_count ?? 0,
      total_missing_cells: Object.values(columns_stats).reduce((sum, c) => sum + c.missing_count, 0),
      total_duplicate_rows: 0,
      memory_usage_bytes: raw.memory_bytes ?? 0,
      columns_stats,
      quality_scores: {
        overall_score: 0,
        dimension_scores: { completeness: 0, accuracy: 0, consistency: 0, timeliness: 0 },
        total_cells: 0,
        missing_cells: 0,
        duplicate_rows: 0,
        outlier_count: 0,
        invalid_formats: 0,
        status: 'FAIR',
      },
      data_preview: raw.sample_rows ?? [],
    };
  },

  // ─── 3. Get Quality Scores ────────────────────────────────────────────────
  // Backend: GET /api/dataset/{upload_id}/quality
  // Returns: QualityScoreResponse { upload_id, overall_score, dimensions, column_scores }
  getQualityScores: async (uploadId?: string): Promise<QualityScoreResponse> => {
    if (!uploadId) throw new Error('No upload_id provided');
    const response = await apiClient.get(`/dataset/${uploadId}/quality`);
    const raw = response.data;

    const dims = raw.dimensions ?? {};
    const overallScore = raw.overall_score ?? 0;

    return {
      overall_score: overallScore,
      dimension_scores: {
        completeness: dims.completeness ?? 0,
        accuracy: dims.validity ?? 0,       // backend "validity" ↔ frontend "accuracy"
        consistency: dims.consistency ?? 0,
        timeliness: dims.uniqueness ?? 0,   // backend "uniqueness" ↔ frontend "timeliness"
      },
      total_cells: 0,
      missing_cells: 0,
      duplicate_rows: 0,
      outlier_count: 0,
      invalid_formats: 0,
      status: overallScore >= 90 ? 'EXCELLENT' : overallScore >= 75 ? 'GOOD' : overallScore >= 50 ? 'FAIR' : 'POOR',
    };
  },

  // ─── 4. Custom Rules API ──────────────────────────────────────────────────
  // Backend: GET /api/rules  →  returns CustomRuleResponse[] { id, name, rule_type, target_column, parameters, is_active, created_at }
  getRules: async (): Promise<CustomRule[]> => {
    try {
      const response = await apiClient.get('/rules');
      return (response.data ?? []).map((r: any) => ({
        id: String(r.id),
        name: r.name,
        column: r.target_column,
        operator: r.rule_type as any,
        threshold: r.parameters ?? '',
        error_level: 'WARNING' as const,
        description: '',
        is_active: r.is_active ?? true,
        created_at: r.created_at,
        violation_count: 0,
      }));
    } catch (err) {
      return MOCK_RULES;
    }
  },

  // Backend: POST /api/rules  body: { name, rule_type, target_column, parameters, is_active }
  createRule: async (rule: Omit<CustomRule, 'id'>): Promise<CustomRule> => {
    try {
      const payload = {
        name: rule.name,
        rule_type: rule.operator,
        target_column: rule.column,
        parameters: rule.threshold,
        is_active: rule.is_active,
      };
      const response = await apiClient.post('/rules', payload);
      const r = response.data;
      return {
        id: String(r.id),
        name: r.name,
        column: r.target_column,
        operator: r.rule_type as any,
        threshold: r.parameters ?? '',
        error_level: rule.error_level,
        description: rule.description,
        is_active: r.is_active,
        created_at: r.created_at,
        violation_count: 0,
      };
    } catch (err) {
      const newRule: CustomRule = {
        ...rule,
        id: `rule_${Date.now()}`,
        created_at: new Date().toISOString(),
        violation_count: 0,
      };
      MOCK_RULES.push(newRule);
      return newRule;
    }
  },

  // Backend: DELETE /api/rules/{rule_id}
  deleteRule: async (id: string): Promise<void> => {
    try {
      await apiClient.delete(`/rules/${id}`);
    } catch (err) {
      MOCK_RULES = MOCK_RULES.filter((r) => r.id !== id);
    }
  },

  // Backend: POST /api/dataset/{upload_id}/evaluate-rules
  evaluateRules: async (uploadId?: string): Promise<EvaluateRulesResponse> => {
    if (!uploadId) throw new Error('No upload_id provided');
    const response = await apiClient.post(`/dataset/${uploadId}/evaluate-rules`, {});
    const raw = response.data;

    const evaluated = raw.evaluated_rules ?? [];
    const violations = evaluated.flatMap((r: any) => {
      if ((r.violating_indices ?? []).length === 0) return [];
      return (r.violating_indices as number[]).slice(0, 20).map((idx: number) => ({
        rule_id: String(r.rule_id ?? ''),
        rule_name: r.name,
        column: r.column,
        row_index: idx,
        actual_value: null,
        expected_condition: `${r.rule_type} ${r.value ?? ''}`,
        error_level: 'WARNING' as const,
      }));
    });

    const summary_by_rule: Record<string, number> = {};
    for (const r of evaluated) {
      summary_by_rule[r.name] = r.violating_count ?? 0;
    }

    const failedRules = evaluated.filter((r: any) => (r.violating_count ?? 0) > 0).length;

    return {
      total_evaluated: raw.total_rules ?? 0,
      total_violations: raw.total_violations ?? 0,
      passed_rules: (raw.total_rules ?? 0) - failedRules,
      failed_rules: failedRules,
      violations,
      summary_by_rule,
    };
  },

  // ─── 5. Clean Dataset ─────────────────────────────────────────────────────
  // Backend: POST /api/dataset/{upload_id}/clean  body: CleaningOptionsRequest
  cleanDataset: async (options: CleaningOptions, uploadId?: string): Promise<CleanResponse> => {
    if (!uploadId) throw new Error('No upload_id provided');

    // Map frontend CleaningOptions → backend CleaningOptionsRequest
    const payload = {
      remove_duplicates: options.deduplication?.enabled ?? false,
      duplicate_cols: options.deduplication?.subset_columns ?? null,
      duplicate_keep: options.deduplication?.keep === false ? 'false' : (options.deduplication?.keep ?? 'first'),

      trim_whitespace: options.string_normalization?.trim_whitespace ?? false,
      whitespace_cols: options.string_normalization?.columns ?? null,

      handle_missing: options.missing_values?.method !== undefined && options.missing_values?.method !== 'drop' ||
                      (options.missing_values?.method === 'drop' && (options.missing_values?.columns?.length ?? 0) > 0),
      missing_strategy: options.missing_values?.method ?? 'drop',
      missing_cols: options.missing_values?.columns ?? null,
      missing_custom_val: options.missing_values?.fill_value ?? null,

      convert_numeric: options.type_casting?.enabled ?? false,
      numeric_cols: options.type_casting?.column_types
        ? Object.entries(options.type_casting.column_types)
            .filter(([, t]) => t === 'float' || t === 'int')
            .map(([col]) => col)
        : null,

      remove_outliers: options.outliers?.enabled ?? false,
      outlier_method: options.outliers?.method ?? 'iqr',
      outlier_cols: options.outliers?.columns ?? null,
    };

    const response = await apiClient.post(`/dataset/${uploadId}/clean`, payload);
    const raw = response.data;

    return {
      success: true,
      message: 'Dataset cleaned successfully',
      original_rows: raw.original_row_count ?? 0,
      cleaned_rows: raw.cleaned_row_count ?? 0,
      rows_removed: (raw.original_row_count ?? 0) - (raw.cleaned_row_count ?? 0),
      initial_quality_score: raw.original_quality_score ?? 0,
      cleaned_quality_score: raw.cleaned_quality_score ?? 0,
      quality_gain: (raw.cleaned_quality_score ?? 0) - (raw.original_quality_score ?? 0),
      changelog: (raw.changelog ?? []).map((c: any, i: number) => ({
        id: `chg_${i}`,
        timestamp: new Date().toISOString(),
        action: c.action ?? c.details ?? '',
        category: 'NORMALIZATION' as const,
        affected_rows: c.rows_affected ?? 0,
        affected_columns: c.column_name ? [c.column_name] : [],
        details: c.details ?? '',
      })),
      preview: raw.sample_rows ?? [],
      download_urls: {
        csv: `${API_BASE_URL}/dataset/${uploadId}/export/csv`,
        excel: `${API_BASE_URL}/dataset/${uploadId}/export/xlsx`,
        html: `${API_BASE_URL}/dataset/${uploadId}/export/html`,
        pdf: `${API_BASE_URL}/dataset/${uploadId}/export/pdf`,
      },
    };
  },

  // ─── 6. Export ───────────────────────────────────────────────────────────
  getExportUrl: (format: 'csv' | 'xlsx' | 'html', uploadId?: string): string => {
    if (!uploadId) return '';
    return `${API_BASE_URL}/dataset/${uploadId}/export/${format}`;
  },

  // ─── 7. AI / ML Endpoints ────────────────────────────────────────────────
  detectAnomalies: async (uploadId?: string, contamination: number = 0.05) => {
    if (!uploadId) throw new Error('No upload_id provided');
    const response = await apiClient.post('/ai/detect-anomalies', {
      upload_id: Number(uploadId),
      contamination,
    });
    return response.data;
  },

  imputeKNN: async (uploadId?: string, nNeighbors: number = 5) => {
    if (!uploadId) throw new Error('No upload_id provided');
    const response = await apiClient.post('/ai/impute-knn', {
      upload_id: Number(uploadId),
      n_neighbors: nNeighbors,
    });
    return response.data;
  },

  fuzzyDeduplicate: async (uploadId?: string, threshold: number = 85.0) => {
    if (!uploadId) throw new Error('No upload_id provided');
    const response = await apiClient.post('/ai/fuzzy-dedup', {
      upload_id: Number(uploadId),
      threshold,
    });
    return response.data;
  },

  getSemanticTypes: async (uploadId?: string) => {
    if (!uploadId) throw new Error('No upload_id provided');
    const response = await apiClient.get('/ai/semantic-types', {
      params: { upload_id: Number(uploadId) },
    });
    return response.data;
  },

  // ─── 8. SQL Analytics ────────────────────────────────────────────────────
  executeSQL: async (query: string, uploadId?: string) => {
    if (!uploadId) throw new Error('No upload_id provided');
    const response = await apiClient.post('/analytics/sql', {
      upload_id: Number(uploadId),
      query,
    });
    return response.data;
  },

  getCorrelationMatrix: async (uploadId?: string, method: string = 'pearson') => {
    if (!uploadId) throw new Error('No upload_id provided');
    const response = await apiClient.get('/analytics/correlation', {
      params: { upload_id: Number(uploadId), method },
    });
    return response.data;
  },

  runCopilot: async (prompt: string, uploadId?: string, apiKey?: string) => {
    if (!uploadId) throw new Error('No upload_id provided');
    const response = await apiClient.post('/analytics/copilot', {
      upload_id: Number(uploadId),
      prompt,
      api_key: apiKey,
    });
    return response.data;
  },
};
