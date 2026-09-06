export interface PipelineResult {
  outputPath: string;
  label: string;
  pointCount: number;
}

export interface GenerateOptions {
  /** Override the auto-detected column, matched by header (case-insensitive). */
  column?: string;
}
