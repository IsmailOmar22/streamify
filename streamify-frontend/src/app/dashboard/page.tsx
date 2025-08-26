'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Header from '../../components/Header';
// CORRECTED: Component imports should use PascalCase to match their filenames
import StatCard from '../../components/Statcard'; 
import VideoList from '../../components/videoList';
import UploadZone from '../../components/UploadZone';

// Define a type for your video object
type Video = {
  id: number;
  status: string;
  s3_key: string;
  created_at: string;
};

// BEST PRACTICE: Icons are defined outside the component to prevent re-declaration on every render.
const VideosIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
);
const ProcessingIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h5M20 20v-5h-5" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 9a9 9 0 0114.65-4.65l-2.12 2.12a5 5 0 00-7.07 7.07l-2.12 2.12A9 9 0 014 9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 15a9 9 0 01-14.65 4.65l2.12-2.12a5 5 0 007.07-7.07l2.12-2.12A9 9 0 0120 15z" /></svg>
);
const StorageIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7a8 8 0 0116 0" /></svg>
);


export default function DashboardPage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  const fetchAndPoll = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setIsLoading(false);
      return;
    }
    try {
      const res = await fetch('http://localhost:8080/videos', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch videos');
      
      const data = await res.json();
      const videoList: Video[] = data || [];
      setVideos(videoList);

      const isProcessing = videoList.some((video) => video.status === 'processing');
      
      if (pollingRef.current) clearTimeout(pollingRef.current);

      if (isProcessing) {
        pollingRef.current = setTimeout(fetchAndPoll, 5000);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAndPoll();
    return () => {
      if (pollingRef.current) clearTimeout(pollingRef.current);
    };
  }, [fetchAndPoll]);

  const videosProcessing = videos.filter(v => v.status === 'processing').length;

  return (
    <>
      <Header />
      <main className="pt-24 px-4 min-h-screen sm:px-6 lg:px-8 max-w-7xl mx-auto">

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-400">An overview of your video processing activity.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <StatCard title="Total Videos" value={isLoading ? '...' : videos.length} icon={<VideosIcon />} loading={isLoading && videos.length === 0} />
          <StatCard title="Processing" value={isLoading ? '...' : videosProcessing} icon={<ProcessingIcon />} loading={isLoading && videos.length === 0} />
          <StatCard title="Storage Used" value="~ 0 GB" icon={<StorageIcon />} loading={isLoading && videos.length === 0} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <VideoList isLoading={isLoading} videos={videos} />
          <UploadZone onUploadSuccess={fetchAndPoll} />
        </div>
      </main>
    </>
  );
}