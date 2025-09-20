'use client';

import React from 'react';
import Link from 'next/link';

const HeaderPublic = () => {
  return (
    <header className="fixed top-4 left-1/2 -translate-x-1/2 w-[95%] max-w-6xl z-50">
      <nav className="flex justify-between items-center w-full px-6 py-3 bg-black/20 backdrop-blur-lg border border-white/10 rounded-xl shadow-lg">
        
        {/* Logo and Home Link */}
        <Link href="/" className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600"></div>
          <span className="text-xl font-semibold text-white">
            Streamify
          </span>
        </Link>
        
        {/* Centered Navigation Links */}
        <div className="hidden md:flex items-center space-x-8">
          <Link href="/#features" className="text-sm text-gray-400 hover:text-white transition-colors duration-300">
            Features
          </Link>
          <Link href="/#pricing" className="text-sm text-gray-400 hover:text-white transition-colors duration-300">
            Pricing
          </Link>
          <Link href="/docs" className="text-sm text-gray-400 hover:text-white transition-colors duration-300">
            Documentation
          </Link>
        </div>
        
        {/* Action Buttons */}
        <div className="flex items-center space-x-4">
          <Link 
            href="/login" 
            className="text-sm text-gray-400 hover:text-white transition-colors duration-300 px-4 py-2"
          >
            Login
          </Link>
          <div className='relative p-[1px] rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg hover:shadow-purple-500/50 transition-shadow duration-300 transform hover:-translate-y-0.5'>
            <Link 
              href="/register"
              className="group relative flex items-center justify-center px-5 py-2 text-sm font-semibold text-white rounded-xl overflow-hidden
                         bg-black/80 hover:bg-transparent transition-all duration-300 ease-in-out
                         before:absolute before:inset-0 before:bg-gradient-to-r before:from-blue-500 before:to-purple-600 before:opacity-0 before:transition-opacity before:duration-300 before:ease-in-out group-hover:before:opacity-100"
            >
              <span className="relative z-10">Sign Up</span>
              {/* Optional: Add a subtle light beam effect on hover */}
              <span className="absolute inset-0 w-full h-full transform translate-x-[-100%] bg-white/20 blur-md group-hover:animate-beam"></span>
            </Link>
          </div>
        </div>
      </nav>
    </header>
  );
};

export default HeaderPublic;