'use client';
import React, { useRef, useEffect, useState, useCallback } from 'react';

const InteractiveDemo = () => {
  const demoRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [typedCommand, setTypedCommand] = useState('');
  const [showResponse, setShowResponse] = useState(false);
  const [processingStage, setProcessingStage] = useState<'idle' | 'processing' | 'ready'>('idle');

  // Full command string - now with color classes embedded for direct rendering
  // This approach is more manual but gives precise control for a small, fixed snippet.
  const fullCommandColored = `<span class="text-green-400">$</span> <span class="text-blue-400">curl</span> <span class="text-purple-400">-X</span> <span class="text-orange-400">POST</span> <span class="text-white">\\</span>
  <span class="text-purple-400">-H</span> <span class="text-yellow-400">"Authorization: Bearer sk_live_..."</span> <span class="text-white">\\</span>
  <span class="text-purple-400">-F</span> <span class="text-yellow-400">"file=@my-video.mp4"</span> <span class="text-white">\\</span>
  <span class="text-cyan-400">https://api.streamify.com/upload</span>`;

  // Full response string - also with color classes embedded
  const fullResponseColored = `<span class="text-gray-500">#=> Response:</span>
<span class="text-purple-400">{</span>
  <span class="text-yellow-400">"message"</span>: <span class="text-green-400">"Upload successful."</span>,
  <span class="text-yellow-400">"videoId"</span>: <span class="text-orange-400">"12345"</span>,
  <span class="text-yellow-400">"status"</span>: <span class="text-green-400">"processing"</span>
<span class="text-purple-400">}</span>`;

  // We'll use a plain string version for typing speed calculation
  const fullCommandPlain = `$ curl -X POST \\
  -H "Authorization: Bearer sk_live_..." \\
  -F "file=@my-video.mp4" \\
  https://api.streamify.com/upload`;

  // Function to reset all states when the component goes out of view
  const resetDemo = useCallback(() => {
    setTypedCommand('');
    setShowResponse(false);
    setProcessingStage('idle');
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        } else {
          setIsVisible(false);
          resetDemo();
        }
      },
      {
        root: null, // viewport
        rootMargin: '0px',
        threshold: 0.5, // Trigger when 50% of the element is visible
      }
    );

    if (demoRef.current) {
      observer.observe(demoRef.current);
    }

    return () => {
      if (demoRef.current) {
        observer.unobserve(demoRef.current);
      }
    };
  }, [resetDemo]);

  // Typing effect and subsequent animations
  useEffect(() => {
    let typingInterval: NodeJS.Timeout | undefined;
    let responseTimeout: NodeJS.Timeout | undefined;
    let processingStartTimeout: NodeJS.Timeout | undefined;
    let processingEndTimeout: NodeJS.Timeout | undefined;

    if (isVisible) {
      let i = 0;
      setTypedCommand('');
      setShowResponse(false);
      setProcessingStage('idle');

      typingInterval = setInterval(() => {
        // Append characters from the plain command string
        setTypedCommand(prev => prev + fullCommandPlain.charAt(i));
        i++;
        if (i === fullCommandPlain.length) {
          clearInterval(typingInterval);
          
          responseTimeout = setTimeout(() => {
            setShowResponse(true);
            
            processingStartTimeout = setTimeout(() => {
              setProcessingStage('processing');
              
              processingEndTimeout = setTimeout(() => {
                setProcessingStage('ready');
              }, 2000); // Simulate 2 seconds of processing
            }, 500); // 0.5s delay before processing starts
          }, 300); // 0.3s delay after typing ends before response appears
        }
      }, 30); // Typing speed: 30ms per character
    }

    // Cleanup function for useEffect
    return () => {
      clearInterval(typingInterval);
      clearTimeout(responseTimeout);
      clearTimeout(processingStartTimeout);
      clearTimeout(processingEndTimeout);
      setTypedCommand('');
      setShowResponse(false);
      setProcessingStage('idle');
    };
  }, [isVisible, fullCommandPlain]); // Depend on fullCommandPlain for typing

  // Helper to apply colors to the currently typed plain command
  const getColoredTypedCommand = () => {
    let coloredOutput = '';
    let currentPlainIndex = 0;
    
    // We iterate through the HTML-embedded colored string
    // and extract parts that match the plain typed command.
    // This is a bit of a hack but ensures colors match typed content.
    const regex = /(<span class="[^"]*">[^<]*<\/span>|[^<])/g; // Match either a full span or a single char outside a span
    let match;
    let htmlColoredIndex = 0;

    while ((match = regex.exec(fullCommandColored)) !== null) {
      const part = match[0];
      if (part.startsWith('<span')) {
        // If it's a colored span, get its inner text
        const innerTextMatch = part.match(/>([^<]*)<\/span>/);
        if (innerTextMatch) {
          const innerText = innerTextMatch[1];
          // If we have typed past this span, append the full colored span
          if (currentPlainIndex + innerText.length <= typedCommand.length) {
            coloredOutput += part;
            currentPlainIndex += innerText.length;
          } else if (currentPlainIndex < typedCommand.length) {
            // If we are currently typing within this span
            const charsToType = typedCommand.length - currentPlainIndex;
            coloredOutput += part.replace(innerText, innerText.substring(0, charsToType));
            currentPlainIndex += charsToType;
          }
        }
      } else {
        // If it's a plain character outside a span
        if (currentPlainIndex < typedCommand.length) {
          coloredOutput += part;
          currentPlainIndex++;
        }
      }

      if (currentPlainIndex >= typedCommand.length) {
        break; // Stop when we've generated enough colored output for what's typed
      }
    }
    return coloredOutput;
  };


  return (
    // Main window container with gradient border and shadow
    <div 
      ref={demoRef} 
      className={`relative p-[1px] rounded-2xl transition-all duration-700 ease-out 
                  ${isVisible ? 
                    'bg-gradient-to-b from-white/20 to-transparent shadow-2xl shadow-black/40 scale-100' : 
                    'bg-gradient-to-b from-white/5 to-transparent shadow-none scale-98' 
                  }`}
    >
      <div className={`bg-black/90 backdrop-blur-lg rounded-2xl overflow-hidden transition-all duration-700 ease-out 
                  ${isVisible ? 'opacity-100' : 'opacity-70'}`}>
        
        {/* Window Header */}
        <div className="h-10 flex items-center px-4 border-b border-white/10">
          <div className="flex space-x-2">
            <div className={`w-3 h-3 rounded-full transition-colors duration-500 ${isVisible ? 'bg-red-500' : 'bg-gray-700'}`}></div>
            <div className={`w-3 h-3 rounded-full transition-colors duration-500 ${isVisible ? 'bg-yellow-500' : 'bg-gray-700'}`}></div>
            <div className={`w-3 h-3 rounded-full transition-colors duration-500 ${isVisible ? 'bg-green-500' : 'bg-gray-700'}`}></div>
          </div>
          <div className={`flex-grow text-center text-sm transition-opacity duration-500 ${isVisible ? 'opacity-100 text-gray-400' : 'opacity-0'}`}>
            bash -- Streamify API Demo
          </div>
        </div>
        
        {/* Window Content: Code Editor and Video Preview */}
        <div className="flex flex-col md:flex-row p-6 space-y-6 md:space-y-0 md:space-x-6 min-h-[400px]">

          {/* Left Side: Mock Code Editor */}
          <div className="flex-1 font-mono text-sm bg-black/50 p-4 rounded-lg border border-white/10 overflow-x-auto relative">
            {/* Overlay for "dead" state */}
            <div className={`absolute inset-0 bg-black/50 rounded-lg z-10 
                             transition-opacity duration-500 
                             ${isVisible && (typedCommand === '' && !showResponse) ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}></div>
            
            <pre className={`transition-opacity duration-500 ${isVisible ? 'opacity-100' : 'opacity-0'} `}>
              <code className="text-gray-400">
                <span dangerouslySetInnerHTML={{ __html: getColoredTypedCommand() }} />
                
                {/* Typing cursor */}
                {isVisible && typedCommand.length < fullCommandPlain.length && (
                  <span className="animate-blink text-green-400">|</span>
                )}
                
                {typedCommand.length === fullCommandPlain.length && showResponse && (
                  <>
                    <br /><br />
                    <span dangerouslySetInnerHTML={{ __html: fullResponseColored }} />
                  </>
                )}
              </code>
            </pre>
          </div>

          {/* Right Side: Mock Video Preview */}
          <div className="flex-1 flex flex-col items-center justify-center bg-black/50 p-4 rounded-lg border border-white/10 relative">
            {/* Overlay for "dead" state */}
            <div className={`absolute inset-0 bg-black/50 rounded-lg z-10 
                             transition-opacity duration-500 
                             ${isVisible && (typedCommand === '' && !showResponse) ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}></div>

            <div className={`transition-opacity duration-500 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
              <div className="w-full max-w-[200px] aspect-video bg-black rounded-md flex items-center justify-center mb-4 relative overflow-hidden">
                  {/* Processing animation */}
                  {processingStage === 'processing' && (
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 opacity-30 blur-sm animate-beam"></div>
                  )}
                  {/* Play icon always present, maybe styled differently based on stage */}
                  <svg className={`w-10 h-10 z-10 transition-colors duration-300
                                  ${processingStage === 'ready' ? 'text-blue-400' : 'text-white'}`} 
                       fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
              </div>
              <div className="text-center">
                <p className="font-semibold text-white">my-video.mp4</p>
                {/* Status badge */}
                {processingStage === 'idle' && (
                  <div className="mt-2 px-3 py-1 text-xs font-semibold rounded-full bg-gray-500/20 text-gray-400">
                    Waiting for upload
                  </div>
                )}
                {processingStage === 'processing' && (
                  <div className="mt-2 px-3 py-1 text-xs font-semibold rounded-full bg-yellow-500/20 text-yellow-400 animate-pulse">
                    Processing...
                  </div>
                )}
                {processingStage === 'ready' && (
                  <div className="mt-2 px-3 py-1 text-xs font-semibold rounded-full bg-blue-500/20 text-blue-400">
                    Ready to Stream
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default InteractiveDemo;