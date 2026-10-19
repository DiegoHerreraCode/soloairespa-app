import { useQuery } from '@tanstack/react-query';
import { getEquiposAction } from '../actions/get-equipos.action';
import { getInventarioAction } from '../actions/get-inventario.action';
import { getComprasAction } from '../actions/get-compras.action';

export const useEquipos = () => {
  const equiposQuery = useQuery({
    queryKey: ['equipos-listado'],
    queryFn: getEquiposAction,
    staleTime: 1000 * 60 * 3, // 3 minutos
  });

  const inventarioQuery = useQuery({
    queryKey: ['inventario-listado'],
    queryFn: getInventarioAction,
    staleTime: 1000 * 60 * 5,
  });

  const comprasQuery = useQuery({
    queryKey: ['compras-listado'],
    queryFn: getComprasAction,
    staleTime: 1000 * 60 * 5,
  });

  return {
    equipos: equiposQuery.data || [],
    inventario: inventarioQuery.data || [],
    compras: comprasQuery.data || [],
    isLoading: equiposQuery.isLoading || inventarioQuery.isLoading || comprasQuery.isLoading,
    isError: equiposQuery.isError,
    refetch: () => {
      equiposQuery.refetch();
      inventarioQuery.refetch();
      comprasQuery.refetch();
    },
  };
};
