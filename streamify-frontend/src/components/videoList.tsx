'use client';

import React from 'react';
import VideoCard from './VideoCard'; // Assuming VideoCard is in the same components folder

// EDITED: Added title and filename to match the parent component
type Video = {
  id: number;
  status: string;
  s3_key: string;
  created_at: string;
  title: string;
  filename: string;
};

// EDITED: Added onDeleteVideo to the component's props interface
interface VideoListProps {
  videos: Video[];
  isLoading: boolean;
  onDeleteVideo: (videoId: number) => void;
}

const VideoList: React.FC<VideoListProps> = ({ videos, isLoading, onDeleteVideo }) => {
  return (
    <div className="lg:col-span-2">
      <h2 className="text-2xl font-semibold mb-4 text-white">Your Videos</h2>
      <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
        
        {isLoading && videos.length === 0 ? (
          <>
            <div className="h-24 w-full bg-black/20 backdrop-blur-lg border border-white/10 rounded-lg animate-pulse"></div>
            <div className="h-24 w-full bg-black/20 backdrop-blur-lg border border-white/10 rounded-lg animate-pulse"></div>
            <div className="h-24 w-full bg-black/20 backdrop-blur-lg border border-white/10 rounded-lg animate-pulse"></div>
          </>
        ) : videos.length > 0 ? (
          videos.map((video) => (
            // EDITED: Passed the real function to the onDelete prop
            <VideoCard key={video.id} video={video} onDelete={onDeleteVideo} />
          ))
        ) : (
          <div className="p-6 text-center bg-black/20 backdrop-blur-lg border border-white/10 rounded-lg">
            <p className="text-gray-400">You haven't uploaded any videos yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoList;