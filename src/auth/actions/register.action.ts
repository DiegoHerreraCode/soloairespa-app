import { apiClient } from '@/api/apiClient';
import type { AuthResponse } from '@/interfaces/user.interface';

interface RegisterData {
  name: string;
  email: string;
  password: string;
  rut: string;
  num_tlf?: string;
  direccion: string;
}

export const registerAction = async (registerData: RegisterData): Promise<AuthResponse> => {
  try {
    const { data } = await apiClient.post<AuthResponse>('/register', registerData);
    return data;
  } catch (error) {
    console.log(error);
    throw error;
  }
};
