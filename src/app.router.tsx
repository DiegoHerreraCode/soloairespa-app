import { createBrowserRouter, Navigate } from 'react-router';
import { lazy } from 'react';
import { LoginPage } from './auth/pages/login/LoginPage';
import { RegisterPage } from './auth/pages/register/RegisterPage';
import { ForgotPasswordPage } from './auth/pages/forgot-password/ForgotPasswordPage';
import { DashboardPage } from './admin/pages/dashboard/DashboardPage';
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
            description="Gestión y estado de órdenes mediante OrdenController."
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
        path: 'clientes', // ruta: admin/clientes
        element: (
          <ModulePlaceholder
            title="Clientes y Pagos"
            description="Gestión de clientes y recaudaciones con ClienteController y PagoClienteController."
          />
        ),
      },
      {
        path: 'compras', // ruta: admin/compras
        element: (
          <ModulePlaceholder
            title="Compras y Proveedores"
            description="Control de proveedores, compras y pagos con CompraController, ProveedorController y PagoCompraController."
          />
        ),
      },
      {
        path: 'inventario', // ruta: admin/inventario
        element: (
          <ModulePlaceholder
            title="Inventario y Servicios"
            description="Control de repuestos, marcas, modelos, insumos, reparaciones y equipos."
          />
        ),
      },
      {
        path: 'personal', // ruta: admin/personal
        element: (
          <ModulePlaceholder
            title="Personal y Administradores"
            description="Control de personal con AdminController y PersonalController."
          />
        ),
      },
      {
        path: 'finanzas', // ruta: admin/finanzas
        element: (
          <ModulePlaceholder
            title="Finanzas"
            description="Supervisión integral de rentabilidad, desglose por línea de negocio, cálculo de IVA diferencial y productos más exitosos."
          />
        ),
      },
    ],
  },

  // Comodín / 404
  {
    path: '*',
    element: <Navigate to="/admin" replace />,
  },
]);
