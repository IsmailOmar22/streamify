'use client';

import React, { useEffect } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children }) => {
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);

    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [onClose]);
  
  return (
    <>
      <div
        onClick={onClose}
        className={`
          fixed inset-0 bg-black/50 backdrop-blur-xs z-40
          transition-opacity duration-300 ease-in-out
          ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}
        `}
      ></div>
      <div
        className={`
          fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg p-4 z-50 origin-center
          transition-opacity transition-transform duration-300 ease-in-out
          ${isOpen ? 'transform opacity-100 scale-100' : 'transform opacity-0 scale-95 pointer-events-none'}
        `}
      >
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl">
          {children}
        </div>
      </div>
    </>
  );
};

export default Modal;