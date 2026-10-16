import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getPagosClientesAction } from '../actions/get-pagos-clientes.action';
import { getClientesAction } from '../actions/get-clientes.action';
import { anularPagoClienteAction } from '../actions/anular-pago-cliente.action';
import { toast } from 'sonner';

export const usePagosClientes = () => {
  const queryClient = useQueryClient();

  // 1. Pagos de clientes
  const pagosQuery = useQuery({
    queryKey: ['pagos-clientes-listado'],
    queryFn: getPagosClientesAction,
    staleTime: 1000 * 60 * 3,
  });

  // 2. Clientes para mapear nombre y rut de cada cliente según id_cliente
  const clientesQuery = useQuery({
    queryKey: ['clientes-map'],
    queryFn: getClientesAction,
    staleTime: 1000 * 60 * 5,
  });

  // Mutación para anular pago
  const anularMutation = useMutation({
    mutationFn: ({ id, motivo }: { id: number | string; motivo: string }) =>
      anularPagoClienteAction(id, motivo),
    onSuccess: () => {
      toast.success('Pago de cliente anulado correctamente');
      queryClient.invalidateQueries({ queryKey: ['pagos-clientes-listado'] });
      queryClient.invalidateQueries({ queryKey: ['finanzas'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.message || 'Error al anular el pago';
      toast.error(msg);
    },
  });

  return {
    pagos: pagosQuery.data || [],
    clientes: clientesQuery.data || [],
    isLoading: pagosQuery.isLoading || clientesQuery.isLoading,
    isError: pagosQuery.isError,
    refetch: pagosQuery.refetch,
    anularPago: anularMutation.mutateAsync,
    isAnulando: anularMutation.isPending,
  };
};
