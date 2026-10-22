import React, { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Plus,
  X,
  Loader2,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';

import { getClientesAction } from '@/admin/actions/get-clientes.action';
import { getInventarioAction } from '@/admin/actions/get-inventario.action';
import { getTiposOrdenesAction } from '@/admin/actions/get-tipos-ordenes.action';
import { createCotizacionAction } from '@/admin/actions/create-cotizacion.action';

import type { ClienteItem } from '@/admin/interfaces/cliente.interface';
import type { InventarioItem } from '@/admin/interfaces/inventario.interface';
import type { TipoOrdenItem } from '@/admin/interfaces/tipo-orden.interface';

// Cada bloque/línea de recambio según el boceto
export interface LineaRecambioItem {
  id: string; // id temporal único
  id_inventario_repuesto_saliente: number | '';
  id_inventario_repuesto_entrante: number | '';
  cantidad: number;
  precio_unitario: number | '';
  monto_tasacion: number | '';
  porcentaje_iva: number;
}

export const CotizacionInicialRecambioFormPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // 1. Clientes
  const { data: clientes = [], isLoading: isLoadingClientes } = useQuery<ClienteItem[]>({
    queryKey: ['clientes-listado'],
    queryFn: getClientesAction,
  });

  // 2. Inventario (filtrado: solo compresores y válvulas)
  const { data: inventario = [], isLoading: isLoadingInventario } = useQuery<InventarioItem[]>({
    queryKey: ['inventario-catalogo'],
    queryFn: getInventarioAction,
  });

  // 3. Tipos de Órdenes (para resolver id_tipo_orden correspondiente a 'recambio')
  const { data: tiposOrdenes = [], isLoading: isLoadingTiposOrdenes } = useQuery<TipoOrdenItem[]>({
    queryKey: ['tipos-ordenes'],
    queryFn: getTiposOrdenesAction,
  });

  // Estado del cliente seleccionado
  const [idCliente, setIdCliente] = useState<number | ''>('');

  // Catálogo permitido para recambio: solo 'compresor' o 'valvula'
  const inventarioPermitido = useMemo(() => {
    return inventario.filter((item) => {
      const t = item.tipo;
      return t === 'compresor' || t === 'valvula';
    });
  }, [inventario]);

  // Mapa rápido de inventario por id_inventario
  const inventarioMap = useMemo(() => {
    return new Map<number, InventarioItem>(inventarioPermitido.map((i) => [i.id_inventario, i]));
  }, [inventarioPermitido]);

  // Líneas de recambio inicializadas con 1 bloque por defecto
  const [lineasRecambio, setLineasRecambio] = useState<LineaRecambioItem[]>([
    {
      id: crypto.randomUUID(),
      id_inventario_repuesto_saliente: '',
      id_inventario_repuesto_entrante: '',
      cantidad: 1,
      precio_unitario: '',
      monto_tasacion: '',
      porcentaje_iva: 19,
    },
  ]);

  // Resolución del id_tipo_orden de 'recambio'
  const idTipoOrdenRecambio = useMemo(() => {
    const tipo = tiposOrdenes.find((t) => t.nombre.toLowerCase().trim() === 'recambio');
    return tipo ? tipo.id_tipo_orden : 3; // Fallback al id 3 si coincide con el seed
  }, [tiposOrdenes]);

  // Agregar una nueva línea de recambio (+)
  const handleAgregarLinea = () => {
    setLineasRecambio((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        id_inventario_repuesto_saliente: '',
        id_inventario_repuesto_entrante: '',
        cantidad: 1,
        precio_unitario: '',
        monto_tasacion: '',
        porcentaje_iva: 19,
      },
    ]);
  };

  // Remover línea de recambio (X)
  const handleRemoverLinea = (id: string) => {
    if (lineasRecambio.length <= 1) {
      toast.warning('Debe existir al menos una línea de recambio');
      return;
    }
    setLineasRecambio((prev) => prev.filter((l) => l.id !== id));
  };

  // Actualizar campo de una línea
  const handleActualizarCampo = (
    index: number,
    campo: keyof LineaRecambioItem,
    valor: any
  ) => {
    setLineasRecambio((prev) => {
      const actual = [...prev];
      const linea = { ...actual[index] };

      if (campo === 'id_inventario_repuesto_saliente') {
        const idSaliente = valor ? Number(valor) : '';
        linea.id_inventario_repuesto_saliente = idSaliente;
        // Asignar porcentaje_iva configurado en el ítem saliente
        if (idSaliente) {
          const itemInv = inventarioMap.get(idSaliente);
          linea.porcentaje_iva =
            itemInv?.porcentaje_iva !== undefined && itemInv.porcentaje_iva !== null
              ? Number(itemInv.porcentaje_iva)
              : 19;

          // precargar input del precio unitario con el monto_venta_unitario del item seleccionado
          if (itemInv?.monto_venta_unitario) {
            linea.precio_unitario = Number(itemInv?.monto_venta_unitario);
          }
        }
      } else if (campo === 'id_inventario_repuesto_entrante') {
        linea.id_inventario_repuesto_entrante = valor ? Number(valor) : '';
      } else if (campo === 'precio_unitario' || campo === 'monto_tasacion') {
        linea[campo] = valor === '' ? '' : Math.max(0, Number(valor));
      } else {
        (linea as any)[campo] = valor;
      }

      actual[index] = linea;
      return actual;
    });
  };

  // ==========================================
  // TOTALES ECONÓMICOS DE LA COTIZACIÓN
  // ==========================================
  // Monto neto gravado de cada línea = (precio_unitario - monto_tasacion) * cantidad
  const totales = useMemo(() => {
    let gravado = 0;
    let exento = 0;
    let iva = 0;

    for (const l of lineasRecambio) {
      const pUnit = Number(l.precio_unitario) || 0;
      const tasacion = Number(l.monto_tasacion) || 0;
      const cant = Number(l.cantidad) || 1;
      const pctIva = Number(l.porcentaje_iva) || 0;

      // Base imponible neta = (precio_unitario - monto_tasacion) * cantidad
      const netoLinea = Math.max(0, pUnit - tasacion) * cant;

      if (pctIva > 0) {
        gravado += netoLinea;
        iva += netoLinea * (pctIva / 100);
      } else {
        exento += netoLinea;
      }
    }

    const total = gravado + exento + iva;

    return {
      gravado: Number(gravado.toFixed(2)),
      exento: Number(exento.toFixed(2)),
      iva: Number(iva.toFixed(2)),
      total: Number(total.toFixed(2)),
    };
  }, [lineasRecambio]);

  // Mutación para crear la cotización de recambio
  const createMutation = useMutation({
    mutationFn: createCotizacionAction,
    onSuccess: (cotCreada) => {
      toast.success(
        `Cotización de recambio ${cotCreada?.num_cotizacion ? '#' + cotCreada.num_cotizacion : ''} creada exitosamente.`
      );
      queryClient.invalidateQueries({ queryKey: ['cotizaciones-listado'] });
      navigate('/admin/cotizaciones/listado');
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.message || 'Error al generar la cotización de recambio';
      toast.error(msg);
    },
  });

  // Manejo del envío del formulario
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!idCliente) {
      toast.warning('Debe seleccionar un cliente para la cotización');
      return;
    }

    if (lineasRecambio.length === 0) {
      toast.warning('Debe registrar al menos una línea de recambio');
      return;
    }

    // Validar cada línea
    for (let i = 0; i < lineasRecambio.length; i++) {
      const linea = lineasRecambio[i];
      const numFila = i + 1;

      if (!linea.id_inventario_repuesto_saliente) {
        toast.warning(`Línea #${numFila}: Debe seleccionar el repuesto saliente de la empresa`);
        return;
      }

      if (!linea.id_inventario_repuesto_entrante) {
        toast.warning(`Línea #${numFila}: Debe seleccionar el tipo de repuesto entrante del cliente`);
        return;
      }

      const pUnit = Number(linea.precio_unitario);
      if (linea.precio_unitario === '' || isNaN(pUnit) || pUnit <= 0) {
        toast.warning(`Línea #${numFila}: Ingrese un precio unitario mayor a 0`);
        return;
      }

      const tasacion = Number(linea.monto_tasacion);
      if (linea.monto_tasacion === '' || isNaN(tasacion) || tasacion < 0) {
        toast.warning(`Línea #${numFila}: Ingrese un monto de tasación válido (mayor o igual a 0)`);
        return;
      }

      // Validar que el monto_tasacion no puede ser mayor al precio_unitario
      if (tasacion > pUnit) {
        toast.warning(
          `Línea #${numFila}: El monto de tasación ($${tasacion.toLocaleString('es-CL')}) no puede ser mayor al precio unitario ($${pUnit.toLocaleString('es-CL')})`
        );
        return;
      }
    }

    // Construcción del payload exacto
    const payload = {
      id_cliente: Number(idCliente),
      id_tipo_orden: Number(idTipoOrdenRecambio),
      detalles_inventario: lineasRecambio.map((l) => ({
        id_inventario_repuesto_saliente: Number(l.id_inventario_repuesto_saliente),
        id_inventario_repuesto_entrante: Number(l.id_inventario_repuesto_entrante),
        cantidad: Number(l.cantidad) || 1,
        precio_unitario: Number(l.precio_unitario),
        monto_tasacion: Number(l.monto_tasacion),
        porcentaje_iva: Number(l.porcentaje_iva),
      })),
    };

    createMutation.mutate(payload);
  };

  const isLoadingGlobal = isLoadingClientes || isLoadingInventario || isLoadingTiposOrdenes;

  if (isLoadingGlobal) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        <p className="text-sm font-medium text-muted-foreground">
          Cargando catálogo e información de recambio...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn pb-24 max-w-5xl mx-auto">
      {/* 1. BARRA SUPERIOR: Título y Volver */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-border/80">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2.5">
            <RefreshCw className="w-7 h-7 text-blue-500" />
            Registrar Nueva Cotización de Recambio
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Cotización inicial para intercambio de compresores o válvulas entre la empresa y el cliente
          </p>
        </div>

        <Link
          to="/admin/cotizaciones/new/inicial"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-card border border-border/80 text-foreground hover:bg-accent transition-all shadow-xs cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 2. SELECTOR DE CLIENTE (boceto) */}
        <div className="bg-card p-4 sm:p-5 rounded-2xl border border-border/80 shadow-xs space-y-2 max-w-md">
          <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Seleccione al Cliente <span className="text-rose-500">*</span>
          </label>
          <select
            required
            value={idCliente}
            onChange={(e) => setIdCliente(e.target.value ? Number(e.target.value) : '')}
            className="w-full px-3 py-2 text-sm rounded-xl bg-background border border-border/80 text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
          >
            <option value="">-- Seleccione al Cliente --</option>
            {clientes.map((c) => (
              <option key={c.id_cliente} value={c.id_cliente}>
                {c.nombre} {c.rut ? `(${c.rut})` : ''}
              </option>
            ))}
          </select>
        </div>

        {/* 3. LÍNEAS DE RECAMBIO (boceto con bloques y botón +) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h2 className="text-base sm:text-lg font-bold text-foreground">
                Lineas de Recambio
              </h2>
              <button
                type="button"
                onClick={handleAgregarLinea}
                className="inline-flex items-center justify-center w-7 h-7 rounded-lg border border-border/80 bg-card hover:bg-accent text-foreground transition-all shadow-xs cursor-pointer"
                title="Agregar otra línea de recambio"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <span className="text-xs font-semibold text-muted-foreground">
              {lineasRecambio.length} {lineasRecambio.length === 1 ? 'línea' : 'líneas'}
            </span>
          </div>

          {/* Lista de Bloques/Tarjetas de Recambio */}
          <div className="space-y-3">
            {lineasRecambio.map((linea, index) => {
              const pUnit = Number(linea.precio_unitario) || 0;
              const tasacion = Number(linea.monto_tasacion) || 0;
              const tasacionInvalida = tasacion > pUnit && pUnit > 0;

              return (
                <div
                  key={linea.id}
                  className="relative bg-card p-4 sm:p-5 rounded-2xl border border-border/80 shadow-xs hover:border-blue-500/40 transition-all space-y-3"
                >
                  {/* Fila Superior: id_inventario_repuesto_saliente | precio_unitario | porcentaje_iva (read only) */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                    {/* id_inventario_repuesto_saliente */}
                    <div className="sm:col-span-6 space-y-1">
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                        Repuesto Saliente (Empresa) <span className="text-rose-500">*</span>
                      </label>
                      <select
                        required
                        value={linea.id_inventario_repuesto_saliente}
                        onChange={(e) =>
                          handleActualizarCampo(
                            index,
                            'id_inventario_repuesto_saliente',
                            e.target.value
                          )
                        }
                        className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-background border border-border/80 text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                      >
                        <option value="">-- Seleccionar repuesto saliente --</option>
                        {inventarioPermitido.map((item) => (
                          <option key={item.id_inventario} value={item.id_inventario}>
                            {item.nombre} ({item.tipo} - {item.condicion || 'N/A'}) - Stock: {item.cantidad_propia}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* precio_unitario */}
                    <div className="sm:col-span-3 space-y-1">
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                        Precio Unitario <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-mono">
                          $
                        </span>
                        <input
                          type="number"
                          required
                          min={0}
                          step="any"
                          placeholder="0.00"
                          value={linea.precio_unitario}
                          onChange={(e) =>
                            handleActualizarCampo(index, 'precio_unitario', e.target.value)
                          }
                          className="w-full pl-6 pr-2.5 py-1.5 text-xs sm:text-sm rounded-xl bg-background border border-border/80 text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                        />
                      </div>
                    </div>

                    {/* porcentaje_iva (read only según boceto) */}
                    <div className="sm:col-span-3 space-y-1">
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                        <span>% IVA</span>
                      </label>
                      <input
                        type="text"
                        readOnly
                        value={`${Number(linea.porcentaje_iva).toFixed(1)}%`}
                        className="w-full px-3 py-1.5 text-xs sm:text-sm rounded-xl bg-muted/50 border border-border/60 text-muted-foreground font-mono cursor-not-allowed text-center select-none"
                      />
                    </div>
                  </div>

                  {/* Fila Inferior: id_inventario_repuesto_entrante | monto_tasacion | Botón Eliminar (X) */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end pt-1">
                    {/* id_inventario_repuesto_entrante */}
                    <div className="sm:col-span-6 space-y-1">
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                        Repuesto Entrante (Cliente Averiado) <span className="text-rose-500">*</span>
                      </label>
                      <select
                        required
                        value={linea.id_inventario_repuesto_entrante}
                        onChange={(e) =>
                          handleActualizarCampo(
                            index,
                            'id_inventario_repuesto_entrante',
                            e.target.value
                          )
                        }
                        className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-background border border-border/80 text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                      >
                        <option value="">-- Seleccionar repuesto entrante --</option>
                        {inventarioPermitido.map((item) => (
                          <option key={item.id_inventario} value={item.id_inventario}>
                            {item.nombre} ({item.tipo} - {item.condicion || 'usado'})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* monto_tasacion */}
                    <div className="sm:col-span-4 space-y-1">
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                        Monto Tasación <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-mono">
                          $
                        </span>
                        <input
                          type="number"
                          required
                          min={0}
                          step="any"
                          placeholder="0.00"
                          value={linea.monto_tasacion}
                          onChange={(e) =>
                            handleActualizarCampo(index, 'monto_tasacion', e.target.value)
                          }
                          className={`w-full pl-6 pr-2.5 py-1.5 text-xs sm:text-sm rounded-xl bg-background border ${tasacionInvalida
                            ? 'border-rose-500 focus:ring-rose-500'
                            : 'border-border/80 focus:ring-blue-500'
                            } text-foreground font-mono focus:outline-none focus:ring-2 transition-all`}
                        />
                      </div>
                    </div>

                    {/* Botón Eliminar (X) según el boceto */}
                    <div className="sm:col-span-2 flex items-center justify-end">
                      <button
                        type="button"
                        onClick={() => handleRemoverLinea(linea.id)}
                        className="w-10 h-10 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20 flex items-center justify-center transition-all cursor-pointer"
                        title="Eliminar línea de recambio"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {/* Resumen auxiliar de la línea */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border/40">
                    {tasacionInvalida && (
                      <span className="text-rose-500 font-semibold flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        La tasación no puede superar al precio unitario
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 4. TOTALES ECONÓMICOS DE LA COTIZACIÓN (boceto) */}
        <div className="bg-card p-5 sm:p-6 rounded-2xl border border-border/80 shadow-xs space-y-4">
          <h2 className="text-base sm:text-lg font-bold text-foreground text-center border-b border-border/60 pb-2">
            Totales Económicos de la Cotización
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div className="p-3 rounded-xl bg-accent/40 space-y-1">
              <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider block">
                Total Gravado
              </span>
              <span className="text-sm sm:text-base font-extrabold font-mono text-foreground">
                ${totales.gravado.toLocaleString('es-CL')}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-accent/40 space-y-1">
              <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider block">
                Total Exento
              </span>
              <span className="text-sm sm:text-base font-extrabold font-mono text-foreground">
                ${totales.exento.toLocaleString('es-CL')}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-accent/40 space-y-1">
              <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider block">
                Total IVA
              </span>
              <span className="text-sm sm:text-base font-extrabold font-mono text-foreground">
                ${totales.iva.toLocaleString('es-CL')}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 space-y-1">
              <span className="text-xs text-blue-600 dark:text-blue-400 uppercase font-bold tracking-wider block">
                Monto Total
              </span>
              <span className="text-base sm:text-lg font-extrabold font-mono text-blue-600 dark:text-blue-400">
                ${totales.total.toLocaleString('es-CL')}
              </span>
            </div>
          </div>
        </div>

        {/* 5. BOTÓN GENERAR (centrado según boceto) */}
        <div className="flex justify-center pt-2">
          <button
            type="submit"
            disabled={createMutation.isPending || lineasRecambio.length === 0}
            className="w-full sm:w-80 py-3 text-sm sm:text-base font-bold rounded-xl bg-blue-500 hover:bg-blue-600 text-white shadow-lg shadow-blue-500/25 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {createMutation.isPending ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Generando Cotización...
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

export default CotizacionInicialRecambioFormPage;
