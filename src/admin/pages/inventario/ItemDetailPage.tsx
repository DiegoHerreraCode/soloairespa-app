import { useMemo, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  Edit2,
  Package,
  Barcode,
  Layers,
  Percent,
  TrendingUp,
  ShoppingCart,
  ClipboardList,
  Building2,
  User,
  ChevronLeft,
  ChevronRight,
  Boxes,
  DollarSign,
  AlertCircle,
  ShieldCheck,
  Wrench,
} from 'lucide-react';
import { getInventarioByIdAction } from '../../actions/get-inventario-by-id.action';
import { getRepuestosAction } from '../../actions/get-repuestos.action';
import { getEquiposAction } from '../../actions/get-equipos.action';
import { getComprasAction } from '../../actions/get-compras.action';
import { getOrdenesAction } from '../../actions/get-ordenes.action';
import { getProveedoresAction } from '../../actions/get-proveedores.action';
import { getClientesAction } from '../../actions/get-clientes.action';
import { getInventarioProveedoresAction } from '../../actions/get-inventario-proveedores.action';
import type { RepuestoItem } from '../../interfaces/repuesto.interface';
import type { EquipoItem } from '../../interfaces/equipo.interface';
import type { InventarioProveedorItem } from '../../interfaces/inventario-proveedor.interface';

export const ItemDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // 1. Cargar ítem de inventario
  const { data: itemData, isLoading: isLoadingItem } = useQuery({
    queryKey: ['inventario-item', id],
    queryFn: () => getInventarioByIdAction(id!),
    enabled: !!id,
  });

  const isSerialized = itemData && itemData.tipo !== 'insumo';

  // 2. Cargar repuestos si el ítem es compresor o valvula
  const { data: repuestos = [] } = useQuery<RepuestoItem[]>({
    queryKey: ['repuestos-stock'],
    queryFn: getRepuestosAction,
    enabled: !!(isSerialized && (itemData?.tipo === 'compresor' || itemData?.tipo === 'valvula')),
  });

  // 3. Cargar equipos si el ítem es equipo
  const { data: equipos = [] } = useQuery<EquipoItem[]>({
    queryKey: ['equipos-listado'],
    queryFn: getEquiposAction,
    enabled: !!(isSerialized && itemData?.tipo === 'equipo'),
  });

  // 4. Cargar compras para resolver información de proveedor y código
  const { data: compras = [] } = useQuery({
    queryKey: ['compras-listado'],
    queryFn: getComprasAction,
    enabled: !!isSerialized,
  });

  // 5. Cargar órdenes para resolver información de clientes
  const { data: ordenes = [] } = useQuery({
    queryKey: ['ordenes-listado'],
    queryFn: getOrdenesAction,
    enabled: !!isSerialized,
  });

  // 6. Cargar todos los proveedores (tanto para serializados como para opciones de compra)
  const { data: proveedores = [] } = useQuery({
    queryKey: ['proveedores-listado'],
    queryFn: getProveedoresAction,
  });

  // 7. Cargar relaciones inventario-proveedores para ver quiénes suministran este ítem
  const { data: proveedoresQueSuministran = [], isLoading: isLoadingProveedoresItem } = useQuery<InventarioProveedorItem[]>({
    queryKey: ['inventario-proveedores-item', id],
    queryFn: () => getInventarioProveedoresAction({ id_inventario: Number(id) }),
    enabled: !!id,
  });

  const { data: clientes = [] } = useQuery({
    queryKey: ['clientes-listado'],
    queryFn: getClientesAction,
    enabled: !!isSerialized,
  });

  // Mapas de búsqueda rápida
  const proveedoresMap = useMemo(() => {
    return new Map(proveedores.map((p) => [p.id_proveedor, p]));
  }, [proveedores]);

  const clientesMap = useMemo(() => {
    return new Map(clientes.map((c) => [c.id_cliente, c]));
  }, [clientes]);

  const comprasMap = useMemo(() => {
    return new Map(compras.map((comp) => [comp.id_compra, comp]));
  }, [compras]);

  const ordenesMap = useMemo(() => {
    return new Map(ordenes.map((ord) => [ord.id_orden, ord]));
  }, [ordenes]);

  // Mapa de detalles de compra: id_detalle_compra -> { id_compra, codigo_proveedor }
  const detallesComprasMap = useMemo(() => {
    const map = new Map<number, { id_compra?: number; codigo_proveedor?: string | null }>();
    compras.forEach((comp) => {
      comp.detalles?.forEach((det) => {
        if (det.id_detalle_compra) {
          map.set(det.id_detalle_compra, {
            id_compra: comp.id_compra,
            codigo_proveedor: det.codigo_proveedor,
          });
        }
      });
    });
    return map;
  }, [compras]);

  // Registros físicos que confirman la cantidad_total del ítem
  const registrosSerializados = useMemo(() => {
    if (!itemData || !isSerialized) return [];
    const numId = Number(id);

    if (itemData.tipo === 'equipo') {
      // Para equipos: registros en 'equipos' con is_deleted != true
      return equipos
        .filter((eq) => eq.id_inventario === numId && !(eq.is_deleted === true || String(eq.is_deleted) === '1'))
        .map((eq) => {
          const infoDetalle = eq.id_detalle_compra ? detallesComprasMap.get(eq.id_detalle_compra) : undefined;
          const idCompra = infoDetalle?.id_compra;
          const compra = idCompra ? comprasMap.get(idCompra) : undefined;
          const prov = compra?.proveedor || (compra?.id_proveedor ? proveedoresMap.get(compra.id_proveedor) : undefined);

          return {
            id: `eq-${eq.id_equipo}`,
            identificador: `#${eq.id_equipo}`,
            serial: eq.serial || 'Sin serial',
            service_tag: '-',
            tipo_origen: 'compra' as const,
            id_origen: idCompra ?? null,
            codigo_proveedor: infoDetalle?.codigo_proveedor || '-',
            origen_nombre: prov?.nombre || 'Proveedor no registrado',
            origen_rut: prov?.rut || '-',
            propietario_texto: 'Taller (Propio)',
            estado_texto: 'Activo',
          };
        });
    }

    // Para compresores y válvulas: registros en 'repuestos' con id_orden_salida == null
    return repuestos
      .filter((r) => r.id_inventario === numId && (r.id_orden_salida === null || r.id_orden_salida === undefined))
      .map((r) => {
        if (r.id_detalle_compra) {
          const infoDetalle = detallesComprasMap.get(r.id_detalle_compra);
          const idCompra = infoDetalle?.id_compra;
          const compra = idCompra ? comprasMap.get(idCompra) : undefined;
          const prov = compra?.proveedor || (compra?.id_proveedor ? proveedoresMap.get(compra.id_proveedor) : undefined);

          return {
            id: `rep-${r.id_repuesto}`,
            identificador: `#${r.id_repuesto}`,
            serial: r.serial || 'Sin serial',
            service_tag: r.service_tag || 'Sin tag',
            tipo_origen: 'compra' as const,
            id_origen: idCompra ?? null,
            codigo_proveedor: infoDetalle?.codigo_proveedor || '-',
            origen_nombre: prov?.nombre || 'Proveedor no registrado',
            origen_rut: prov?.rut || '-',
            propietario_texto: r.propietario ? 'Taller (Propio)' : 'Cliente',
            estado_texto: r.estado || 'nuevo',
          };
        } else if (r.id_orden_entrada) {
          const orden = ordenesMap.get(r.id_orden_entrada);
          const cli = orden?.cliente || (orden?.id_cliente ? clientesMap.get(orden.id_cliente) : undefined);

          return {
            id: `rep-${r.id_repuesto}`,
            identificador: `#${r.id_repuesto}`,
            serial: r.serial || 'Sin serial',
            service_tag: r.service_tag || 'Sin tag',
            tipo_origen: 'orden' as const,
            id_origen: r.id_orden_entrada,
            codigo_proveedor: '-',
            origen_nombre: cli?.nombre || 'Cliente no registrado',
            origen_rut: cli?.rut || '-',
            propietario_texto: r.propietario ? 'Taller (Propio)' : 'Cliente',
            estado_texto: r.estado || 'pendiente_reparacion',
          };
        }

        return {
          id: `rep-${r.id_repuesto}`,
          identificador: `#${r.id_repuesto}`,
          serial: r.serial || 'Sin serial',
          service_tag: r.service_tag || 'Sin tag',
          tipo_origen: 'otro' as const,
          id_origen: null,
          codigo_proveedor: '-',
          origen_nombre: 'Ingreso directo',
          origen_rut: '-',
          propietario_texto: r.propietario ? 'Taller (Propio)' : 'Cliente',
          estado_texto: r.estado || 'nuevo',
        };
      });
  }, [itemData, isSerialized, id, equipos, repuestos, detallesComprasMap, comprasMap, proveedoresMap, ordenesMap, clientesMap]);

  // Paginación para tabla de registros serializados (7 por página)
  const [paginaRegistros, setPaginaRegistros] = useState(1);
  const itemsPorPagina = 7;
  const totalPaginasRegistros = Math.ceil(registrosSerializados.length / itemsPorPagina);

  const paginatedRegistros = useMemo(() => {
    const inicio = (paginaRegistros - 1) * itemsPorPagina;
    return registrosSerializados.slice(inicio, inicio + itemsPorPagina);
  }, [registrosSerializados, paginaRegistros]);

  // Paginación para tabla de proveedores que suministran este ítem (7 por página)
  const [paginaProveedores, setPaginaProveedores] = useState(1);
  const totalPaginasProveedores = Math.ceil(proveedoresQueSuministran.length / itemsPorPagina);

  const paginatedProveedores = useMemo(() => {
    const inicio = (paginaProveedores - 1) * itemsPorPagina;
    return proveedoresQueSuministran.slice(inicio, inicio + itemsPorPagina);
  }, [proveedoresQueSuministran, paginaProveedores]);

  if (isLoadingItem) {
    return (
      <div className="flex items-center justify-center min-h-[350px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!itemData) {
    return (
      <div className="bg-card p-12 rounded-2xl border border-border/80 text-center space-y-4 max-w-lg mx-auto">
        <Package className="w-12 h-12 text-muted-foreground/40 mx-auto" />
        <h2 className="text-lg font-bold text-foreground">Ítem no encontrado</h2>
        <p className="text-xs text-muted-foreground">
          No existe ningún ítem de inventario con el identificador #{id}.
        </p>
        <Link
          to="/admin/inventario/items"
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-blue-600 text-white"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al listado
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl animate-fadeIn mx-auto pb-12">
      {/* 1. Encabezado con Botón Volver y Botón Editar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-border/80">
        <div className="flex items-center gap-3">
          <Link
            to="/admin/inventario/items"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-card border border-border/80 text-foreground hover:bg-accent transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Package className="w-6 h-6 text-blue-500" />
              Detalle del Ítem #{itemData.id_inventario}
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Ficha técnica, métricas económicas y existencias físicas del ítem
            </p>
          </div>
        </div>

        <button
          onClick={() => navigate(`/admin/inventario/items/${itemData.id_inventario}`)}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 transition-all cursor-pointer"
        >
          <Edit2 className="w-4 h-4" />
          Editar Ítem
        </button>
      </div>

      {/* 2. Tarjeta con Ficha Técnica y Métricas Económicas */}
      <div className="bg-card p-6 sm:p-8 rounded-2xl border border-border/80 shadow-xs space-y-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1">
            Información General
          </span>
          <h2 className="text-xl font-extrabold text-foreground">{itemData.nombre}</h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-3.5 bg-accent/40 rounded-xl space-y-1">
            <span className="text-xs text-muted-foreground block flex items-center gap-1">
              <Barcode className="w-3.5 h-3.5 text-blue-500" /> SKU
            </span>
            <span className="font-mono font-bold text-foreground text-sm sm:text-base">
              {itemData.sku || 'N/A'}
            </span>
          </div>

          <div className="p-3.5 bg-accent/40 rounded-xl space-y-1">
            <span className="text-xs text-muted-foreground block flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-blue-500" /> Tipo
            </span>
            <span className="capitalize font-semibold text-foreground text-sm sm:text-base">
              {itemData.tipo}
            </span>
          </div>

          <div className="p-3.5 bg-accent/40 rounded-xl space-y-1">
            <span className="text-xs text-muted-foreground block flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Condición
            </span>
            <span className="uppercase font-semibold text-foreground text-sm sm:text-base">
              {itemData.condicion || 'N/A'}
            </span>
          </div>

          <div className="p-3.5 bg-accent/40 rounded-xl space-y-1">
            <span className="text-xs text-muted-foreground block flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 text-amber-500" /> Stock Mínimo
            </span>
            <span className="font-mono font-bold text-foreground text-sm sm:text-base">
              {itemData.stock_minimo ?? 0}
            </span>
          </div>
        </div>

        {/* Resumen de Stocks Consolidados */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div className="p-4 rounded-xl border border-blue-500/20 bg-blue-500/10 text-center space-y-0.5">
            <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 block uppercase tracking-wider">
              Cantidad Total
            </span>
            <span className="text-2xl font-black text-blue-600 dark:text-blue-400 font-mono">
              {itemData.cantidad_total ?? 0}
            </span>
          </div>

          <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-center space-y-0.5">
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 block uppercase tracking-wider">
              Cantidad Propia (Taller)
            </span>
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
              {itemData.cantidad_propia ?? 0}
            </span>
          </div>

          <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/10 text-center space-y-0.5">
            <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 block uppercase tracking-wider">
              Cantidad Cliente
            </span>
            <span className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono">
              {itemData.cantidad_cliente ?? 0}
            </span>
          </div>
        </div>

        {/* Parámetros y Cantidades Económicas */}
        {(() => {
          const tipo = itemData.tipo;
          const condicion = (itemData.condicion || '').toLowerCase().trim();

          // Reglas:
          // 1. Para insumos: todos los campos económicos excepto los de reparación.
          // 2. Para equipos: solo los campos económicos de compra.
          // 3. Para compresores y válvulas con condición "nuevo": todos los campos económicos excepto los de reparación.
          // 4. Para compresores y válvulas con condición "usado": todos los campos económicos.
          const showCompras = true; // Aplica para los 4 casos
          const showVentas = tipo !== 'equipo'; // Aplica para insumos, compresores y válvulas (nuevo y usado)
          const showReparaciones = (tipo === 'compresor' || tipo === 'valvula') && condicion === 'usado';

          return (
            <div className="space-y-4 pt-4 border-t border-border/60">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                Cantidades y Parámetros Económicos
              </span>

              {/* Parámetros Generales: IVA y Margen de Ganancia (si aplica venta) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-accent/30 border border-border/60">
                <div className="space-y-0.5">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Percent className="w-3.5 h-3.5 text-blue-500" /> IVA
                  </span>
                  <span className="font-semibold text-foreground text-sm">
                    {itemData.porcentaje_iva ?? 19}%
                  </span>
                </div>

                {showVentas && (
                  <>
                    <div className="space-y-0.5">
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Percent className="w-3.5 h-3.5 text-emerald-500" /> Margen Ganancia
                      </span>
                      <span className="font-semibold text-foreground text-sm">
                        {itemData.porcentaje_ganancia ?? 30}%
                      </span>
                    </div>

                    <div className="space-y-0.5">
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <TrendingUp className="w-3.5 h-3.5 text-blue-500" /> Precio Venta Sugerido
                      </span>
                      <span className="font-mono font-bold text-blue-600 dark:text-blue-400 text-sm">
                        ${Number(itemData.monto_venta_unitario || 0).toLocaleString('es-CL')}
                      </span>
                    </div>
                  </>
                )}

                <div className="space-y-0.5">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <DollarSign className="w-3.5 h-3.5 text-muted-foreground" /> Último Costo Compra
                  </span>
                  <span className="font-mono font-bold text-foreground text-sm">
                    ${Number(itemData.ultimo_monto_compra || 0).toLocaleString('es-CL')}
                  </span>
                </div>
              </div>

              {/* 1. Métricas de Compra */}
              {showCompras && (
                <div className="space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <ShoppingCart className="w-3.5 h-3.5 text-blue-500" />
                    Métricas de Compra
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-center">
                    <div className="p-3 bg-accent/40 rounded-xl space-y-0.5">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                        Compra Mínima
                      </span>
                      <span className="font-mono font-bold text-foreground text-sm">
                        ${Number(itemData.monto_compra_min || 0).toLocaleString('es-CL')}
                      </span>
                    </div>
                    <div className="p-3 bg-accent/40 rounded-xl space-y-0.5">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                        Compra Promedio
                      </span>
                      <span className="font-mono font-bold text-foreground text-sm">
                        ${Number(itemData.monto_compra_prom || 0).toLocaleString('es-CL')}
                      </span>
                    </div>
                    <div className="p-3 bg-accent/40 rounded-xl space-y-0.5">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                        Compra Máxima
                      </span>
                      <span className="font-mono font-bold text-foreground text-sm">
                        ${Number(itemData.monto_compra_max || 0).toLocaleString('es-CL')}
                      </span>
                    </div>
                    <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl space-y-0.5">
                      <span className="text-[10px] uppercase font-bold text-blue-600 dark:text-blue-400 block">
                        Última Compra
                      </span>
                      <span className="font-mono font-bold text-blue-600 dark:text-blue-400 text-sm">
                        ${Number(itemData.ultimo_monto_compra || 0).toLocaleString('es-CL')}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* 2. Métricas de Venta */}
              {showVentas && (
                <div className="space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                    Métricas de Venta
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-center">
                    <div className="p-3 bg-accent/40 rounded-xl space-y-0.5">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                        Venta Mínima
                      </span>
                      <span className="font-mono font-bold text-foreground text-sm">
                        ${Number(itemData.monto_venta_min || 0).toLocaleString('es-CL')}
                      </span>
                    </div>
                    <div className="p-3 bg-accent/40 rounded-xl space-y-0.5">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                        Venta Promedio
                      </span>
                      <span className="font-mono font-bold text-foreground text-sm">
                        ${Number(itemData.monto_venta_prom || 0).toLocaleString('es-CL')}
                      </span>
                    </div>
                    <div className="p-3 bg-accent/40 rounded-xl space-y-0.5">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                        Venta Máxima
                      </span>
                      <span className="font-mono font-bold text-foreground text-sm">
                        ${Number(itemData.monto_venta_max || 0).toLocaleString('es-CL')}
                      </span>
                    </div>
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl space-y-0.5">
                      <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 block">
                        Venta Sugerida
                      </span>
                      <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                        ${Number(itemData.monto_venta_unitario || 0).toLocaleString('es-CL')}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* 3. Métricas de Reparación */}
              {showReparaciones && (
                <div className="space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Wrench className="w-3.5 h-3.5 text-amber-500" />
                    Métricas de Reparación
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
                    <div className="p-3 bg-accent/40 rounded-xl space-y-0.5">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                        Reparación Mínima
                      </span>
                      <span className="font-mono font-bold text-foreground text-sm">
                        ${Number(itemData.monto_reparacion_min || 0).toLocaleString('es-CL')}
                      </span>
                    </div>
                    <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl space-y-0.5">
                      <span className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400 block">
                        Reparación Promedio
                      </span>
                      <span className="font-mono font-bold text-amber-600 dark:text-amber-400 text-sm">
                        ${Number(itemData.monto_reparacion_prom || 0).toLocaleString('es-CL')}
                      </span>
                    </div>
                    <div className="p-3 bg-accent/40 rounded-xl space-y-0.5">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                        Reparación Máxima
                      </span>
                      <span className="font-mono font-bold text-foreground text-sm">
                        ${Number(itemData.monto_reparacion_max || 0).toLocaleString('es-CL')}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })()}
      </div>

      {/* 3. Tabla de Proveedores que suministran este ítem y su último monto de compra */}
      <div className="bg-card p-6 sm:p-8 rounded-2xl border border-border/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/70 pb-3">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-foreground flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-500" />
              Proveedores y Opciones de Compra ({proveedoresQueSuministran.length})
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Proveedores que suministran este ítem en su catálogo, con su código respectivo y último costo registrado
            </p>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-border/70">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-muted/40 border-b border-border/70 text-muted-foreground font-semibold">
                <th className="py-2.5 px-3 text-center">Proveedor</th>
                <th className="py-2.5 px-3 text-center">RUT Proveedor</th>
                <th className="py-2.5 px-3 text-center">Código Proveedor</th>
                <th className="py-2.5 px-3 text-center">Último Monto de Compra</th>
                <th className="py-2.5 px-3 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {isLoadingProveedoresItem ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-muted-foreground">
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />
                      Cargando opciones de proveedores...
                    </div>
                  </td>
                </tr>
              ) : paginatedProveedores.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-muted-foreground">
                    <AlertCircle className="w-6 h-6 text-muted-foreground/40 mx-auto mb-1.5" />
                    No hay proveedores registrados que suministren este ítem actualmente.
                  </td>
                </tr>
              ) : (
                paginatedProveedores.map((ip) => {
                  const prov = ip.proveedor || proveedoresMap.get(ip.id_proveedor);

                  return (
                    <tr key={ip.id_inventario_proveedor} className="hover:bg-accent/40 transition-colors">
                      <td className="py-2.5 px-3 font-semibold text-foreground text-center">
                        {prov?.nombre || `Proveedor #${ip.id_proveedor}`}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-muted-foreground text-center">
                        {prov?.rut || '-'}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-blue-600 dark:text-blue-400 text-center">
                        {ip.codigo_proveedor}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono font-bold text-foreground">
                        {ip.ultimo_monto_compra !== undefined && ip.ultimo_monto_compra !== null && Number(ip.ultimo_monto_compra) > 0 ? (
                          `$${Math.round(Number(ip.ultimo_monto_compra)).toLocaleString('es-CL')}`
                        ) : (
                          <span className="text-muted-foreground font-normal">Sin compras registradas ($0)</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <Link
                          to={`/admin/compras/proveedores/${ip.id_proveedor}/catalogo`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-card border border-border/80 text-foreground hover:bg-accent transition-colors"
                        >
                          Ver Catálogo
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación de proveedores si hay más de 7 */}
        {totalPaginasProveedores > 1 && (
          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-muted-foreground">
              Mostrando {paginatedProveedores.length} de {proveedoresQueSuministran.length} proveedores
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={paginaProveedores === 1}
                onClick={() => setPaginaProveedores((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg border border-border/80 text-foreground hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-semibold px-2">
                Página {paginaProveedores} de {totalPaginasProveedores}
              </span>
              <button
                type="button"
                disabled={paginaProveedores === totalPaginasProveedores}
                onClick={() => setPaginaProveedores((p) => Math.min(totalPaginasProveedores, p + 1))}
                className="p-1.5 rounded-lg border border-border/80 text-foreground hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 4. Tabla con los N registros que componen la cantidad total de existencias (Serializados) */}
      {isSerialized ? (
        <div className="bg-card p-6 sm:p-8 rounded-2xl border border-border/80 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/70 pb-3">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-foreground flex items-center gap-2">
                <Boxes className="w-5 h-5 text-blue-500" />
                Desglose Físico de Existencias Activas ({registrosSerializados.length})
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Registros individuales que componen las existencias de este ítem en bodega
              </p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-border/70">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-muted/40 border-b border-border/70 text-muted-foreground font-semibold">
                  <th className="py-2.5 px-3 text-center">Identificador</th>
                  <th className="py-2.5 px-3 text-center">Serial</th>
                  {itemData?.tipo !== 'equipo' && <th className="py-2.5 px-3 text-center">Service Tag</th>}
                  <th className="py-2.5 px-3 text-center">Origen</th>
                  <th className="py-2.5 px-3 text-center">ID Origen</th>
                  <th className="py-2.5 px-3 text-center">Cód. Proveedor</th>
                  <th className="py-2.5 px-3 text-center">Entidad (Proveedor / Cliente)</th>
                  <th className="py-2.5 px-3 text-center">RUT</th>
                  <th className="py-2.5 px-3 text-center">Titularidad</th>
                  <th className="py-2.5 px-3 text-center">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {paginatedRegistros.length === 0 ? (
                  <tr>
                    <td
                      colSpan={itemData?.tipo !== 'equipo' ? 10 : 9}
                      className="text-center py-8 text-muted-foreground"
                    >
                      No se encontraron piezas físicas registradas en existencia para este ítem.
                    </td>
                  </tr>
                ) : (
                  paginatedRegistros.map((reg) => (
                    <tr key={reg.id} className="hover:bg-accent/30 transition-colors">
                      <td className="py-2.5 px-3 font-mono font-bold text-foreground text-center">
                        {reg.identificador}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-foreground font-medium text-center">
                        {reg.serial}
                      </td>
                      {itemData?.tipo !== 'equipo' && (
                        <td className="py-2.5 px-3 font-mono text-muted-foreground text-center">
                          {reg.service_tag}
                        </td>
                      )}
                      <td className="py-2.5 px-3 text-center">
                        {reg.tipo_origen === 'compra' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                            <ShoppingCart className="w-3 h-3" />
                            Compra
                          </span>
                        ) : reg.tipo_origen === 'orden' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                            <ClipboardList className="w-3 h-3" />
                            Orden
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono font-bold text-foreground">
                        {reg.id_origen ? `#${reg.id_origen}` : '-'}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-blue-600 dark:text-blue-400 font-bold text-center">
                        {reg.codigo_proveedor}
                      </td>
                      <td className="py-2.5 px-3 font-medium text-foreground text-center">
                        <div className="flex items-center gap-1.5 truncate max-w-[200px]" title={reg.origen_nombre}>
                          {reg.tipo_origen === 'compra' ? (
                            <Building2 className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                          ) : (
                            <User className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                          )}
                          <span className="truncate">{reg.origen_nombre}</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-muted-foreground text-center">
                        {reg.origen_rut}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${reg.propietario_texto.includes('Propio')
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                            }`}
                        >
                          {reg.propietario_texto}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center capitalize text-muted-foreground">
                        {reg.estado_texto}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Paginación si hay más de 7 registros */}
          {totalPaginasRegistros > 1 && (
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-muted-foreground">
                Mostrando {paginatedRegistros.length} de {registrosSerializados.length} registros
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={paginaRegistros === 1}
                  onClick={() => setPaginaRegistros((p) => Math.max(1, p - 1))}
                  className="p-1.5 rounded-lg border border-border/80 text-foreground hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs font-semibold px-2">
                  Página {paginaRegistros} de {totalPaginasRegistros}
                </span>
                <button
                  type="button"
                  disabled={paginaRegistros === totalPaginasRegistros}
                  onClick={() => setPaginaRegistros((p) => Math.min(totalPaginasRegistros, p + 1))}
                  className="p-1.5 rounded-lg border border-border/80 text-foreground hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-card p-6 rounded-2xl border border-border/80 text-center text-xs text-muted-foreground">
          Los ítems de tipo <span className="font-semibold text-foreground">Insumo</span> se gestionan por cantidad global y no requieren identificación serializada individual.
        </div>
      )}
    </div>
  );
};

