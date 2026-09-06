export interface ColumnCandidate {
  label: string;
  values: number[];
  /** Fraction of body rows that parsed to a number (0..1). */
  ratio: number;
}
