import React, { useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  ArrowLeft,
  CheckCircle2,
  Calendar,
  Wrench,
  RefreshCw,
  Loader2,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';

import { getCotizacionByIdAction } from '@/admin/actions/get-cotizacion-by-id.action';
import { aceptarCotizacionAction } from '@/admin/actions/aceptar-cotizacion.action';
import type { CotizacionItem } from '@/admin/interfaces/cotizacion.interface';

export const AceptarCotizacionPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // 1. Cargar Cotización
  const {
    data: cotizacion,
    isLoading: isLoadingCotizacion,
    isError: isErrorCotizacion,
  } = useQuery<CotizacionItem | null>({
    queryKey: ['cotizacion-detalle', id],
    queryFn: () => getCotizacionByIdAction(id || ''),
    enabled: !!id,
  });

  // ==========================================
  // ESTADOS DEL FORMULARIO SEGÚN CASO
  // ==========================================

  // Estado para N° Orden de Compra (opcional)
  const [numOrdenCompra, setNumOrdenCompra] = useState<string>('');

  // CASO 3 (Reparación): Fecha entrega y equipos entrantes
  const [fechaEntregaReparacion, setFechaEntregaReparacion] = useState<string>('');

  // Tipo de cotización y orden normalizados
  const tipoCotizacion = cotizacion?.tipo; // 'inicial' | 'extra'
  const tipoOrdenNombre = useMemo(() => {
    return (cotizacion?.tipo_orden?.nombre || '').toLowerCase().trim();
  }, [cotizacion]);

  // Mutación para Aceptar Cotización
  const aceptarMutation = useMutation({
    mutationFn: (payload: Record<string, any>) => {
      if (!id) throw new Error('ID de cotización no especificado');
      return aceptarCotizacionAction(id, payload);
    },
    onSuccess: () => {
      toast.success(`Cotización #${cotizacion?.num_cotizacion} aceptada exitosamente.`);
      queryClient.invalidateQueries({ queryKey: ['cotizaciones-listado'] });
      queryClient.invalidateQueries({ queryKey: ['cotizacion-detalle', id] });
      queryClient.invalidateQueries({ queryKey: ['ordenes-listado'] });
      queryClient.invalidateQueries({ queryKey: ['reparaciones-listado'] });
      queryClient.invalidateQueries({ queryKey: ['repuestos-stock'] });
      navigate('/admin/cotizaciones/listado');
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.message || 'Error al aceptar la cotización';
      toast.error(msg);
    },
  });

  // Manejo del Envío
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!cotizacion) return;

    // CASO 0: Cotización Extra
    if (tipoCotizacion === 'extra') {
      aceptarMutation.mutate({
        num_orden_compra: numOrdenCompra.trim() || undefined,
      });
      return;
    }

    // CASO 1: Venta Inicial
    if (tipoOrdenNombre === 'venta') {
      // El descuento y asignación de stock se realiza de forma automática por el sistema (FIFO),
      // comportándose exactamente igual a la creación de una orden de venta.
      aceptarMutation.mutate({
        num_orden_compra: numOrdenCompra.trim() || undefined,
      });
      return;
    }

    // CASO 2: Recambio Inicial
    if (tipoOrdenNombre === 'recambio') {
      // El sistema descuenta y asigna automáticamente la pieza física que sale (FIFO de bodega: reparada)
      // y registra la pieza entrante del cliente usando la información previamente capturada en la cotización.
      aceptarMutation.mutate({
        num_orden_compra: numOrdenCompra.trim() || undefined,
      });
      return;
    }

    // CASO 3: Reparación Inicial
    if (tipoOrdenNombre === 'reparacion') {
      if (!fechaEntregaReparacion) {
        toast.warning('Debes seleccionar la fecha estimada de entrega de la reparación');
        return;
      }

      aceptarMutation.mutate({
        num_orden_compra: numOrdenCompra.trim() || undefined,
        fecha_entrega_reparacion: fechaEntregaReparacion,
      });
      return;
    }

    // En caso de otro tipo no contemplado
    aceptarMutation.mutate({
      num_orden_compra: numOrdenCompra.trim() || undefined,
    });
  };

  // Estados de carga generales
  if (isLoadingCotizacion) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        <p className="text-sm font-medium text-muted-foreground">
          Cargando datos de la cotización...
        </p>
      </div>
    );
  }

  // Estado si no existe cotización
  if (isErrorCotizacion || !cotizacion) {
    return (
      <div className="bg-card p-8 rounded-2xl border border-border/80 text-center space-y-4 max-w-lg mx-auto mt-10">
        <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto" />
        <h2 className="text-lg font-bold text-foreground">Cotización no encontrada</h2>
        <p className="text-sm text-muted-foreground">
          No se pudo encontrar la cotización con el identificador solicitado o fue eliminada.
        </p>
        <Link
          to="/admin/cotizaciones/listado"
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al Listado
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn pb-20 max-w-5xl mx-auto">
      {/* 1. BARRA SUPERIOR: Título, Volver y Badges */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-3 border-b border-border/80">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2.5">
              <ShieldCheck className="w-7 h-7 text-emerald-500" />
              Aceptar Cotización #{cotizacion.num_cotizacion}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              {tipoCotizacion}
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
              {tipoOrdenNombre}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Cliente: <span className="font-semibold text-foreground">{cotizacion.cliente?.nombre || 'No asignado'}</span>
            {cotizacion.cliente?.rut ? ` (${cotizacion.cliente.rut})` : ''} • Fecha: {cotizacion.fecha_creacion}
          </p>
        </div>

        <Link
          to="/admin/cotizaciones/listado"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-card border border-border/80 text-foreground hover:bg-accent transition-all shadow-xs cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al Listado
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* N° ORDEN DE COMPRA (GENERAL PARA CUALQUIER TIPO DE COTIZACIÓN) */}
        <div className="bg-card p-4 sm:p-5 rounded-2xl border border-border/80 shadow-xs space-y-2">
          <label className="text-sm font-semibold text-foreground flex items-center gap-2">
            N° Orden de Compra del Cliente
            <span className="text-xs font-normal text-muted-foreground">(Opcional)</span>
          </label>
          <input
            type="text"
            value={numOrdenCompra}
            onChange={(e) => setNumOrdenCompra(e.target.value)}
            placeholder="Ej: OC-2026-9982"
            className="w-full sm:max-w-md px-3.5 py-2 text-sm bg-background border border-input rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
          />
          <p className="text-xs text-muted-foreground">
            Si el cliente emitió una orden de compra formal para autorizar esta cotización, ingrese su número aquí para dejar constancia.
          </p>
        </div>

        {/* ============================================================
            CASO 0: COTIZACIÓN EXTRA (DE REPARACIÓN)
            ============================================================ */}
        {tipoCotizacion === 'extra' && (
          <div className="bg-card p-6 rounded-2xl border border-emerald-500/30 shadow-xs space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-dark-600 dark:text-dark-400">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-foreground">Confirmación de Cotización Extra</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  ¿Está seguro de que el cliente aceptó esta cotización extra? Se agregarán automáticamente los
                  insumos y servicios aprobados a la ficha de reparación en curso sin necesidad de datos adicionales.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================
            CASO 1: COTIZACIÓN INICIAL DE VENTA
            ============================================================ */}
        {tipoCotizacion === 'inicial' && tipoOrdenNombre === 'venta' && (
          <div className="bg-card p-6 rounded-2xl border border-blue-500/30 shadow-xs space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-foreground">Confirmación y Generación de Orden de Venta</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Al aceptar esta cotización, el sistema generará automáticamente la correspondiente orden de venta
                  y descontará del stock disponible las unidades cotizadas siguiendo la regla FIFO, sin requerir asignación manual de piezas.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================
            CASO 2: COTIZACIÓN INICIAL DE RECAMBIO
            ============================================================ */}
        {tipoCotizacion === 'inicial' && tipoOrdenNombre === 'recambio' && (
          <div className="bg-card p-6 rounded-2xl border border-amber-500/30 shadow-xs space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <RefreshCw className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-foreground">Confirmación y Generación de Orden de Recambio</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Al aceptar esta cotización, el sistema generará automáticamente la orden de recambio correspondiente.
                  La pieza reparada garantizada de la bodega se asignará mediante FIFO y se registrará la pieza usada entrante
                  del cliente utilizando los seriales y service tags ingresados durante la cotización.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================
            CASO 3: COTIZACIÓN INICIAL DE REPARACIÓN
            ============================================================ */}
        {tipoCotizacion === 'inicial' && tipoOrdenNombre === 'reparacion' && (
          <div className="space-y-4">
            <div className="bg-purple-500/10 border border-purple-500/20 p-4 rounded-xl flex items-start gap-3 text-dark-700 dark:text-dark-300">
              <Wrench className="w-5 h-5 shrink-0 mt-0.5" />
              <div className="text-xs sm:text-sm leading-relaxed">
                <span className="font-bold">Aceptación de Reparación:</span> Los equipos, números de serie y service tags
                fueron configurados al momento de crear la cotización. Indique la fecha estimada de entrega para generar la orden de reparación.
              </div>
            </div>

            {/* Selector de Fecha de Entrega */}
            <div className="bg-card p-5 rounded-2xl border border-border/80 shadow-xs space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-purple-500" />
                Fecha Estimada de Entrega de la Reparación <span className="text-rose-500">*</span>
              </label>
              <input
                min={new Date().toISOString().split('T')[0]}
                type="date"
                required
                value={fechaEntregaReparacion}
                onChange={(e) => setFechaEntregaReparacion(e.target.value)}
                className="w-full sm:w-64 px-3 py-2 text-sm rounded-xl bg-background border border-border/80 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all font-mono"
              />
            </div>
          </div>
        )}

        {/* ============================================================
            RESUMEN FINANCIERO Y BOTÓN DE ACCIÓN
            ============================================================ */}
        <div className="bg-card p-5 rounded-2xl border border-border/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs sm:text-sm text-muted-foreground">
            Total Cotizado:{' '}
            <span className="font-extrabold text-foreground text-base sm:text-lg">
              ${Number(cotizacion.monto_total).toLocaleString('es-CL')}
            </span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Link
              to="/admin/cotizaciones/listado"
              className="flex-1 sm:flex-none text-center px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-xl bg-background border border-border/80 hover:bg-accent text-foreground transition-all cursor-pointer"
            >
              Cancelar
            </Link>

            <button
              type="submit"
              disabled={aceptarMutation.isPending}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-6 py-2.5 text-xs sm:text-sm font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-500/20 transition-all cursor-pointer disabled:opacity-50"
            >
              {aceptarMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Procesando Aceptación...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Aceptar Cotización
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
