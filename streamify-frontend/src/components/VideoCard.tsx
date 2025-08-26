'use client';

import React, { useState, useEffect, useRef } from 'react';

// Define the shape of the video object
type Video = {
  id: number;
  status: string;
  s3_key: string;
  created_at: string;
  filename: string;
  title: string;
};

// Define the props for our component
interface VideoCardProps {
  video: Video;
  onDelete: (videoId: number) => void;
}

const VideoCard: React.FC<VideoCardProps> = ({ video, onDelete }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const statusColor = video.status === 'ready' ? 'bg-green-200 text-green-900' : video.status === 'processing' ? 'bg-yellow-200 text-yellow-900' : 'bg-red-200 text-red-900';

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuRef]);

  const handleDeleteClick = () => {
    onDelete(video.id);
    setIsMenuOpen(false);
  };

  return (
    <div className="flex items-center p-4 bg-black/20 backdrop-blur-lg border border-white/10 rounded-xl space-x-4 transition-all duration-300 hover:border-white/20 hover:bg-black/30">
      
      <div className="flex-shrink-0 w-24 h-16 bg-gray-700 rounded-md flex items-center justify-center">
        <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
      </div>

      <div className="flex-grow">
        <p className="font-semibold text-white break-all">{video.title || 'Processing...'}</p>
        <p className="text-sm text-gray-400">
          Uploaded: {new Date(video.created_at).toLocaleString()}
        </p>
      </div>

      <div className="flex-shrink-0 flex items-center space-x-4">
        <span className={`px-3 py-1 text-xs font-semibold rounded-full capitalize ${statusColor}`}>
          {video.status}
        </span>
        
        <div className="relative" ref={menuRef}>
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="text-gray-400 hover:text-white transition-colors"
            aria-label="Actions"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"></path></svg>
          </button>
          <div 
            className={`
              absolute right-0 w-48 bg-black/30 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl z-20
              transition-all duration-300 ease-in-out
              
               bottom-full mb-2 origin-bottom-right
              
              ${isMenuOpen ? 'transform opacity-100 scale-100' : 'transform opacity-0 scale-95 pointer-events-none'}
            `}
          >
            <div className="p-2">
              <button 
                onClick={handleDeleteClick}
                className="flex items-center w-full px-3 py-2 text-sm text-red-400 hover:bg-red-500/20 hover:text-red-300 rounded-md transition-colors"
              >
                <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                Delete Video
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoCard;