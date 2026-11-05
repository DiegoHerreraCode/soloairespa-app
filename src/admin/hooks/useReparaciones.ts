import { useQuery } from '@tanstack/react-query';
import { getReparacionesAction } from '../actions/get-reparaciones.action';
import { getRepuestosAction } from '../actions/get-repuestos.action';
import { getOrdenesAction } from '../actions/get-ordenes.action';

export const useReparaciones = () => {
  const reparacionesQuery = useQuery({
    queryKey: ['reparaciones-listado'],
    queryFn: getReparacionesAction,
    staleTime: 1000 * 60 * 3, // 3 minutos
  });

  const repuestosQuery = useQuery({
    queryKey: ['repuestos-listado'],
    queryFn: getRepuestosAction,
    staleTime: 1000 * 60 * 5,
  });

  const ordenesQuery = useQuery({
    queryKey: ['ordenes-listado'],
    queryFn: getOrdenesAction,
    staleTime: 1000 * 60 * 3,
  });

  return {
    reparaciones: reparacionesQuery.data || [],
    repuestos: repuestosQuery.data || [],
    ordenes: ordenesQuery.data || [],
    isLoading: reparacionesQuery.isLoading || repuestosQuery.isLoading || ordenesQuery.isLoading,
    isError: reparacionesQuery.isError,
    refetch: () => {
      reparacionesQuery.refetch();
      repuestosQuery.refetch();
      ordenesQuery.refetch();
    },
  };
};
