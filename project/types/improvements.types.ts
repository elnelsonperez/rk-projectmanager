/**
 * Input: Item to be improved by AI
 */
export interface ItemToImprove {
  id: number;
  item_name: string;
  description: string | null;
  category: string;
}

/**
 * AI response for single item improvement
 */
export interface ItemImprovement {
  id: number;
  improved_name: string;
  improved_description: string;
  improved_category: string;
}

/**
 * Comparison item for UI display
 * Contains both original and improved values
 */
export interface ItemComparison {
  id: number;
  original_name: string;
  original_description: string;
  original_category: string;
  improved_name: string;
  improved_description: string;
  improved_category: string;
  has_changes: boolean;
  accepted: boolean; // User's accept/reject decision
}

/**
 * API request payload for improve items endpoint
 */
export interface ImproveItemsRequest {
  projectId: number;
  items: ItemToImprove[];
}

/**
 * API response payload from improve items endpoint
 */
export interface ImproveItemsResponse {
  success: boolean;
  improvements: ItemImprovement[];
  items_processed: number;
  items_with_changes: number;
  message?: string;
  error?: string;
}
