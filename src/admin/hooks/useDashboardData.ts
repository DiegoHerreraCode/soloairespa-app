import { useQuery } from '@tanstack/react-query';
import { getOrdenesAction } from '../actions/get-ordenes.action';
import { getInventarioAction } from '../actions/get-inventario.action';
import { getRepuestosAction } from '../actions/get-repuestos.action';
import { getPagosComprasAction } from '../actions/get-pagos-compras.action';

export const useDashboardData = () => {
  const ordenesQuery = useQuery({
    queryKey: ['dashboard', 'ordenes'],
    queryFn: getOrdenesAction,
    staleTime: 1000 * 60 * 3, // 3 minutos
  });

  const inventarioQuery = useQuery({
    queryKey: ['dashboard', 'inventario'],
    queryFn: getInventarioAction,
    staleTime: 1000 * 60 * 3,
  });

  const repuestosQuery = useQuery({
    queryKey: ['dashboard', 'repuestos'],
    queryFn: getRepuestosAction,
    staleTime: 1000 * 60 * 3,
  });

  const pagosComprasQuery = useQuery({
    queryKey: ['dashboard', 'pagos-compras'],
    queryFn: getPagosComprasAction,
    staleTime: 1000 * 60 * 3,
  });

  const isLoading =
    ordenesQuery.isLoading ||
    inventarioQuery.isLoading ||
    repuestosQuery.isLoading ||
    pagosComprasQuery.isLoading;

  return {
    ordenes: ordenesQuery.data || [],
    inventario: inventarioQuery.data || [],
    repuestos: repuestosQuery.data || [],
    pagosCompras: pagosComprasQuery.data || [],
    isLoading,
    refetchAll: () => {
      ordenesQuery.refetch();
      inventarioQuery.refetch();
      repuestosQuery.refetch();
      pagosComprasQuery.refetch();
    },
  };
};
