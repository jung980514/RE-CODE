import React from "react";
import styles from './PolicyModal.module.css';

interface SensitivePolicyModalProps {
  open: boolean;
  onClose: () => void;
}

const SensitivePolicyModal: React.FC<SensitivePolicyModalProps> = ({ open, onClose }) => {
  if (!open) return null;
  return (
    <div
      style={{
        position: "fixed",
        top: 0, left: 0, right: 0, bottom: 0,
        background: "rgba(0,0,0,0.5)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
      }}
      onClick={onClose}
    >


      <div
        style={{
          background: "#fff",
          borderRadius: 18,
          padding: 32,
          minWidth: 420,
          maxWidth: 600,
          width: "90vw",
          minHeight: 500,
          maxHeight: "90vh",
          boxShadow: "0 4px 24px rgba(0,0,0,0.10)",
          position: "relative",
          display: "flex",
          flexDirection: "column",
          alignItems: "center"
        }}
        onClick={e => e.stopPropagation()}
      >
        <h2 style={{ fontWeight: 700, fontSize: 26, marginBottom: 24, textAlign: "center", letterSpacing: "-1px" }}>
          RE:CORD 민감정보 수집 및 이용동의서
        </h2>
        {/* 본문 카드 */}
        <div
          className={styles.policyCard}
        >

          <div style={{ fontSize: 22, lineHeight: 2.1, color: "#222", whiteSpace: "pre-line", fontWeight: 500 }}>
            <b>민감정보의 정의</b>{"\n"}
            개인정보보호법 제23조에 따른 민감정보는 사상·신념, 노동조합·정당의 가입·탈퇴, 정치적 견해, 건강, 성생활 등에 관한 정보, 그 밖에 정보주체의 사생활을 현저히 침해할 우려가 있는 개인정보를 말합니다.{"\n"}
            {"\n"}
            <b>수집하는 민감정보 항목</b>{"\n"}
            건강정보: 질병 이력, 복용 중인 약물, 알레르기 정보{"\n"}
            생체정보: 지문, 홍채, 음성인식 정보 (보안 인증용){"\n"}
            위치정보: GPS 기반 정확한 위치 데이터{"\n"}
            행동정보: 서비스 이용 패턴, 선호도 분석 데이터{"\n"}
            {"\n"}
            <b>민감정보 수집 및 이용목적</b>{"\n"}
            개인 맞춤형 헬스케어 서비스 제공{"\n"}
            생체인증을 통한 강화된 보안 서비스{"\n"}
            위치 기반 개인화 콘텐츠 추천{"\n"}
            사용자 행동 분석을 통한 서비스 개선{"\n"}
            응급상황 시 의료진에게 필요한 정보 제공{"\n"}
            {"\n"}
            <b>민감정보 처리 및 보관</b>{"\n"}
            수집된 민감정보는 별도의 암호화된 시스템에서 관리{"\n"}
            접근권한을 최소한의 담당자에게만 부여{"\n"}
            정기적인 보안 감사 및 취약점 점검 실시{"\n"}
            해외 서버 이전 시 사전 고지 및 동의 절차 진행{"\n"}
            {"\n"}
            <b>민감정보 보유 및 이용기간</b>{"\n"}
            서비스 이용 목적 달성 시까지{"\n"}
            회원 탈퇴 후 즉시 파기 (법적 보존의무 제외){"\n"}
            생체정보는 인증 목적 달성 후 즉시 삭제{"\n"}
            위치정보는 서비스 종료 후 6개월 이내 삭제{"\n"}
            {"\n"}
            <b>민감정보 제3자 제공</b>{"\n"}
            RE:CORD는 원칙적으로 민감정보를 제3자에게 제공하지 않습니다. 다만, 다음의 경우에는 예외로 합니다:{"\n"}
            법령에 의한 요구가 있는 경우{"\n"}
            생명이 위급한 응급상황에서 의료진에게 제공하는 경우{"\n"}
            사전에 별도 동의를 받은 경우{"\n"}
            {"\n"}
            <b>민감정보 처리 거부권 및 불이익</b>{"\n"}
            귀하는 민감정보 수집 및 이용에 대해 동의를 거부할 권리가 있습니다. 민감정보 처리에 동의하지 않으셔도 기본 서비스 이용은 가능하나, 다음 서비스는 제한될 수 있습니다:{"\n"}
            개인 맞춤형 건강 관리 서비스{"\n"}
            생체인증 기반 보안 서비스{"\n"}
            위치 기반 개인화 추천 서비스{"\n"}
            {"\n"}
            <b>민감정보 안전성 확보조치</b>{"\n"}
            기술적 조치: 민감정보 암호화, 접근통제 시스템, 침입차단 시스템{"\n"}
            관리적 조치: 개인정보 처리 담당자 지정, 정기적 교육, 접근권한 관리{"\n"}
            물리적 조치: 전용 서버실 운영, 출입통제, CCTV 설치{"\n"}
            {"\n"}
            <b>정보주체의 권리</b>{"\n"}
            민감정보 처리현황 통지 요구{"\n"}
            민감정보 열람 요구{"\n"}
            민감정보 정정·삭제 요구{"\n"}
            민감정보 처리정지 요구{"\n"}
            손해배상 청구
          </div>
        </div>
        {/* 닫기 버튼 */}
        <button
          style={{
            background: "#ff8345",
            color: "#fff",
            fontWeight: 700,
            fontSize: 22,
            border: "none",
            borderRadius: 12,
            padding: "14px 0",
            width: 220,
            margin: "0 auto",
            cursor: "pointer",
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
            display: "block"
          }}
          onClick={onClose}
        >
          닫기
        </button>
      </div>
    </div>
  );
};

export default SensitivePolicyModal; 