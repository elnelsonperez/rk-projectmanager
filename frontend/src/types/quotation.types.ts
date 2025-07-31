export interface QuotationItem {
  id: string;
  description: string; // Supports Markdown
  amount: number;
}

export interface Quotation {
  clientName: string;
  items: QuotationItem[];
  total: number;
  createdAt: Date;
}

export interface QuotationFormData {
  clientName: string;
  items: QuotationItem[];
}