import { apiClient } from '@/api/apiClient';
import type { ApiResponse } from '../interfaces/api-response.interface';
import type { CompraItem } from '../interfaces/compra.interface';

export const getCompraByIdAction = async (id: number | string): Promise<CompraItem | null> => {
  try {
    const { data } = await apiClient.get<ApiResponse<CompraItem> | CompraItem>(`/compras/${id}`);
    if ('data' in data) {
      return data.data;
    }
    return data;
  } catch (error) {
    console.error('Error al obtener compra por ID:', error);
    return null;
  }
};
