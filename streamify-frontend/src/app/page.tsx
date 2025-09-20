'use client';

import React, { useState } from 'react';
import HeaderPublic from '../components/Header2'; // Corrected import path
import InteractiveDemo from '../components/InteractiveDemo';
// Removed: import VisualTransition from '@/components/VisualTransition';

// --- ICON COMPONENTS ---
const ApiIcon = () => (
  <div className="w-14 h-14 bg-black/50 border border-white/10 rounded-full flex items-center justify-center">
    <svg className="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path></svg>
  </div>
);
const ScaleIcon = () => (
  <div className="w-14 h-14 bg-black/50 border border-white/10 rounded-full flex items-center justify-center">
    <svg className="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 0h-4m4 0l-5-5"></path></svg>
  </div>
);
const CloudIcon = () => (
  <div className="w-14 h-14 bg-black/50 border border-white/10 rounded-full flex items-center justify-center">
    <svg className="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z"></path></svg>
  </div>
);
// --- END ICON COMPONENTS ---

export default function LandingPage() {
  // State for the mouse-following glow for each card
  const [glowPosition1, setGlowPosition1] = useState({ x: 0, y: 0 });
  const [isHovering1, setIsHovering1] = useState(false);

  const [glowPosition2, setGlowPosition2] = useState({ x: 0, y: 0 });
  const [isHovering2, setIsHovering2] = useState(false);

  const [glowPosition3, setGlowPosition3] = useState({ x: 0, y: 0 });
  const [isHovering3, setIsHovering3] = useState(false);

  // Function to handle mouse movement for the glow effect
  const handleMouseMove = (
    e: React.MouseEvent<HTMLDivElement>,
    setGlow: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>,
    setIsHovering: React.Dispatch<React.SetStateAction<boolean>>
  ) => {
    setIsHovering(true);
    const target = e.currentTarget;
    const rect = target.getBoundingClientRect();
    setGlow({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const handleMouseLeave = (setIsHovering: React.Dispatch<React.SetStateAction<boolean>>) => {
    setIsHovering(false);
  };

  return (
    <div className="min-h-screen bg-black text-white relative">
      {/* Background gradient effect */}
      <div className="absolute inset-0 z-0 opacity-20" 
           style={{ 
             background: 'radial-gradient(circle at top, rgba(147, 51, 234, 0.15) 0%, transparent 40%), radial-gradient(circle at bottom, rgba(59, 130, 246, 0.15) 0%, transparent 40%)'
           }}>
      </div>
      
      {/* Main content */}
      <div className="relative z-10">
        <HeaderPublic />

        {/* Hero Section */}
        <section className="relative h-screen flex flex-col items-center justify-center text-center px-4 md:px-8 pt-20">
          <h1 className="text-5xl md:text-7xl font-bold leading-tight max-w-4xl bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600 animate-fade-in-up">
            Effortless Video Processing for Developers
          </h1>
          <p className="mt-6 text-lg md:text-xl text-gray-300 max-w-2xl animate-fade-in-up delay-200">
            Integrate powerful video capabilities into your applications with simple API calls.
          </p>
          <div className="mt-10 animate-fade-in-up delay-400">
            <a 
              href="/register"
              className="group relative flex items-center justify-center px-8 py-3 text-lg font-semibold text-white rounded-xl overflow-hidden
                         bg-gradient-to-r from-blue-500 to-purple-600 shadow-lg shadow-blue-500/30 hover:scale-105 active:scale-100 transition-all duration-300 ease-in-out"
            >
              Get Started Free
              <svg className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
            </a>
          </div>
        </section>

        {/* Removed: <VisualTransition /> */}

        {/* Features Section */}
        <section id="features" className="py-24 px-4 md:px-8">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold text-center text-white mb-16">
              Everything you need, nothing you don't.
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

              {/* Feature Card 1 (Small) */}
              <div className="relative p-px rounded-2xl bg-gradient-to-br from-white/20 to-transparent group"
                   onMouseMove={(e) => handleMouseMove(e, setGlowPosition1, setIsHovering1)}
                   onMouseLeave={() => handleMouseLeave(setIsHovering1)}>
                <div className="relative h-full bg-gradient-to-br from-black to-purple-500/30 backdrop-blur-md rounded-2xl p-8 transition-all duration-300 overflow-hidden"> 
                  {/* Mouse-following glow */}
                  <div 
                    className={`absolute inset-0 w-32 h-32 bg-purple-500/90 blur-3xl rounded-full transform -translate-x-1/2 -translate-y-1/2 transition-opacity duration-200 -z-10
                                ${isHovering1 ? 'opacity-100' : 'opacity-0'}`}
                    style={{ left: glowPosition1.x, top: glowPosition1.y }}
                  ></div>
                  <ApiIcon />
                  <h3 className="text-xl font-semibold text-white mt-6 mb-2">Developer-First API</h3>
                  <p className="text-gray-400 leading-relaxed">
                    A clean, simple REST API with comprehensive documentation.
                  </p>
                </div>
              </div>
              
              {/* Feature Card 2 (Small) */}
              <div className="relative p-px rounded-2xl bg-gradient-to-tl from-white/20 to-transparent group lg:col-span-2"
                   onMouseMove={(e) => handleMouseMove(e, setGlowPosition2, setIsHovering2)}
                   onMouseLeave={() => handleMouseLeave(setIsHovering2)}>
                <div className="relative h-full bg-gradient-to-tl from-black to-blue-500/30 backdrop-blur-md rounded-2xl p-8 transition-all duration-300 overflow-hidden">
                   {/* Mouse-following glow */}
                  <div 
                    className={`absolute inset-0 w-60 h-32 bg-blue-500/70 blur-3xl rounded-full transform -translate-x-1/2 -translate-y-1/2 transition-opacity duration-200 -z-10
                                ${isHovering2 ? 'opacity-100' : 'opacity-0'}`}
                    style={{ left: glowPosition2.x, top: glowPosition2.y }}
                  ></div>
                  <ScaleIcon />
                  <h3 className="text-xl font-semibold text-white mt-6 mb-2">Built for Scale</h3>
                  <p className="text-gray-400 leading-relaxed">
                    Our asynchronous, containerized architecture is designed to handle video processing jobs of any scale.
                  </p>
                </div>
              </div>

              {/* Feature Card 3 (Large) */}
              <div className="relative p-px rounded-2xl bg-gradient-to-br from-white/20 to-transparent group lg:col-span-3"
                   onMouseMove={(e) => handleMouseMove(e, setGlowPosition3, setIsHovering3)}
                   onMouseLeave={() => handleMouseLeave(setIsHovering3)}>
                <div className="relative h-full bg-black backdrop-blur-md rounded-2xl p-8 transition-all duration-300 flex flex-col md:flex-row items-center md:space-x-8 overflow-hidden">
                  {/* Mouse-following glow */}
                  <div 
                    className={`absolute inset-0 w-48 h-48 bg-gradient-to-br from-blue-500/20 to-purple-500/20 blur-3xl rounded-full transform -translate-x-1/2 -translate-y-1/2 transition-opacity duration-200 -z-10
                                ${isHovering3 ? 'opacity-100' : 'opacity-0'}`}
                    style={{ left: glowPosition3.x, top: glowPosition3.y }}
                  ></div>
                  <div className="flex-shrink-0 mb-6 md:mb-0">
                    <CloudIcon />
                  </div>
                  <div>
                    <h3 className="text-2xl font-semibold text-white mb-2">Cloud Native Storage & Delivery</h3>
                    <p className="text-gray-400 leading-relaxed mb-4">
                      All processed videos are securely stored on AWS S3 and delivered via a global CDN for optimal performance. You don't have to manage a single server.
                    </p>
                    <div className='bg-gradient-to-r from-blue-500/50 to-purple-600/50 inline-block p-[1px] rounded-full shadow-lg transition-shadow duration-300 transform hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-600 transition-colors ease-in-out'>
                      <a href="#" className="font-semibold bg-black/80 inline-block p-2 rounded-full">
                        Learn more
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Interactive Demo Section */}
        <section id="demo-section" className="py-20 px-4 md:px-8 flex justify-center items-center">
          <div className="w-full max-w-5xl">
            <InteractiveDemo />
          </div>
        </section>

        {/* Footer */}
        <footer className="py-10 text-center text-gray-500 text-sm">
          &copy; {new Date().getFullYear()} Streamify. All rights reserved.
        </footer>
      </div>
    </div>
  );
}