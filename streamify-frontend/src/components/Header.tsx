'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation'; // ADDED: Import useRouter

const Header = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter(); // ADDED: Initialize the router

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDropdownOpen]);

  // ADDED: Function to handle the logout action
  const handleLogout = () => {
    localStorage.removeItem('token'); // Clear the session token
    router.push('/login'); // Redirect to the login page
  };

  return (
    <>
      <header className="fixed top-4 left-1/2 -translate-x-1/2 w-[95%] max-w-4xl z-50">
        <nav className="flex justify-between items-center w-full px-6 py-3 bg-black/20 backdrop-blur-lg border border-white/10 rounded-xl shadow-lg">
          
          <Link href="/dashboard" className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600"></div>
            <span className="text-xl font-semibold text-white">
              Streamify
            </span>
          </Link>
          <div className="flex items-center space-x-6">
            <Link 
              href="/docs" 
              className="text-sm text-gray-400 hover:text-white transition-colors duration-300"
            >
              Documentation
            </Link>
            <div className="relative" ref={dropdownRef}>
              <div className="p-[2px] rounded-full bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg hover:shadow-none shadow-purple-500/50 transition-shadow duration-300 ">
                <button 
                  type="button"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="cursor-pointer w-9 h-9 rounded-full flex items-center justify-center bg-black transition-all duration-300 focus:outline-none"
                  aria-label="User menu"
                >
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className="h-5 w-5 text-gray-300" 
                    viewBox="0 0 20 20" 
                    fill="currentColor"
                  >
                    <path 
                      fillRule="evenodd" 
                      d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" 
                      clipRule="evenodd" 
                    />
                  </svg>
                </button>
              </div>
              <div 
                className={`absolute top-full right-0 mt-6 w-48 origin-top-right transition-all duration-300 ease-in-out
                  ${isDropdownOpen ? 'transform opacity-100 scale-100' : 'transform opacity-0 scale-95 pointer-events-none'}`}
              >
                <div className="p-2 bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl shadow-2xl">
                  <Link href="/keys" className="flex items-center w-full px-3 py-2 text-sm text-gray-300 hover:bg-black/10 hover:text-white rounded-md transition-colors">
                    <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7h1a2 2 0 012 2v5a2 2 0 01-2 2h-1m-6 0H6a2 2 0 01-2-2V9a2 2 0 012-2h1m3 0V5a2 2 0 00-2-2h-1a2 2 0 00-2 2v2m0 0h1"></path></svg>
                    API Keys
                  </Link>
                  {/* EDITED: Added the onClick handler to the button */}
                  <button 
                    onClick={handleLogout}
                    className="flex items-center w-full px-3 py-2 text-sm text-red-400 hover:bg-red-500/20 hover:text-red-300 rounded-md transition-colors"
                  >
                    <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
                    Logout
                  </button>
                </div>
              </div>
            </div>
          </div>
        </nav>
      </header>
      <div 
        className={`fixed inset-0 bg-black/20 backdrop-blur-xs z-40 transition-opacity duration-300
          ${isDropdownOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsDropdownOpen(false)}
      ></div>
    </>
  );
};

export default Header;