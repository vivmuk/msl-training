import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ConnectionState } from '../types/heygen';

interface AvatarVideoProps {
  stream?: MediaStream | null;
  connectionState: ConnectionState;
  isSpeaking?: boolean;
  isListening?: boolean;
  avatarName?: string;
  specialty?: string;
  onVideoReady?: () => void;
}

const AvatarVideo: React.FC<AvatarVideoProps> = ({
  stream,
  connectionState,
  isSpeaking = false,
  isListening = false,
  avatarName = 'Dr. Alex',
  specialty = 'Cardiologist',
  onVideoReady
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasVideoStarted, setHasVideoStarted] = useState(false);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      
      videoRef.current.onloadeddata = () => {
        setHasVideoStarted(true);
        if (onVideoReady) {
          onVideoReady();
        }
      };
    }
  }, [stream, onVideoReady]);

  const getStatusColor = () => {
    switch (connectionState) {
      case 'connected':
        return isSpeaking ? 'bg-blue-500' : isListening ? 'bg-green-500' : 'bg-green-500';
      case 'connecting':
        return 'bg-yellow-500';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = () => {
    if (connectionState === 'connected') {
      if (isSpeaking) return 'Speaking';
      if (isListening) return 'Listening';
      return 'Ready';
    }
    if (connectionState === 'connecting') return 'Connecting';
    if (connectionState === 'error') return 'Error';
    return 'Offline';
  };

  const renderVideoContent = () => {
    if (connectionState === 'connecting') {
      return (
        <div className="flex flex-col items-center justify-center h-full text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-400 mb-4"></div>
          <h3 className="text-lg font-semibold mb-2">Connecting to Avatar</h3>
          <p className="text-sm text-center">
            Initializing {avatarName}...
          </p>
        </div>
      );
    }

    if (connectionState === 'error') {
      return (
        <div className="flex flex-col items-center justify-center h-full text-white p-4">
          <svg className="w-12 h-12 mb-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-lg font-semibold mb-2">Connection Error</h3>
          <p className="text-sm text-center">
            Failed to connect to {avatarName}
          </p>
        </div>
      );
    }

    if (!stream || !hasVideoStarted) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-white">
          <div className="w-16 h-16 bg-gradient-to-r from-primary-500 to-primary-600 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold mb-1">{avatarName}</h3>
          <p className="text-sm text-medical-300">{specialty}</p>
          <p className="text-xs text-medical-400 mt-2">
            {stream ? 'Loading video...' : 'Waiting for stream...'}
          </p>
        </div>
      );
    }

    return (
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="w-full h-full object-cover"
      />
    );
  };

  return (
    <div className="relative w-full h-full rounded-lg overflow-hidden">
      {/* Video container with speaking/listening indicators */}
      <motion.div
        className={`w-full h-full bg-medical-900 ${
          isSpeaking 
            ? 'ring-4 ring-blue-500 ring-opacity-75' 
            : isListening 
            ? 'ring-4 ring-green-500 ring-opacity-75'
            : ''
        }`}
        animate={
          isSpeaking 
            ? { scale: [1, 1.02, 1] } 
            : isListening
            ? { scale: [1, 1.01, 1] }
            : { scale: 1 }
        }
        transition={{ 
          duration: isSpeaking ? 0.5 : 1, 
          repeat: (isSpeaking || isListening) ? Infinity : 0 
        }}
      >
        {renderVideoContent()}
      </motion.div>

      {/* Speaking indicator overlay */}
      <AnimatePresence>
        {isSpeaking && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-2 left-2 flex items-center bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium shadow-lg"
          >
            <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></div>
            Speaking
          </motion.div>
        )}
        
        {isListening && !isSpeaking && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-2 left-2 flex items-center bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium shadow-lg"
          >
            <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></div>
            Listening
          </motion.div>
        )}
      </AnimatePresence>

      {/* Connection status indicator */}
      <div className="absolute top-2 right-2 flex items-center">
        <div className={`w-3 h-3 rounded-full ${getStatusColor()} ${
          connectionState === 'connecting' ? 'animate-pulse' : ''
        }`}></div>
        <span className="ml-2 text-xs text-white bg-black bg-opacity-50 px-2 py-1 rounded">
          {getStatusText()}
        </span>
      </div>

      {/* Audio visualization when avatar is speaking */}
      <AnimatePresence>
        {isSpeaking && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-end space-x-1"
          >
            {[...Array(7)].map((_, i) => (
              <motion.div
                key={i}
                className="w-1 bg-blue-400 rounded-full"
                animate={{
                  height: [4, 20, 8, 16, 12, 24, 6],
                }}
                transition={{
                  duration: 0.6,
                  repeat: Infinity,
                  delay: i * 0.1,
                  ease: "easeInOut"
                }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Avatar info overlay */}
      <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
        <div className="font-semibold">{avatarName}</div>
        <div className="text-medical-300">{specialty}</div>
      </div>
    </div>
  );
};

export default AvatarVideo; 