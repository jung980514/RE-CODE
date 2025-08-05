'use client';

import React, { useState, useEffect, useRef } from 'react';
import styles from './sign-up-success-modal.module.css';
import { BsCheckCircleFill } from 'react-icons/bs';

interface SignUpSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SignUpSuccessModal: React.FC<SignUpSuccessModalProps> = ({ isOpen, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const mouseDownTargetRef = useRef<EventTarget | null>(null);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsAnimating(true);
      }, 10);
      return () => clearTimeout(timer);
    } else {
      setIsAnimating(false);
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    mouseDownTargetRef.current = e.target;
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && mouseDownTargetRef.current === e.currentTarget) {
      onClose();
    }
    mouseDownTargetRef.current = null;
  };

  if (!isVisible) return null;

  return (
    <div
      className={`${styles.overlay} ${isAnimating ? styles.overlayOpen : styles.overlayClose}`}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
    >
      <div className={`${styles.modal} ${isAnimating ? styles.modalOpen : styles.modalClose}`}>
        <div className={styles.content}>
          <BsCheckCircleFill className={styles.successIcon} />
          <h2 className={styles.title}>회원가입 성공!</h2>
          <p className={styles.message}>
            회원가입이 성공적으로 완료되었습니다.
            <br />
            로그인 후 서비스를 이용해주세요.
          </p>
          <button onClick={onClose} className={styles.confirmButton}>
            확인
          </button>
        </div>
      </div>
    </div>
  );
};

export default SignUpSuccessModal;

