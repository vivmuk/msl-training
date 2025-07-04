import React, { useEffect, useState } from 'react';

interface HeyGenAvatarEmbedProps {
  apiKey: string;
  isActive: boolean;
  onAvatarReady?: () => void;
  onAvatarShow?: () => void;
  onAvatarHide?: () => void;
}

const HeyGenAvatarEmbed: React.FC<HeyGenAvatarEmbedProps> = ({
  apiKey,
  isActive,
  onAvatarReady,
  onAvatarShow,
  onAvatarHide
}) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [showIframe, setShowIframe] = useState(false);

  useEffect(() => {
    if (!isActive) return;

    // Set up message listener for HeyGen events
    const handleMessage = (e: MessageEvent) => {
      if (e.origin === "https://labs.heygen.com" && e.data && e.data.type && "streaming-embed" === e.data.type) {
        console.log('HeyGen message received:', e.data);
        
        if ("init" === e.data.action) {
          console.log('HeyGen avatar initialized');
          setIsInitialized(true);
          if (onAvatarReady) onAvatarReady();
        } else if ("show" === e.data.action) {
          console.log('HeyGen avatar shown');
          if (onAvatarShow) onAvatarShow();
        } else if ("hide" === e.data.action) {
          console.log('HeyGen avatar hidden');
          if (onAvatarHide) onAvatarHide();
        }
      }
    };

    window.addEventListener('message', handleMessage);

    // Show iframe after a small delay to ensure proper mounting
    const timer = setTimeout(() => {
      setShowIframe(true);
    }, 100);

    // Cleanup
    return () => {
      window.removeEventListener('message', handleMessage);
      clearTimeout(timer);
    };
  }, [isActive, onAvatarReady, onAvatarShow, onAvatarHide]);

  // HeyGen embed URL (from the working demo)
  const embedUrl = "https://labs.heygen.com/guest/streaming-embed?share=eyJxdWFsaXR5IjoiaGlnaCIsImF2YXRhck5hbWUiOiJEZXh0ZXJfRG9jdG9yX1N0YW5kaW5nMl9w%0D%0AdWJsaWMiLCJwcmV2aWV3SW1nIjoiaHR0cHM6Ly9maWxlczIuaGV5Z2VuLmFpL2F2YXRhci92My84%0D%0AOGQ0MjFmOTM5MDQ0YmIwOGQ4OTJlODMzOTMxOTQ4Yl80NTU5MC9wcmV2aWV3X3RhbGtfMS53ZWJw%0D%0AIiwibmVlZFJlbW92ZUJhY2tncm91bmQiOmZhbHNlLCJrbm93bGVkZ2VCYXNlSWQiOiIyZmZkZGQ1%0D%0AMjhiYWE0MTFkOWNkY2Q5NzJiMzhkNTM1MCIsInVzZXJuYW1lIjoiNGE2MjIwYWQyNjUwNDFkNWI4%0D%0ANTk2NjZjMDNiY2FmZjcifQ%3D%3D&inIFrame=1";

  return (
    <div className="w-full h-full bg-gray-100 rounded-lg overflow-hidden relative" style={{ minHeight: '500px', height: '500px' }}>
      {!isInitialized && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
          <div className="text-center text-gray-500">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p>Loading Dr. Alex...</p>
          </div>
        </div>
      )}
      {showIframe && (
        <iframe
          src={embedUrl}
          title="Dr. Alex - HeyGen Avatar"
          width="100%"
          height="100%"
          style={{ minHeight: '500px', border: '0', borderRadius: '8px' }}
          allowFullScreen
          allow="microphone; camera; autoplay; fullscreen; display-capture; encrypted-media; gyroscope; picture-in-picture; web-share"
        />
      )}
    </div>
  );
};

export default HeyGenAvatarEmbed; 