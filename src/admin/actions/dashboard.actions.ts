import { apiClient } from '@/api/apiClient';
import type {
  OrdenItem,
  InventarioItem,
  RepuestoItem,
  PagoCompraItem,
  PagoClienteItem,
  TipoOrdenItem,
  ReparacionItem,
} from '../interfaces/dashboard.interface';

interface ApiResponse<T> {
  message: string;
  data: T;
}

export const getOrdenesAction = async (): Promise<OrdenItem[]> => {
  try {
    const { data } = await apiClient.get<ApiResponse<OrdenItem[]> | OrdenItem[]>('/ordenes');
    return Array.isArray(data) ? data : data.data || [];
  } catch (error) {
    console.error('Error al obtener órdenes:', error);
    return [];
  }
};

export const getInventarioAction = async (): Promise<InventarioItem[]> => {
  try {
    const { data } = await apiClient.get<ApiResponse<InventarioItem[]> | InventarioItem[]>('/inventario');
    return Array.isArray(data) ? data : data.data || [];
  } catch (error) {
    console.error('Error al obtener inventario:', error);
    return [];
  }
};

export const getRepuestosAction = async (): Promise<RepuestoItem[]> => {
  try {
    const { data } = await apiClient.get<ApiResponse<RepuestoItem[]> | RepuestoItem[]>('/repuestos');
    return Array.isArray(data) ? data : data.data || [];
  } catch (error) {
    console.error('Error al obtener repuestos:', error);
    return [];
  }
};

export const getPagosComprasAction = async (): Promise<PagoCompraItem[]> => {
  try {
    const { data } = await apiClient.get<ApiResponse<PagoCompraItem[]> | PagoCompraItem[]>('/pagos-compras');
    return Array.isArray(data) ? data : data.data || [];
  } catch (error) {
    console.error('Error al obtener pagos a compras:', error);
    return [];
  }
};

export const getPagosClientesAction = async (): Promise<PagoClienteItem[]> => {
  try {
    const { data } = await apiClient.get<ApiResponse<PagoClienteItem[]> | PagoClienteItem[]>('/pagos-clientes');
    return Array.isArray(data) ? data : data.data || [];
  } catch (error) {
    console.error('Error al obtener pagos de clientes:', error);
    return [];
  }
};

export const getTiposOrdenesAction = async (): Promise<TipoOrdenItem[]> => {
  try {
    const { data } = await apiClient.get<ApiResponse<TipoOrdenItem[]> | TipoOrdenItem[]>('/tipos-ordenes');
    return Array.isArray(data) ? data : data.data || [];
  } catch (error) {
    console.error('Error al obtener tipos de órdenes:', error);
    return [];
  }
};

export const getReparacionesAction = async (): Promise<ReparacionItem[]> => {
  try {
    const { data } = await apiClient.get<ApiResponse<ReparacionItem[]> | ReparacionItem[]>('/reparaciones');
    return Array.isArray(data) ? data : data.data || [];
  } catch (error) {
    console.error('Error al obtener reparaciones:', error);
    return [];
  }
};
