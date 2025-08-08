"use client"

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Key, Clock, Copy, Check, X } from 'lucide-react';

export default function GuardianLinkPage() {
  const router = useRouter();
  
  // 연동 토큰 관련 상태
  const [generatedToken, setGeneratedToken] = useState<string>('');
  const [tokenExpiry, setTokenExpiry] = useState<number>(0);
  const [isTokenGenerated, setIsTokenGenerated] = useState(false);

  // 연동 요청 대기 목록 상태
  interface PendingRequest {
    guardianId: number;
    guardianName: string;
    guardianEmail: string;
    status: string;
    requestedAt: string;
  }
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);
  const [isLoadingPending, setIsLoadingPending] = useState<boolean>(false);
  const [pendingError, setPendingError] = useState<string | null>(null);

  // 연동된 보호자 목록 상태
  interface LinkedGuardian {
    id: number;
    name: string;
    phone: string;
    createdAt: string;
  }
  const [linkedGuardians, setLinkedGuardians] = useState<LinkedGuardian[]>([]);
  const [isLoadingLinked, setIsLoadingLinked] = useState<boolean>(false);
  const [linkedError, setLinkedError] = useState<string | null>(null);

  // 페이지 로드 시 대기 중 연동 요청 목록 조회
  useEffect(() => {
    const fetchPendingRequests = async () => {
      try {
        setIsLoadingPending(true);
        setPendingError(null);
        const response = await fetch('https://recode-my-life.site/api/link/list', {
          method: 'GET',
          credentials: 'include',
        });
        if (!response.ok) {
          throw new Error('연동 요청 목록을 가져오지 못했습니다.');
        }
        const result = await response.json();
        const list: PendingRequest[] = Array.isArray(result?.data) ? result.data : [];
        setPendingRequests(list);
      } catch (error) {
        console.error(error);
        setPendingError('연동 요청 목록을 불러오는 중 오류가 발생했습니다.');
      } finally {
        setIsLoadingPending(false);
      }
    };
    fetchPendingRequests();
  }, []);

  // 페이지 로드 시 연동된 보호자 목록 조회
  useEffect(() => {
    const fetchLinkedGuardians = async () => {
      try {
        setIsLoadingLinked(true);
        setLinkedError(null);
        const response = await fetch('https://recode-my-life.site/api/link/elder/list', {
          method: 'GET',
          credentials: 'include',
        });
        if (!response.ok) {
          throw new Error('연동된 보호자 목록을 가져오지 못했습니다.');
        }
        const result = await response.json();
        const list: LinkedGuardian[] = Array.isArray(result?.data) ? result.data : [];
        setLinkedGuardians(list);
      } catch (error) {
        console.error(error);
        setLinkedError('연동된 보호자 목록을 불러오는 중 오류가 발생했습니다.');
      } finally {
        setIsLoadingLinked(false);
      }
    };
    fetchLinkedGuardians();
  }, []);

  // 토큰 만료 시간 카운트다운
  useEffect(() => {
    if (tokenExpiry > 0) {
      const timer = setInterval(() => {
        setTokenExpiry(prev => {
          if (prev <= 1) {
            setIsTokenGenerated(false);
            setGeneratedToken('');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [tokenExpiry]);

  const handleBack = () => {
    router.back();
  };

  // 토큰 생성
  const generateToken = async () => {
    try {
      const response = await fetch('https://recode-my-life.site/api/link', {
        method: 'POST',
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to generate token');
      }
      const result = await response.json();
      const token: string | undefined = result?.data?.token;
      const expiresIn: number | undefined = result?.data?.expiresIn;
      if (!token) {
        throw new Error('Invalid response');
      }
      setGeneratedToken(token);
      setTokenExpiry(Number(expiresIn) || 600); // 서버 제공 만료 시간 사용, 기본 10분
      setIsTokenGenerated(true);
    } catch (error) {
      console.error(error);
      alert('토큰 생성에 실패했습니다. 잠시 후 다시 시도해주세요.');
      setIsTokenGenerated(false);
      setGeneratedToken('');
      setTokenExpiry(0);
    }
  };

  // 토큰 복사
  const copyToken = async () => {
    try {
      await navigator.clipboard.writeText(generatedToken);
      alert('토큰이 클립보드에 복사되었습니다.');
    } catch (err) {
      alert('복사에 실패했습니다.');
    }
  };

  // 연동 요청 응답 공통 처리
  const respondToRequest = async (guardianId: number, approve: boolean) => {
    try {
      const response = await fetch('https://recode-my-life.site/api/link/res', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ guardianId, approve }),
      });
      if (!response.ok) {
        let message = '요청 처리에 실패했습니다.';
        try {
          const err = await response.json();
          message = err?.message || message;
        } catch (_) {}
        throw new Error(message);
      }
      setPendingRequests(prev => prev.filter(r => r.guardianId !== guardianId));
      alert(approve ? '연동 요청이 승인되었습니다.' : '연동 요청이 거절되었습니다.');
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : '요청 처리 중 오류가 발생했습니다.');
    }
  };

  // 연동 요청 승인
  const approveRequest = (guardianId: number) => {
    respondToRequest(guardianId, true);
  };

  // 연동 요청 거절
  const rejectRequest = (guardianId: number) => {
    if (confirm('정말로 이 연동 요청을 거절하시겠습니까?')) {
      respondToRequest(guardianId, false);
    }
  };

  // 보호자 연동 해제
  const unlinkGuardian = (id: number) => {
    if (confirm('정말로 이 보호자와의 연동을 해제하시겠습니까?')) {
      setLinkedGuardians(linkedGuardians.filter(g => g.id !== id));
      alert('보호자 연동이 해제되었습니다.');
    }
  };

  // 시간 포맷팅
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

     return (
     <div className="min-h-screen bg-gray-50">
       {/* Main Content */}
       <main className="max-w-4xl mx-auto p-6 pt-8">
        {/* Page Title */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">보호자 연동 관리</h2>
          <p className="text-gray-600">보호자와의 연동을 관리할 수 있습니다</p>
        </div>

        {/* 연동 토큰 생성 섹션 */}
        <div className="bg-white rounded-lg p-6 mb-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Key size={20} className="text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-800">연동 토큰 생성</h3>
            </div>
            <button
              onClick={generateToken}
              className="bg-orange-500 text-white px-4 py-2 rounded-md hover:bg-orange-600"
            >
              토큰 생성
            </button>
          </div>
          <p className="text-gray-600 mb-4">보호자가 연동할 때 사용할 일회용 토큰을 생성합니다</p>
          
          {isTokenGenerated && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-600 mb-1">생성된 토큰:</div>
                  <div className="text-2xl font-bold text-orange-600 mb-2">{generatedToken}</div>
                  <div className="flex items-center space-x-1 text-gray-500">
                    <Clock size={14} />
                    <span>남은 시간: {formatTime(tokenExpiry)}</span>
                  </div>
                </div>
                <button
                  onClick={copyToken}
                  className="flex items-center space-x-1 bg-gray-200 text-gray-700 px-3 py-1 rounded hover:bg-gray-300"
                >
                  <Copy size={14} />
                  <span>복사</span>
                </button>
              </div>
            </div>
          )}
        </div>

         {/* 연동 요청 승인 섹션 */}
         <div className="bg-white rounded-lg p-6 mb-6 shadow-sm">
           <h3 className="text-lg font-semibold text-gray-800 mb-4">연동 요청 승인</h3>
           {isLoadingPending ? (
             <div className="text-center py-8 text-gray-500">불러오는 중...</div>
           ) : pendingError ? (
             <div className="text-center py-8 text-red-600">{pendingError}</div>
           ) : pendingRequests.length === 0 ? (
             <div className="text-center py-8 text-gray-500">대기 중인 연동 요청이 없습니다.</div>
           ) : (
             <div className="space-y-3">
               {pendingRequests.map((req) => (
                 <div key={req.guardianId} className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                   <div className="flex items-center justify-between">
                     <div>
                       <div className="font-semibold text-gray-800 mb-1">{req.guardianName}의 연동 요청</div>
                       <div className="text-sm text-gray-500">이메일: {req.guardianEmail}</div>
                       <div className="text-sm text-gray-500">요청 시간: {req.requestedAt}</div>
                     </div>
                     <div className="flex space-x-2">
                       <button
                         onClick={() => approveRequest(req.guardianId)}
                         className="flex items-center space-x-1 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                       >
                         <Check size={16} />
                         <span>승인</span>
                       </button>
                       <button
                         onClick={() => rejectRequest(req.guardianId)}
                         className="flex items-center space-x-1 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                       >
                         <X size={16} />
                         <span>거절</span>
                       </button>
                     </div>
                   </div>
                 </div>
               ))}
             </div>
           )}
         </div>

        {/* 연동된 보호자 목록 섹션 */}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">연동된 보호자 목록</h3>
          {isLoadingLinked ? (
            <div className="text-center py-8 text-gray-500">불러오는 중...</div>
          ) : linkedError ? (
            <div className="text-center py-8 text-red-600">{linkedError}</div>
          ) : linkedGuardians.length === 0 ? (
            <div className="text-center py-8 text-gray-500">연동된 보호자가 없습니다.</div>
          ) : (
            <div className="space-y-4">
              {linkedGuardians.map((guardian) => (
                <div key={guardian.id} className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                        <span className="text-gray-600 font-semibold">
                          {guardian.name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <div className="font-semibold text-gray-800">{guardian.name}</div>
                        <div className="text-sm text-gray-500">{guardian.phone}</div>
                        <div className="text-sm text-gray-500">연동일: {guardian.createdAt}</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="bg-green-100 text-green-700 px-3 py-1 rounded text-sm">연동됨</span>
                      <button
                        onClick={() => unlinkGuardian(guardian.id)}
                        className="flex items-center space-x-1 text-red-600 hover:text-red-700"
                      >
                        <X size={16} />
                        <span className="text-sm">해제</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
} 