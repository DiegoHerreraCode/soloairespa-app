import { useEffect, useState, useMemo } from 'react';
import { useParams, Link } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Save,
  Package,
  Barcode,
  Layers,
  Percent,
  TrendingUp,
  AlertTriangle,
  ShoppingCart,
  ClipboardList,
  Building2,
  User,
  ChevronLeft,
  ChevronRight,
  Boxes,
  Plus,
  Trash2,
} from 'lucide-react';
import { getInventarioByIdAction } from '../../actions/get-inventario-by-id.action';
import { getModelosAction } from '../../actions/get-modelos.action';
import { getRepuestosAction } from '../../actions/get-repuestos.action';
import { getEquiposAction } from '../../actions/get-equipos.action';
import { getComprasAction } from '../../actions/get-compras.action';
import { getOrdenesAction } from '../../actions/get-ordenes.action';
import { getProveedoresAction } from '../../actions/get-proveedores.action';
import { getClientesAction } from '../../actions/get-clientes.action';
import { useItemMutation } from '../../hooks/useItemMutation';
import type { RepuestoItem } from '../../interfaces/repuesto.interface';
import type { EquipoItem } from '../../interfaces/equipo.interface';

export const ItemFormPage = () => {
  const { id } = useParams<{ id: string }>();

  // Si id === 'new', estamos creando; de lo contrario estamos editando
  const isCreating = !id || id === 'new';

  const { saveItem, isPending } = useItemMutation();

  // Consulta de modelos para selección al crear
  const { data: modelos = [] } = useQuery({
    queryKey: ['modelos-listado'],
    queryFn: getModelosAction,
  });

  // Consulta del ítem si estamos editando
  const { data: itemData, isLoading: isLoadingItem } = useQuery({
    queryKey: ['inventario-item', id],
    queryFn: () => getInventarioByIdAction(id!),
    enabled: !isCreating,
  });

  const isSerialized = itemData && itemData.tipo !== 'insumo';

  // 1. Cargar repuestos si el ítem es compresor o valvula
  const { data: repuestos = [] } = useQuery<RepuestoItem[]>({
    queryKey: ['repuestos-stock'],
    queryFn: getRepuestosAction,
    enabled: !!(!isCreating && isSerialized && (itemData?.tipo === 'compresor' || itemData?.tipo === 'valvula')),
  });

  // 2. Cargar equipos si el ítem es equipo
  const { data: equipos = [] } = useQuery<EquipoItem[]>({
    queryKey: ['equipos-listado'],
    queryFn: getEquiposAction,
    enabled: !!(!isCreating && isSerialized && itemData?.tipo === 'equipo'),
  });

  // 3. Cargar compras para resolver información de origen de compra
  const { data: compras = [] } = useQuery({
    queryKey: ['compras-listado'],
    queryFn: getComprasAction,
    enabled: !!(!isCreating && isSerialized),
  });

  // 4. Cargar órdenes para resolver información de origen de orden de trabajo
  const { data: ordenes = [] } = useQuery({
    queryKey: ['ordenes-listado'],
    queryFn: getOrdenesAction,
    enabled: !!(!isCreating && isSerialized),
  });

  // 5. Cargar todos los proveedores (necesarios para asociar al crear o editar el ítem)
  const { data: proveedores = [] } = useQuery({
    queryKey: ['proveedores-listado'],
    queryFn: getProveedoresAction,
  });

  const { data: clientes = [] } = useQuery({
    queryKey: ['clientes-listado'],
    queryFn: getClientesAction,
    enabled: !!(!isCreating && isSerialized),
  });

  // Mapas rápidos para resolución eficiente
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

  // Mapa de detalles de compras: id_detalle_compra -> { id_compra, codigo_proveedor }
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

  // Registros físicos serializados que componen la cantidad_total de este ítem
  const registrosSerializados = useMemo(() => {
    if (!itemData || !isSerialized) return [];
    const numId = Number(id);

    if (itemData.tipo === 'equipo') {
      // Para equipos: registros de la tabla 'equipos' con is_deleted != true
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

    // Para compresores y válvulas: registros de la tabla 'repuestos' con id_orden_salida === null
    return repuestos
      .filter((r) => r.id_inventario === numId && (r.id_orden_salida === null || r.id_orden_salida === undefined))
      .map((r) => {
        if (r.id_detalle_compra) {
          // Origen por COMPRA
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
          // Origen por ORDEN (Recambio o Recepción para Reparación)
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

        // Caso sin detalle_compra ni orden_entrada explícita
        return {
          id: `rep-${r.id_repuesto}`,
          identificador: `#${r.id_repuesto}`,
          serial: r.serial || 'Sin serial',
          service_tag: r.service_tag || 'Sin tag',
          tipo_origen: 'otro' as const,
          id_origen: null,
          codigo_proveedor: '-',
          origen_nombre: 'Ingreso directo inicial',
          origen_rut: '-',
          propietario_texto: r.propietario ? 'Taller (Propio)' : 'Cliente',
          estado_texto: r.estado || 'nuevo',
        };
      });
  }, [itemData, isSerialized, id, equipos, repuestos, detallesComprasMap, comprasMap, proveedoresMap, ordenesMap, clientesMap]);

  // Paginación para la tabla de registros serializados (7 por página)
  const [paginaRegistros, setPaginaRegistros] = useState(1);
  const itemsPorPagina = 7;
  const totalPaginasRegistros = Math.ceil(registrosSerializados.length / itemsPorPagina);

  const paginatedRegistros = useMemo(() => {
    const inicio = (paginaRegistros - 1) * itemsPorPagina;
    return registrosSerializados.slice(inicio, inicio + itemsPorPagina);
  }, [registrosSerializados, paginaRegistros]);

  // Estados del formulario
  const [sku, setSku] = useState('');
  const [nombre, setNombre] = useState('');
  const [tipo, setTipo] = useState<'insumo' | 'compresor' | 'valvula' | 'equipo'>('insumo');
  const [condicion, setCondicion] = useState<string>('NA');
  const [stockMinimo, setStockMinimo] = useState<number | ''>(5);
  const [porcentajeIva, setPorcentajeIva] = useState<number | ''>(19);
  const [porcentajeGanancia, setPorcentajeGanancia] = useState<number | ''>(30);
  const [idModelo, setIdModelo] = useState<number | ''>('');

  // Estado para asociaciones con proveedores
  interface ProveedorFila {
    id_proveedor: number | '';
    codigo_proveedor: string;
    ultimo_monto_compra: number | '';
  }
  const [proveedoresAsociados, setProveedoresAsociados] = useState<ProveedorFila[]>([]);

  // Sincronizar datos al editar
  useEffect(() => {
    if (itemData) {
      setSku(itemData.sku || '');
      setNombre(itemData.nombre || '');
      setTipo(itemData.tipo || 'insumo');
      setCondicion(itemData.condicion || '');
      setStockMinimo(itemData.stock_minimo ?? 0);
      setPorcentajeIva(itemData.porcentaje_iva !== undefined && itemData.porcentaje_iva !== null ? Number(itemData.porcentaje_iva) : 19);
      setPorcentajeGanancia(itemData.porcentaje_ganancia !== undefined && itemData.porcentaje_ganancia !== null ? Number(itemData.porcentaje_ganancia) : 30);
      setIdModelo(itemData.id_modelo || '');

      // Cargar homologaciones existentes con proveedores si las tiene
      if (itemData.inventario_proveedores && Array.isArray(itemData.inventario_proveedores)) {
        setProveedoresAsociados(
          itemData.inventario_proveedores.map((ip) => ({
            id_proveedor: ip.id_proveedor,
            codigo_proveedor: ip.codigo_proveedor || '',
            ultimo_monto_compra: ip.ultimo_monto_compra !== undefined && ip.ultimo_monto_compra !== null ? Number(ip.ultimo_monto_compra) : '',
          }))
        );
      } else {
        setProveedoresAsociados([]);
      }
    }
  }, [itemData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!idModelo) {
      toast.warning('Por favor selecciona un modelo');
      return;
    }

    if (!sku.trim()) {
      toast.warning('Por favor ingresa el SKU del ítem');
      return;
    }

    if (!nombre.trim()) {
      toast.warning('Por favor ingresa el nombre del ítem');
      return;
    }

    if (stockMinimo === '' || Number(stockMinimo) < 0) {
      toast.warning('Por favor ingresa un stock mínimo válido (mayor o igual a 0)');
      return;
    }

    if (porcentajeIva === '' || Number(porcentajeIva) < 0) {
      toast.warning('Por favor ingresa un porcentaje de IVA válido');
      return;
    }

    if (porcentajeGanancia === '' || Number(porcentajeGanancia) < 0) {
      toast.warning('Por favor ingresa un porcentaje de ganancia válido');
      return;
    }

    //validar condicion valida para tipo insumo y equipo
    if ((tipo === 'insumo' || tipo === 'equipo') && condicion !== 'NA') {
      toast.warning('Por favor ingresa "NA" como condicion para insumos y equipos');
      return;
    }

    //validar condiciones validas para tipo compresor y valvula
    if ((tipo === 'compresor' || tipo === 'valvula') && condicion === 'NA') {
      toast.warning('Por favor ingresa "nuevo" o "usado" como condicion para compresores y valvulas');
      return;
    }

    // Validar filas de proveedores asociados (si agregó alguna fila)
    const proveedoresPayload = [];
    const proveedoresSeleccionadosIds = new Set<number>();

    for (let i = 0; i < proveedoresAsociados.length; i++) {
      const p = proveedoresAsociados[i];
      if (!p.id_proveedor) {
        toast.warning(`Selecciona un proveedor válido en la fila #${i + 1}`);
        return;
      }
      if (proveedoresSeleccionadosIds.has(Number(p.id_proveedor))) {
        toast.warning(`El proveedor en la fila #${i + 1} está duplicado`);
        return;
      }
      proveedoresSeleccionadosIds.add(Number(p.id_proveedor));

      if (!p.codigo_proveedor.trim()) {
        toast.warning(`Ingresa el código de proveedor en la fila #${i + 1}`);
        return;
      }

      proveedoresPayload.push({
        id_proveedor: Number(p.id_proveedor),
        codigo_proveedor: p.codigo_proveedor.trim(),
        ultimo_monto_compra: p.ultimo_monto_compra !== '' ? Number(p.ultimo_monto_compra) : 0,
      });
    }

    if (isCreating) {
      // Crear: id_modelo, sku, nombre, tipo, condicion, stock_minimo, porcentaje_iva, porcentaje_ganancia y proveedores
      saveItem({
        payload: {
          id_modelo: Number(idModelo),
          sku: sku.trim().toUpperCase(),
          nombre: nombre.trim(),
          tipo,
          condicion,
          stock_minimo: Number(stockMinimo),
          porcentaje_iva: Number(porcentajeIva),
          porcentaje_ganancia: Number(porcentajeGanancia),
          proveedores: proveedoresPayload,
        },
        id: undefined,
      });
    } else {
      // Editar: sku, nombre, stock_minimo, porcentaje_iva, porcentaje_ganancia y proveedores
      saveItem({
        payload: {
          sku: sku.trim().toUpperCase(),
          nombre: nombre.trim(),
          stock_minimo: Number(stockMinimo),
          porcentaje_iva: Number(porcentajeIva),
          porcentaje_ganancia: Number(porcentajeGanancia),
          proveedores: proveedoresPayload,
        },
        id,
      });
    }
  };

  if (!isCreating && isLoadingItem) {
    return (
      <div className="flex items-center justify-center min-h-[350px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl animate-fadeIn mx-auto pb-12">
      {/* 1. Encabezado con Botón Volver */}
      <div className="flex items-center justify-between pb-2 border-b border-border/80">
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
              {isCreating ? 'Registrar Nuevo Ítem de Inventario' : `Editar Ítem de Inventario #${id}`}
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isCreating
                ? 'Agrega un nuevo artículo maestro al catálogo de inventario'
                : 'Modificación de parámetros editables del ítem maestro'}
            </p>
          </div>
        </div>
      </div>

      {/* 2. Tarjeta del Formulario */}
      <div className="bg-card p-6 sm:p-8 rounded-2xl border border-border/80 shadow-xs">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Fila 1: SKU y Nombre */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Barcode className="w-3.5 h-3.5 text-blue-500" />
                SKU <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="Ej: INS-ACE-001"
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl bg-background border border-border/80 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all font-mono uppercase font-bold"
                required
              />
            </div>

            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-blue-500" />
                Nombre del Ítem <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej: Aceite Sintético ISO VG 46"
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl bg-background border border-border/80 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all font-medium"
                required
              />
            </div>
          </div>

          {/* Fila 2: Tipo y Condición (Solo seleccionables al crear; al editar son informativos y no editables) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Campo: Tipo */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-blue-500" />
                Tipo de Ítem
                {!isCreating && (
                  <span className="text-[10px] font-normal normal-case text-amber-500 ml-1">
                    (No editable)
                  </span>
                )}
              </label>

              {isCreating ? (
                <select
                  value={tipo}
                  onChange={(e) => {
                    const newTipo = e.target.value as 'insumo' | 'compresor' | 'valvula' | 'equipo';
                    setTipo(newTipo);
                    if (newTipo === 'insumo') {
                      setCondicion('NA');
                    } else if (!condicion) {
                      setCondicion('nuevo');
                    }
                  }}
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl bg-background border border-border/80 text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all cursor-pointer capitalize"
                  required
                >
                  <option value="insumo">Insumo</option>
                  <option value="compresor">Compresor</option>
                  <option value="valvula">Válvula</option>
                  <option value="equipo">Equipo</option>
                </select>
              ) : (
                <div className="p-3 rounded-xl bg-muted/40 border border-border/60">
                  <span className="text-sm font-bold text-foreground capitalize">
                    {tipo}
                  </span>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    El tipo de ítem maestro no puede ser alterado una vez registrado.
                  </p>
                </div>
              )}
            </div>

            {/* Campo: Condición */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                Condición
                {!isCreating && (
                  <span className="text-[10px] font-normal normal-case text-amber-500 ml-1">
                    (No editable)
                  </span>
                )}
              </label>

              {isCreating ? (

                <select
                  value={condicion}
                  onChange={(e) => setCondicion(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl bg-background border border-border/80 text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all cursor-pointer capitalize"
                >
                  <option value="NA">NA</option>
                  <option value="nuevo">Nuevo</option>
                  <option value="usado">Usado</option>
                </select>

              ) : (
                <div className="p-3 rounded-xl bg-muted/40 border border-border/60">
                  <span className="text-sm font-bold text-foreground uppercase">
                    {condicion}
                  </span>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    La condición del ítem no puede ser modificada en la edición.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Fila 3: Modelo Técnico */}
          {isCreating && (
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                Modelo Técnico Asociado
              </label>
              <select
                value={idModelo}
                onChange={(e) => setIdModelo(e.target.value ? Number(e.target.value) : '')}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl bg-background border border-border/80 text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all cursor-pointer"
              >
                <option value="">-- Sin modelo asociado --</option>
                {modelos.map((m) => (
                  <option key={m.id_modelo} value={m.id_modelo}>
                    {m.nombre} {m.marca ? `(${m.marca.nombre})` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Fila 4: Parámetros Económicos y de Control (Siempre editables) */}
          <div className="pt-2 border-t border-border/60">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-blue-500" />
              Parámetros de Stock y Finanzas
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* stock_minimo */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 text-amber-500" />
                  Stock Mínimo <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min={0}
                  value={stockMinimo}
                  onChange={(e) => setStockMinimo(e.target.value ? Number(e.target.value) : '')}
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl bg-background border border-border/80 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all font-semibold"
                  required
                />
              </div>

              {/* porcentaje_iva */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  <Percent className="w-3 h-3 text-blue-500" />
                  Porcentaje IVA (%) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min={0}
                  step="any"
                  value={porcentajeIva}
                  onChange={(e) => setPorcentajeIva(e.target.value ? Number(e.target.value) : '')}
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl bg-background border border-border/80 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all font-semibold"
                  required
                />
              </div>

              {/* porcentaje_ganancia */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  <Percent className="w-3 h-3 text-emerald-500" />
                  Porcentaje Ganancia (%) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min={0}
                  step="any"
                  value={porcentajeGanancia}
                  onChange={(e) => setPorcentajeGanancia(e.target.value ? Number(e.target.value) : '')}
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl bg-background border border-border/80 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all font-semibold"
                  required
                />
              </div>
            </div>
          </div>

          {/* Fila 5: Proveedores que suministran este ítem (Asociaciones In-Situ) */}
          <div className="pt-2 border-t border-border/60 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-blue-500" />
                  Proveedores y Catálogo Asociado
                </h4>
                <p className="text-[11px] text-muted-foreground">
                  Asocia los proveedores que suministran este ítem, su código en catálogo y último costo de compra
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setProveedoresAsociados((prev) => [
                    ...prev,
                    { id_proveedor: '', codigo_proveedor: '', ultimo_monto_compra: '' },
                  ])
                }
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 border border-blue-500/20 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Asociar Proveedor
              </button>
            </div>

            {proveedoresAsociados.length === 0 ? (
              <div className="p-4 rounded-xl border border-dashed border-border/80 text-center text-xs text-muted-foreground bg-muted/10">
                No hay proveedores asociados a este ítem. Puedes agregarlos ahora o vincularlos después en compras.
              </div>
            ) : (
              <div className="space-y-2.5">
                {proveedoresAsociados.map((pRow, idx) => (
                  <div
                    key={idx}
                    className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 p-3 rounded-xl bg-muted/20 border border-border/70 items-center animate-fadeIn"
                  >
                    {/* Proveedor */}
                    <div className="sm:col-span-5 space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                        Proveedor <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={pRow.id_proveedor}
                        onChange={(e) => {
                          const val = e.target.value ? Number(e.target.value) : '';
                          setProveedoresAsociados((prev) => {
                            const next = [...prev];
                            next[idx].id_proveedor = val;
                            return next;
                          });
                        }}
                        required
                        className="w-full px-3 py-1.5 text-xs rounded-lg bg-background border border-border/80 text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 font-medium"
                      >
                        <option value="">Selecciona proveedor...</option>
                        {proveedores.map((prov) => (
                          <option key={prov.id_proveedor} value={prov.id_proveedor}>
                            {prov.nombre} ({prov.rut})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Código de Proveedor */}
                    <div className="sm:col-span-4 space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                        Código Proveedor <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={pRow.codigo_proveedor}
                        onChange={(e) => {
                          const val = e.target.value;
                          setProveedoresAsociados((prev) => {
                            const next = [...prev];
                            next[idx].codigo_proveedor = val;
                            return next;
                          });
                        }}
                        placeholder="Ej: 13703-2"
                        required
                        className="w-full px-3 py-1.5 text-xs rounded-lg bg-background border border-border/80 text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                      />
                    </div>

                    {/* Último Costo Compra */}
                    <div className="sm:col-span-2 space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                        Último Costo ($)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={pRow.ultimo_monto_compra}
                        onChange={(e) => {
                          const val = e.target.value === '' ? '' : Number(e.target.value);
                          setProveedoresAsociados((prev) => {
                            const next = [...prev];
                            next[idx].ultimo_monto_compra = val;
                            return next;
                          });
                        }}
                        placeholder="0"
                        className="w-full px-3 py-1.5 text-xs rounded-lg bg-background border border-border/80 text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                      />
                    </div>

                    {/* Botón Eliminar Fila */}
                    <div className="sm:col-span-1 flex justify-center pt-3 sm:pt-4">
                      <button
                        type="button"
                        onClick={() =>
                          setProveedoresAsociados((prev) => prev.filter((_, i) => i !== idx))
                        }
                        className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                        title="Quitar asociación"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Botón de Guardar */}
          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 transition-all cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {isPending
                ? 'Guardando...'
                : isCreating
                  ? 'Registrar Ítem'
                  : 'Guardar Cambios'}
            </button>
          </div>

          {/* 3. Trazabilidad de Existencias Físicas (Solo para Ítems Serializados: compresor, valvula o equipo) */}
          {!isCreating && isSerialized && (
            <div className="bg-card p-6 sm:p-8 rounded-2xl border border-border/80 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/70 pb-3">
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-foreground flex items-center gap-2">
                    <Boxes className="w-5 h-5 text-blue-500" />
                    Desglose Físico de Existencias Activas
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Registros que confirman la cantidad total en bodega ({itemData?.cantidad_total ?? 0} unidad{Number(itemData?.cantidad_total) !== 1 ? 'es' : ''})
                  </p>
                </div>

                {/* Badges de stocks */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-3 py-1 rounded-lg text-xs font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                    Total: {itemData?.cantidad_total ?? 0}
                  </span>
                  <span className="px-3 py-1 rounded-lg text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    Propio: {itemData?.cantidad_propia ?? 0}
                  </span>
                  <span className="px-3 py-1 rounded-lg text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                    Cliente: {itemData?.cantidad_cliente ?? 0}
                  </span>
                </div>
              </div>

              {/* Tabla de Registros Físicos */}
              <div className="overflow-x-auto rounded-xl border border-border/70">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-muted/40 border-b border-border/70 text-muted-foreground font-semibold">
                      <th className="py-2.5 px-3">Identificador</th>
                      <th className="py-2.5 px-3">Serial</th>
                      {itemData?.tipo !== 'equipo' && <th className="py-2.5 px-3">Service Tag</th>}
                      <th className="py-2.5 px-3">Origen</th>
                      <th className="py-2.5 px-3 text-center">ID Origen</th>
                      <th className="py-2.5 px-3">Cód. Proveedor</th>
                      <th className="py-2.5 px-3">Entidad (Proveedor / Cliente)</th>
                      <th className="py-2.5 px-3">RUT</th>
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
                          <td className="py-2.5 px-3 font-mono font-bold text-foreground">
                            {reg.identificador}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-foreground font-medium">
                            {reg.serial}
                          </td>
                          {itemData?.tipo !== 'equipo' && (
                            <td className="py-2.5 px-3 font-mono text-muted-foreground">
                              {reg.service_tag}
                            </td>
                          )}
                          <td className="py-2.5 px-3">
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
                          <td className="py-2.5 px-3 font-mono text-blue-600 dark:text-blue-400 font-bold">
                            {reg.codigo_proveedor}
                          </td>
                          <td className="py-2.5 px-3 font-medium text-foreground">
                            <div className="flex items-center gap-1.5 truncate max-w-[200px]" title={reg.origen_nombre}>
                              {reg.tipo_origen === 'compra' ? (
                                <Building2 className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                              ) : (
                                <User className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                              )}
                              <span className="truncate">{reg.origen_nombre}</span>
                            </div>
                          </td>
                          <td className="py-2.5 px-3 font-mono text-muted-foreground">
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
          )}
        </form>
      </div>
    </div>
  );
};

export default ItemFormPage;
