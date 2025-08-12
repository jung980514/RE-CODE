"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Link, Users, Send, Eye, X } from "lucide-react";

interface LinkedElder {
  id: number;
  name: string;
  email: string;
  phone: string;
}

export default function GuardianLinkPage() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [linkedElders, setLinkedElders] = useState<LinkedElder[]>([]);
  const [isLoadingLinked, setIsLoadingLinked] = useState<boolean>(false);
  const [linkedError, setLinkedError] = useState<string | null>(null);
  const [unlinkingId, setUnlinkingId] = useState<number | null>(null);

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
        const list: Array<{ id: number; name: string; phone: string; createdAt: string }> =
          Array.isArray(result?.data) ? result.data : [];
        const mapped: LinkedElder[] = list.map((item) => ({
          id: item.id,
          name: item.name,
          phone: item.phone,
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
      alert('토큰을 입력해주세요.');
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
      alert('연동 요청이 전송되었습니다. 어르신의 승인을 기다려주세요.');
      setToken('');
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : '연동 요청 전송에 실패했습니다.');
    }
  };

  const handleUnlink = async (id: number) => {
    const proceed = confirm('정말로 이 어르신과의 연동을 해제하시겠습니까?');
    if (!proceed) return;
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
      alert('연동이 해제되었습니다.');
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : '연동 해제 중 오류가 발생했습니다.');
    } finally {
      setUnlinkingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <main className="max-w-4xl mx-auto p-6 pt-8">
        {/* Page Title */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">보호자 연동 관리</h2>
          <p className="text-gray-600">어르신과의 연동을 관리할 수 있습니다</p>
        </div>

        {/* 연동 토큰 입력창 섹션 */}
        <div className="bg-white rounded-lg p-6 mb-6 shadow-sm">
          <div className="flex items-center space-x-2 mb-4">
            <Link size={20} className="text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-800">연동 토큰 입력창</h3>
          </div>
          <p className="text-gray-600 mb-4">
            어르신이 발급한 연동 토큰을 입력하여 연동을 요청하세요
          </p>
          
          <form onSubmit={handleTokenSubmit} className="mb-4">
            <div className="flex space-x-3">
              <input
                type="text"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="토큰을 입력하세요 (예: SXNPYS)"
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                maxLength={6}
              />
              <button
                type="submit"
                className="flex items-center space-x-2 bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-600"
              >
                <Send size={16} />
                <span>연동 요청</span>
              </button>
            </div>
          </form>

          {/* 안내 정보 */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-700">
              안내: 어르신께서 생성한 6자리 토큰을 정확히 입력해주세요. 토큰은 생성 후 10분간 유효합니다.
            </p>
          </div>
        </div>

        {/* 연동된 노인 목록 보기 섹션 */}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <div className="flex items-center space-x-2 mb-4">
            <Users size={20} className="text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-800">연동된 노인 목록 보기</h3>
          </div>
          <p className="text-gray-600 mb-6">
            연동 완료된 노인분들의 정보를 확인하고 관리할 수 있습니다
          </p>
          
          {isLoadingLinked ? (
            <div className="text-center py-8 text-gray-500">불러오는 중...</div>
          ) : linkedError ? (
            <div className="text-center py-8 text-red-600">{linkedError}</div>
          ) : linkedElders.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Users size={48} className="mx-auto mb-4 text-gray-300" />
              <p>연동된 어르신이 없습니다.</p>
              <p className="text-sm">위의 토큰 입력창을 통해 어르신과 연동해보세요.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {linkedElders.map((elder) => (
                <div key={elder.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                        <span className="text-gray-600 font-semibold">
                          {elder.name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="font-semibold text-gray-800">{elder.name}</h4>
                          <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs">연동됨</span>
                        </div>
                        <div className="space-y-1 text-sm text-gray-600">
                          <div>생년월일: {elder.birthDate}</div>
                          <div>연락처: {elder.phone}</div>
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleUnlink(elder.id)}
                        disabled={unlinkingId === elder.id}
                        className={`flex items-center space-x-1 px-3 py-2 rounded text-white ${unlinkingId === elder.id ? 'bg-red-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'}`}
                      >
                        <X size={14} />
                        <span className="text-sm">{unlinkingId === elder.id ? '처리중...' : '연동해제'}</span>
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