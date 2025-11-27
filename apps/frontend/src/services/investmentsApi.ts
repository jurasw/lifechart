import api from './api';
import type { Investment } from '@/types/investment';

export const investmentsApi = {
  getAll: async (): Promise<Investment[]> => {
    const response = await api.get('/investments');
    return response.data.map((inv: any) => ({
      ...inv,
      id: inv._id || inv.id,
      profit: inv.profit ?? 0,
      profitPercent: inv.profitPercent ?? 0,
      purchasePrice: inv.purchasePrice ?? 0,
      currentPrice: inv.currentPrice ?? undefined,
    }));
  },

  create: async (investment: Omit<Investment, 'id'>): Promise<Investment> => {
    const response = await api.post('/investments', investment);
    return {
      ...response.data,
      id: response.data._id || response.data.id,
    };
  },

  update: async (id: string, investment: Partial<Investment>): Promise<Investment> => {
    const response = await api.patch(`/investments/${id}`, investment);
    return {
      ...response.data,
      id: response.data._id || response.data.id,
    };
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/investments/${id}`);
  },

  updatePrices: async (updates: { id: string; currentPrice: number; lastUpdated: number }[]): Promise<void> => {
    await api.post('/investments/update-prices', updates);
  },

  import: async (investments: Omit<Investment, 'id'>[]): Promise<{ created: number; skipped: number }> => {
    const response = await api.post('/investments/import', { investments });
    return response.data;
  },

  clearAll: async (): Promise<{ deleted: number }> => {
    const response = await api.delete('/investments/clear-all');
    return response.data;
  },
};

