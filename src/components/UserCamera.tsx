import React, { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface UserCameraProps {
  isActive: boolean;
  isSpeaking?: boolean;
  onCameraReady?: (stream: MediaStream) => void;
  onCameraError?: (error: Error) => void;
}

const UserCamera: React.FC<UserCameraProps> = ({ 
  isActive, 
  isSpeaking = false,
  onCameraReady,
  onCameraError 
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isActive) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => stopCamera();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive]);

  // Ensure video plays when stream is available
  useEffect(() => {
    if (stream && videoRef.current && isActive) {
      const video = videoRef.current;
      video.srcObject = stream;
      
      const playVideo = async () => {
        try {
          await video.play();
          console.log('Video started playing successfully');
        } catch (error) {
          console.error('Video play error:', error);
        }
      };
      
      // Play video when metadata is loaded
      video.addEventListener('loadedmetadata', playVideo);
      
      return () => {
        video.removeEventListener('loadedmetadata', playVideo);
      };
    }
  }, [stream, isActive]);

  const startCamera = async () => {
    setIsLoading(true);
    console.log('Starting camera...');
    
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        },
        audio: true
      });

      console.log('Camera stream obtained:', mediaStream);
      console.log('Video tracks:', mediaStream.getVideoTracks());
      
      setStream(mediaStream);
      setHasPermission(true);
      
      if (videoRef.current) {
        console.log('Setting video source...');
        videoRef.current.srcObject = mediaStream;
        // Ensure video plays
        videoRef.current.play().catch((error) => {
          console.error('Video play failed:', error);
        });
      }

      if (onCameraReady) {
        onCameraReady(mediaStream);
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      setHasPermission(false);
      
      if (onCameraError) {
        onCameraError(error as Error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const renderCameraContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-white">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mb-4"></div>
          <p className="text-sm">Starting camera...</p>
        </div>
      );
    }

    if (hasPermission === false) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-white p-4">
          <svg className="w-12 h-12 mb-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l18 18" />
          </svg>
          <h3 className="text-lg font-semibold mb-2">Camera Access Denied</h3>
          <p className="text-sm text-center">
            Please allow camera access to enable video in training sessions.
          </p>
          <button
            onClick={startCamera}
            className="mt-4 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      );
    }

    if (!isActive || !stream) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-white">
          <svg className="w-16 h-16 mb-4 text-medical-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <p className="text-sm">Camera is off</p>
        </div>
      );
    }

    return (
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        controls={false}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          backgroundColor: '#000'
        }}
        onLoadedMetadata={() => console.log('Video metadata loaded')}
        onPlay={() => console.log('Video playing')}
        onError={(e) => console.error('Video error:', e)}
      />
    );
  };

  return (
    <div className="relative w-full h-full rounded-lg overflow-hidden">
      <motion.div
        className={`w-full h-full bg-medical-900 ${
          isSpeaking ? 'ring-4 ring-green-500 ring-opacity-75' : ''
        }`}
        animate={isSpeaking ? { scale: [1, 1.02, 1] } : { scale: 1 }}
        transition={{ duration: 0.5, repeat: isSpeaking ? Infinity : 0 }}
      >
        {renderCameraContent()}
      </motion.div>

      {isSpeaking && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute top-2 left-2 flex items-center bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium"
        >
          <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></div>
          Speaking
        </motion.div>
      )}

      <div className="absolute top-2 right-2">
        <div className={`w-3 h-3 rounded-full ${
          stream && isActive ? 'bg-green-500' : 'bg-red-500'
        }`}></div>
      </div>

      {isSpeaking && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-end space-x-1">
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              className="w-1 bg-green-400 rounded-full"
              animate={{
                height: [4, 16, 8, 20, 6],
              }}
              transition={{
                duration: 0.5,
                repeat: Infinity,
                delay: i * 0.1,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default UserCamera; 