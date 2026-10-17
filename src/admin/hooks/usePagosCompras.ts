import { useQuery } from '@tanstack/react-query';
import { getPagosComprasAction } from '../actions/get-pagos-compras.action';
import { getComprasAction } from '../actions/get-compras.action';
import { getProveedoresAction } from '../actions/get-proveedores.action';

export const usePagosCompras = () => {
  const pagosComprasQuery = useQuery({
    queryKey: ['pagos-compras-listado'],
    queryFn: getPagosComprasAction,
    staleTime: 1000 * 60 * 3, // 3 minutos
  });

  const comprasQuery = useQuery({
    queryKey: ['compras-listado'],
    queryFn: getComprasAction,
    staleTime: 1000 * 60 * 5,
  });

  const proveedoresQuery = useQuery({
    queryKey: ['proveedores-listado'],
    queryFn: getProveedoresAction,
    staleTime: 1000 * 60 * 5,
  });

  const isLoading =
    pagosComprasQuery.isLoading ||
    comprasQuery.isLoading ||
    proveedoresQuery.isLoading;

  return {
    pagosCompras: pagosComprasQuery.data || [],
    compras: comprasQuery.data || [],
    proveedores: proveedoresQuery.data || [],
    isLoading,
    isError: pagosComprasQuery.isError,
    refetch: () => {
      pagosComprasQuery.refetch();
      comprasQuery.refetch();
      proveedoresQuery.refetch();
    },
  };
};
