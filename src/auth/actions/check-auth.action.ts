import { apiClient } from '@/api/apiClient';
import type { User } from '@/interfaces/user.interface';

export const checkAuthAction = async (): Promise<{ user: User }> => {
  const token = localStorage.getItem('token');

  if (!token) {
    throw new Error('Token not found');
  }

  try {
    const { data } = await apiClient.get<{ message: string; data: User }>('/user');
    return { user: data.data };
  } catch (error) {
    console.log(error);
    localStorage.removeItem('token');
    throw new Error('Token expired or invalid');
  }
};
