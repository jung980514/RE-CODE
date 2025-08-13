import axios, { AxiosInstance, AxiosResponse } from 'axios';

// API 응답 타입 정의
export interface ApiResponse<T = unknown> {
  status: 'success' | 'fail' | 'error';
  code: number;
  message: string | null;
  data: T;
}

// 토큰 응답 타입
export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
}

// 사용자 정보 타입
export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  birthDate: string;
  role: 'ELDER' | 'GUARDIAN' | 'ADMIN';
  createdAt: string;
  updatedAt: string;
}

// 회원가입 요청 타입
export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  phone: string;
  birthDate: string; // YYYY-MM-DD 형식
  role: 'ELDER' | 'GUARDIAN';
}

// 로그인 요청 타입
export interface LoginRequest {
  email: string;
  password: string;
}

// API 클라이언트 생성
const createApiClient = (): AxiosInstance => {
  const client = axios.create({
    // baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8088',
    baseURL: process.env.NEXT_PUBLIC_API_URL || `${process.env.NEXT_PUBLIC_BACKEND_URL}`,
    withCredentials: true, // 쿠키 포함
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // 요청 인터셉터
  client.interceptors.request.use(
    (config) => {
      // 토큰이 있으면 헤더에 추가
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('accessToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // 응답 인터셉터
  client.interceptors.response.use(
    (response: AxiosResponse<ApiResponse>) => {
      return response;
    },
    async (error) => {
      const originalRequest = error.config;

      // 401 에러이고 토큰 갱신을 시도하지 않았다면
      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;

        try {
          // 토큰 갱신 시도
          const refreshResponse = await client.post<ApiResponse<TokenResponse>>('/api/user/reissue');
          
          if (refreshResponse.data.status === 'success') {
            const { accessToken, refreshToken } = refreshResponse.data.data;
            
            // 새로운 토큰 저장
            if (typeof window !== 'undefined') {
              localStorage.setItem('accessToken', accessToken);
              localStorage.setItem('refreshToken', refreshToken);
            }

            // 원래 요청 재시도
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            return client(originalRequest);
          }
        } catch {
          // 토큰 갱신 실패 시 로그아웃 처리
          if (typeof window !== 'undefined') {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('userType');
            localStorage.removeItem('userEmail');
            window.location.href = '/';
          }
        }
      }

      return Promise.reject(error);
    }
  );

  return client;
};

const apiClient = createApiClient();

// 인증 관련 API 함수들
export const authApi = {
  // 회원가입
  register: async (data: RegisterRequest): Promise<ApiResponse<string>> => {
    const response = await apiClient.post<ApiResponse<string>>('/api/user/register', data);
    return response.data;
  },

  // 로그인
  login: async (data: LoginRequest): Promise<ApiResponse<TokenResponse>> => {
    const response = await apiClient.post<ApiResponse<TokenResponse>>('/api/user/login', data);
    return response.data;
  },

  // 로그아웃
  logout: async (): Promise<ApiResponse<string>> => {
    const response = await apiClient.post<ApiResponse<string>>('/api/user/logout');
    return response.data;
  },

  // 사용자 정보 조회
  getUser: async (): Promise<ApiResponse<User>> => {
    const response = await apiClient.get<ApiResponse<User>>('/api/user');
    return response.data;
  },

  // 토큰 갱신
  reissue: async (): Promise<ApiResponse<TokenResponse>> => {
    const response = await apiClient.post<ApiResponse<TokenResponse>>('/api/user/reissue');
    return response.data;
  },

  // 사용자 정보 업데이트
  updateUser: async (data: unknown): Promise<ApiResponse<User>> => {
    const response = await apiClient.patch<ApiResponse<User>>('/api/user/update', data);
    return response.data;
  },
};

export default apiClient; 