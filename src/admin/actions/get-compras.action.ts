import { apiClient } from '@/api/apiClient';
import type { ApiResponse } from '../interfaces/api-response.interface';
import type { CompraItem } from '../interfaces/compra.interface';

export const getComprasAction = async (): Promise<CompraItem[]> => {
  try {
    const { data } = await apiClient.get<ApiResponse<CompraItem[]> | CompraItem[]>('/compras');
    return Array.isArray(data) ? data : data.data || [];
  } catch (error) {
    console.error('Error al obtener compras:', error);
    return [];
  }
};
