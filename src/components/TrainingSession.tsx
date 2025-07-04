import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { ConnectionState, HeyGenConfig } from '../types/heygen';
import UserCamera from './UserCamera';
import HeyGenAvatarEmbed from './HeyGenAvatarEmbed';
import VoiceControls from './VoiceControls';

interface TrainingSessionProps {
  config: HeyGenConfig;
  onEndTraining: () => void;
}

const TrainingSession: React.FC<TrainingSessionProps> = ({ config, onEndTraining }) => {
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
  const [sessionMetrics, setSessionMetrics] = useState({
    duration: 0,
    messagesExchanged: 0,
    status: 'active' as const
  });
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Avatar and User state
  const [userStream, setUserStream] = useState<MediaStream | null>(null);
  const [isAvatarSpeaking, setIsAvatarSpeaking] = useState(false);
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);
  const [isVoiceChatActive, setIsVoiceChatActive] = useState(false);
  const [isInputMuted, setIsInputMuted] = useState(false);
  const [isUserCameraActive, setIsUserCameraActive] = useState(false);
  
  const sessionStartTimeRef = useRef<number>(Date.now());
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const initializeSession = async () => {
    try {
      setConnectionState('connecting');
      setError(null);
      
      if (config.apiKey) {
        // Initialize real session
        setConnectionState('connected');
        setIsVoiceChatActive(true);
      } else {
        // Demo mode
        setTimeout(() => {
          setConnectionState('connected');
          setIsVoiceChatActive(true); // Simulate voice chat in demo mode
        }, 2000);
      }
      
      // Enable user camera by default
      setIsUserCameraActive(true);
      
    } catch (error) {
      console.error('Failed to initialize session:', error);
      setError('Failed to initialize training session');
      setConnectionState('error');
    }
  };

  useEffect(() => {
    // Just start the timer, don't initialize session automatically
    startTimer();
    
    return () => {
      cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startTimer = () => {
    timerRef.current = setInterval(() => {
      const now = Date.now();
      const duration = Math.floor((now - sessionStartTimeRef.current) / 1000);
      setSessionMetrics(prev => ({ ...prev, duration }));
    }, 1000);
  };

  const cleanup = async () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    if (userStream) {
      userStream.getTracks().forEach(track => track.stop());
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;
    
    setIsLoading(true);
    try {
      // Demo mode simulation
      setIsAvatarSpeaking(true);
      setTimeout(() => {
        setIsAvatarSpeaking(false);
      }, 3000);
      
      setInputMessage('');
      setSessionMetrics(prev => ({ 
        ...prev, 
        messagesExchanged: prev.messagesExchanged + 1 
      }));
      
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Failed to send message');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartVoiceChat = async () => {
    try {
      setIsVoiceChatActive(true);
    } catch (error) {
      console.error('Error starting voice chat:', error);
      setError('Failed to start voice chat');
    }
  };

  const handleStopVoiceChat = async () => {
    try {
      setIsVoiceChatActive(false);
    } catch (error) {
      console.error('Error stopping voice chat:', error);
      setError('Failed to stop voice chat');
    }
  };

  const handleToggleMute = async () => {
    try {
      setIsInputMuted(!isInputMuted);
    } catch (error) {
      console.error('Error toggling mute:', error);
      setError('Failed to toggle mute');
    }
  };

  const handleInterruptAvatar = async () => {
    try {
      setIsAvatarSpeaking(false);
    } catch (error) {
      console.error('Error interrupting avatar:', error);
      setError('Failed to interrupt avatar');
    }
  };

  const handleUserCameraReady = (stream: MediaStream) => {
    setUserStream(stream);
  };

  const handleUserCameraError = (error: Error) => {
    console.error('User camera error:', error);
    setError('Camera access denied');
  };

  const handleEndSession = async () => {
    await cleanup();
    onEndTraining();
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusColor = () => {
    switch (connectionState) {
      case 'connected': return 'text-green-600';
      case 'connecting': return 'text-yellow-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusText = () => {
    switch (connectionState) {
      case 'connected': return 'Connected';
      case 'connecting': return 'Connecting...';
      case 'error': return 'Error';
      default: return 'Initializing...';
    }
  };

  // Show connecting state
  if (connectionState === 'connecting') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-medical-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center p-8"
        >
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <h2 className="text-2xl font-semibold text-medical-800 mb-2">
            Connecting to HCP Avatar
          </h2>
          <p className="text-medical-600">
            {config.apiKey ? 'Initializing HeyGen session...' : 'Loading demo environment...'}
          </p>
        </motion.div>
      </div>
    );
  }

  if (connectionState === 'error') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen bg-gradient-to-br from-medical-50 to-primary-50 flex items-center justify-center p-4"
      >
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Connection Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={handleEndSession}
            className="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            Return to Setup
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gradient-to-br from-medical-50 to-primary-50 p-4"
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">MSL Training Session</h1>
              <div className="flex items-center space-x-4 mt-2">
                <span className={`flex items-center ${getStatusColor()}`}>
                  <div className="w-2 h-2 bg-current rounded-full mr-2"></div>
                  {getStatusText()}
                </span>
                {!config.apiKey && (
                  <span className="text-sm text-amber-600 bg-amber-100 px-2 py-1 rounded">
                    Demo Mode
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{formatDuration(sessionMetrics.duration)}</div>
                <div className="text-sm text-gray-500">Duration</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary-600">{sessionMetrics.messagesExchanged}</div>
                <div className="text-sm text-gray-500">Messages</div>
              </div>
              <button
                onClick={handleEndSession}
                className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                End Session
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6 relative">
          {/* MSL Video Panel */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">MSL (You)</h2>
              <span className="flex items-center text-green-600">
                <div className="w-2 h-2 bg-green-600 rounded-full mr-2"></div>
                {connectionState === 'connected' ? 'Live' : 'Ready'}
              </span>
            </div>
            <div className="aspect-video rounded-lg overflow-hidden">
              <UserCamera
                isActive={isUserCameraActive}
                isSpeaking={isUserSpeaking}
                onCameraReady={handleUserCameraReady}
                onCameraError={handleUserCameraError}
              />
            </div>
          </div>

          {/* HCP Avatar Panel */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Dr. Alex (Cardiologist)</h2>
              <span className="flex items-center">
                <div className={`w-2 h-2 rounded-full mr-2 ${
                  connectionState === 'connected' ? 'bg-green-600' : 'bg-gray-400'
                }`}></div>
                <span className={connectionState === 'connected' ? 'text-green-600' : 'text-gray-600'}>
                  {connectionState === 'connected' ? 'Ready' : 'Waiting'}
                </span>
              </span>
            </div>
            <div className="aspect-video rounded-lg overflow-hidden">
              <HeyGenAvatarEmbed
                apiKey={config.apiKey}
                isActive={true}
                onAvatarReady={() => {
                  console.log('HeyGen Avatar ready');
                  setConnectionState('connected');
                }}
                onAvatarShow={() => console.log('Avatar shown')}
                onAvatarHide={() => console.log('Avatar hidden')}
              />
            </div>
          </div>

          {/* Start Training Overlay */}
          {connectionState === 'disconnected' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10 rounded-lg"
            >
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={initializeSession}
                className="bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-8 rounded-full text-lg shadow-lg flex items-center space-x-3"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1.5a1.5 1.5 0 011.5 1.5V12a1.5 1.5 0 01-1.5 1.5H9m8.485-4.243L15.657 7.93A1.5 1.5 0 0014.242 7.5H12a1.5 1.5 0 00-1.5 1.5v2.121m0 0a4 4 0 105.656 0M9 10v2.121" />
                </svg>
                <span>Start Training Session</span>
              </motion.button>
            </motion.div>
          )}
        </div>

        {/* Real-time Communication Panel */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Real-time Communication</h2>
            
            {/* Simple Controls */}
            <div className="flex items-center space-x-4">
              {/* Voice Chat Status */}
              <div className="flex items-center">
                <div className={`w-2 h-2 rounded-full mr-2 ${isVoiceChatActive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
                <span className={`text-sm font-medium ${isVoiceChatActive ? 'text-green-800' : 'text-gray-600'}`}>
                  {isVoiceChatActive ? 'Voice Active' : 'Voice Inactive'}
                </span>
              </div>
              
              {/* Mute Button */}
              {isVoiceChatActive && (
                <button
                  onClick={handleToggleMute}
                  className={`flex items-center space-x-2 px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                    isInputMuted 
                      ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {isInputMuted ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    )}
                  </svg>
                  <span>{isInputMuted ? 'Muted' : 'Unmute'}</span>
                </button>
              )}
              
              {/* Interrupt Button */}
              {isVoiceChatActive && isAvatarSpeaking && (
                <button
                  onClick={handleInterruptAvatar}
                  className="flex items-center space-x-2 px-3 py-1 bg-orange-100 text-orange-700 hover:bg-orange-200 rounded-lg text-sm font-medium transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10h6v4H9z" />
                  </svg>
                  <span>Interrupt</span>
                </button>
              )}
            </div>
          </div>
          
          {/* Communication Status */}
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-medium text-blue-900 mb-1">Real-time Voice Communication</h3>
                <p className="text-sm text-blue-800">
                  {isVoiceChatActive 
                    ? "Speak naturally - the avatar will hear you and respond in real-time. Your conversation is being transcribed for training records."
                    : "Voice communication is being initialized..."
                  }
                </p>
              </div>
            </div>
          </div>
          
          {/* Fallback Text Input (for when voice isn't working) */}
          {!isVoiceChatActive && (
            <div className="flex space-x-4">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Type your message to the HCP..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                disabled={isLoading || connectionState !== 'connected'}
              />
              <button
                onClick={handleSendMessage}
                disabled={isLoading || connectionState !== 'connected' || !inputMessage.trim()}
                className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Sending...' : 'Send'}
              </button>
            </div>
          )}
        </div>
      </div>
      
      {/* Voice Controls */}
      {connectionState !== 'disconnected' && (
        <div className="fixed bottom-4 right-4">
          <VoiceControls
            isVoiceChatActive={isVoiceChatActive}
            isInputMuted={isInputMuted}
            onStartVoiceChat={handleStartVoiceChat}
            onStopVoiceChat={handleStopVoiceChat}
            onToggleMute={handleToggleMute}
            onInterruptAvatar={handleInterruptAvatar}
          />
        </div>
      )}
    </motion.div>
  );
};

export default TrainingSession; 