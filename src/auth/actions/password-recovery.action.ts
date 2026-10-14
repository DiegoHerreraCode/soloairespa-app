import { apiClient } from '@/api/apiClient';

export const forgotPasswordAction = async (email: string) => {
  try {
    const { data } = await apiClient.post('/forgot-password', { email });
    return data;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

export const verifyCodeAction = async (email: string, codigo: string) => {
  try {
    const { data } = await apiClient.post('/verify-code', { email, codigo });
    return data;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

export const resetPasswordAction = async (email: string, password: string) => {
  try {
    const { data } = await apiClient.post('/reset-password', { email, password });
    return data;
  } catch (error) {
    console.log(error);
    throw error;
  }
};
