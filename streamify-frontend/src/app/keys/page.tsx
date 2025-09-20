'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Header from '../../components/Header';
import Modal from '../../components/Modal';

// Define the shape of the API key responses from your backend
type APIKeyResponse = {
  last_four: string;
  exists: boolean;
};

type NewAPIKeyResponse = {
  key: string;
};

export default function ApiKeysPage() {
  const [apiKey, setApiKey] = useState('');
  const [lastFour, setLastFour] = useState('');
  const [keyExists, setKeyExists] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);
  const [copyButtonText, setCopyButtonText] = useState('Copy');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Function to fetch the existing key's last four digits
  const fetchKey = useCallback(async () => {
    setIsLoading(true);
    const token = localStorage.getItem('token');
    if (!token) {
      setIsLoading(false);
      return;
    }
    try {
      const res = await fetch('http://localhost:8080/keys/', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.ok) {
        const data: APIKeyResponse = await res.json();
        if (data.exists) {
            setLastFour(data.last_four);
            setKeyExists(true);
        } else {
            setKeyExists(false);
        }
      }
    } catch (error) {
      console.error("Failed to fetch API key:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchKey();
  }, [fetchKey]);

  // Function to generate a new key
  const handleGenerateKey = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await fetch('http://localhost:8080/keys/', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.ok) {
        const data: NewAPIKeyResponse = await res.json();
        setApiKey(data.key);
        setLastFour(data.key.slice(-4));
        setKeyExists(true);
        setIsRevealed(true); // Reveal the new key immediately
        setIsModalOpen(false);
      } else {
        throw new Error('Failed to generate key');
      }
    } catch (error) {
      console.error("Failed to generate API key:", error);
    }
  };

  // --- THIS FUNCTION IS FIXED for reliability in all browsers ---
  const handleCopy = () => {
    if (!isRevealed || !apiKey) return;
  
    // Create a temporary textarea element to hold the text
    const textArea = document.createElement('textarea');
    textArea.value = apiKey;
    
    // Style it to be hidden
    textArea.style.position = 'fixed';
    textArea.style.left = '-9999px';
    textArea.style.top = '-9999px';
    
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
  
    try {
      document.execCommand('copy');
      setCopyButtonText('Copied!');
      setTimeout(() => setCopyButtonText('Copy'), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  
    document.body.removeChild(textArea);
  };

  const obfuscatedKey = `sk_live_••••••••••••••••••••${lastFour}`;
  const displayKey = isRevealed && apiKey ? apiKey : obfuscatedKey;

  return (
    <>
      <Header />
      <main className="pt-28 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto w-full">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">API Keys</h1>
          <p className="mt-1 text-sm text-gray-400">
            Manage your secret keys for accessing the Streamify API.
          </p>
        </div>

        <div className="p-6 bg-gray-900 border border-gray-700 rounded-xl shadow-lg relative">
           <div className="absolute -top-px left-0 w-full h-px bg-gradient-to-r from-blue-500/0 via-blue-500/70 to-purple-500/0"></div>
           <div className="absolute -bottom-px left-0 w-full h-px bg-gradient-to-r from-blue-500/0 via-purple-500/70 to-purple-500/0"></div>

          {isLoading ? (
             <div className="h-10 w-full bg-black/50 border border-gray-700 rounded-lg animate-pulse"></div>
          ) : keyExists ? (
            <div>
              <h3 className="font-semibold text-white mb-2">Secret API Key</h3>
              <div className="flex items-center w-full bg-black/50 border border-gray-700 rounded-lg p-2">
                <span className="flex-grow font-mono text-sm text-gray-400">
                  {displayKey}
                </span>
                <div className="flex-shrink-0 flex items-center space-x-2 pl-2">
                  <button
                    onClick={() => setIsRevealed(!isRevealed)}
                    className="px-3 py-1 text-xs bg-gray-700 hover:bg-gray-600 rounded-md text-white transition-colors"
                  >
                    {isRevealed ? 'Hide' : 'Reveal'}
                  </button>
                  <button
                    onClick={handleCopy}
                    disabled={!isRevealed || !apiKey}
                    className="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-500 rounded-md text-white transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed"
                  >
                    {copyButtonText}
                  </button>
                </div>
              </div>
            </div>
          ) : (
             <div className="text-center">
                <p className="text-gray-400 mb-4">You have not generated an API key yet.</p>
                 <button
                    onClick={handleGenerateKey}
                    className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-500 rounded-md text-white font-semibold transition-colors"
                  >
                    Generate Your First Key
                  </button>
             </div>
          )}
        </div>

        {keyExists && (
            <div className="mt-6 border-t border-gray-800 pt-6">
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="text-sm text-yellow-400 hover:text-yellow-300 transition-colors"
                >
                    Regenerate API Key...
                </button>
            </div>
        )}

        <div className="mt-8 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
          <p className="text-sm text-yellow-300">
            <strong>Security Warning:</strong> Treat your API keys like passwords. Do not share them publicly or commit them to version control.
          </p>
        </div>
      </main>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-white">Regenerate API Key?</h3>
          <p className="mt-2 text-sm text-gray-400">
            Are you sure? Your old key will be permanently deleted and will no longer work.
          </p>
          <div className="mt-6 flex justify-end space-x-4">
            <button
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-sm bg-gray-700 hover:bg-gray-600 rounded-md text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleGenerateKey}
              className="px-4 py-2 text-sm bg-yellow-500 hover:bg-yellow-400 rounded-md text-black font-semibold transition-colors"
            >
              Confirm & Regenerate
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
