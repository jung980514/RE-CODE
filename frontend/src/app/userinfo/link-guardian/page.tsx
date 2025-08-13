"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Heart, Users, Link, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertModal, ConfirmModal } from "@/components/ui/modal";

interface LinkedElder {
  id: number;
  name: string;
  phone: string;
  birthDate?: string;
  email?: string;
}

export default function GuardianLinkPage() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [linkedElders, setLinkedElders] = useState<LinkedElder[]>([]);
  const [isLoadingLinked, setIsLoadingLinked] = useState<boolean>(false);
  const [linkedError, setLinkedError] = useState<string | null>(null);
  const [unlinkingId, setUnlinkingId] = useState<number | null>(null);

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

  useEffect(() => {
    const fetchLinkedElders = async () => {
      try {
        setIsLoadingLinked(true);
        setLinkedError(null);
        const response = await fetch("https://recode-my-life.site/api/link/guardian/list", {
          method: "GET",
          credentials: "include",
        });
        if (!response.ok) {
          throw new Error("연동된 노인 목록을 가져오지 못했습니다.");
        }
        const result = await response.json();
        const list: Array<{ id: number; name: string; phone?: string; birthDate?: string; createdAt?: string; email?: string }> =
          Array.isArray(result?.data) ? result.data : [];
        const mapped: LinkedElder[] = list.map((item) => ({
          id: item.id,
          name: item.name,
          phone: item.phone ?? '',
          birthDate: item.birthDate,
          email: item.email,
        }));
        setLinkedElders(mapped);
      } catch (error) {
        console.error(error);
        setLinkedError("연동된 노인 목록을 불러오는 중 오류가 발생했습니다.");
      } finally {
        setIsLoadingLinked(false);
      }
    };
    fetchLinkedElders();
  }, []);

  const handleTokenSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = token.trim();
    if (!trimmed) {
      setAlertModal({
        isOpen: true,
        message: '토큰을 입력해주세요.',
        type: 'warning'
      });
      return;
    }
    try {
      const response = await fetch('https://recode-my-life.site/api/link/req', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: trimmed }),
      });
      if (!response.ok) {
        let message = '연동 요청 전송에 실패했습니다.';
        try {
          const err = await response.json();
          message = err?.message || message;
        } catch (_) {}
        throw new Error(message);
      }
      setAlertModal({
        isOpen: true,
        message: '연동 요청이 전송되었습니다. 어르신의 승인을 기다려주세요.',
        type: 'success'
      });
      setToken('');
    } catch (error) {
      console.error(error);
      setAlertModal({
        isOpen: true,
        message: error instanceof Error ? error.message : '연동 요청 전송에 실패했습니다.',
        type: 'error'
      });
    }
  };

  const handleUnlink = async (id: number) => {
    setConfirmModal({
      isOpen: true,
      message: '정말로 이 어르신과의 연동을 해제하시겠습니까?',
      onConfirm: async () => {
        try {
          setUnlinkingId(id);
          const response = await fetch('https://recode-my-life.site/api/link/unlink', {
            method: 'DELETE',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ targetUserId: id }),
          });
          if (!response.ok) {
            let message = '연동 해제에 실패했습니다.';
            try {
              const err = await response.json();
              message = err?.message || message;
            } catch (_) {}
            throw new Error(message);
          }
          setLinkedElders(prev => prev.filter(elder => elder.id !== id));
          setAlertModal({
            isOpen: true,
            message: '연동이 해제되었습니다.',
            type: 'success'
          });
        } catch (error) {
          console.error(error);
          setAlertModal({
            isOpen: true,
            message: error instanceof Error ? error.message : '연동 해제 중 오류가 발생했습니다.',
            type: 'error'
          });
        } finally {
          setUnlinkingId(null);
        }
      }
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header with icon - consistent with profile page design */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <Heart className="w-6 h-6 text-blue-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">보호자 연동 관리</h1>
          </div>
          <p className="text-lg text-gray-600">어르신과의 연동을 관리할 수 있습니다</p>
        </div>

        <div className="space-y-6">
          {/* 연동 토큰 입력창 */}
          <Card className="shadow-sm border-0">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <Link className="w-5 h-5 text-green-600" />
                </div>
                <CardTitle className="text-xl">연동 토큰 입력창</CardTitle>
              </div>
              <CardDescription className="text-base">어르신이 발급한 연동 토큰을 입력하여 연동을 요청하세요</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={handleTokenSubmit}>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    placeholder="토큰을 입력하세요 (예: SXNPYS)"
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
                    maxLength={6}
                  />
                  <Button
                    type="submit"
                    className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 h-auto"
                    size="lg"
                  >
                    <Send className="w-5 h-5 mr-2" />
                    연동 요청
                  </Button>
                </div>
              </form>

              {/* 안내 정보 */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-base text-blue-700">
                  <strong>안내:</strong> 어르신께서 생성한 6자리 토큰을 정확히 입력해주세요. 토큰은 생성 후 10분간 유효합니다.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* 연동된 노인 목록 보기 */}
          <Card className="shadow-sm border-0">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Users className="w-5 h-5 text-purple-600" />
                  </div>
                  <CardTitle className="text-xl">연동된 노인 목록 보기</CardTitle>
                </div>
                <Badge variant="secondary" className="text-base">{linkedElders.length}명 연동됨</Badge>
              </div>
              <CardDescription className="text-base">연동 완료된 노인분들의 정보를 확인하고 관리할 수 있습니다</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingLinked ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500">불러오는 중...</p>
                </div>
              ) : linkedError ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <X className="w-8 h-8 text-red-400" />
                  </div>
                  <p className="text-red-600">{linkedError}</p>
                </div>
              ) : linkedElders.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500 mb-2">연동된 어르신이 없습니다</p>
                  <p className="text-sm text-gray-400">위의 토큰 입력창을 통해 어르신과 연동해보세요</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {linkedElders.map((elder) => (
                    <div key={elder.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                            <Users className="w-5 h-5 text-green-600" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium text-gray-900">{elder.name}</h4>
                              <Badge variant="secondary" className="bg-green-100 text-green-700">연동됨</Badge>
                            </div>
                            <div className="space-y-1 text-sm text-gray-600">
                              <div>생년월일: {elder.birthDate}</div>
                              <div>연락처: {elder.phone}</div>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleUnlink(elder.id)}
                            disabled={unlinkingId === elder.id}
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:text-red-700 bg-transparent"
                          >
                            <X className="w-4 h-4 mr-1" />
                            {unlinkingId === elder.id ? '처리중...' : '연동해제'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
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