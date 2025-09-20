'use client';

import React, { useState, FormEvent, ChangeEvent, DragEvent } from 'react';
import Modal from './Modal';

interface UploadZoneProps {
  onUploadSuccess: () => void;
}

const UploadZone: React.FC<UploadZoneProps> = ({ onUploadSuccess }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadMessage, setUploadMessage] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setUploadMessage('');
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setUploadMessage('Please select a file first.');
      return;
    }
    
    setIsUploading(true);
    setUploadProgress(0);
    setUploadMessage('Uploading...');
    
    const token = localStorage.getItem('token');
    if (!token) {
      setUploadMessage('Authentication error. Please log in again.');
      setIsUploading(false);
      return;
    }

    const simulateProgress = setInterval(() => {
      setUploadProgress(prev => Math.min(prev + 5, 95));
    }, 200);

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const res = await fetch('http://localhost:8080/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });

      clearInterval(simulateProgress);
      setUploadProgress(100);

      // --- THIS IS THE FIX: Handle both JSON and text responses ---
      if (res.ok) {
        const data = await res.json();
        setUploadMessage(data.message || 'Upload successful!');
        onUploadSuccess();
        setTimeout(() => {
          setIsModalOpen(false);
        }, 1500);
      } else {
        const errorText = await res.text();
        throw new Error(errorText || 'Upload failed');
      }
      // --- END OF FIX ---

    } catch (err: any) {
      console.error(err);
      setUploadMessage(err.message || 'Upload failed.');
    } finally {
      setIsUploading(false);
    }
  };

  const openModal = () => {
    setSelectedFile(null);
    setUploadMessage('');
    setIsUploading(false);
    setUploadProgress(0);
    setIsModalOpen(true);
  };

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); };
  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); };
  const handleDragOver = (e: DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); };
  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
      setUploadMessage('');
    }
  };


  return (
    <div className="lg:col-span-1"> 
      <div className="p-6 bg-black/20 backdrop-blur-lg border border-white/10 rounded-lg">
        <h2 className="text-xl font-semibold mb-4 text-white">Upload a New Video</h2>
        <button
          onClick={openModal}
          type="button"
          className="w-full flex items-center justify-center space-x-3 px-5 py-3 font-semibold text-white rounded-full bg-gradient-to-r from-blue-500 to-purple-600 shadow-lg shadow-blue-500/30 hover:scale-105 hover:shadow-purple-500/40 active:scale-100 transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-white"
        >
          <img src='/icons/cloud-upload-svgrepo-com.svg' alt="Upload Icon" className="w-6 h-6" />
          <span>Upload Video</span>
        </button>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <div className="flex justify-between items-center p-4 border-b border-white/10">
          <h3 className="text-lg font-semibold text-white">Upload Your Video</h3>
          <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        
        <div className="p-6">
          <form onSubmit={handleSubmit}>
            {!selectedFile && (
              <div 
                onDragEnter={handleDragEnter}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`w-full h-48 border-2 border-dashed rounded-lg flex flex-col items-center justify-center text-center p-4 transition-colors duration-300
                  ${isDragging ? 'border-purple-500 bg-purple-500/10' : 'border-gray-600'}
                `}
              >
                <svg className={`w-12 h-12 transition-colors ${isDragging ? 'text-purple-400' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M12 12l0 8m0-8l-4 4m4-4l4-4" /></svg>
                <label htmlFor="file-upload" className="mt-2 text-sm text-blue-400 font-semibold cursor-pointer hover:underline">
                  Click to browse
                  <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} />
                </label>
                <p className={`mt-1 text-xs transition-colors ${isDragging ? 'text-purple-400' : 'text-gray-500'}`}>
                  {isDragging ? 'Drop your file to select' : 'or Drag & Drop'}
                </p>
              </div>
            )}

            {selectedFile && (
              <div className="space-y-4">
                <div className="p-3 bg-gray-700/50 rounded-md text-sm text-gray-300">
                  <p><strong>Selected file:</strong> {selectedFile.name}</p>
                </div>
                {isUploading && (
                  <div className="w-full bg-gray-700 rounded-full h-2.5">
                    <div className="bg-gradient-to-r from-blue-500 to-purple-600 h-2.5 rounded-full transition-all duration-500" style={{ width: `${uploadProgress}%` }}></div>
                  </div>
                )}
                <div className="h-5">
                  <p className="text-gray-300 text-sm text-center">{uploadMessage}</p>
                </div>
              </div>
            )}
            
            <button type="submit" disabled={!selectedFile || isUploading} className="mt-4 bg-blue-600 text-white w-full px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors">
              {isUploading ? 'Uploading...' : 'Upload'}
            </button>
          </form>
        </div>
      </Modal>
    </div>
  );
};

export default UploadZone;