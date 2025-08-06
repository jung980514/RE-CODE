'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import styles from './page.module.css';
import LoginModal from '@/components/auth/LoginModal';
import MainPageGrid from "@/containers/mainpage/MainPageGrid"

export default function Home() {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const handleLoginSuccess = () => {
    setIsLoginModalOpen(false);
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add(styles.visible);
            observer.unobserve(entry.target); // 한 번만 애니메이션 실행
          }
        });
      },
      {
        threshold: 0.1, // 요소가 10% 보일 때 애니메이션 시작
      },
    );

    const elements = document.querySelectorAll(`.${styles.animateOnScroll}`);
    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return (
    <>
      <main className={styles.main}>
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <h1 className={`${styles.heroTitle} ${styles.animateOnScroll}`}>
            나의 아름드리나무였던<br />
            그 시절 그 모습 그대로<br />
            항상 건강하길 바라는 마음
          </h1>
          <p className={`${styles.heroSubtitle} ${styles.animateOnScroll}`}>지금 리:코드를 만나보세요!</p>
          <button
            className={`${styles.loginButton} ${styles.animateOnScroll}`}
            onClick={() => setIsLoginModalOpen(true)}
          >
            로그인
          </button>
        </div>
        <div className={styles.scrollIndicator}>
          <Image
            src="/icons/scroll.png"
            alt="Scroll down"
            width={96}
            height={66}
          />
        </div>
      </section>

      {/* Introduction Section */}
      <section className={styles.introduction}>
        <div className={styles.introductionContent}>
          <h2 className={`${styles.quote} ${styles.animateOnScroll}`}>
            &quot행복한 추억으로 오늘의 기억을 지켜주세요!&quot
          </h2>
          <p className={`${styles.description} ${styles.animateOnScroll}`}>
            RE:CORD는 사랑하는 사람들이 추억을 공유하며, 부모님・지인 등 소중한 분의 기억을 지켜주는 애플리케이션입니다.
            리:코드는 회상요법(Reminiscence Therapy)을 기반으로 한 웹 플랫폼으로 추억이 담긴 사진・영상・메시지 등을 공유함으로써, 잊혀진 기억을 되살려주도록 설계되었습니다.
            <br /><br />
            리:코드는 행복한 기억을 반복적으로 회상하게 해줌으로써, 기억력을 강화해주고 행복함을 느끼게 해줍니다. 기억력을 강화해주고 행복감을 느끼게 해줍니다. 부모님과 우리 가족의 행복, 리:코드로 지키세요.
          </p>
        </div>
      </section>

      {/* Necessity Section */}
      <section className={styles.necessity}>
        <h2 className={`${styles.sectionTitle} ${styles.animateOnScroll}`}>RE:CORD란?</h2>
        <p className={`${styles.necessityText} ${styles.animateOnScroll}`}>
          전 세계적으로 고령화가 심각한 사회문제로 떠오르고 있습니다. 이에 따라, 나이가 들면서 기억력 감소와 경도인지장애 등으로 고민하고 힘들어하시는 분들이 늘어나고 있습니다.
          <br /><br />
          우리가 건강하고 행복한 노후를 위해, 운동을 하는 것처럼 두뇌건강도 관리가 필요합니다. RE:CORD로 사랑하는 부모님의 두뇌건강을 지켜주세요.
        </p>
        <h3 className={`${styles.slogan} ${styles.animateOnScroll}`}>
          &quot두뇌건강, 노년의 행복이 되다!&quot
        </h3>
        < MainPageGrid />
      </section>
      
      {/* Therapy Section */}
      <section className={styles.therapy}>
        <h2 className={`${styles.sectionTitle} ${styles.animateOnScroll}`}>회상요법이란?</h2>
        <div className={styles.therapyContent}>
          <div className={`${styles.therapyText} ${styles.animateOnScroll}`}>
            나이가 들어갈수록 기억력은 자연스럽게 감퇴합니다. 하지만, 치매로 증상이 악화되지 않도록 두뇌건강을 잘 관리하고, 지키는 것이 매우 중요합니다.
            <br /><br />
            회상요법은 행복한 추억이 담긴 사진·편지·그림·음악 등을 통해 잊혀진 기억에 불씨를 지피고, 자연스럽게 과거의 추억을 회상할 수 있게 합니다.
            <br /><br />
            이런 회상 과정을 반복하면서 기억력이 강화되고, 기억을 오래오래 유지하게 해주는 치료법입니다.
            <br /><br />
            또한, 회상요법은 기억력 강화 뿐만 아니라, 감정해소와 정신건강에도 도움을 줍니다.
          </div>
          <div className={`${styles.therapyImage} ${styles.animateOnScroll}`}>
            <Image
              src="/images/reminiscence.jpg"
              alt="Reminiscence Therapy"
              width={600}
              height={595}
            />
          </div>
        </div>
        <h3 className={`${styles.slogan} ${styles.animateOnScroll}`}>
          &quot추억으로 기억의 불씨를 되살리다!&quot
        </h3>
      </section>
      </main>
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />
    </>
  );
}
