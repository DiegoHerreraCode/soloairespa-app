import { useQuery } from '@tanstack/react-query';
import { getServiciosTallerAction } from '../actions/get-servicios-taller.action';
import { getTiposServiciosTallerAction } from '../actions/get-tipos-servicios-taller.action';

export const useServiciosTaller = () => {
  const serviciosTallerQuery = useQuery({
    queryKey: ['servicios-taller-listado'],
    queryFn: getServiciosTallerAction,
    staleTime: 1000 * 60 * 3, // 3 minutos
  });

  const tiposServiciosTallerQuery = useQuery({
    queryKey: ['tipos-servicios-taller-listado'],
    queryFn: getTiposServiciosTallerAction,
    staleTime: 1000 * 60 * 5,
  });

  return {
    serviciosTaller: serviciosTallerQuery.data || [],
    tiposServiciosTaller: tiposServiciosTallerQuery.data || [],
    isLoading: serviciosTallerQuery.isLoading || tiposServiciosTallerQuery.isLoading,
    isError: serviciosTallerQuery.isError,
    refetch: () => {
      serviciosTallerQuery.refetch();
      tiposServiciosTallerQuery.refetch();
    },
  };
};
