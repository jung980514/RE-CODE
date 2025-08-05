'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import styles from './FindAccountModal.module.css';
import { VirtualKeyboard } from '@/components/common/VirtualKeyboard';

interface FindAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const FindAccountModal: React.FC<FindAccountModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'findId' | 'resetPassword'>('findId');
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    id: '',
  });
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [activeInput, setActiveInput] = useState<'name' | 'phone' | 'id' | null>(
    null,
  );
  const mouseDownTargetRef = useRef<EventTarget | null>(null);

  const nameInputRef = useRef<HTMLInputElement>(null);
  const phoneInputRef = useRef<HTMLInputElement>(null);
  const idInputRef = useRef<HTMLInputElement>(null);

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
        setIsKeyboardVisible(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: API 연동
    console.log('Form submitted:', { type: activeTab, ...formData });
  };

  const handleTabChange = (tab: 'findId' | 'resetPassword') => {
    setActiveTab(tab);
    setFormData({
      name: '',
      phone: '',
      id: '',
    });
  };

  const handleToggleKeyboard = () => {
    setIsKeyboardVisible((prev) => !prev);
  };

  const focusActiveInput = () => {
    setTimeout(() => {
      let inputRef: React.RefObject<HTMLInputElement | null> = nameInputRef;
      if (activeInput === 'phone') {
        inputRef = phoneInputRef;
      } else if (activeInput === 'id') {
        inputRef = idInputRef;
      }

      if (inputRef?.current) {
        const inputElement = inputRef.current;
        inputElement.focus();
        const valueLength = inputElement.value.length;
        inputElement.setSelectionRange(valueLength, valueLength);
      }
    }, 0);
  };

  const handleVirtualKeyPress = (key: string, replaceLast = false) => {
    if (!activeInput) return;

    setFormData((prev) => {
      const currentVal = prev[activeInput];
      const newVal = replaceLast
        ? currentVal.slice(0, -1) + key
        : currentVal + key;
      return { ...prev, [activeInput]: newVal };
    });
    focusActiveInput();
  };

  const handleVirtualBackspace = () => {
    if (!activeInput) return;
    setFormData((prev) => ({
      ...prev,
      [activeInput]: prev[activeInput].slice(0, -1),
    }));
    focusActiveInput();
  };

  const handleVirtualSpace = () => {
    if (!activeInput) return;
    setFormData((prev) => ({ ...prev, [activeInput]: `${prev[activeInput]} ` }));
    focusActiveInput();
  };

  const handleVirtualEnter = () => {
    const fakeEvent = { preventDefault: () => {} } as React.FormEvent;
    handleSubmit(fakeEvent);
  };

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
        <div className={styles.header}>
          <button type="button" className={styles.keyboardButton} onClick={handleToggleKeyboard}>
            <Image
              src="/icons/keyboard_icon.png"
              alt="가상 키보드 열기/닫기"
              width={52}
              height={52}
            />
          </button>
          <h2 className={styles.title}>
            {activeTab === 'findId' ? '이메일 찾기' : '비밀번호 찾기'}
          </h2>
          <p className={styles.subtitle}>
            {activeTab === 'findId' ? '이메일을 찾으시나요?' : '비밀번호를 찾으시나요?'}
          </p>
          <p className={styles.description}>
            회원가입시 입력한 아래의 정보를 입력해주세요.
          </p>
        </div>

        <div className={styles.tabContainer}>
          <div className={styles.tabList}>
            <button
              className={`${styles.tab} ${activeTab === 'findId' ? styles.tabActive : ''}`}
              onClick={() => handleTabChange('findId')}
            >
              이메일 찾기
            </button>
            <button
              className={`${styles.tab} ${activeTab === 'resetPassword' ? styles.tabActive : ''}`}
              onClick={() => handleTabChange('resetPassword')}
            >
              비밀번호 재설정
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {activeTab === 'findId' ? (
            <div className={styles.inputGroup}>
              <label htmlFor="name" className={styles.label}>이름</label>
              <input
                ref={nameInputRef}
                type="text"
                id="name"
                className={styles.input}
                placeholder="이름을 입력하세요"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                onFocus={() => setActiveInput('name')}
                required
              />
            </div>
          ) : (
            <div className={styles.inputGroup}>
              <label htmlFor="id" className={styles.label}>이메일</label>
              <input
                ref={idInputRef}
                type="text"
                id="id"
                className={styles.input}
                placeholder="이메일을 입력하세요"
                value={formData.id}
                onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                onFocus={() => setActiveInput('id')}
                required
              />
            </div>
          )}

          <div className={styles.inputGroup}>
            <label htmlFor="phone" className={styles.label}>전화번호</label>
            <input
              ref={phoneInputRef}
              type="tel"
              id="phone"
              className={styles.input}
              placeholder="전화번호를 입력하세요"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              onFocus={() => setActiveInput('phone')}
              required
            />
          </div>

          <button type="submit" className={styles.confirmButton}>
            <span className={styles.buttonIcon}>→</span>
            확인
          </button>

          <div className={styles.divider}>
            <span className={styles.dividerText}>또는</span>
          </div>

          <button type="button" className={styles.cancelButton} onClick={onClose}>
            취소
          </button>
        </form>
        <VirtualKeyboard
          isVisible={isKeyboardVisible}
          onToggle={handleToggleKeyboard}
          onKeyPress={handleVirtualKeyPress}
          onBackspace={handleVirtualBackspace}
          onSpace={handleVirtualSpace}
          onEnter={handleVirtualEnter}
          currentInputValue={activeInput ? formData[activeInput] : ''}
        />
      </div>
    </div>
  );
};

export default FindAccountModal; 