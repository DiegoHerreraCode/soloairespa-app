export interface User {
  id: number | string;
  name: string;
  email: string;
  codigo_verificacion?: string | null;
  roles?: string[];
  role?: string;
}

export interface Admin {
  id_admin?: number | string;
  id_user?: number | string;
  nombre?: string;
  rut?: string;
  num_tlf?: string;
  direccion?: string;
}

export interface AuthResponse {
  message: string;
  token?: string;
  data?: any;
}
