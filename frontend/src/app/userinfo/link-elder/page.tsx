"use client"

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Key, Clock, Copy, Check, X } from 'lucide-react';

export default function GuardianLinkPage() {
  const router = useRouter();
  
  // 연동 토큰 관련 상태
  const [generatedToken, setGeneratedToken] = useState<string>('');
  const [tokenExpiry, setTokenExpiry] = useState<number>(0);
  const [isTokenGenerated, setIsTokenGenerated] = useState(false);

  type LinkRequestItem = {
    guardianId: number;
    guardianName: string;
    guardianEmail: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED' | string;
    requestedAt: string;
  };

  // 대기중 연동 요청 목록
  const [pendingRequests, setPendingRequests] = useState<LinkRequestItem[]>([]);
  const [processingIds, setProcessingIds] = useState<number[]>([]);
  type LinkedGuardian = {
    guardianId: number;
    name: string;
    phone: string;
  };
  const [linkedGuardians, setLinkedGuardians] = useState<LinkedGuardian[]>([]);

  // 토큰 만료 시간 카운트다운
  useEffect(() => {
    if (tokenExpiry > 0) {
      const timer = setInterval(() => {
        setTokenExpiry((prev: number) => {
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

  // 토큰 생성 (실제 API 호출)
  const generateToken = async () => {
    try {
      const response = await fetch('https://recode-my-life.site/api/link/', {
        method: 'POST',
        credentials: 'include',
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error('Failed to generate link token');
      }

      const result = await response.json();
      const token: string | undefined = result?.data?.token;
      const expiresIn: number | undefined = result?.data?.expiresIn;

      if (!token || !expiresIn) {
        throw new Error('Invalid response shape');
      }

      setGeneratedToken(token);
      setTokenExpiry(expiresIn);
      setIsTokenGenerated(true);
    } catch (error) {
      alert('토큰 생성에 실패했습니다. 다시 시도해 주세요.');
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

  // 연동 요청 목록 불러오기
  const fetchPendingRequests = async () => {
    try {
      const response = await fetch('https://recode-my-life.site/api/link/list', {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch pending link requests');
      }

      const result = await response.json();
      const items: LinkRequestItem[] | undefined = result?.data;

      if (!Array.isArray(items)) {
        setPendingRequests([]);
        return;
      }

      // 서버에서 다양한 상태가 올 수 있으므로 PENDING만 표시
      const onlyPending = items.filter((item) => item.status === 'PENDING');
      setPendingRequests(onlyPending);
    } catch (error) {
      // 실패 시 빈 목록 처리
      setPendingRequests([]);
    }
  };

  // 연동된 보호자 목록 불러오기
  const fetchLinkedGuardians = async () => {
    try {
      const response = await fetch('https://recode-my-life.site/api/link/elder/list', {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store',
      });

      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        const errorMessage = result?.message ?? '연동된 보호자 목록 조회에 실패했습니다.';
        throw new Error(errorMessage);
      }

      const items: LinkedGuardian[] | undefined = result?.data;
      if (!Array.isArray(items)) {
        setLinkedGuardians([]);
        return;
      }

      setLinkedGuardians(items);
    } catch (error) {
      setLinkedGuardians([]);
    }
  };

  useEffect(() => {
    fetchPendingRequests();
    fetchLinkedGuardians();
  }, []);

  const respondLinkRequest = async (guardianId: number, approve: boolean) => {
    try {
      setProcessingIds((prev: number[]) => (prev.includes(guardianId) ? prev : [...prev, guardianId]));

      const response = await fetch('https://recode-my-life.site/api/link/res', {
        method: 'POST',
        credentials: 'include',
        cache: 'no-store',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guardianId, approve }),
      });

      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        const errorMessage = result?.message ?? '요청 처리에 실패했습니다.';
        throw new Error(errorMessage);
      }

      const message = result?.message ?? (approve ? '연동 요청이 승인되었습니다.' : '연동 요청이 거절되었습니다.');
      alert(message);
      setPendingRequests((prev: LinkRequestItem[]) => prev.filter((r: LinkRequestItem) => r.guardianId !== guardianId));
    } catch (error: unknown) {
      const fallback = approve ? '승인에 실패했습니다. 다시 시도해 주세요.' : '거절에 실패했습니다. 다시 시도해 주세요.';
      const msg = error instanceof Error ? error.message : fallback;
      alert(msg);
    } finally {
      setProcessingIds((prev: number[]) => prev.filter((id: number) => id !== guardianId));
    }
  };

  // 연동 요청 승인
  const approveRequest = (guardianId: number) => {
    respondLinkRequest(guardianId, true).then(() => {
      fetchLinkedGuardians();
    });
  };

  // 연동 요청 거절
  const rejectRequest = (guardianId: number) => {
    if (!confirm('정말로 이 연동 요청을 거절하시겠습니까?')) return;
    respondLinkRequest(guardianId, false);
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
           {pendingRequests.length > 0 ? (
             <div className="space-y-3">
               {pendingRequests.map((req: LinkRequestItem) => (
                 <div key={req.guardianId} className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                   <div className="flex items-center justify-between">
                     <div>
                       <div className="font-semibold text-gray-800 mb-1">
                         {req.guardianName}의 연동 요청
                       </div>
                       <div className="text-sm text-gray-500">
                         요청 시간: {new Date(req.requestedAt).toLocaleString('ko-KR')}
                       </div>
                       <div className="text-xs text-gray-400 mt-1">{req.guardianEmail}</div>
                     </div>
                     <div className="flex space-x-2">
                       <button
                         onClick={() => approveRequest(req.guardianId)}
                         disabled={processingIds.includes(req.guardianId)}
                         className={`flex items-center space-x-1 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 ${processingIds.includes(req.guardianId) ? 'opacity-50 cursor-not-allowed' : ''}`}
                       >
                         <Check size={16} />
                         <span>승인</span>
                       </button>
                       <button
                         onClick={() => rejectRequest(req.guardianId)}
                         disabled={processingIds.includes(req.guardianId)}
                         className={`flex items-center space-x-1 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 ${processingIds.includes(req.guardianId) ? 'opacity-50 cursor-not-allowed' : ''}`}
                       >
                         <X size={16} />
                         <span>거절</span>
                       </button>
                     </div>
                   </div>
                 </div>
               ))}
             </div>
           ) : (
             <div className="text-center py-8 text-gray-500">
               <p>대기 중인 연동 요청이 없습니다.</p>
             </div>
           )}
         </div>

        {/* 연동된 보호자 목록 섹션 */}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">연동된 보호자 목록</h3>
          
          {linkedGuardians.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>연동된 보호자가 없습니다.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {linkedGuardians.map((guardian: LinkedGuardian) => (
                <div key={guardian.guardianId} className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                        <span className="text-gray-600 font-semibold">
                          {guardian.name?.charAt(0) ?? ''}
                        </span>
                      </div>
                      <div>
                        <div className="font-semibold text-gray-800">{guardian.name}</div>
                        <div className="text-sm text-gray-500">{guardian.phone}</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="bg-green-100 text-green-700 px-3 py-1 rounded text-sm">
                        연동됨
                      </span>
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