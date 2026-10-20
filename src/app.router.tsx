import { createBrowserRouter, Navigate } from 'react-router';
import { lazy } from 'react';
import { LoginPage } from './auth/pages/login/LoginPage';
import { RegisterPage } from './auth/pages/register/RegisterPage';
import { ForgotPasswordPage } from './auth/pages/forgot-password/ForgotPasswordPage';
import { DashboardPage } from './admin/pages/dashboard/DashboardPage';
import { FinanzasPage } from './admin/pages/finanzas/FinanzasPage';
import { PersonalMenuPage } from './admin/pages/personal/PersonalMenuPage';
import { PersonalTallerPage } from './admin/pages/personal/PersonalTallerPage';
import { PersonalTallerFormPage } from './admin/pages/personal/PersonalTallerFormPage';
import { AdministradoresPage } from './admin/pages/personal/AdministradoresPage';
import { AdministradoresFormPage } from './admin/pages/personal/AdministradoresFormPage';
import { ClienteMenuPage } from './admin/pages/clientes/ClienteMenuPage';
import { ClientePage } from './admin/pages/clientes/ClientePage';
import { ClienteFormPage } from './admin/pages/clientes/ClienteFormPage';
import { PagoClientePage } from './admin/pages/clientes/PagoClientePage';
import { PagoClienteFormPage } from './admin/pages/clientes/PagoClienteFormPage';
import { CompraMenuPage } from './admin/pages/compras/CompraMenuPage';
import { CompraPage } from './admin/pages/compras/CompraPage';
import { CompraFormPage } from './admin/pages/compras/CompraFormPage';
import { CompraProveedorPage } from './admin/pages/compras/CompraProveedorPage';
import { CompraProveedorFormPage } from './admin/pages/compras/CompraProveedorFormPage';
import { PagoCompraPage } from './admin/pages/compras/PagoCompraPage';
import { PagoCompraFormPage } from './admin/pages/compras/PagoCompraFormPage';
import { InventarioMenuPage } from './admin/pages/inventario/InventarioMenuPage';
import { RepuestoPage } from './admin/pages/inventario/RepuestoPage';
import { RepuestoFormPage } from './admin/pages/inventario/RepuestoFormPage';
import { EquipoPage } from './admin/pages/inventario/EquipoPage';
import { ModeloPage } from './admin/pages/inventario/ModeloPage';
import { ModeloFormPage } from './admin/pages/inventario/ModeloFormPage';
import { MarcaPage } from './admin/pages/inventario/MarcaPage';
import { MarcaFormPage } from './admin/pages/inventario/MarcaFormPage';
import { ItemPage } from './admin/pages/inventario/ItemPage';
import { ItemFormPage } from './admin/pages/inventario/ItemFormPage';
import { TallerMenuPage } from './admin/pages/taller/TallerMenuPage';
import { TipoServicioTallerPage } from './admin/pages/taller/TipoServicioTallerPage';
import { TipoServicioTallerFormPage } from './admin/pages/taller/TipoServicioTallerFormPage';
import { ServicioTallerPage } from './admin/pages/taller/ServicioTallerPage';
import { ServicioTallerFormPage } from './admin/pages/taller/ServicioTallerFormPage';
import { ReparacionPage } from './admin/pages/taller/ReparacionPage';
import { ModulePlaceholder } from './admin/pages/ModulePlaceholder';
import { AuthenticatedRoute, NotAuthenticatedRoute } from './components/routes/ProtectedRoutes';

// Lazy loading de layouts
const AuthLayout = lazy(() => import('./auth/layouts/AuthLayout'));
const AdminLayout = lazy(() => import('./admin/layouts/AdminLayout'));

export const appRouter = createBrowserRouter([
  // Redirección de raíz hacia el panel de administración
  {
    path: '/',
    element: <Navigate to="/admin" replace />,
  },

  // Rutas públicas de autenticación (solo para usuarios no autenticados)
  {
    path: '/auth',
    element: (
      <NotAuthenticatedRoute>
        <AuthLayout />
      </NotAuthenticatedRoute>
    ),
    children: [
      {
        index: true, // ruta: auth
        element: <Navigate to="/auth/login" replace />,
      },
      {
        path: 'login', // ruta: auth/login
        element: <LoginPage />,
      },
      {
        path: 'register', // ruta: auth/register
        element: <RegisterPage />,
      },
      {
        path: 'forgot-password', // ruta: auth/forgot-password
        element: <ForgotPasswordPage />,
      },
    ],
  },

  // Rutas privadas de administración (requieren autenticación)
  {
    path: '/admin',
    element: (
      <AuthenticatedRoute>
        <AdminLayout />
      </AuthenticatedRoute>
    ),
    children: [
      {
        index: true, // ruta: admin
        element: <DashboardPage />,
      },
      {
        path: 'ordenes', // ruta: admin/ordenes
        element: (
          <ModulePlaceholder
            title="Órdenes de Trabajo"
            description="Gestión de OrdenController y TipoOrdenController."
          />
        ),
      },
      {
        path: 'cotizaciones', // ruta: admin/cotizaciones
        element: (
          <ModulePlaceholder
            title="Cotizaciones"
            description="Aprobación y control de presupuestos mediante CotizacionController."
          />
        ),
      },
      {
        path: 'clientes',
        children: [
          {
            index: true, // ruta: admin/clientes (Menú de selección con los 2 cards: Clientes y Pagos)
            element: <ClienteMenuPage />,
          },
          {
            path: 'listado', // ruta: admin/clientes/listado (Listado de clientes)
            element: <ClientePage />,
          },
          {
            path: 'listado/:id', // ruta: admin/clientes/listado/:id (crear y editar estilo Fernando Herrera con :id = 'new' o id numérico)
            element: <ClienteFormPage />,
          },
          {
            path: 'pagos-clientes', // ruta: admin/clientes/pagos-clientes (Listado con tabla)
            element: <PagoClientePage />,
          },
          {
            path: 'pagos-clientes/:id', // ruta: admin/clientes/pagos-clientes/:id (crear y editar estilo Fernando Herrera con :id = 'new' o id numérico)
            element: <PagoClienteFormPage />,
          },
        ],
      },
      {
        path: 'compras',
        children: [
          {
            index: true, // ruta: admin/compras (Menú de 3 cards: Compras, Pagos de Compras, Proveedores)
            element: <CompraMenuPage />,
          },
          {
            path: 'proveedores', // ruta: admin/compras/proveedores (Listado de proveedores en cards de 3)
            element: <CompraProveedorPage />,
          },
          {
            path: 'proveedores/:id', // ruta: admin/compras/proveedores/:id (:id = 'new' o id numérico)
            element: <CompraProveedorFormPage />,
          },
          {
            path: 'listado', // ruta: admin/compras/listado (Listado de compras en tabla de 7 filas)
            element: <CompraPage />,
          },
          {
            path: 'listado/:id', // ruta: admin/compras/listado/:id (modo detalle solo lectura o :id='new' para crear)
            element: <CompraFormPage />,
          },
          {
            path: 'pagos-compras', // ruta: admin/compras/pagos-compras (Listado con tabla de 7 filas)
            element: <PagoCompraPage />,
          },
          {
            path: 'pagos-compras/:id', // ruta: admin/compras/pagos-compras/:id (detalle o pago)
            element: <PagoCompraFormPage />,
          },
        ],
      },
      {
        path: 'inventario',
        children: [
          {
            index: true, // ruta: admin/inventario (Menú con las 5 opciones: Items, Marcas, Modelos, Equipos, Repuestos)
            element: <InventarioMenuPage />,
          },
          {
            path: 'repuestos', // ruta: admin/inventario/repuestos (Listado de repuestos en tabla de 7 filas)
            element: <RepuestoPage />,
          },
          {
            path: 'repuestos/:id', // ruta: admin/inventario/repuestos/:id (Ver detalle del repuesto a modo de solo lectura)
            element: <RepuestoFormPage />,
          },
          {
            path: 'items', // ruta: admin/inventario/items
            element: <ItemPage />,
          },
          {
            path: 'items/:id', // ruta: admin/inventario/items/:id (crear con 'new' o editar)
            element: <ItemFormPage />,
          },
          {
            path: 'marcas', // ruta: admin/inventario/marcas
            element: <MarcaPage />,
          },
          {
            path: 'marcas/:id', // ruta: admin/inventario/marcas/:id (crear con 'new' o editar)
            element: <MarcaFormPage />,
          },
          {
            path: 'modelos', // ruta: admin/inventario/modelos
            element: <ModeloPage />,
          },
          {
            path: 'modelos/:id', // ruta: admin/inventario/modelos/:id (crear con 'new' o editar)
            element: <ModeloFormPage />,
          },
          {
            path: 'equipos', // ruta: admin/inventario/equipos
            element: <EquipoPage />,
          },
        ],
      },
      {
        path: 'taller', // ruta: admin/taller
        children: [
          {
            index: true, // ruta: admin/taller (Menú de selección con los 3 cards)
            element: <TallerMenuPage />,
          },
          {
            path: 'reparaciones', // ruta: admin/taller/reparaciones (Listado de reparaciones en tabla de 7 filas)
            element: <ReparacionPage />,
          },
          {
            path: 'reparaciones/:id', // ruta: admin/taller/reparaciones/:id (Ver detalle del repuesto a modo de solo lectura)
            //  element: <ReparacionFormPage />,
          },
          {
            path: 'servicios', // ruta: admin/taller/servicios
            element: <ServicioTallerPage />,
          },
          {
            path: 'servicios/:id', // ruta: admin/taller/servicios/:id (crear con 'new' o editar)
            element: <ServicioTallerFormPage />,
          },
          {
            path: 'tipos-servicios', // ruta: admin/taller/tipos-servicios
            element: <TipoServicioTallerPage />,
          },
          {
            path: 'tipos-servicios/:id', // ruta: admin/taller/tipos-servicios/:id (crear con 'new' o editar)
            element: <TipoServicioTallerFormPage />,
          },
        ],
      },
      {
        path: 'personal',
        children: [
          {
            index: true, // ruta: admin/personal (Menú de selección con los 2 cards)
            element: <PersonalMenuPage />,
          },
          {
            path: 'taller', // ruta: admin/personal/taller (Listado con tarjetas)
            element: <PersonalTallerPage />,
          },
          {
            path: 'taller/:id', // ruta: admin/personal/taller/:id (crear y editar estilo Fernando Herrera con :id = 'new' o id numérico)
            element: <PersonalTallerFormPage />,
          },
          {
            path: 'administradores', // ruta: admin/personal/administradores (Listado con tarjetas)
            element: <AdministradoresPage />,
          },
          {
            path: 'administradores/:id', // ruta: admin/personal/administradores/:id (crear y editar estilo Fernando Herrera con :id = 'new' o id numérico)
            element: <AdministradoresFormPage />,
          },
        ],
      },
      {
        path: 'finanzas', // ruta: admin/finanzas
        element: <FinanzasPage />,
      },
    ],
  },

  // Comodín / 404
  {
    path: '*',
    element: <Navigate to="/admin" replace />,
  },
]);
