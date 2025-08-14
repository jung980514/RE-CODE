"use client"

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Heart, Users, Link, Shield, Copy, Eye, Trash2, UserPlus, Check, X, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertModal, ConfirmModal } from '@/components/ui/modal';

export default function GuardianLinkPage() {
  const router = useRouter();
  
  // 사용자 역할 확인
  const [userRole, setUserRole] = useState<string>('');
  
  // 연동 토큰 관련 상태
  const [generatedToken, setGeneratedToken] = useState<string>('');
  const [tokenExpiry, setTokenExpiry] = useState<number>(0);
  const [isTokenGenerated, setIsTokenGenerated] = useState(false);

  // 모달 상태
  const [alertModal, setAlertModal] = useState<{
    isOpen: boolean;
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
  }>({
    isOpen: false,
    message: '',
    type: 'info'
  });

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    message: '',
    onConfirm: () => {}
  });

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

  // 사용자 역할 가져오기
  useEffect(() => {
    const role = localStorage.getItem('role');
    setUserRole(role || '');
  }, []);

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
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/link/`, {
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
      setAlertModal({
        isOpen: true,
        message: '토큰 생성에 실패했습니다. 다시 시도해 주세요.',
        type: 'error'
      });
      setIsTokenGenerated(false);
      setGeneratedToken('');
      setTokenExpiry(0);
    }
  };

  // 토큰 복사
  const copyToken = async () => {
    try {
      await navigator.clipboard.writeText(generatedToken);
      setAlertModal({
        isOpen: true,
        message: '토큰이 클립보드에 복사되었습니다.',
        type: 'success'
      });
    } catch (err) {
      setAlertModal({
        isOpen: true,
        message: '복사에 실패했습니다.',
        type: 'error'
      });
    }
  };

  // 연동 요청 목록 불러오기
  const fetchPendingRequests = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/link/list`, {
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
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/link/elder/list`, {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store',
      });

      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        const errorMessage = result?.message ?? '연동된 보호자 목록 조회에 실패했습니다.';
        throw new Error(errorMessage);
      }

      const list: Array<{ guardianId: number; name: string; phone?: string; phoneNumber?: string }> =
        Array.isArray(result?.data) ? result.data : [];
      const mapped: LinkedGuardian[] = list.map((item) => ({
        guardianId: item.guardianId,
        name: item.name,
        phone: item.phone ?? item.phoneNumber ?? '',
      }));
      setLinkedGuardians(mapped);
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
      setAlertModal({
        isOpen: true,
        message: message,
        type: 'success'
      });
      setPendingRequests((prev: LinkRequestItem[]) => prev.filter((r: LinkRequestItem) => r.guardianId !== guardianId));
    } catch (error: unknown) {
      const fallback = approve ? '승인에 실패했습니다. 다시 시도해 주세요.' : '거절에 실패했습니다. 다시 시도해 주세요.';
      const msg = error instanceof Error ? error.message : fallback;
      setAlertModal({
        isOpen: true,
        message: msg,
        type: 'error'
      });
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
    setConfirmModal({
      isOpen: true,
      message: '정말로 이 연동 요청을 거절하시겠습니까?',
      onConfirm: () => respondLinkRequest(guardianId, false)
    });
  };

  // 시간 포맷팅
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header with icon - consistent with profile page design */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
              <Heart className="w-6 h-6 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">보호자 연동 관리</h1>
          </div>
          <p className="text-lg text-gray-600">보호자와의 연동을 관리할 수 있습니다</p>
        </div>

        <div className="space-y-6">
          {/* 연동 토큰 생성 */}
          <Card className="shadow-sm border-0">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Link className="w-5 h-5 text-blue-600" />
                </div>
                <CardTitle className="text-xl">연동 토큰 생성</CardTitle>
              </div>
              <CardDescription className="text-base">보호자가 연동할 때 사용할 일회용 토큰을 생성합니다</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-base text-blue-800">
                  <strong>안내:</strong> 어르신께서 생성한 6자리 토큰을 정확히 입력해주세요. 토큰은 생성 후 10분간 유효합니다.
                </p>
              </div>
              
              {isTokenGenerated && (
                <>
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-base text-gray-600 mb-1">생성된 토큰:</div>
                        <div className="text-3xl font-bold text-orange-600 mb-2">{generatedToken}</div>
                        <div className="flex items-center gap-2 text-base">
                          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                          <span className="text-red-600 font-medium">토큰 만료까지: {formatTime(tokenExpiry)}</span>
                        </div>
                      </div>
                      <Button variant="outline" size="icon" onClick={copyToken}>
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </>
              )}

              <div className="flex items-center gap-6">
                <Button 
                  className="bg-orange-500 hover:bg-orange-600 text-white text-xl w-56 h-32 rounded-2xl flex flex-col items-center justify-center gap-4 shadow-md hover:shadow-lg transition-all duration-200" 
                  onClick={generateToken}
                >
                  <Link className="w-12 h-12" />
                  <span className="text-xl font-semibold">새 토큰 생성</span>
                </Button>
                
                <div className="flex-1">
                  <p className="text-lg text-gray-700 leading-relaxed">
                    <strong>새 토큰 생성</strong>을 클릭하면 토큰이 생성됩니다
                  </p>
                  <p className="text-base text-gray-500 mt-2">
                    생성된 토큰은 보호자에게 전달하여 연동 요청을 받을 수 있습니다
                  </p>
                </div>
              </div>

              {!isTokenGenerated && (
                <div className="text-center py-6">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Link className="w-6 h-6 text-gray-400" />
                  </div>
                  <p className="text-gray-500 text-sm">새 토큰을 생성하여 보호자 연동을 시작하세요</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 연동 요청 승인 */}
          <Card className="shadow-sm border-0">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                    <Shield className="w-5 h-5 text-amber-600" />
                  </div>
                  <CardTitle className="text-xl">연동 요청 승인</CardTitle>
                </div>
                <Badge variant="secondary" className="text-base">{pendingRequests.length}개 대기중</Badge>
              </div>
            </CardHeader>
            <CardContent>
              {pendingRequests.length > 0 ? (
                <div className="space-y-4">
                  {pendingRequests.map((req: LinkRequestItem) => (
                    <div key={req.guardianId} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                            <Users className="w-5 h-5 text-yellow-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{req.guardianName}의 연동 요청</p>
                            <p className="text-sm text-gray-500">요청 시간: {new Date(req.requestedAt).toLocaleString('ko-KR')}</p>
                            <p className="text-xs text-gray-400">{req.guardianEmail}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => approveRequest(req.guardianId)}
                            disabled={processingIds.includes(req.guardianId)}
                            className="bg-green-600 hover:bg-green-700 text-white"
                            size="sm"
                          >
                            <Check className="w-4 h-4 mr-1" />
                            승인
                          </Button>
                          <Button
                            onClick={() => rejectRequest(req.guardianId)}
                            disabled={processingIds.includes(req.guardianId)}
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:text-red-700 bg-transparent"
                          >
                            <X className="w-4 h-4 mr-1" />
                            거절
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Shield className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500 mb-2">대기 중인 연동 요청이 없습니다</p>
                  <p className="text-sm text-gray-400">새로운 요청이 있으면 여기에 표시됩니다</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 연동된 보호자 목록 */}
          <Card className="shadow-sm border-0">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Users className="w-5 h-5 text-purple-600" />
                  </div>
                  <CardTitle className="text-xl">연동된 보호자 목록</CardTitle>
                </div>
                <Badge variant="secondary" className="text-base">{linkedGuardians.length}명 연동됨</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {linkedGuardians.length > 0 ? (
                <>
                  {linkedGuardians.map((guardian: LinkedGuardian) => (
                    <div key={guardian.guardianId} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                            <Users className="w-5 h-5 text-green-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{guardian.name}</p>
                            <p className="text-sm text-gray-500">{guardian.phone}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {userRole !== 'ELDER' && (
                            <>
                              <Button variant="outline" size="sm">
                                <Eye className="w-4 h-4 mr-1" />
                                권한 보기
                              </Button>
                              <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 bg-transparent">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500 mb-2">연동된 보호자가 없습니다</p>
                  <p className="text-sm text-gray-400">토큰을 생성하여 보호자와 연동을 시작하세요</p>
                </div>
              )}

              {linkedGuardians.length > 0 && (
                <div className="pt-4 border-t">
                  <Button className="w-full bg-green-600 hover:bg-green-700 text-white">
                    <UserPlus className="w-4 h-4 mr-2" />새 보호자 초대하기
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 모달들 */}
      <AlertModal
        isOpen={alertModal.isOpen}
        onClose={() => setAlertModal(prev => ({ ...prev, isOpen: false }))}
        message={alertModal.message}
        type={alertModal.type}
      />

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        type="warning"
      />
    </div>
  );
} 