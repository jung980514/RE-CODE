export interface RegisterData {
  name: string;
  email: string;
  password: string;
  phone: string;
  birthDate: string; // YYYY-MM-DD
  role: 'GUARDIAN' | 'ELDER'; 
}

interface RegisterResponse {
  success: boolean;
  message: string;
  user?: {
    id: string;
    username: string;
    email: string;
  };
}

export const register = async (data: RegisterData): Promise<RegisterResponse> => {
  try {
    const response = await fetch('https://recode-my-life.site/api/user/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': '*/*',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: '회원가입에 실패했습니다.' }));
      throw new Error(errorData.message || '회원가입 중 오류가 발생했습니다.');
    }

    return await response.json();
  } catch (error) {
    console.error('Registration API call failed:', error);
    throw error instanceof Error ? error : new Error('네트워크 오류 또는 알 수 없는 문제가 발생했습니다.');
  }
};