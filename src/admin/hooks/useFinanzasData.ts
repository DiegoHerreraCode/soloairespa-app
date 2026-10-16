import { useQuery } from '@tanstack/react-query';
import { getOrdenesAction } from '../actions/get-ordenes.action';
import { getInventarioAction } from '../actions/get-inventario.action';
import { getRepuestosAction } from '../actions/get-repuestos.action';
import { getPagosComprasAction } from '../actions/get-pagos-compras.action';
import { getPagosClientesAction } from '../actions/get-pagos-clientes.action';
import { getTiposOrdenesAction } from '../actions/get-tipos-ordenes.action';
import { getReparacionesAction } from '../actions/get-reparaciones.action';

export const useFinanzasData = () => {
  const ordenesQuery = useQuery({
    queryKey: ['finanzas', 'ordenes'],
    queryFn: getOrdenesAction,
    staleTime: 1000 * 60 * 3,
  });

  const inventarioQuery = useQuery({
    queryKey: ['finanzas', 'inventario'],
    queryFn: getInventarioAction,
    staleTime: 1000 * 60 * 3,
  });

  const repuestosQuery = useQuery({
    queryKey: ['finanzas', 'repuestos'],
    queryFn: getRepuestosAction,
    staleTime: 1000 * 60 * 3,
  });

  const pagosComprasQuery = useQuery({
    queryKey: ['finanzas', 'pagos-compras'],
    queryFn: getPagosComprasAction,
    staleTime: 1000 * 60 * 3,
  });

  const pagosClientesQuery = useQuery({
    queryKey: ['finanzas', 'pagos-clientes'],
    queryFn: getPagosClientesAction,
    staleTime: 1000 * 60 * 3,
  });

  const tiposOrdenesQuery = useQuery({
    queryKey: ['finanzas', 'tipos-ordenes'],
    queryFn: getTiposOrdenesAction,
    staleTime: 1000 * 60 * 10,
  });

  const reparacionesQuery = useQuery({
    queryKey: ['finanzas', 'reparaciones'],
    queryFn: getReparacionesAction,
    staleTime: 1000 * 60 * 3,
  });

  const isLoading =
    ordenesQuery.isLoading ||
    inventarioQuery.isLoading ||
    repuestosQuery.isLoading ||
    pagosComprasQuery.isLoading ||
    pagosClientesQuery.isLoading ||
    tiposOrdenesQuery.isLoading ||
    reparacionesQuery.isLoading;

  return {
    ordenes: ordenesQuery.data || [],
    inventario: inventarioQuery.data || [],
    repuestos: repuestosQuery.data || [],
    pagosCompras: pagosComprasQuery.data || [],
    pagosClientes: pagosClientesQuery.data || [],
    tiposOrdenes: tiposOrdenesQuery.data || [],
    reparaciones: reparacionesQuery.data || [],
    isLoading,
    refetchAll: () => {
      ordenesQuery.refetch();
      inventarioQuery.refetch();
      repuestosQuery.refetch();
      pagosComprasQuery.refetch();
      pagosClientesQuery.refetch();
      tiposOrdenesQuery.refetch();
      reparacionesQuery.refetch();
    },
  };
};
