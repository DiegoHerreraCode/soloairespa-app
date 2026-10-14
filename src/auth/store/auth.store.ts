import { create } from 'zustand';
import type { User } from '@/interfaces/user.interface';
import { loginAction } from '../actions/login.action';
import { registerAction } from '../actions/register.action';
import { checkAuthAction } from '../actions/check-auth.action';

type AuthStatus = 'checking' | 'authenticated' | 'not-authenticated';

type AuthState = {
  authStatus: AuthStatus;
  user: User | null;
  token: string | null;

  // actions
  login: (email: string, password: string) => Promise<{ ok: boolean; message?: string }>;
  register: (data: {
    name: string;
    email: string;
    password: string;
    rut: string;
    num_tlf?: string;
    direccion: string;
  }) => Promise<{ ok: boolean; message?: string }>;
  logout: () => void;
  checkAuthStatus: () => Promise<boolean>;
};

export const useAuthStore = create<AuthState>()((set) => ({
  authStatus: 'checking',
  user: null,
  token: null,

  login: async (email: string, password: string) => {
    try {
      const resp = await loginAction(email, password);
      if (resp.token) {
        localStorage.setItem('token', resp.token);
        set({ token: resp.token, authStatus: 'authenticated' });
      }
      return { ok: true, message: resp.message };
    } catch (error: any) {
      console.log(error);
      localStorage.removeItem('token');
      set({ user: null, token: null, authStatus: 'not-authenticated' });
      const msg = error?.response?.data?.message || 'Email o contraseña incorrectos';
      return { ok: false, message: msg };
    }
  },

  register: async (registerData) => {
    try {
      const resp = await registerAction(registerData);
      return { ok: true, message: resp.message };
    } catch (error: any) {
      console.log(error);
      const msg = error?.response?.data?.message || 'Error al registrar usuario';
      return { ok: false, message: msg };
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null, authStatus: 'not-authenticated' });
  },

  checkAuthStatus: async () => {
    try {
      const { user } = await checkAuthAction();
      const token = localStorage.getItem('token');
      set({ user, token, authStatus: 'authenticated' });
      return true;
    } catch (error) {
      localStorage.removeItem('token');
      set({ user: null, token: null, authStatus: 'not-authenticated' });
      return false;
    }
  },
}));
