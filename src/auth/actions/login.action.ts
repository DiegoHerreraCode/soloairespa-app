import { apiClient } from '@/api/apiClient';
import type { AuthResponse } from '@/interfaces/user.interface';

export const loginAction = async (email: string, password: string): Promise<AuthResponse> => {
  try {
    const { data } = await apiClient.post<AuthResponse>('/login', { email, password });
    return data;
  } catch (error) {
    console.log(error);
    throw error;
  }
};