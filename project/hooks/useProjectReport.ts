import { useQuery } from '@tanstack/react-query'
import { getProjectReport } from '../lib/supabase'

export type ReportItem = {
  item_id: number;
  category: string;
  area: string | null;
  item_name: string;
  description: string | null;
  estimated_cost: number | null;
  internal_cost: number | null;
  actual_cost: number | null;
  difference_percentage: number | null;
  amount_paid: number;
  pending_to_pay: number;
  supplier_id: number | null;
  supplier_name: string | null;
  internal_amount_paid: number;
};

export type AreaSubtotal = {
  area: string;
  estimated_cost: number;
  actual_cost: number;
  amount_paid: number;
  pending_to_pay: number;
};

export type GroupedReportData = {
  area: string;
  items: ReportItem[];
  totals: {
    estimated_cost: number;
    actual_cost: number;
    amount_paid: number;
    internal_amount_paid: number;
    pending_to_pay: number;
  };
};

export function useProjectReport(projectId: number | undefined) {
  return useQuery({
    queryKey: ['projectReport', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      return getProjectReport(projectId) as Promise<ReportItem[]>;
    },
    enabled: !!projectId,
    staleTime: 0, // Data is always stale, forcing a refetch
    refetchOnMount: true, // Refetch whenever component mounts
    refetchOnWindowFocus: true, // Refetch when window regains focus
  });
}

// Helper function to group report data by area with subtotals
export function groupReportDataByArea(reportData: ReportItem[]): GroupedReportData[] {
  if (!reportData || reportData.length === 0) return [];
  
  const grouped: Record<string, GroupedReportData> = {};
  
  reportData.forEach(item => {
    const area = item.area || 'Sin Área';
    
    if (!grouped[area]) {
      grouped[area] = {
        area,
        items: [],
        totals: {
          estimated_cost: 0,
          actual_cost: 0,
          amount_paid: 0,
          internal_amount_paid: 0,
          pending_to_pay: 0
        }
      };
    }
    
    grouped[area].items.push(item);
    
    // Calculate totals
    grouped[area].totals.estimated_cost += item.estimated_cost || 0;
    grouped[area].totals.actual_cost += item.actual_cost || 0;
    grouped[area].totals.amount_paid += item.amount_paid || 0;
    grouped[area].totals.internal_amount_paid += item.internal_amount_paid || 0;
    grouped[area].totals.pending_to_pay += item.pending_to_pay || 0;
  });
  
  return Object.values(grouped);
}

// Helper function to calculate grand totals
export function calculateGrandTotals(groupedData: GroupedReportData[]): {
  estimated_cost: number;
  actual_cost: number;
  amount_paid: number;
  internal_amount_paid: number;
  pending_to_pay: number;
} {
  return groupedData.reduce((totals, group) => {
    return {
      estimated_cost: totals.estimated_cost + group.totals.estimated_cost,
      actual_cost: totals.actual_cost + group.totals.actual_cost,
      amount_paid: totals.amount_paid + group.totals.amount_paid,
      internal_amount_paid: totals.internal_amount_paid + group.totals.internal_amount_paid,
      pending_to_pay: totals.pending_to_pay + group.totals.pending_to_pay
    };
  }, {
    estimated_cost: 0,
    actual_cost: 0,
    amount_paid: 0,
    internal_amount_paid: 0,
    pending_to_pay: 0
  });
}