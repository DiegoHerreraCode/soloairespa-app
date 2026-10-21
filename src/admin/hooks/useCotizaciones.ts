import { useQuery } from '@tanstack/react-query';
import { getCotizacionesAction } from '../actions/get-cotizaciones.action';
import { getTiposOrdenesAction } from '../actions/get-tipos-ordenes.action';

export const useCotizaciones = () => {
  const {
    data: cotizaciones = [],
    isLoading: isLoadingCotizaciones,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['cotizaciones-listado'],
    queryFn: getCotizacionesAction,
  });

  const { data: tiposOrdenes = [] } = useQuery({
    queryKey: ['tipos-ordenes-listado'],
    queryFn: getTiposOrdenesAction,
  });

  return {
    cotizaciones,
    tiposOrdenes,
    isLoading: isLoadingCotizaciones,
    isError,
    error,
    refetch,
  };
};
