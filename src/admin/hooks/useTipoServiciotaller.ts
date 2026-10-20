import { useQuery } from '@tanstack/react-query';
import { getTiposServiciosTallerAction } from '../actions/get-tipos-servicios-taller.action';

export const useTiposServiciosTaller = () => {
  const tiposServiciosTallerQuery = useQuery({
    queryKey: ['tipos-servicios-taller-listado'],
    queryFn: getTiposServiciosTallerAction,
    staleTime: 1000 * 60 * 5,
  });

  return {
    tiposServiciosTaller: tiposServiciosTallerQuery.data || [],
    isLoading: tiposServiciosTallerQuery.isLoading,
    isError: tiposServiciosTallerQuery.isError,
    refetch: tiposServiciosTallerQuery.refetch,
  };
};
