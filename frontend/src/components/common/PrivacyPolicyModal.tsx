import React from "react";
import styles from './PolicyModal.module.css';

interface PrivacyPolicyModalProps {
  open: boolean;
  onClose: () => void;
}

const PrivacyPolicyModal: React.FC<PrivacyPolicyModalProps> = ({ open, onClose }) => {
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
        {/* 본문 카드 */}
        <h2 style={{ fontWeight: 700, fontSize: 26, marginBottom: 24, textAlign: "center", letterSpacing: "-1px" }}>
            RE:CODE 개인정보 수집 및 이용동의서
          </h2>
        
        <div className={styles.policyCard}
        >

          <div style={{ fontSize: 22, lineHeight: 2.1, color: "#222", whiteSpace: "pre-line", fontWeight: 500 }}>
            <b>수집하는 개인정보 항목</b>{"\n"}
            - 필수항목: 이름, 이메일 주소, 비밀번호, 생년월일, 연락처{"\n"}
            - 선택항목: 프로필 사진, 거주지, 관심 분야{"\n"}
            {"\n"}
            <b>개인정보 수집 및 이용목적</b>{"\n"}
            - 회원가입 및 회원관리{"\n"}
            - 서비스 제공 및 이용자 인증{"\n"}
            - 공지사항 전달 및 고객지원{"\n"}
            - 서비스 개선을 위한 통계분석{"\n"}
            - 맞춤형 콘텐츠 제공{"\n"}
            {"\n"}
            <b>개인정보 보유 및 이용기간</b>{"\n"}
            - 회원 탈퇴 시까지{"\n"}
            - 관련 법령에 의한 보존의무가 있는 경우 해당 기간까지 보존{"\n"}
            - 탈퇴 후 즉시 또는 지체 없이 파기{"\n"}
            {"\n"}
            <b>개인정보 제공 동의 거부권</b>{"\n"}
            귀하는 개인정보 수집 및 이용에 대한 동의를 거부할 권리가 있습니다. 다만, 필수항목에 대한 동의를 거부하실 경우 서비스 이용이 제한될 수 있습니다.{"\n"}
            {"\n"}
            <b>개인정보 처리 위탁</b>{"\n"}
            RE:CODE는 서비스 향상을 위해 개인정보 처리업무를 외부 전문업체에 위탁할 수 있으며, 이 경우 위탁 업체, 위탁 업무 내용은 사전에 고지하고 동의를 받겠습니다.{"\n"}
            {"\n"}
            <b>개인정보 안전성 확보조치</b>{"\n"}
            - 개인정보는 암호화 저장{"\n"}
            - 접근권한 관리 및 접근통제 시스템 운영{"\n"}
            - 개인정보 처리 시스템 접근기록 보관{"\n"}
            - 정기적인 보안점검 실시{"\n"}
            {"\n"}
            <b>개인정보 열람, 정정·삭제, 처리정지 요구</b>{"\n"}
            귀하는 언제든지 등록되어 있는 개인정보에 대해 열람, 정정·삭제, 처리정지를 요구할 수 있으며, 해당 요구사항은 지체 없이 처리됩니다.
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

export default PrivacyPolicyModal; 