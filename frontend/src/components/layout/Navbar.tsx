'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import styles from './Navbar.module.css';
import LoginModal from '../auth/LoginModal';
import SignupModal from '../auth/SignupModal';

const Navbar = () => {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isSignupModalOpen, setIsSignupModalOpen] = useState(false);

  return (
    <>
      <nav className={styles.navbar}>
        <div className={styles.container}>
          <div className={styles.logoContainer}>
            <Link href="/" className={styles.logoLink}>
              <Image
                src="/icons/logo.png"
                alt="RE:CORD Logo"
                width={410}
                height={78}
                priority
                className={styles.logo}
              />
              <span className={styles.logoText}>RE:CORD</span>
            </Link>
          </div>
          <div className={styles.authLinks}>
            <button 
              className={styles.authLink} 
              onClick={() => setIsLoginModalOpen(true)}
            >
              로그인
            </button>
            <button
              className={styles.authLink}
              onClick={() => setIsSignupModalOpen(true)}
            >
              회원가입
            </button>
          </div>
        </div>
        <div className={styles.bottomBar} />
      </nav>
      <LoginModal 
        isOpen={isLoginModalOpen} 
        onClose={() => setIsLoginModalOpen(false)} 
      />
      <SignupModal
        isOpen={isSignupModalOpen}
        onClose={() => setIsSignupModalOpen(false)}
      />
    </>
  );
};

export default Navbar;
