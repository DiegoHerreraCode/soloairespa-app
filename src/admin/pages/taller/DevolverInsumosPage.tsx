import { useState, useMemo, useEffect } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Wrench,
  Check,
  RotateCcw,
  PackageCheck,
} from 'lucide-react';
import { getReparacionByIdAction } from '../../actions/get-reparacion-by-id.action';
import { getReparacionesInsumosAction } from '../../actions/get-reparaciones-insumos.action';
import { getInventarioAction } from '../../actions/get-inventario.action';
import {
  finalizarReparacionAction,
  type InsumoDevueltoPayload,
} from '../../actions/finalizar-reparacion.action';
import { anularOrdenAction } from '../../actions/anular-orden.action';

interface FilaInsumoDevolver {
  id_reparacion_insumo: number;
  sku: string;
  nombre: string;
  cantidad_cotizada: number;
  cantidad_sobrante: number;
}

export const DevolverInsumosPage = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Determinar si es flujo de finalizar reparación o anular orden (preparado para cuando se integren órdenes)
  const modo = searchParams.get('modo') || 'finalizar_reparacion';
  const esAnulacionOrden = modo === 'anular_orden';

  // Motivo de anulación (solo visible si es anulación de orden)
  const [motivoAnulacion, setMotivoAnulacion] = useState('');

  // 1. Consultas para obtener la reparación, sus insumos y el catálogo de inventario
  const { data: reparacion, isLoading: isLoadingReparacion } = useQuery({
    queryKey: ['reparacion-item', id],
    queryFn: () => getReparacionByIdAction(id!),
    enabled: !!id,
  });

  const { data: todosLosInsumos = [], isLoading: isLoadingInsumosPivote } = useQuery({
    queryKey: ['reparaciones-insumos'],
    queryFn: getReparacionesInsumosAction,
  });

  const { data: inventario = [], isLoading: isLoadingInventario } = useQuery({
    queryKey: ['inventario-listado'],
    queryFn: getInventarioAction,
  });

  const inventarioMap = useMemo(
    () => new Map(inventario.map((i) => [i.id_inventario, i])),
    [inventario]
  );

  // 2. Estado local de insumos a devolver
  const [insumosFilas, setInsumosFilas] = useState<FilaInsumoDevolver[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (!isInitialized && reparacion && (reparacion.insumos?.length || todosLosInsumos.length)) {
      const insumosDeEstaReparacion =
        reparacion.insumos && reparacion.insumos.length > 0
          ? reparacion.insumos
          : todosLosInsumos.filter((ins) => Number(ins.id_reparacion) === Number(id));

      const filas: FilaInsumoDevolver[] = insumosDeEstaReparacion.map((ins) => {
        const itemInv = ins.inventario || inventarioMap.get(ins.id_inventario);
        const cantCotizada = Number(ins.cantidad || 0);

        return {
          id_reparacion_insumo: ins.id_reparacion_insumo!,
          sku: itemInv?.sku || 'N/A',
          nombre: itemInv?.nombre || `Insumo #${ins.id_inventario}`,
          cantidad_cotizada: cantCotizada,
          cantidad_sobrante: 0, // Por defecto inicia en 0 (no sobró nada)
        };
      });

      setInsumosFilas(filas);
      setIsInitialized(true);
    }
  }, [isInitialized, reparacion, todosLosInsumos, inventarioMap, id]);

  // Modificar cantidad sobrante individual de una fila
  const handleCambiarCantidadSobrante = (index: number, valor: number) => {
    setInsumosFilas((prev) => {
      const copia = [...prev];
      const fila = copia[index];
      // Clampear entre 0 y cantidad_cotizada
      const cantClampeada = Math.min(Math.max(0, valor), fila.cantidad_cotizada);
      copia[index] = {
        ...fila,
        cantidad_sobrante: isNaN(cantClampeada) ? 0 : cantClampeada,
      };
      return copia;
    });
  };

  // Botón: Sobró Todo (coloca cantidad_sobrante = cantidad_cotizada en cada fila)
  const handleSobroTodo = () => {
    setInsumosFilas((prev) =>
      prev.map((f) => ({
        ...f,
        cantidad_sobrante: f.cantidad_cotizada,
      }))
    );
  };

  // Botón: No Sobró Nada (coloca cantidad_sobrante = 0 en cada fila)
  const handleNoSobroNada = () => {
    setInsumosFilas((prev) =>
      prev.map((f) => ({
        ...f,
        cantidad_sobrante: 0,
      }))
    );
  };

  // Mutación para finalizar la reparación
  const finalizarMutation = useMutation({
    mutationFn: (payload: InsumoDevueltoPayload[]) =>
      finalizarReparacionAction(id!, payload),
    onSuccess: () => {
      toast.success(`Reparación #${id} finalizada exitosamente con devolución de insumos procesada`);
      queryClient.invalidateQueries({ queryKey: ['reparaciones-listado'] });
      queryClient.invalidateQueries({ queryKey: ['reparacion-item', id] });
      queryClient.invalidateQueries({ queryKey: ['repuestos-listado'] });
      queryClient.invalidateQueries({ queryKey: ['inventario-listado'] });
      queryClient.invalidateQueries({ queryKey: ['ordenes-listado'] });
      navigate('/admin/taller/reparaciones');
    },
    onError: (error: any) => {
      const errors = error.response?.data?.errors;
      if (errors && typeof errors === 'object') {
        const firstKey = Object.keys(errors)[0];
        const firstMsg = errors[firstKey][0];
        toast.error(firstMsg);
        return;
      }
      const msg = error.response?.data?.message || 'Error al finalizar la reparación';
      toast.error(msg);
    },
  });

  // Mutación para anular la orden de reparación
  const anularOrdenMutation = useMutation({
    mutationFn: async ({
      idOrden,
      motivo,
      insumos,
    }: {
      idOrden: string | number;
      motivo: string;
      insumos: InsumoDevueltoPayload[];
    }) => {
      return anularOrdenAction(idOrden, {
        motivo_anulacion: motivo,
        insumos_devueltos: insumos,
      });
    },
    onSuccess: () => {
      toast.success('Orden de reparación anulada exitosamente');
      queryClient.invalidateQueries({ queryKey: ['ordenes-listado'] });
      queryClient.invalidateQueries({ queryKey: ['reparaciones-listado'] });
      queryClient.invalidateQueries({ queryKey: ['repuestos-listado'] });
      queryClient.invalidateQueries({ queryKey: ['inventario-listado'] });
      navigate('/admin/ordenes/listado');
    },
    onError: (error: any) => {
      const errors = error.response?.data?.errors;
      if (errors && typeof errors === 'object') {
        const firstKey = Object.keys(errors)[0];
        const firstMsg = errors[firstKey][0];
        toast.error(firstMsg);
        return;
      }
      const msg = error.response?.data?.message || 'Error al anular la orden de reparación';
      toast.error(msg);
    },
  });

  // Guardar (Finaliza la reparación o Anula la orden)
  const handleGuardar = () => {
    const payload: InsumoDevueltoPayload[] = insumosFilas.map((f) => ({
      id_reparacion_insumo: f.id_reparacion_insumo,
      cantidad_sobrante: f.cantidad_sobrante,
    }));

    if (esAnulacionOrden) {
      if (!motivoAnulacion.trim()) {
        toast.warning('Por favor ingresa el motivo de la anulación');
        return;
      }
      const idOrdenTarget = searchParams.get('id_orden') || reparacion?.id_orden;
      if (!idOrdenTarget) {
        toast.error('No se encontró el ID de la orden a anular');
        return;
      }
      anularOrdenMutation.mutate({
        idOrden: idOrdenTarget,
        motivo: motivoAnulacion.trim(),
        insumos: payload,
      });
      return;
    }

    finalizarMutation.mutate(payload);
  };

  const isSaving = finalizarMutation.isPending || anularOrdenMutation.isPending;
  const isLoading = isLoadingReparacion || isLoadingInsumosPivote || isLoadingInventario;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[350px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn pb-16 max-w-5xl mx-auto">
      {/* 1. BARRA SUPERIOR: Título + Botón Volver */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-border/80">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
            <Wrench className="w-6 h-6 text-blue-500" />
            Devolver Insumos Sobrantes de la Reparacion #{id}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Indica los insumos que no fueron utilizados para reintegrarlos automáticamente al inventario físico
          </p>
        </div>

        <Link
          to={esAnulacionOrden ? '/admin/ordenes/listado' : '/admin/taller/reparaciones'}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-card border border-border/80 text-foreground hover:bg-accent transition-all shadow-xs cursor-pointer shrink-0"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver
        </Link>
      </div>

      {/* 2. CAMPO OPCIONAL: INGRESE EL MOTIVO DE ANULACIÓN (Solo visible si es anulación de orden) */}
      {esAnulacionOrden && (
        <div className="bg-card p-4 sm:p-5 rounded-2xl border border-border/80 shadow-xs space-y-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Ingrese el Motivo de Anulación <span className="text-rose-500">*</span>
          </label>
          <textarea
            value={motivoAnulacion}
            onChange={(e) => setMotivoAnulacion(e.target.value)}
            rows={3}
            placeholder="Describe la razón por la cual se anula la orden..."
            className="w-full px-3.5 py-2 text-sm rounded-xl bg-background border border-border/80 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 resize-none"
          />
        </div>
      )}

      {/* 3. LISTA DE INSUMOS (Tabla con columnas: sku, nombre, cantidad sobrante, cantidad cotizada) */}
      <div className="space-y-3">
        <h2 className="text-base sm:text-lg font-bold text-foreground">
          Lista de Insumos
        </h2>

        <div className="bg-card rounded-2xl border border-border/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm border-collapse">
              <thead>
                <tr className="border-b border-border/80 bg-muted/30 text-muted-foreground font-semibold">
                  <th className="py-3 px-4 text-center">sku</th>
                  <th className="py-3 px-4 text-left">nombre</th>
                  <th className="py-3 px-4 text-center w-36">cantidad sobrante</th>
                  <th className="py-3 px-4 text-center w-36">cantidad cotizada</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {insumosFilas.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-muted-foreground text-xs">
                      Esta reparación no tiene insumos cotizados asociados. Al presionar Guardar se marcará como finalizada directamente.
                    </td>
                  </tr>
                ) : (
                  insumosFilas.map((fila, index) => (
                    <tr key={fila.id_reparacion_insumo} className="hover:bg-accent/40 transition-colors">
                      <td className="py-3 px-4 text-center font-mono font-bold text-foreground text-xs">
                        {fila.sku}
                      </td>
                      <td className="py-3 px-4 font-medium text-foreground text-xs sm:text-sm">
                        {fila.nombre}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <input
                          type="number"
                          min={0}
                          max={fila.cantidad_cotizada}
                          value={fila.cantidad_sobrante}
                          onChange={(e) =>
                            handleCambiarCantidadSobrante(index, parseInt(e.target.value, 10))
                          }
                          className="w-20 px-2 py-1.5 text-center text-xs sm:text-sm font-semibold rounded-lg border border-border/80 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                        />
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-foreground text-xs sm:text-sm">
                        {fila.cantidad_cotizada}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 4. BOTONES INFERIORES: Sobró Todo, No Sobró Nada, Guardar (fiel al boceto) */}
      <div className="flex flex-wrap items-center justify-center gap-4 pt-4 border-t border-border/80">
        <button
          type="button"
          onClick={handleSobroTodo}
          disabled={insumosFilas.length === 0 || isSaving}
          className="px-5 py-2.5 text-xs sm:text-sm font-semibold rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 transition-all cursor-pointer disabled:opacity-40 flex items-center gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          Sobró Todo
        </button>

        <button
          type="button"
          onClick={handleNoSobroNada}
          disabled={insumosFilas.length === 0 || isSaving}
          className="px-5 py-2.5 text-xs sm:text-sm font-semibold rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20 hover:bg-sky-500/20 transition-all cursor-pointer disabled:opacity-40 flex items-center gap-2"
        >
          <PackageCheck className="w-4 h-4" />
          No Sobró Nada
        </button>

        <button
          type="button"
          onClick={handleGuardar}
          disabled={isSaving}
          className={`px-8 py-2.5 text-xs sm:text-sm font-bold rounded-xl text-white shadow-md transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2 ${
            esAnulacionOrden
              ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-500/20'
              : 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20'
          }`}
        >
          {isSaving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
              <span>{esAnulacionOrden ? 'Anulando Orden...' : 'Guardando...'}</span>
            </>
          ) : (
            <>
              <Check className="w-4 h-4" />
              <span>{esAnulacionOrden ? 'Confirmar Anulación' : 'Guardar'}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default DevolverInsumosPage;
