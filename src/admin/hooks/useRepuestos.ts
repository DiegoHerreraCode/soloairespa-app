import { useQuery } from '@tanstack/react-query';
import { getRepuestosAction } from '../actions/get-repuestos.action';
import { getInventarioAction } from '../actions/get-inventario.action';
import { getOrdenesAction } from '../actions/get-ordenes.action';

export const useRepuestos = () => {
  const repuestosQuery = useQuery({
    queryKey: ['repuestos-listado'],
    queryFn: getRepuestosAction,
    staleTime: 1000 * 60 * 3, // 3 minutos
  });

  const inventarioQuery = useQuery({
    queryKey: ['inventario-listado'],
    queryFn: getInventarioAction,
    staleTime: 1000 * 60 * 5,
  });

  const ordenesQuery = useQuery({
    queryKey: ['ordenes-listado'],
    queryFn: getOrdenesAction,
    staleTime: 1000 * 60 * 5,
  });

  return {
    repuestos: repuestosQuery.data || [],
    inventario: inventarioQuery.data || [],
    ordenes: ordenesQuery.data || [],
    isLoading: repuestosQuery.isLoading || inventarioQuery.isLoading || ordenesQuery.isLoading,
    isError: repuestosQuery.isError,
    refetch: () => {
      repuestosQuery.refetch();
      inventarioQuery.refetch();
      ordenesQuery.refetch();
    },
  };
};
