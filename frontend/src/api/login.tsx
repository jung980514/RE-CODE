interface LoginCredentials {
  email: string;
  password?: string;
}

import {
  dummyOldPeopleAccount,
  dummyGuardianAccount,
  dummyOldPeopleAccount2,
  dummyGuardianAccount2
} from '../../dummy-data/DummyAccounts';

type DummyUser = typeof dummyOldPeopleAccount | typeof dummyGuardianAccount | typeof dummyOldPeopleAccount2 | typeof dummyGuardianAccount2;

const DUMMY_USERS: DummyUser[] = [
  dummyOldPeopleAccount,
  dummyGuardianAccount,
  dummyOldPeopleAccount2,
  dummyGuardianAccount2
];

/**
 * 더미 로그인 함수.
 * 성공 시 로컬 스토리지에 토큰을 저장하고 사용자 정보를 반환합니다.
 * @param credentials - 로그인 정보 (email, password)
 * @returns Promise<DummyUser> - 로그인 성공 시 더미 유저 정보 반환
 */
export const login = async (credentials: LoginCredentials): Promise<DummyUser> => {
  console.log('Dummy login attempt with:', credentials.email);
  await new Promise(resolve => setTimeout(resolve, 500));

  // 더미 계정에서 찾기 (userType: 0은 oldpeople, 1은 guardian)
  const user = DUMMY_USERS.find(
    u => u.email === credentials.email && u.password === credentials.password
  );
  if (!user) {
    throw new Error('존재하지 않는 계정이거나 비밀번호가 틀렸습니다.');
  }

  if (typeof window !== 'undefined') {
    localStorage.setItem(`userType:${user.email}`, user.userType === 0 ? 'oldpeople' : 'guardian');
    const dummyToken = `dummy-token-for-${user.email}-${Date.now()}`;
    localStorage.setItem('token', dummyToken);
    localStorage.setItem('userType', user.userType === 0 ? '0' : '1');
    localStorage.setItem('userEmail', user.email);
  }
  return user;
};