import { useState, useMemo, useEffect } from 'react';
import { useParams, Link } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  ArrowLeft,
  ShoppingBag,
  Plus,
  Trash2,
  Save,
  Search,
  Building2,
  CreditCard,
  CheckCircle2,
  Clock,
  AlertCircle,
  Hash,
  Copy,
} from 'lucide-react';
import { getCompraByIdAction } from '../../actions/get-compra-by-id.action';
import { getProveedoresAction } from '../../actions/get-proveedores.action';
import { getInventarioAction } from '../../actions/get-inventario.action';
import { getPagosComprasAction } from '../../actions/get-pagos-compras.action';
import { getInventarioProveedoresAction } from '../../actions/get-inventario-proveedores.action';
import { getRepuestosAction } from '../../actions/get-repuestos.action';
import { useCompraMutation } from '../../hooks/useCompraMutation';
import { generarServiceTagUnico } from '../../utils/service-tag-generator';
import type { InventarioItem } from '../../interfaces/inventario.interface';
import type { DetalleCompraSerial, CompraPagoPayload } from '../../interfaces/compra.interface';
import type { PagoCompraItem } from '../../interfaces/pago-compra.interface';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { QuickCreateProveedorModal } from '@/admin/components/compras/QuickCreateProveedorModal';
import { QuickCreateItemModal } from '@/admin/components/inventario/QuickCreateItemModal';

interface CartItem {
  id_inventario: number;
  inventario: InventarioItem;
  codigo_proveedor?: string;
  cantidad: number;
  costo_unitario: number | string;
  porcentaje_iva: number;
  seriales: DetalleCompraSerial[];
}

export const CompraFormPage = () => {
  const { id } = useParams<{ id: string }>();
  const isCreating = !id || id === 'new';

  const { createCompra, isCreating: isSavingNew } = useCompraMutation();

  // 1. Cargar compra si estamos en modo detalle
  const { data: compraData, isLoading: isLoadingCompra } = useQuery({
    queryKey: ['compra-item', id],
    queryFn: () => getCompraByIdAction(id!),
    enabled: !isCreating,
  });

  // 2. Cargar proveedores e inventario
  const { data: proveedores = [] } = useQuery({
    queryKey: ['proveedores-select'],
    queryFn: getProveedoresAction,
  });

  const { data: inventario = [] } = useQuery({
    queryKey: ['inventario-select'],
    queryFn: getInventarioAction,
  });

  // 3. Cargar las relaciones inventario-proveedores para homologación de códigos
  const { data: inventarioProveedores = [] } = useQuery({
    queryKey: ['inventario-proveedores-listado'],
    queryFn: () => getInventarioProveedoresAction(),
  });

  // 3.1 Cargar repuestos existentes en BD para garantizar unicidad global de service_tag
  const { data: repuestosExistentes = [] } = useQuery({
    queryKey: ['repuestos-stock'],
    queryFn: getRepuestosAction,
  });

  // Conjunto de service_tags existentes en base de datos
  const existingServiceTagsSet = useMemo(() => {
    const set = new Set<string>();
    repuestosExistentes.forEach((r) => {
      if (r.service_tag) set.add(r.service_tag.toLowerCase().trim());
    });
    return set;
  }, [repuestosExistentes]);

  // 4. Cargar todos los pagos de compras si estamos en modo detalle (fallback de seguridad)
  const { data: todosLosPagosCompras = [] } = useQuery({
    queryKey: ['pagos-compras-listado'],
    queryFn: getPagosComprasAction,
    enabled: !isCreating,
  });

  // ESTADOS DEL FORMULARIO DE CABECERA
  const [idProveedor, setIdProveedor] = useState('');
  const [isQuickProveedorOpen, setIsQuickProveedorOpen] = useState(false);
  const [isQuickItemOpen, setIsQuickItemOpen] = useState(false);
  const [numFacturaBoleta, setNumFacturaBoleta] = useState('');
  const [fechaCompra, setFechaCompra] = useState(new Date().toISOString().split('T')[0]);
  const [tipoPago, setTipoPago] = useState<'contado' | 'credito'>('contado');
  const [numPagos, setNumPagos] = useState<number>(1);

  // ESTADO DE CUOTAS / PAGOS ACORDADOS
  const [pagosPlan, setPagosPlan] = useState<CompraPagoPayload[]>([]);

  // ESTADO DE BÚSQUEDA SKU Y LISTA DE COMPRA (CARRITO)
  const [skuSearch, setSkuSearch] = useState('');
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  // Mapa de relaciones con el proveedor seleccionado: (id_inventario) -> InventarioProveedorItem
  const inventarioProveedorSeleccionadoMap = useMemo(() => {
    const map = new Map<number, (typeof inventarioProveedores)[0]>();
    if (!idProveedor) return map;
    const numProvId = Number(idProveedor);
    inventarioProveedores
      .filter((ip) => ip.id_proveedor === numProvId)
      .forEach((ip) => {
        map.set(ip.id_inventario, ip);
      });
    return map;
  }, [idProveedor, inventarioProveedores]);

  // Mapa de códigos de proveedor: (id_inventario) -> codigo_proveedor para el proveedor seleccionado
  const codigosProveedorMap = useMemo(() => {
    const map = new Map<number, string>();
    inventarioProveedorSeleccionadoMap.forEach((ip, idInv) => {
      map.set(idInv, ip.codigo_proveedor);
    });
    return map;
  }, [inventarioProveedorSeleccionadoMap]);

  // Ítems de inventario filtrados según el proveedor seleccionado:
  // Si no hay proveedor seleccionado, no se muestra ningún ítem (requiere seleccionar proveedor primero).
  // Si hay proveedor seleccionado, se muestran ÚNICAMENTE los ítems homologados que dicho proveedor suministra.
  // Si el proveedor no suministra ningún ítem aún, la lista queda vacía.
  const inventarioFiltradoPorProveedor = useMemo(() => {
    if (!idProveedor) return [];
    const numProvId = Number(idProveedor);
    const homologadosIds = new Set(
      inventarioProveedores
        .filter((ip) => ip.id_proveedor === numProvId)
        .map((ip) => ip.id_inventario)
    );

    if (homologadosIds.size === 0) {
      return [];
    }

    return inventario.filter((item) => homologadosIds.has(item.id_inventario));
  }, [idProveedor, inventario, inventarioProveedores]);

  // Regla 1: Si tipo_pago es 'contado', num_pagos siempre es 1
  useEffect(() => {
    if (tipoPago === 'contado') {
      setNumPagos(1);
    }
  }, [tipoPago]);

  // CÁLCULO DE TOTALES ECONÓMICOS DE LA COMPRA
  const totalesEconomicos = useMemo(() => {
    let montoTotalGravado = 0;
    let montoTotalExento = 0;
    let montoTotalIva = 0;
    let montoTotal = 0;

    cartItems.forEach((item) => {
      const cant = Number(item.cantidad) || 0;
      const costo = Number(item.costo_unitario) || 0;
      const ivaPerc = Number(item.porcentaje_iva) || 0;

      const subtotalLinea = cant * costo;
      const ivaLinea = Math.round(subtotalLinea * (ivaPerc / 100) * 100) / 100;
      const totalLinea = subtotalLinea + ivaLinea;

      if (ivaPerc > 0) {
        montoTotalGravado += subtotalLinea;
      } else {
        montoTotalExento += subtotalLinea;
      }
      montoTotalIva += ivaLinea;
      montoTotal += totalLinea;
    });

    return {
      montoTotalGravado: Math.round(montoTotalGravado * 100) / 100,
      montoTotalExento: Math.round(montoTotalExento * 100) / 100,
      montoTotalIva: Math.round(montoTotalIva * 100) / 100,
      montoTotal: Math.round(montoTotal * 100) / 100,
    };
  }, [cartItems]);

  // SINCRONIZAR EL NÚMERO DE CUOTAS SEGÚN numPagos Y DISTRIBUIR MONTOS SI CAMBIA EL TOTAL
  useEffect(() => {
    if (!isCreating) return;

    const count = Math.max(1, Number(numPagos) || 1);
    const total = totalesEconomicos.montoTotal;

    setPagosPlan((prev) => {
      // Si el número de cuotas no ha cambiado y ya existen pagos definidos, recalculamos los montos en base a los porcentajes existentes
      if (prev.length === count) {
        return prev.map((p) => {
          const porc = Number(p.porcentaje_monto_total) || 0;
          const calculatedMonto = total > 0 ? Math.round(((total * porc) / 100) * 100) / 100 : p.monto_a_pagar;
          return {
            ...p,
            monto_a_pagar: calculatedMonto,
          };
        });
      }

      // Si cambió el número de cuotas, repartimos inicialmente de forma equitativa (ej: 100 / count)
      const newPlan: CompraPagoPayload[] = [];
      const basePorc = Math.floor((100 / count) * 100) / 100;
      const remainderPorc = Math.round((100 - basePorc * count) * 100) / 100;

      for (let i = 0; i < count; i++) {
        const isLast = i === count - 1;
        const porcCuota = isLast ? Math.round((basePorc + remainderPorc) * 100) / 100 : basePorc;
        const montoCuota = total > 0 ? Math.round(((total * porcCuota) / 100) * 100) / 100 : 0;

        const defaultDate = new Date();
        defaultDate.setDate(defaultDate.getDate() + i * 30);
        const existing = prev[i];
        const fechaAcordada = existing?.fecha_pago_acordada || defaultDate.toISOString().split('T')[0];

        newPlan.push({
          monto_a_pagar: montoCuota,
          porcentaje_monto_total: porcCuota,
          fecha_pago_acordada: fechaAcordada,
        });
      }
      return newPlan;
    });
  }, [numPagos, totalesEconomicos.montoTotal, isCreating]);

  // Manejar cambio manual en las cuotas del plan de pagos con cálculo bidireccional
  const handlePagoChange = (index: number, field: keyof CompraPagoPayload, value: string | number) => {
    setPagosPlan((prev) => {
      const next = [...prev];
      const total = totalesEconomicos.montoTotal;

      if (field === 'porcentaje_monto_total') {
        const newPorc = value === '' ? '' : Number(value);
        const newMonto = typeof newPorc === 'number' && total > 0
          ? Math.round(((total * newPorc) / 100) * 100) / 100
          : next[index].monto_a_pagar;

        next[index] = {
          ...next[index],
          porcentaje_monto_total: newPorc,
          monto_a_pagar: newMonto,
        };
      } else if (field === 'monto_a_pagar') {
        const newMonto = value === '' ? '' : Number(value);
        const newPorc = typeof newMonto === 'number' && total > 0
          ? Math.round(((newMonto / total) * 100) * 100) / 100
          : next[index].porcentaje_monto_total;

        next[index] = {
          ...next[index],
          monto_a_pagar: newMonto,
          porcentaje_monto_total: newPorc,
        };
      } else {
        next[index] = { ...next[index], [field]: String(value) };
      }

      return next;
    });
  };

  // Obtener un conjunto acumulado de todos los service_tags actuales (BD + carrito)
  const getCombinedServiceTagsSet = () => {
    const set = new Set<string>(existingServiceTagsSet);
    cartItems.forEach((ci) => {
      ci.seriales.forEach((s) => {
        if (s.service_tag) set.add(s.service_tag.toLowerCase().trim());
      });
    });
    return set;
  };

  // Regla 2: Seleccionar y agregar item de inventario
  const handleAddItemToCart = (item: InventarioItem, overrideCodigoProveedor?: string) => {
    // Si ya fue seleccionado, no permitir re-seleccionarlo
    if (cartItems.some((c) => c.id_inventario === item.id_inventario)) {
      toast.info(`El ítem "${item.nombre}" ya está en la lista de compra`);
      return;
    }

    const initialQty = 1;
    const isSerialized = item.tipo !== 'insumo';
    const needsServiceTag = ['compresor', 'valvula'].includes(item.tipo);
    const codigoProveedorAsociado =
      overrideCodigoProveedor !== undefined
        ? overrideCodigoProveedor
        : codigosProveedorMap.get(item.id_inventario) ||
          item.inventario_proveedores?.find((ip) => ip.id_proveedor === Number(idProveedor))?.codigo_proveedor ||
          '';

    const currentTags = getCombinedServiceTagsSet();
    const initialSeriales: DetalleCompraSerial[] = isSerialized
      ? Array.from({ length: initialQty }, () => {
        if (needsServiceTag) {
          const tag = generarServiceTagUnico(item.tipo, currentTags);
          return { serial: tag, service_tag: tag };
        }
        // Equipos: no tienen service_tag, se genera un serial autogenerado único por defecto
        const tag = generarServiceTagUnico(item.tipo, currentTags);
        return { serial: tag, service_tag: '' };
      })
      : [];

    const relacionProv = inventarioProveedorSeleccionadoMap.get(item.id_inventario);
    const costoUnitarioSugerido =
      relacionProv?.ultimo_monto_compra !== undefined &&
        relacionProv.ultimo_monto_compra !== null &&
        Number(relacionProv.ultimo_monto_compra) > 0
        ? Number(relacionProv.ultimo_monto_compra)
        : item.ultimo_monto_compra || item.monto_compra_prom || '';

    setCartItems((prev) => [
      ...prev,
      {
        id_inventario: item.id_inventario,
        inventario: item,
        codigo_proveedor: codigoProveedorAsociado,
        cantidad: initialQty,
        costo_unitario: costoUnitarioSugerido,
        porcentaje_iva: 19, // IVA chileno por defecto
        seriales: initialSeriales,
      },
    ]);
  };

  // Buscar por SKU o Código de Proveedor al dar Enter o click en "+"
  const handleSkuSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const term = skuSearch.trim().toLowerCase();
    if (!term) return;

    // Buscar en el inventario disponible por SKU o por Código de Proveedor asociado
    const matched = inventarioFiltradoPorProveedor.find((inv) => {
      const matchSku = inv.sku && inv.sku.toLowerCase() === term;
      const codProv = (codigosProveedorMap.get(inv.id_inventario) || '').toLowerCase();
      const matchCodProv = codProv === term;
      return matchSku || matchCodProv;
    });

    if (matched) {
      handleAddItemToCart(matched);
      setSkuSearch('');
    } else {
      toast.error(`No se encontró ningún ítem con el SKU o Código de proveedor "${skuSearch.trim()}"`);
    }
  };

  // Cambiar cantidad de un item en el carrito (y ajustar arreglo de seriales)
  const handleCartItemQuantityChange = (id_inventario: number, newQty: number) => {
    const qty = Math.max(1, newQty);
    setCartItems((prev) =>
      prev.map((item) => {
        if (item.id_inventario !== id_inventario) return item;

        const isSerialized = item.inventario.tipo !== 'insumo';
        let updatedSeriales = [...item.seriales];

        if (isSerialized) {
          if (qty > updatedSeriales.length) {
            const diff = qty - updatedSeriales.length;
            const needsServiceTag = ['compresor', 'valvula'].includes(item.inventario.tipo);
            const currentTags = getCombinedServiceTagsSet();
            const extras: DetalleCompraSerial[] = Array.from({ length: diff }, () => {
              const tag = generarServiceTagUnico(item.inventario.tipo, currentTags);
              return {
                serial: tag,
                service_tag: needsServiceTag ? tag : '',
              };
            });
            updatedSeriales = [...updatedSeriales, ...extras];
          } else if (qty < updatedSeriales.length) {
            updatedSeriales = updatedSeriales.slice(0, qty);
          }
        }

        return {
          ...item,
          cantidad: qty,
          seriales: updatedSeriales,
        };
      })
    );
  };

  // Cambiar costo unitario, porcentaje de iva o codigo de proveedor
  const handleCartItemFieldChange = (
    id_inventario: number,
    field: 'costo_unitario' | 'porcentaje_iva' | 'codigo_proveedor',
    value: any
  ) => {
    setCartItems((prev) =>
      prev.map((item) => {
        if (item.id_inventario !== id_inventario) return item;
        return { ...item, [field]: value };
      })
    );
  };

  // Cambiar serial o service_tag en items serializados
  const handleSerialChange = (
    id_inventario: number,
    index: number,
    field: 'serial' | 'service_tag',
    value: string
  ) => {
    setCartItems((prev) =>
      prev.map((item) => {
        if (item.id_inventario !== id_inventario) return item;
        const newSeriales = [...item.seriales];
        newSeriales[index] = { ...newSeriales[index], [field]: value };
        return { ...item, seriales: newSeriales };
      })
    );
  };

  // Estado para el serial de "Aplicar a todos" por ítem de inventario: Map<id_inventario, string>
  const [bulkSerials, setBulkSerials] = useState<Record<number, string>>({});

  // Manejar cambio en el input de serial a granel
  const handleBulkSerialInputChange = (id_inventario: number, value: string) => {
    setBulkSerials((prev) => ({ ...prev, [id_inventario]: value }));
  };

  // Aplicar serial masivo a todas las unidades de este ítem serializado
  const handleApplySerialToAll = (id_inventario: number) => {
    const serialValue = (bulkSerials[id_inventario] || '').trim();
    if (!serialValue) {
      toast.warning('Ingresa un serial para aplicar a todas las unidades de este ítem');
      return;
    }

    setCartItems((prev) =>
      prev.map((item) => {
        if (item.id_inventario !== id_inventario) return item;
        const updatedSeriales = item.seriales.map((s) => ({
          ...s,
          serial: serialValue,
        }));
        return { ...item, seriales: updatedSeriales };
      })
    );

    toast.success(`Serial "${serialValue}" aplicado a todas las unidades`);
  };

  // Remover item del carrito
  const handleRemoveCartItem = (id_inventario: number) => {
    setCartItems((prev) => prev.filter((item) => item.id_inventario !== id_inventario));
  };

  // Envío del formulario de compra
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!idProveedor) {
      toast.warning('Por favor selecciona un proveedor');
      return;
    }

    if (!numFacturaBoleta.trim()) {
      toast.warning('Ingresa el número de factura o boleta de la compra');
      return;
    }

    if (cartItems.length === 0) {
      toast.warning('Debes agregar al menos un ítem a la lista de compra');
      return;
    }

    // Validar costos y seriales
    for (const item of cartItems) {
      if (Number(item.costo_unitario) <= 0) {
        toast.warning(`Ingresa un costo unitario válido para "${item.inventario.nombre}"`);
        return;
      }

      if (item.inventario.tipo !== 'insumo') {
        for (let i = 0; i < item.cantidad; i++) {
          const s = item.seriales[i];
          if (!s?.serial?.trim()) {
            toast.warning(`Ingresa el serial #${i + 1} para "${item.inventario.nombre}"`);
            return;
          }
          if (['compresor', 'valvula'].includes(item.inventario.tipo) && !s?.service_tag?.trim()) {
            toast.warning(`Ingresa el service_tag #${i + 1} para "${item.inventario.nombre}"`);
            return;
          }
        }
      }
    }

    // Validar que no se repita ningun service_tag en todos los items
    const serviceTags = cartItems
      .filter((item) => item.inventario.tipo !== 'insumo')
      .flatMap((item) => item.seriales.map((s) => s.service_tag));
    const uniqueServiceTags = new Set(serviceTags);
    if (serviceTags.length !== uniqueServiceTags.size) {
      toast.warning('No se permiten service_tags repetidos en la compra');
      return;
    }

    // Validar suma del plan de pagos con el total y que los porcentajes sumen exactamente 100%
    const sumaPorcentajes = pagosPlan.reduce((acc, p) => acc + (Number(p.porcentaje_monto_total) || 0), 0);
    const sumaPagos = pagosPlan.reduce((acc, p) => acc + (Number(p.monto_a_pagar) || 0), 0);

    // 1. Validar porcentajes = 100%
    if (Math.abs(sumaPorcentajes - 100) > 0.01) {
      toast.warning(
        `La suma de los porcentajes de las cuotas (${sumaPorcentajes.toFixed(2)}%) debe ser exactamente igual al 100%`
      );
      return;
    }

    // 2. Validar suma de montos = monto total
    const diffMontos = Math.abs(sumaPagos - totalesEconomicos.montoTotal);
    if (diffMontos > 0.5) {
      toast.warning(
        `La suma de las cuotas ($${sumaPagos.toLocaleString('es-CL')}) debe coincidir con el total de la compra ($${totalesEconomicos.montoTotal.toLocaleString('es-CL')})`
      );
      return;
    }

    // Estructurar payload exacto para CompraController@store
    const payload = {
      id_proveedor: Number(idProveedor),
      num_factura_boleta: numFacturaBoleta.trim(),
      fecha_compra: fechaCompra,
      tipo_pago: tipoPago,
      num_pagos: tipoPago === 'contado' ? 1 : Number(numPagos),
      monto_total_gravado: totalesEconomicos.montoTotalGravado,
      monto_total_exento: totalesEconomicos.montoTotalExento,
      monto_total_iva: totalesEconomicos.montoTotalIva,
      monto_total: totalesEconomicos.montoTotal,
      monto_pendiente: totalesEconomicos.montoTotal,
      detalles: cartItems.map((c) => {
        const subtotalLinea = Number(c.cantidad) * Number(c.costo_unitario);
        const montoIva = Math.round(subtotalLinea * (Number(c.porcentaje_iva) / 100) * 100) / 100;
        const totalLinea = subtotalLinea + montoIva;

        return {
          id_inventario: c.id_inventario,
          codigo_proveedor: c.codigo_proveedor ? c.codigo_proveedor.trim() : undefined,
          cantidad: Number(c.cantidad),
          costo_unitario: Number(c.costo_unitario),
          monto_total_linea_sin_iva: subtotalLinea,
          porcentaje_iva: Number(c.porcentaje_iva),
          monto_iva: montoIva,
          monto_total_linea_con_iva: totalLinea,
          seriales: c.inventario.tipo !== 'insumo' ? c.seriales : undefined,
        };
      }),
      pagos: pagosPlan.map((p) => ({
        monto_a_pagar: Number(p.monto_a_pagar),
        porcentaje_monto_total: Number(p.porcentaje_monto_total),
        fecha_pago_acordada: p.fecha_pago_acordada,
      })),
    };

    createCompra(payload);
  };

  if (isLoadingCompra) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  // MODO DETALLE (SOLO LECTURA)
  if (!isCreating && compraData) {
    const proveedor = proveedores.find((p) => p.id_proveedor === compraData.id_proveedor) || compraData.proveedor;

    // Obtener los pagos asociados a esta compra (desde compraData.pagosCompras o filtrando todosLosPagosCompras)
    const pagosAsociados: PagoCompraItem[] = (
      compraData.pagosCompras && compraData.pagosCompras.length > 0
        ? compraData.pagosCompras
        : todosLosPagosCompras.filter((p) => Number(p.id_compra) === Number(compraData.id_compra))
    ).slice().sort((a, b) => a.id_pago_compra - b.id_pago_compra);

    return (
      <div className="space-y-6 max-w-6xl animate-fadeIn mx-auto">
        {/* Encabezado */}
        <div className="flex items-center justify-between pb-2 border-b border-border/80">
          <div className="flex items-center gap-3">
            <Link
              to="/admin/compras/listado"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-card border border-border/80 text-foreground hover:bg-accent transition-colors cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver
            </Link>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                <ShoppingBag className="w-6 h-6 text-blue-500" />
                Detalle de Compra #{compraData.id_compra}
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Factura / Boleta: <span className="font-mono font-bold text-foreground">{compraData.num_factura_boleta}</span>
              </p>
            </div>
          </div>

          <div>
            {compraData.estado === 'pagada' ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Compra Pagada
              </span>
            ) : compraData.estado === 'pagada_parcial' ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-600 border border-blue-500/20">
                <Clock className="w-3.5 h-3.5" />
                Pagada Parcial
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 border border-amber-500/20">
                <AlertCircle className="w-3.5 h-3.5" />
                Por Pagar
              </span>
            )}
          </div>
        </div>

        {/* Datos de Cabecera */}
        <div className="bg-card p-6 rounded-2xl border border-border/80 shadow-xs space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <Building2 className="w-4 h-4 text-blue-500" />
            Información General de la Compra
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs sm:text-sm">
            <div className="p-3 bg-accent/40 rounded-xl">
              <span className="text-xs text-muted-foreground block">Proveedor</span>
              <span className="text-sm font-bold text-foreground">{proveedor?.nombre || 'Desconocido'}</span>
              <span className="text-[11px] text-muted-foreground block">RUT: {proveedor?.rut || 'Sin RUT'}</span>
            </div>

            <div className="p-3 bg-accent/40 rounded-xl">
              <span className="text-xs text-muted-foreground block">Fecha de Compra</span>
              <span className="text-sm font-bold text-foreground">
                {compraData.fecha_compra ? compraData.fecha_compra.split('T')[0] : 'S/F'}
              </span>
            </div>

            <div className="p-3 bg-accent/40 rounded-xl">
              <span className="text-xs text-muted-foreground block">Tipo de Pago</span>
              <span className="text-sm font-bold text-foreground uppercase">{compraData.tipo_pago}</span>
              <span className="text-[11px] text-muted-foreground block">{compraData.num_pagos || 1} cuota(s)</span>
            </div>

            <div className="p-3 bg-accent/40 rounded-xl">
              <span className="text-xs text-muted-foreground block">Saldo Pendiente</span>
              <span className="text-base font-bold text-rose-500">
                ${Number(compraData.monto_pendiente || 0).toLocaleString('es-CL')}
              </span>
            </div>
          </div>
        </div>

        {/* Lista de Detalles Adquiridos */}
        <div className="bg-card p-6 rounded-2xl border border-border/80 shadow-xs space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-blue-500" />
            Ítems de Inventario Adquiridos
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm border-collapse">
              <thead>
                <tr className="border-b border-border/80 text-muted-foreground">
                  <th className="py-2.5 px-3 text-center">id_detalle_compra</th>
                  <th className="py-2.5 px-3 text-center">Ítem / Repuesto</th>
                  <th className="py-2.5 px-3 text-center">Cód. Proveedor</th>
                  <th className="py-2.5 px-3 text-center">Cantidad</th>
                  <th className="py-2.5 px-3 text-center">Costo Unitario</th>
                  <th className="py-2.5 px-3 text-center">Subtotal</th>
                  <th className="py-2.5 px-3 text-center">% IVA</th>
                  <th className="py-2.5 px-3 text-center">Total Línea</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {(compraData.detalles || []).map((det, idx) => {
                  const itemInv = inventario.find((i) => i.id_inventario === det.id_inventario) || det.inventario;
                  return (
                    <tr key={idx} className="hover:bg-accent/30">
                      <td className="py-3 px-3 text-center">
                        <div className="font-bold text-foreground">{det.id_detalle_compra}</div>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <div className="font-bold text-foreground">{itemInv?.nombre || `Ítem #${det.id_inventario}`}</div>
                        <div className="text-[11px] text-muted-foreground font-mono">SKU: {itemInv?.sku || 'N/A'}</div>
                      </td>
                      <td className="py-3 px-3 text-center font-mono font-bold text-blue-600 dark:text-blue-400">
                        {det.codigo_proveedor || '-'}
                      </td>
                      <td className="py-3 px-3 text-center font-bold">{det.cantidad}</td>
                      <td className="py-3 px-3 text-center">${Number(det.costo_unitario).toLocaleString('es-CL')}</td>
                      <td className="py-3 px-3 text-center">${Number(det.monto_total_linea_sin_iva || 0).toLocaleString('es-CL')}</td>
                      <td className="py-3 px-3 text-center">{det.porcentaje_iva || 19}%</td>
                      <td className="py-3 px-3 text-center font-bold text-foreground">
                        ${Number(det.monto_total_linea_con_iva || 0).toLocaleString('es-CL')}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Totales Económicos */}
        <div className="bg-card p-6 rounded-2xl border border-border/80 shadow-xs">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div className="p-3 bg-accent/40 rounded-xl">
              <span className="text-xs text-muted-foreground block">Total Gravado</span>
              <span className="text-base font-bold text-foreground">
                ${Number(compraData.monto_total_gravado || 0).toLocaleString('es-CL')}
              </span>
            </div>
            <div className="p-3 bg-accent/40 rounded-xl">
              <span className="text-xs text-muted-foreground block">Total Exento</span>
              <span className="text-base font-bold text-foreground">
                ${Number(compraData.monto_total_exento || 0).toLocaleString('es-CL')}
              </span>
            </div>
            <div className="p-3 bg-accent/40 rounded-xl">
              <span className="text-xs text-muted-foreground block">Total IVA</span>
              <span className="text-base font-bold text-foreground">
                ${Number(compraData.monto_total_iva || 0).toLocaleString('es-CL')}
              </span>
            </div>
            <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl">
              <span className="text-xs text-blue-600 dark:text-blue-400 font-semibold block">Monto Total</span>
              <span className="text-lg font-extrabold text-blue-600 dark:text-blue-400">
                ${Number(compraData.monto_total || 0).toLocaleString('es-CL')}
              </span>
            </div>
          </div>
        </div>

        {/* Tabla de Pagos Asociados a la Compra */}
        <div className="bg-card p-6 rounded-2xl border border-border/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-blue-500" />
              Pagos y Cuotas Asociadas a la Compra
            </h3>
            <span className="text-xs text-muted-foreground">
              {pagosAsociados.length} cuota(s) programada(s)
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm border-collapse">
              <thead>
                <tr className="border-b border-border/80 bg-muted/30 text-muted-foreground font-semibold">
                  <th className="py-2.5 px-3 text-center">ID Pago</th>
                  <th className="py-2.5 px-3 text-center">% Monto Total</th>
                  <th className="py-2.5 px-3 text-center">Monto</th>
                  <th className="py-2.5 px-3 text-center">Abono al Bien</th>
                  <th className="py-2.5 px-3 text-center">Abono al IVA</th>
                  <th className="py-2.5 px-3 text-center">Fecha Pago Acordada</th>
                  <th className="py-2.5 px-3 text-center">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {pagosAsociados.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-6 text-center text-muted-foreground">
                      No hay cuotas ni pagos registrados para esta compra
                    </td>
                  </tr>
                ) : (
                  pagosAsociados.map((pago) => {
                    const porcentaje = Number(pago.porcentaje_monto_total || 0);
                    const monto = Number(pago.monto_a_pagar || 0);
                    const abonoBien = Number(pago.abono_al_bien || 0);
                    const abonoIva = Number(pago.abono_al_iva || 0);
                    const fechaAcordada = pago.fecha_pago_acordada
                      ? pago.fecha_pago_acordada.split('T')[0]
                      : '-';

                    return (
                      <tr key={pago.id_pago_compra} className="hover:bg-accent/30 transition-colors">
                        <td className="py-3 px-3 text-center font-mono font-bold text-foreground">
                          #{pago.id_pago_compra}
                        </td>
                        <td className="py-3 px-3 text-center font-mono">
                          {porcentaje.toFixed(2)}%
                        </td>
                        <td className="py-3 px-3 text-center font-mono font-bold text-foreground">
                          ${monto.toLocaleString('es-CL')}
                        </td>
                        <td className="py-3 px-3 text-center font-mono text-foreground">
                          ${abonoBien.toLocaleString('es-CL')}
                        </td>
                        <td className="py-3 px-3 text-center font-mono text-foreground">
                          ${abonoIva.toLocaleString('es-CL')}
                        </td>
                        <td className="py-3 px-3 text-center font-mono text-muted-foreground">
                          {fechaAcordada}
                        </td>
                        <td className="py-3 px-3 text-center">
                          {pago.estado === 'realizado' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                              <CheckCircle2 className="w-3 h-3" />
                              Realizado
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-600 border border-amber-500/20">
                              <Clock className="w-3 h-3" />
                              Pendiente
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // MODO CREAR: RENDERIZADO COMPLETO SEGÚN BOCETO REGISTRAR COMPRA
  return (
    <div className="space-y-6 max-w-7xl animate-fadeIn mx-auto pb-12">
      {/* 1. BARRA SUPERIOR CON BOTÓN VOLVER */}
      <div className="flex items-center justify-between pb-2 border-b border-border/80">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
            <ShoppingBag className="w-7 h-7 text-blue-500" />
            Registrar Compra
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Ingreso de compras con facturas o boletas, líneas de inventario y plan de pagos
          </p>
        </div>

        <Link
          to="/admin/compras/listado"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-card border border-border/80 text-foreground hover:bg-accent transition-all shadow-xs cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 2. CABECERA: id_proveedor, num_factura_boleta, fecha, tipo_pago, num_pagos */}
        <div className="bg-card p-5 sm:p-6 rounded-2xl border border-border/80 shadow-xs space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3.5">
            {/* id_proveedor */}
            <div className="lg:col-span-4 space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-foreground">
                  Proveedor <span className="text-rose-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setIsQuickProveedorOpen(true)}
                  className="text-xs font-semibold text-blue-500 hover:text-blue-600 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Nuevo Proveedor
                </button>
              </div>
              <SearchableSelect
                options={proveedores.map((p) => ({
                  value: p.id_proveedor,
                  label: p.nombre,
                  sublabel: p.rut ? `RUT: ${p.rut}` : undefined,
                  searchTerms: `${p.rut || ''}`,
                }))}
                value={idProveedor}
                onChange={(val) => {
                  const newId = val ? String(val) : '';
                  if (newId !== idProveedor) {
                    setIdProveedor(newId);
                    setCartItems([]);
                  }
                }}
                placeholder="Selecciona un proveedor..."
                searchPlaceholder="Buscar por nombre o RUT..."
                required
              />
            </div>

            {/* num_factura_boleta */}
            <div className="lg:col-span-3 space-y-1">
              <label className="text-xs font-bold text-foreground">
                N° Factura / Boleta <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={numFacturaBoleta}
                onChange={(e) => setNumFacturaBoleta(e.target.value)}
                placeholder="Ej: FPROV-2026-554"
                required
                className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl bg-background border border-border/80 text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 font-mono"
              />
            </div>

            {/* fecha */}
            <div className="lg:col-span-2 space-y-1">
              <label className="text-xs font-bold text-foreground">
                Fecha <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={fechaCompra}
                onChange={(e) => setFechaCompra(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-background border border-border/80 text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
              />
            </div>

            {/* tipo_pago */}
            <div className="lg:col-span-2 space-y-1">
              <label className="text-xs font-bold text-foreground">
                Tipo Pago <span className="text-rose-500">*</span>
              </label>
              <select
                value={tipoPago}
                onChange={(e) => setTipoPago(e.target.value as any)}
                required
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-background border border-border/80 text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
              >
                <option value="contado">Contado</option>
                <option value="credito">Crédito</option>
              </select>
            </div>

            {/* num_pagos (Regla 1: si es contado, siempre 1 y disabled) */}
            <div className="lg:col-span-1 space-y-1">
              <label className="text-xs font-bold text-foreground">
                Cuotas
              </label>
              <input
                type="number"
                min="1"
                max="36"
                disabled={tipoPago === 'contado'}
                value={tipoPago === 'contado' ? 1 : numPagos}
                onChange={(e) => setNumPagos(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-background border border-border/80 text-foreground disabled:opacity-50 disabled:bg-muted/40 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 text-center font-bold"
              />
            </div>
          </div>

          {/* TARJETAS DEL PLAN DE PAGOS SEGÚN BOCETO: Pago #1, Pago #2 ... Pago #n */}
          <div className="pt-2 border-t border-border/60">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
              <CreditCard className="w-3.5 h-3.5 text-blue-500" />
              Cronograma de Pagos Acordados ({pagosPlan.length} cuota{pagosPlan.length > 1 ? 's' : ''})
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {pagosPlan.map((pago, idx) => (
                <div
                  key={idx}
                  className="bg-accent/30 border border-border/80 rounded-xl p-3.5 space-y-2.5 text-xs shadow-xs"
                >
                  <div className="font-bold text-foreground flex items-center justify-between border-b border-border/40 pb-1.5">
                    <span>Pago #{idx + 1}</span>
                    <span className="text-[11px] font-mono text-muted-foreground font-semibold">
                      {pago.porcentaje_monto_total !== '' ? `${pago.porcentaje_monto_total}%` : '0%'}
                    </span>
                  </div>

                  {/* monto_a_pagar */}
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-muted-foreground block">
                      Monto a Pagar ($)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={pago.monto_a_pagar}
                      onChange={(e) => handlePagoChange(idx, 'monto_a_pagar', e.target.value)}
                      placeholder="0.00"
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-background border border-border/70 text-foreground font-bold focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  {/* porcentaje_monto_total */}
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-muted-foreground block">
                      Porcentaje Monto Total (%)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={pago.porcentaje_monto_total}
                      onChange={(e) => handlePagoChange(idx, 'porcentaje_monto_total', e.target.value)}
                      placeholder="Ej: 30"
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-background border border-border/70 text-foreground font-bold focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  {/* fecha_pago_acordada */}
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-muted-foreground block">
                      Fecha Pago Acordada
                    </label>
                    <input
                      type="date"
                      value={pago.fecha_pago_acordada}
                      onChange={(e) => handlePagoChange(idx, 'fecha_pago_acordada', e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-background border border-border/70 text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 3. GRID CENTRAL: Lista de Compra (Izquierda) vs Buscar por SKU (Derecha) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* COLUMNA IZQUIERDA: LISTA DE COMPRA */}
          <div className="lg:col-span-8 bg-card p-5 sm:p-6 rounded-2xl border border-border/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <h2 className="text-base sm:text-lg font-bold text-foreground flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-blue-500" />
                Lista de Compra ({cartItems.length})
              </h2>
              {cartItems.length > 0 && (
                <button
                  type="button"
                  onClick={() => setCartItems([])}
                  className="text-xs text-rose-500 hover:underline cursor-pointer"
                >
                  Limpiar lista
                </button>
              )}
            </div>

            {cartItems.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground border-2 border-dashed border-border/60 rounded-xl space-y-2">
                <ShoppingBag className="w-8 h-8 text-muted-foreground/30 mx-auto" />
                <p className="text-xs sm:text-sm font-semibold">
                  Aún no has agregado ningún ítem a la lista de compra.
                </p>
                <p className="text-xs text-muted-foreground/80">
                  Usa el panel de la derecha para buscar ítems por SKU y agregarlos con "+".
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {cartItems.map((item) => {
                  const isSerialized = item.inventario.tipo !== 'insumo';
                  const needsServiceTag = ['compresor', 'valvula'].includes(item.inventario.tipo);

                  return (
                    <div
                      key={item.id_inventario}
                      className="border border-border/80 rounded-xl p-4 bg-background/50 space-y-3"
                    >
                      {/* Fila principal del item */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <div className="font-bold text-sm text-foreground flex items-center gap-2">
                            <span>{item.inventario.nombre}</span>
                            <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-accent text-muted-foreground border border-border/60">
                              {item.inventario.tipo}
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground font-mono">
                            SKU: {item.inventario.sku || 'N/A'}
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          {/* Código Proveedor (Solo Lectura) */}
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase text-muted-foreground block">
                              Cód. Proveedor
                            </label>
                            <input
                              type="text"
                              value={item.codigo_proveedor || '-'}
                              readOnly
                              tabIndex={-1}
                              title="El código del proveedor se homologa desde el catálogo del proveedor"
                              className="w-28 px-2.5 py-1 text-xs rounded-lg bg-muted/50 border border-border/80 text-muted-foreground font-mono cursor-not-allowed select-none focus:outline-none"
                            />
                          </div>

                          {/* Cantidad */}
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase text-muted-foreground block">
                              Cantidad
                            </label>
                            <input
                              type="number"
                              min="1"
                              value={item.cantidad}
                              onChange={(e) =>
                                handleCartItemQuantityChange(
                                  item.id_inventario,
                                  parseInt(e.target.value) || 1
                                )
                              }
                              className="w-20 px-2.5 py-1 text-xs rounded-lg bg-background border border-border/80 text-foreground font-bold text-center focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          </div>

                          {/* Costo Unitario */}
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase text-muted-foreground block">
                              Costo Unitario ($)
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={item.costo_unitario}
                              onChange={(e) =>
                                handleCartItemFieldChange(
                                  item.id_inventario,
                                  'costo_unitario',
                                  e.target.value
                                )
                              }
                              placeholder="0.00"
                              className="w-28 px-2.5 py-1 text-xs rounded-lg bg-background border border-border/80 text-foreground font-bold focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          </div>

                          {/* Porcentaje de IVA */}
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase text-muted-foreground block">
                              % IVA
                            </label>
                            <select
                              value={item.porcentaje_iva}
                              onChange={(e) =>
                                handleCartItemFieldChange(
                                  item.id_inventario,
                                  'porcentaje_iva',
                                  parseInt(e.target.value) || 0
                                )
                              }
                              className="w-20 px-2 py-1 text-xs rounded-lg bg-background border border-border/80 text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500"
                            >
                              <option value={19}>19%</option>
                              <option value={0}>0%</option>
                            </select>
                          </div>

                          {/* Botón Eliminar */}
                          <div className="pt-4">
                            <button
                              type="button"
                              onClick={() => handleRemoveCartItem(item.id_inventario)}
                              className="p-1.5 text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                              title="Eliminar de la lista"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Regla 3: Si es serializado (compresor, valvula o equipo), ingresar n seriales y n service_tags */}
                      {isSerialized && (
                        <div className="pt-2 border-t border-border/50 space-y-2.5">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                              Identificadores Serializados ({item.cantidad} unidad{item.cantidad > 1 ? 'es' : ''})
                            </div>

                            {/* Control para "Aplicar a todos" el serial en este ítem */}
                            <div className="flex items-center gap-1.5">
                              <input
                                type="text"
                                placeholder="Serial a aplicar a todos..."
                                value={bulkSerials[item.id_inventario] || ''}
                                onChange={(e) =>
                                  handleBulkSerialInputChange(item.id_inventario, e.target.value)
                                }
                                className="w-44 px-2 py-1 text-xs rounded-lg bg-background border border-border/80 text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                              />
                              <button
                                type="button"
                                onClick={() => handleApplySerialToAll(item.id_inventario)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 transition-colors cursor-pointer"
                                title="Aplica este serial a todas las unidades de este ítem"
                              >
                                <Copy className="w-3.5 h-3.5" />
                                Aplicar a todos
                              </button>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                            {Array.from({ length: item.cantidad }).map((_, sIdx) => (
                              <div
                                key={sIdx}
                                className="bg-accent/40 border border-border/60 rounded-xl p-2.5 space-y-1.5 text-xs"
                              >
                                <div className="font-bold text-foreground text-[11px]">
                                  {item.inventario.nombre} #{sIdx + 1}
                                </div>

                                <div className="space-y-0.5">
                                  <label className="text-[10px] text-muted-foreground block">Serial *</label>
                                  <input
                                    type="text"
                                    value={item.seriales[sIdx]?.serial || ''}
                                    onChange={(e) =>
                                      handleSerialChange(item.id_inventario, sIdx, 'serial', e.target.value)
                                    }
                                    placeholder="Serial ..."
                                    required
                                    className="w-full px-2 py-1 text-xs rounded bg-background border border-border/70 text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500"
                                  />
                                </div>

                                {needsServiceTag && (
                                  <div className="space-y-0.5">
                                    <label className="text-[10px] text-muted-foreground block">Service Tag *</label>
                                    <input
                                      type="text"
                                      value={item.seriales[sIdx]?.service_tag || ''}
                                      onChange={(e) =>
                                        handleSerialChange(item.id_inventario, sIdx, 'service_tag', e.target.value)
                                      }
                                      placeholder="Service tag..."
                                      required
                                      className="w-full px-2 py-1 text-xs rounded bg-background border border-border/70 text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    />
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* COLUMNA DERECHA: BUSCAR POR SKU O CÓDIGO PROVEEDOR */}
          <div className="lg:col-span-4 bg-card p-5 sm:p-6 rounded-2xl border border-border/80 shadow-xs space-y-4">
            <div>
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                  <Search className="w-4 h-4 text-blue-500" />
                  Buscar Ítems
                </h2>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={!idProveedor}
                    onClick={() => {
                      if (!idProveedor) {
                        toast.warning('Selecciona un proveedor antes de registrar un nuevo ítem');
                        return;
                      }
                      setIsQuickItemOpen(true);
                    }}
                    title={!idProveedor ? 'Debes seleccionar un proveedor primero' : 'Registrar nuevo ítem y homologarlo a este proveedor'}
                    className="text-xs font-semibold text-blue-500 hover:text-blue-600 transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:text-blue-500"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Nuevo Ítem
                  </button>
                  {idProveedor && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                      Filtrado
                    </span>
                  )}
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Busca por SKU o Código de proveedor. Presiona Enter o "+" para agregar
              </p>
            </div>

            {/* Input de Búsqueda por SKU con Enter */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  value={skuSearch}
                  onChange={(e) => setSkuSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSkuSearchSubmit(e);
                    }
                  }}
                  placeholder="SKU o Cód. Proveedor (ej: 13703-2)..."
                  className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl bg-background border border-border/80 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 font-mono"
                />
              </div>
              <button
                type="button"
                onClick={handleSkuSearchSubmit}
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Catálogo de Ítems Disponibles con botón "+" */}
            <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
              {!idProveedor ? (
                <div className="text-center py-8 text-xs text-muted-foreground border border-dashed border-border/80 rounded-xl px-4">
                  Selecciona un proveedor en la cabecera para ver los ítems que suministra.
                </div>
              ) : inventarioFiltradoPorProveedor.length === 0 ? (
                <div className="text-center py-8 text-xs text-muted-foreground border border-dashed border-border/80 rounded-xl px-4 space-y-1">
                  <p className="font-semibold text-foreground">Sin ítems homologados</p>
                  <p>Este proveedor aún no tiene ningún ítem asociado en su catálogo.</p>
                </div>
              ) : (
                inventarioFiltradoPorProveedor.map((item) => {
                  const isSelected = cartItems.some((c) => c.id_inventario === item.id_inventario);
                  const codigoProv = codigosProveedorMap.get(item.id_inventario);

                  return (
                    <div
                      key={item.id_inventario}
                      className={`flex items-center justify-between p-3 rounded-xl border transition-all ${isSelected
                        ? 'bg-muted/40 border-border/40 opacity-60'
                        : 'bg-background border-border/80 hover:border-blue-500/40'
                        }`}
                    >
                      <div className="overflow-hidden pr-2">
                        <div className="text-xs font-bold text-foreground truncate">{item.nombre}</div>
                        <div className="text-[11px] text-muted-foreground font-mono flex items-center gap-2 flex-wrap">
                          <span>SKU: {item.sku || 'N/A'}</span>
                          {codigoProv && (
                            <>
                              <span>•</span>
                              <span className="text-blue-600 dark:text-blue-400 font-bold">
                                Cód. Prov: {codigoProv}
                              </span>
                            </>
                          )}
                          <span>•</span>
                          <span className="capitalize">{item.tipo}</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        disabled={isSelected}
                        onClick={() => handleAddItemToCart(item)}
                        className={`p-2 rounded-lg text-xs font-semibold flex items-center justify-center transition-all cursor-pointer ${isSelected
                          ? 'bg-muted text-muted-foreground cursor-not-allowed'
                          : 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs shadow-blue-500/20'
                          }`}
                        title={isSelected ? 'Ya agregado' : 'Agregar a la compra'}
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* 4. TOTALES ECONÓMICOS DE LA COMPRA SEGÚN BOCETO */}
        <div className="bg-card p-6 rounded-2xl border border-border/80 shadow-xs space-y-4">
          <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Totales Económicos de la Compra
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div className="p-3.5 bg-accent/40 rounded-xl">
              <span className="text-xs text-muted-foreground block mb-0.5">Monto Total Gravado</span>
              <span className="text-base sm:text-lg font-bold text-foreground">
                ${totalesEconomicos.montoTotalGravado.toLocaleString('es-CL')}
              </span>
            </div>

            <div className="p-3.5 bg-accent/40 rounded-xl">
              <span className="text-xs text-muted-foreground block mb-0.5">Monto Total Exento</span>
              <span className="text-base sm:text-lg font-bold text-foreground">
                ${totalesEconomicos.montoTotalExento.toLocaleString('es-CL')}
              </span>
            </div>

            <div className="p-3.5 bg-accent/40 rounded-xl">
              <span className="text-xs text-muted-foreground block mb-0.5">Monto Total IVA</span>
              <span className="text-base sm:text-lg font-bold text-foreground">
                ${totalesEconomicos.montoTotalIva.toLocaleString('es-CL')}
              </span>
            </div>

            <div className="p-3.5 bg-blue-500/10 border border-blue-500/20 rounded-xl">
              <span className="text-xs text-blue-600 dark:text-blue-400 font-semibold block mb-0.5">Monto Total</span>
              <span className="text-lg sm:text-xl font-extrabold text-blue-600 dark:text-blue-400">
                ${totalesEconomicos.montoTotal.toLocaleString('es-CL')}
              </span>
            </div>
          </div>
        </div>

        {/* 5. BOTÓN DE ACCIÓN / GUARDAR */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link
            to="/admin/compras/listado"
            className="px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-xl bg-card border border-border/80 text-foreground hover:bg-accent transition-colors"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={isSavingNew}
            className="inline-flex items-center gap-2 px-6 py-2.5 text-xs sm:text-sm font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 transition-all cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {isSavingNew ? 'Registrando Compra...' : 'Registrar Compra'}
          </button>
        </div>
      </form>

      <QuickCreateProveedorModal
        isOpen={isQuickProveedorOpen}
        onClose={() => setIsQuickProveedorOpen(false)}
        onCreated={(nuevo) => {
          setIdProveedor(String(nuevo.id_proveedor));
          setCartItems([]);
        }}
      />

      <QuickCreateItemModal
        isOpen={isQuickItemOpen}
        onClose={() => setIsQuickItemOpen(false)}
        defaultProveedorId={idProveedor ? Number(idProveedor) : undefined}
        onCreated={(nuevo) => {
          const cod =
            nuevo.inventario_proveedores?.find((ip) => ip.id_proveedor === Number(idProveedor))?.codigo_proveedor ||
            nuevo.sku ||
            '';
          handleAddItemToCart(nuevo, cod);
        }}
      />
    </div>
  );
};

export default CompraFormPage;
