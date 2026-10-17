import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  ArrowLeft,
  CreditCard,
  Upload,
  FileText,
  CheckCircle2,
  Clock,
  Eye,
  Save,
  Building2,
} from 'lucide-react';
import { getPagoCompraByIdAction } from '../../actions/get-pago-compra-by-id.action';
import { getComprasAction } from '../../actions/get-compras.action';
import { getProveedoresAction } from '../../actions/get-proveedores.action';
import { usePagoCompraMutation } from '../../hooks/usePagoCompraMutation';

export const PagoCompraFormPage = () => {
  const { id } = useParams<{ id: string }>();

  const { updatePagoCompra, isPending: isSaving } = usePagoCompraMutation();

  // 1. Consulta los datos del pago de compra
  const { data: pagoData, isLoading: isLoadingPago } = useQuery({
    queryKey: ['pago-compra-item', id],
    queryFn: () => getPagoCompraByIdAction(id!),
    enabled: !!id,
  });

  // 2. Consulta compras y proveedores para enriquecer los datos de cabecera
  const { data: compras = [] } = useQuery({
    queryKey: ['compras-listado'],
    queryFn: getComprasAction,
  });

  const { data: proveedores = [] } = useQuery({
    queryKey: ['proveedores-listado'],
    queryFn: getProveedoresAction,
  });

  // Resolver compra y proveedor asociados
  const compraAsociada = compras.find((c) => c.id_compra === pagoData?.id_compra);
  const proveedorAsociado = compraAsociada
    ? proveedores.find((p) => p.id_proveedor === compraAsociada.id_proveedor)
    : undefined;

  // Estado del formulario de pago (habilitado cuando estado === 'pendiente')
  const [fechaPago, setFechaPago] = useState(new Date().toISOString().split('T')[0]);
  const [metodoPago, setMetodoPago] = useState<'transferencia' | 'efectivo' | 'cheque'>('transferencia');
  const [numReferencia, setNumReferencia] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Sincronizar datos si ya existen en el pago
  useEffect(() => {
    if (pagoData) {
      if (pagoData.fecha_pago) {
        setFechaPago(pagoData.fecha_pago.split('T')[0]);
      }
      if (pagoData.metodo_pago) {
        setMetodoPago(pagoData.metodo_pago);
      }
      if (pagoData.num_referencia) {
        setNumReferencia(pagoData.num_referencia);
      }
    }
  }, [pagoData]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  // Enviar liquidación de pago
  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!id) return;

    if (!fechaPago) {
      toast.warning('Por favor selecciona una fecha de pago');
      return;
    }

    if (metodoPago === 'transferencia') {
      if (!numReferencia.trim()) {
        toast.warning('El número de referencia es obligatorio para pagos por transferencia');
        return;
      }
      if (!selectedImage && !pagoData?.imagePath && !pagoData?.image) {
        toast.warning('Se requiere adjuntar el comprobante de transferencia');
        return;
      }
    }

    const form = new FormData();
    form.append('estado', 'realizado');
    form.append('fecha_pago', fechaPago);
    form.append('metodo_pago', metodoPago);

    if (metodoPago === 'transferencia') {
      if (numReferencia.trim()) {
        form.append('num_referencia', numReferencia.trim());
      }
      if (selectedImage) {
        form.append('image', selectedImage);
      }
    }

    updatePagoCompra({ id, formData: form });
  };

  // Resuelve la URL pública del backend para la imagen del comprobante
  const getBackendImageUrl = (path?: string | null) => {
    if (!path) return null;
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    const baseUrlImg = import.meta.env.VITE_IMG_URL || 'http://localhost:8000';
    return `${baseUrlImg}/${path}`;
  };

  if (isLoadingPago) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!pagoData) {
    return (
      <div className="bg-card p-12 rounded-2xl border border-border/80 text-center space-y-4 max-w-xl mx-auto">
        <CreditCard className="w-12 h-12 text-muted-foreground/40 mx-auto" />
        <h2 className="text-lg font-bold text-foreground">Pago no encontrado</h2>
        <p className="text-xs text-muted-foreground">
          No existe ningún registro de pago a compra con el identificador #{id}.
        </p>
        <Link
          to="/admin/compras/pagos-compras"
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-blue-600 text-white"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al listado
        </Link>
      </div>
    );
  }

  const isRealizado = pagoData.estado === 'realizado';
  const voucherUrl = getBackendImageUrl(pagoData.imagePath || pagoData.image);

  return (
    <div className="space-y-6 max-w-3xl animate-fadeIn mx-auto">
      {/* 1. Encabezado con Botón Volver */}
      <div className="flex items-center justify-between pb-2 border-b border-border/80">
        <div className="flex items-center gap-3">
          <Link
            to="/admin/compras/pagos-compras"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-card border border-border/80 text-foreground hover:bg-accent transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <CreditCard className="w-6 h-6 text-blue-500" />
              {isRealizado ? `Detalle del Pago #${pagoData.id_pago_compra}` : `Registrar Pago #${pagoData.id_pago_compra}`}
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isRealizado
                ? 'Información del pago a proveedor (Solo lectura)'
                : 'Completa la información para liquidar la cuota a proveedor'}
            </p>
          </div>
        </div>

        <div>
          {isRealizado ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Pago Realizado
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              <Clock className="w-3.5 h-3.5" />
              Pago Pendiente
            </span>
          )}
        </div>
      </div>

      {/* 2. Tarjeta con Datos Informativos de la Compra y Proveedor */}
      <div className="bg-card p-6 rounded-2xl border border-border/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-border/60 pb-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <Building2 className="w-4 h-4 text-blue-500" />
            Datos de la Compra y Proveedor
          </h3>
          <span className="text-xs font-bold text-foreground">
            Compra #{pagoData.id_compra}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs sm:text-sm">
          <div className="p-3 bg-accent/40 rounded-xl">
            <span className="text-xs text-muted-foreground block">Proveedor</span>
            <span className="text-sm font-bold text-foreground">{proveedorAsociado?.nombre || 'Desconocido'}</span>
            <span className="text-[11px] text-muted-foreground block">RUT: {proveedorAsociado?.rut || 'Sin RUT'}</span>
          </div>

          <div className="p-3 bg-accent/40 rounded-xl">
            <span className="text-xs text-muted-foreground block">Monto de la Cuota</span>
            <span className="text-base font-bold text-foreground">
              ${Number(pagoData.monto_a_pagar || 0).toLocaleString('es-CL')}
            </span>
            <span className="text-[11px] text-muted-foreground block">
              Cuota: {pagoData.porcentaje_monto_total ? `${pagoData.porcentaje_monto_total}%` : 'N/A'}
            </span>
          </div>

          <div className="p-3 bg-accent/40 rounded-xl">
            <span className="text-xs text-muted-foreground block">Abono al Bien</span>
            <span className="text-base font-bold text-foreground">
              ${Number(pagoData.abono_al_bien || 0).toLocaleString('es-CL')}
            </span>
            <span className="text-[11px] text-muted-foreground block">Valor neto</span>
          </div>

          <div className="p-3 bg-accent/40 rounded-xl">
            <span className="text-xs text-muted-foreground block">Abono al IVA</span>
            <span className="text-base font-bold text-foreground">
              ${Number(pagoData.abono_al_iva || 0).toLocaleString('es-CL')}
            </span>
            <span className="text-[11px] text-muted-foreground block">Impuesto IVA</span>
          </div>

          <div className="p-3 bg-accent/40 rounded-xl sm:col-span-2">
            <span className="text-xs text-muted-foreground block">Fecha de Pago Acordada</span>
            <span className="text-sm font-bold text-foreground">
              {pagoData.fecha_pago_acordada ? pagoData.fecha_pago_acordada.split('T')[0] : 'No definida'}
            </span>
          </div>

          <div className="p-3 bg-accent/40 rounded-xl sm:col-span-2">
            <span className="text-xs text-muted-foreground block">N° Factura / Boleta Compra</span>
            <span className="text-sm font-bold text-foreground">
              {compraAsociada?.num_factura_boleta || 'Sin factura'}
            </span>
          </div>
        </div>
      </div>

      {/* 3. CASO A: MODO SOLO LECTURA (Si estado === 'realizado') */}
      {isRealizado ? (
        <div className="space-y-6">
          <div className="bg-card p-6 rounded-2xl border border-border/80 shadow-xs space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-500" />
              Detalle del Pago Efectuado
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs sm:text-sm">
              <div className="p-3 bg-accent/40 rounded-xl">
                <span className="text-xs text-muted-foreground block">Fecha en que se Pagó</span>
                <span className="text-base font-bold text-foreground">
                  {pagoData.fecha_pago ? pagoData.fecha_pago.split('T')[0] : 'S/F'}
                </span>
              </div>

              <div className="p-3 bg-accent/40 rounded-xl">
                <span className="text-xs text-muted-foreground block">Método de Pago</span>
                <span className="text-base font-bold text-foreground uppercase">
                  {pagoData.metodo_pago || 'No especificado'}
                </span>
              </div>

              <div className="p-3 bg-accent/40 rounded-xl">
                <span className="text-xs text-muted-foreground block">N° de Referencia</span>
                <span className="text-base font-bold text-foreground">
                  {pagoData.num_referencia || 'Sin número de referencia'}
                </span>
              </div>
            </div>

            {/* Comprobante de Pago Adjunto */}
            <div className="pt-2">
              <span className="text-xs font-bold text-foreground block mb-2">Comprobante de Pago</span>
              {voucherUrl ? (
                <div className="p-4 bg-muted/20 border border-border/80 rounded-2xl flex flex-col items-center gap-3">
                  <a
                    href={voucherUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="relative group block overflow-hidden rounded-xl border border-border"
                  >
                    <img
                      src={voucherUrl}
                      alt="Comprobante de pago"
                      className="max-h-64 object-contain rounded-xl group-hover:scale-105 transition-transform duration-200"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-bold transition-opacity">
                      <Eye className="w-4 h-4 mr-1" />
                      Ver Imagen Completa
                    </div>
                  </a>
                  <a
                    href={voucherUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-semibold text-blue-500 hover:underline flex items-center gap-1"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Abrir comprobante en pestaña nueva
                  </a>
                </div>
              ) : (
                <div className="p-6 bg-muted/20 border border-dashed border-border/80 rounded-xl text-center text-xs text-muted-foreground">
                  No se adjuntó imagen de comprobante para este pago.
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* 4. CASO B: MODO REGISTRAR / PAGAR (Si estado === 'pendiente') */
        <form onSubmit={handlePaymentSubmit} className="bg-card p-6 sm:p-8 rounded-2xl border border-border/80 shadow-xs space-y-6">
          <div className="border-b border-border/60 pb-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-500" />
              Ingresar Datos del Pago
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Ingresa la fecha, método de pago y comprobante correspondiente
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Fecha de Pago */}
            <div>
              <label className="block text-xs font-bold text-foreground mb-1.5">
                Fecha de Pago <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={fechaPago}
                onChange={(e) => setFechaPago(e.target.value)}
                required
                className="w-full px-3.5 py-2 text-sm rounded-xl bg-background border border-border/80 text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
              />
            </div>

            {/* Método de Pago */}
            <div>
              <label className="block text-xs font-bold text-foreground mb-1.5">
                Método de Pago <span className="text-rose-500">*</span>
              </label>
              <select
                value={metodoPago}
                onChange={(e) => setMetodoPago(e.target.value as any)}
                required
                className="w-full px-3.5 py-2 text-sm rounded-xl bg-background border border-border/80 text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
              >
                <option value="transferencia">Transferencia Bancaria</option>
                <option value="efectivo">Efectivo</option>
                <option value="cheque">Cheque</option>
              </select>
            </div>

            {/* N° de Referencia (si metodo_pago === 'transferencia') */}
            {metodoPago === 'transferencia' && (
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-foreground mb-1.5">
                  N° de Referencia / Transacción <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={numReferencia}
                  onChange={(e) => setNumReferencia(e.target.value)}
                  placeholder="Ej: 333 o TRX-765432"
                  required={metodoPago === 'transferencia'}
                  className="w-full px-3.5 py-2 text-sm rounded-xl bg-background border border-border/80 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                />
              </div>
            )}

            {/* Adjuntar Comprobante (si metodo_pago === 'transferencia') */}
            {metodoPago === 'transferencia' && (
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-foreground mb-1.5">
                  Comprobante de Pago <span className="text-rose-500">*</span>
                </label>
                <div className="border-2 border-dashed border-border/80 rounded-2xl p-4 text-center hover:border-emerald-500/40 transition-colors">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/jpg"
                    onChange={handleImageChange}
                    id="image-upload-pago-compra"
                    className="hidden"
                  />
                  <label
                    htmlFor="image-upload-pago-compra"
                    className="cursor-pointer flex flex-col items-center justify-center gap-1.5 text-muted-foreground hover:text-foreground"
                  >
                    <Upload className="w-6 h-6 text-emerald-500" />
                    <span className="text-xs font-semibold">
                      {selectedImage ? selectedImage.name : 'Haz clic para seleccionar comprobante (JPEG, PNG)'}
                    </span>
                  </label>
                </div>

                {imagePreview && (
                  <div className="mt-3 flex items-center justify-center">
                    <img
                      src={imagePreview}
                      alt="Vista previa comprobante"
                      className="max-h-48 rounded-xl border border-border object-contain shadow-xs"
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Botones de Acción */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/80">
            <Link
              to="/admin/compras/pagos-compras"
              className="px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-card border border-border/80 text-foreground hover:bg-accent transition-colors"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-500/20 transition-all cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Registrando...' : 'Confirmar y Pagar'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default PagoCompraFormPage;
