// 더미 보호자 연동 데이터
export const dummyLinkedGuardians = [
  {
    id: 1,
    name: '이보호',
    phone: '010-9876-5432',
    linkDate: '2024-01-10',
    isLinked: true
  },
  {
    id: 2,
    name: '박보호',
    phone: '010-5555-1234',
    linkDate: '2024-01-08',
    isLinked: true
  }
];

export const dummyPendingGuardianRequest = {
  id: 1,
  name: '김보호님',
  requestTime: '2024-01-15 14:30'
};

// 더미 보호자 연동 해제, 승인, 거절 등은 함수로 분리 가능
