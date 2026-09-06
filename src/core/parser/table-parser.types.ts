/** A table cell with its span metadata, before rowspan/colspan expansion. */
export interface RawCell {
  text: string;
  colspan: number;
  rowspan: number;
}
