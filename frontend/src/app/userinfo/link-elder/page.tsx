"use client"

import React, { useState, useEffect } from 'react';
import { dummyLinkedGuardians, dummyPendingGuardianRequest } from '../../../../dummy-data/DummyGuardianLinks';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Key, Clock, Copy, Check, X } from 'lucide-react';

export default function GuardianLinkPage() {
  const router = useRouter();
  
  // 연동 토큰 관련 상태
  const [generatedToken, setGeneratedToken] = useState<string>('');
  const [tokenExpiry, setTokenExpiry] = useState<number>(0);
  const [isTokenGenerated, setIsTokenGenerated] = useState(false);

  // 더미 데이터로 초기화
  const [pendingRequest, setPendingRequest] = useState<typeof dummyPendingGuardianRequest | null>(dummyPendingGuardianRequest);
  const [linkedGuardians, setLinkedGuardians] = useState([...dummyLinkedGuardians]);

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
  const generateToken = () => {
    const token = Math.random().toString(36).substring(2, 8).toUpperCase();
    setGeneratedToken(token);
    setTokenExpiry(600); // 10분
    setIsTokenGenerated(true);
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

  // 연동 요청 승인
  const approveRequest = () => {
    alert('연동 요청이 승인되었습니다.');
    setPendingRequest(null);
  };

  // 연동 요청 거절
  const rejectRequest = () => {
    if (confirm('정말로 이 연동 요청을 거절하시겠습니까?')) {
      alert('연동 요청이 거절되었습니다.');
      setPendingRequest(null);
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
           {pendingRequest ? (
             <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
               <div className="flex items-center justify-between">
                 <div>
                   <div className="font-semibold text-gray-800 mb-1">
                     {pendingRequest.name}의 연동 요청
                   </div>
                   <div className="text-sm text-gray-500">
                     요청 시간: {pendingRequest.requestTime}
                   </div>
                 </div>
                 <div className="flex space-x-2">
                   <button
                     onClick={approveRequest}
                     className="flex items-center space-x-1 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                   >
                     <Check size={16} />
                     <span>승인</span>
                   </button>
                   <button
                     onClick={rejectRequest}
                     className="flex items-center space-x-1 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                   >
                     <X size={16} />
                     <span>거절</span>
                   </button>
                 </div>
               </div>
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
                        <div className="text-sm text-gray-500">연동일: {guardian.linkDate}</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="bg-green-100 text-green-700 px-3 py-1 rounded text-sm">
                        연동됨
                      </span>
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