'use client';

import React from 'react';
import VideoCard from './VideoCard'; // Assuming VideoCard is in the same components folder

// Define the shape of the video object
type Video = {
  id: number;
  status: string;
  s3_key: string;
  created_at: string;
};

// Define the props that this component will accept from its parent (DashboardPage)
interface VideoListProps {
  videos: Video[];
  isLoading: boolean;
}

const VideoList: React.FC<VideoListProps> = ({ videos, isLoading }) => {
  return (
    <div className="lg:col-span-2">
      <h2 className="text-2xl font-semibold mb-4 text-white">Your Videos</h2>
      
      {/* --- THIS IS THE UPDATE --- */}
      {/* Added a max height, vertical scroll, and right padding for the scrollbar */}
      <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
      {/* --- END OF UPDATE --- */}
        
        {isLoading && videos.length === 0 ? (
          // Skeleton loaders for the video list
          <>
            <div className="h-24 w-full bg-black/20 backdrop-blur-lg border border-white/10 rounded-lg animate-pulse"></div>
            <div className="h-24 w-full bg-black/20 backdrop-blur-lg border border-white/10 rounded-lg animate-pulse"></div>
            <div className="h-24 w-full bg-black/20 backdrop-blur-lg border border-white/10 rounded-lg animate-pulse"></div>
          </>
        ) : videos.length > 0 ? (
          // Map over the videos array passed down via props
          videos.map((video) => (
            <VideoCard key={video.id} video={video} onDelete={() => {}} />
          ))
        ) : (
          // Display the empty state message
          <div className="p-6 text-center bg-black/20 backdrop-blur-lg border border-white/10 rounded-lg">
            <p className="text-gray-400">You haven't uploaded any videos yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoList;