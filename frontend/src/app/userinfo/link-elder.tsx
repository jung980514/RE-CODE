"use client";
import React, { useState } from "react";
import Navbar from "@/components/layout/Navbar";

export default function GuardianLinkPage() {
  // 더미 데이터
  const [token, setToken] = useState("SXNPYS");
  const [timeLeft, setTimeLeft] = useState("9:40");
  const [requests, setRequests] = useState([
    { name: "김보호님", time: "2024-01-15 14:30" }
  ]);
  const [linkedGuardians, setLinkedGuardians] = useState([
    { name: "이보호", phone: "010-9876-5432", date: "2024-01-10" },
    { name: "박보호", phone: "010-5555-1234", date: "2024-01-08" }
  ]);

  return (
    <>
      <Navbar />
      <div className="max-w-2xl mx-auto p-8">
        <h1 className="text-xl font-bold mb-2">보호자 연동 관리</h1>
        <p className="text-gray-600 mb-6">보호자와의 연동을 관리할 수 있습니다.</p>

        {/* 토큰 생성 */}
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold text-gray-700">생성된 토큰:</span>
            <button className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600">토큰 생성</button>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-3xl font-bold text-orange-500 tracking-widest">{token}</span>
            <button className="bg-gray-100 px-3 py-1 rounded border border-gray-300 text-gray-700 ml-2">복사</button>
          </div>
          <div className="flex items-center mt-2 text-sm text-gray-500">
            <span className="mr-2">🕒 남은 시간:</span>
            <span className="text-green-600 font-bold">{timeLeft}</span>
          </div>
        </div>

        {/* 연동 요청 승인 */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
          <div className="font-semibold mb-2">연동 요청 승인</div>
          {requests.map((req, idx) => (
            <div key={idx} className="flex items-center justify-between bg-yellow-100 rounded p-3 mb-2">
              <div>
                <span className="font-bold">{req.name} 연동 요청</span>
                <div className="text-xs text-gray-600">요청 시간: {req.time}</div>
              </div>
              <div className="flex space-x-2">
                <button className="bg-green-500 text-white px-4 py-1 rounded hover:bg-green-600">승인</button>
                <button className="bg-red-400 text-white px-4 py-1 rounded hover:bg-red-500">거절</button>
              </div>
            </div>
          ))}
        </div>

        {/* 연동된 보호자 목록 */}
        <div className="mb-6">
          <div className="font-semibold mb-2">연동된 보호자 목록</div>
          {linkedGuardians.map((g, idx) => (
            <div key={idx} className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-xl p-4 mb-3">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center mr-4 text-lg font-bold text-gray-700">
                  {g.name[0]}
                </div>
                <div>
                  <div className="font-bold text-gray-800">{g.name}</div>
                  <div className="text-sm text-gray-600">{g.phone}</div>
                  <div className="text-xs text-gray-400">연동일: {g.date}</div>
                </div>
              </div>
              <div className="flex flex-col items-end space-y-2">
                <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs mb-1">연동됨</span>
                <button className="bg-red-100 text-red-600 px-3 py-1 rounded hover:bg-red-200 text-xs">해제</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
