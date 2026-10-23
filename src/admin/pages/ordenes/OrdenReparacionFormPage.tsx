import React, { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Plus,
  X,
  Loader2,
  Calendar,
} from 'lucide-react';

import { getClientesAction } from '@/admin/actions/get-clientes.action';
import { getInventarioAction } from '@/admin/actions/get-inventario.action';
import { getTiposOrdenesAction } from '@/admin/actions/get-tipos-ordenes.action';
import {
  createOrdenAction,
  type CreateOrdenReparacionPayload,
} from '@/admin/actions/create-orden.action';

import type { ClienteItem } from '@/admin/interfaces/cliente.interface';
import type { InventarioItem } from '@/admin/interfaces/inventario.interface';
import type { TipoOrdenItem } from '@/admin/interfaces/tipo-orden.interface';

// Cada bloque/fila de repuesto entrante según el boceto:
// [ id_inventario ] [ serial ] [ service_tag ] [ X ]
export interface RepuestoEntranteFila {
  id: string; // id temporal único para control en React
  id_inventario: number | '';
  serial: string;
  service_tag: string;
}

export const OrdenReparacionFormPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // 1. Cargar Clientes
  const { data: clientes = [], isLoading: isLoadingClientes } = useQuery<ClienteItem[]>({
    queryKey: ['clientes-listado'],
    queryFn: getClientesAction,
  });

  // 2. Cargar Inventario (filtrado: solo equipos reparables en taller: compresores y válvulas)
  const { data: inventario = [], isLoading: isLoadingInventario } = useQuery<InventarioItem[]>({
    queryKey: ['inventario-catalogo'],
    queryFn: getInventarioAction,
  });

  // 3. Cargar Tipos de Órdenes (para resolver id_tipo_orden de 'reparacion')
  const { data: tiposOrdenes = [], isLoading: isLoadingTiposOrdenes } = useQuery<TipoOrdenItem[]>({
    queryKey: ['tipos-ordenes'],
    queryFn: getTiposOrdenesAction,
  });

  // Estado del cliente seleccionado
  const [idCliente, setIdCliente] = useState<number | ''>('');

  // Fecha estimada de entrega de reparación
  const [fechaEntregaReparacion, setFechaEntregaReparacion] = useState<string>('');

  // Repuestos entrantes inicializados con 1 fila por defecto según el boceto
  const [repuestosEntrantes, setRepuestosEntrantes] = useState<RepuestoEntranteFila[]>([
    {
      id: crypto.randomUUID(),
      id_inventario: '',
      serial: '',
      service_tag: '',
    },
  ]);

  // Catálogo permitido para reparación en taller: compresores y válvulas
  const inventarioPermitido = useMemo(() => {
    return inventario.filter((item) => {
      const t = item.tipo;
      return t === 'compresor' || t === 'valvula';
    });
  }, [inventario]);

  // Resolución del id_tipo_orden de 'reparacion' (id 2)
  const idTipoOrdenReparacion = useMemo(() => {
    const tipo = tiposOrdenes.find((t) => t.nombre.toLowerCase().trim() === 'reparacion');
    return tipo ? tipo.id_tipo_orden : 2;
  }, [tiposOrdenes]);

  // Agregar una nueva fila de repuesto entrante (+)
  const handleAgregarFila = () => {
    setRepuestosEntrantes((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        id_inventario: '',
        serial: '',
        service_tag: '',
      },
    ]);
  };

  // Remover fila de repuesto entrante (X)
  const handleRemoverFila = (id: string) => {
    if (repuestosEntrantes.length <= 1) {
      toast.warning('Debe existir al menos un repuesto entrante a reparar');
      return;
    }
    setRepuestosEntrantes((prev) => prev.filter((r) => r.id !== id));
  };

  // Actualizar campo de una fila
  const handleActualizarCampo = (
    index: number,
    campo: keyof RepuestoEntranteFila,
    valor: any
  ) => {
    setRepuestosEntrantes((prev) => {
      const actual = [...prev];
      const fila = { ...actual[index] };

      if (campo === 'id_inventario') {
        fila.id_inventario = valor ? Number(valor) : '';
      } else {
        (fila as any)[campo] = valor;
      }

      actual[index] = fila;
      return actual;
    });
  };

  // Mutación para crear la Orden de Reparación
  const createOrdenMutation = useMutation({
    mutationFn: (payload: CreateOrdenReparacionPayload) => createOrdenAction(payload),
    onSuccess: (ordenCreada) => {
      toast.success(
        `Orden de Reparación #${ordenCreada?.id_orden || ''} registrada exitosamente.`
      );
      queryClient.invalidateQueries({ queryKey: ['ordenes-listado'] });
      queryClient.invalidateQueries({ queryKey: ['reparaciones-listado'] });
      queryClient.invalidateQueries({ queryKey: ['repuestos-stock'] });
      queryClient.invalidateQueries({ queryKey: ['inventario-catalogo'] });
      navigate('/admin/ordenes/listado');
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.message || 'Error al generar la orden de reparación';
      toast.error(msg);
    },
  });

  // Manejo del envío del formulario con validaciones
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!idCliente) {
      toast.warning('Debe seleccionar un cliente para la orden');
      return;
    }

    if (!fechaEntregaReparacion) {
      toast.warning('Debe indicar la fecha estimada de entrega de la reparación');
      return;
    }

    if (repuestosEntrantes.length === 0) {
      toast.warning('Debe registrar al menos un repuesto entrante');
      return;
    }

    // 1. Validar campos requeridos en cada fila
    for (let i = 0; i < repuestosEntrantes.length; i++) {
      const r = repuestosEntrantes[i];
      const numFila = i + 1;

      if (!r.id_inventario) {
        toast.warning(`En la fila #${numFila}, debe seleccionar el modelo de repuesto entrante`);
        return;
      }

      if (!r.serial.trim()) {
        toast.warning(`En la fila #${numFila}, debe ingresar el número de serie (serial)`);
        return;
      }

      if (!r.service_tag.trim()) {
        toast.warning(`En la fila #${numFila}, debe ingresar el service_tag del repuesto`);
        return;
      }
    }

    // 2. REGLA CLAVE DEL BOCETO:
    // "validar antes de enviar en el payload, que no pueden haber service_tag iguales"
    const serviceTags = repuestosEntrantes.map((r) => r.service_tag.trim().toLowerCase());
    const serviceTagsSet = new Set(serviceTags);
    if (serviceTagsSet.size !== serviceTags.length) {
      toast.error('No pueden haber service_tag iguales entre los repuestos entrantes.');
      return;
    }

    // 3. Construcción del Payload exacto
    const payload: CreateOrdenReparacionPayload = {
      id_cliente: Number(idCliente),
      id_tipo_orden: Number(idTipoOrdenReparacion),
      fecha_entrega_reparacion: fechaEntregaReparacion,
      repuestos_entrantes: repuestosEntrantes.map((r) => ({
        id_inventario: Number(r.id_inventario),
        serial: r.serial.trim(),
        service_tag: r.service_tag.trim(),
      })),
    };

    createOrdenMutation.mutate(payload);
  };

  const isLoadingGlobal = isLoadingClientes || isLoadingInventario || isLoadingTiposOrdenes;

  if (isLoadingGlobal) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <p className="text-sm font-medium">Cargando formulario de orden de reparación...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn pb-16 max-w-5xl mx-auto">
      {/* 1. BARRA SUPERIOR: Título + Botón Volver */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-border/80">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Registrar Nueva Orden de Reparación
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Recepción e ingreso de equipos del cliente al taller para diagnóstico y mantenimiento
          </p>
        </div>

        <Link
          to="/admin/ordenes/new"
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-card border border-border/80 text-foreground hover:bg-accent transition-all shadow-xs cursor-pointer shrink-0"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 2. SELECTOR DE CLIENTE Y FECHA ENTREGA REPARACIÓN (Fila superior según boceto) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
          {/* Selector de Cliente */}
          <div className="bg-card p-4 rounded-2xl border border-border/80 shadow-xs space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Seleccione al Cliente <span className="text-rose-500">*</span>
            </label>
            <select
              value={idCliente}
              onChange={(e) => setIdCliente(e.target.value ? Number(e.target.value) : '')}
              required
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-background border border-border/80 text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all font-medium cursor-pointer"
            >
              <option value="">Seleccione al Cliente</option>
              {clientes.map((c) => (
                <option key={c.id_cliente} value={c.id_cliente}>
                  {c.nombre} {c.rut ? `(${c.rut})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Fecha Entrega Reparación */}
          <div className="bg-card p-4 rounded-2xl border border-border/80 shadow-xs space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-blue-500" />
              Fecha Entrega Reparación <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              required
              value={fechaEntregaReparacion}
              onChange={(e) => setFechaEntregaReparacion(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-background border border-border/80 text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all font-mono"
            />
          </div>
        </div>

        {/* 3. REPUESTOS ENTRANTES (Según boceto: con botón + al lado) */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-foreground">Repuestos Entrantes</h2>
            <button
              type="button"
              onClick={handleAgregarFila}
              className="p-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-xs cursor-pointer flex items-center justify-center"
              title="Agregar otro repuesto entrante"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3">
            {repuestosEntrantes.map((fila, index) => (
              <div
                key={fila.id}
                className="bg-card p-4 sm:p-5 rounded-2xl border border-border/80 shadow-xs"
              >
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                  {/* id_inventario */}
                  <div className="sm:col-span-5 space-y-1">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                      Modelo / Equipo (id_inventario) <span className="text-rose-500">*</span>
                    </label>
                    <select
                      required
                      value={fila.id_inventario}
                      onChange={(e) =>
                        handleActualizarCampo(index, 'id_inventario', e.target.value)
                      }
                      className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-background border border-border/80 text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                    >
                      <option value="">-- Seleccionar equipo / repuesto --</option>
                      {inventarioPermitido.map((item) => (
                        <option key={item.id_inventario} value={item.id_inventario}>
                          {item.nombre} ({item.tipo} - {item.condicion || 'usado'}) {item.sku ? `[${item.sku}]` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* serial */}
                  <div className="sm:col-span-3 space-y-1">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                      Serial <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ej: CLI-COMP-334488"
                      value={fila.serial}
                      onChange={(e) =>
                        handleActualizarCampo(index, 'serial', e.target.value)
                      }
                      className="w-full px-3 py-1.5 text-xs sm:text-sm rounded-xl bg-background border border-border/80 text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    />
                  </div>

                  {/* service_tag */}
                  <div className="sm:col-span-3 space-y-1">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                      Service Tag (Único) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ej: Compresor-old-gen"
                      value={fila.service_tag}
                      onChange={(e) =>
                        handleActualizarCampo(index, 'service_tag', e.target.value)
                      }
                      className="w-full px-3 py-1.5 text-xs sm:text-sm rounded-xl bg-background border border-border/80 text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    />
                  </div>

                  {/* Botón Eliminar fila (X) */}
                  <div className="sm:col-span-1 flex justify-center pb-0.5">
                    {repuestosEntrantes.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoverFila(fila.id)}
                        className="p-2 rounded-xl bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 border border-rose-500/20 transition-all cursor-pointer"
                        title="Eliminar este repuesto entrante"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 4. BOTÓN GENERAR (centrado según boceto) */}
        <div className="flex justify-center pt-6">
          <button
            type="submit"
            disabled={createOrdenMutation.isPending || repuestosEntrantes.length === 0}
            className="w-full sm:w-80 py-3 text-sm sm:text-base font-bold rounded-xl bg-blue-500 hover:bg-blue-600 text-white shadow-lg shadow-blue-500/25 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {createOrdenMutation.isPending ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Generando Orden...</span>
              </>
            ) : (
              'Generar'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default OrdenReparacionFormPage;
