import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface VoiceControlsProps {
  isVoiceChatActive: boolean;
  isInputMuted: boolean;
  onStartVoiceChat: () => void;
  onStopVoiceChat: () => void;
  onToggleMute: () => void;
  onInterruptAvatar: () => void;
  disabled?: boolean;
}

const VoiceControls: React.FC<VoiceControlsProps> = ({
  isVoiceChatActive,
  isInputMuted,
  onStartVoiceChat,
  onStopVoiceChat,
  onToggleMute,
  onInterruptAvatar,
  disabled = false
}) => {
  const [isHovering, setIsHovering] = useState<string | null>(null);

  const buttonBaseClass = "flex items-center justify-center p-3 rounded-full font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed";

  return (
    <div className="flex items-center space-x-3">
      {/* Voice Chat Toggle */}
      <motion.button
        whileHover={{ scale: disabled ? 1 : 1.05 }}
        whileTap={{ scale: disabled ? 1 : 0.95 }}
        onClick={isVoiceChatActive ? onStopVoiceChat : onStartVoiceChat}
        disabled={disabled}
        onMouseEnter={() => setIsHovering('voice')}
        onMouseLeave={() => setIsHovering(null)}
        className={`${buttonBaseClass} ${
          isVoiceChatActive
            ? 'bg-red-500 hover:bg-red-600 text-white'
            : 'bg-green-500 hover:bg-green-600 text-white'
        }`}
      >
        {isVoiceChatActive ? (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
        )}
      </motion.button>

      {/* Microphone Mute Toggle */}
      {isVoiceChatActive && (
        <motion.button
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          whileHover={{ scale: disabled ? 1 : 1.05 }}
          whileTap={{ scale: disabled ? 1 : 0.95 }}
          onClick={onToggleMute}
          disabled={disabled}
          onMouseEnter={() => setIsHovering('mute')}
          onMouseLeave={() => setIsHovering(null)}
          className={`${buttonBaseClass} ${
            isInputMuted
              ? 'bg-red-500 hover:bg-red-600 text-white'
              : 'bg-gray-500 hover:bg-gray-600 text-white'
          }`}
        >
          {isInputMuted ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          )}
        </motion.button>
      )}

      {/* Interrupt Avatar Button */}
      {isVoiceChatActive && (
        <motion.button
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          whileHover={{ scale: disabled ? 1 : 1.05 }}
          whileTap={{ scale: disabled ? 1 : 0.95 }}
          onClick={onInterruptAvatar}
          disabled={disabled}
          onMouseEnter={() => setIsHovering('interrupt')}
          onMouseLeave={() => setIsHovering(null)}
          className={`${buttonBaseClass} bg-orange-500 hover:bg-orange-600 text-white`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10h6v4H9z" />
          </svg>
        </motion.button>
      )}

      {/* Tooltip */}
      {isHovering && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-gray-800 text-white text-xs rounded whitespace-nowrap z-10"
        >
          {isHovering === 'voice' && (
            isVoiceChatActive ? 'Stop Voice Chat' : 'Start Voice Chat'
          )}
          {isHovering === 'mute' && (
            isInputMuted ? 'Unmute Microphone' : 'Mute Microphone'
          )}
          {isHovering === 'interrupt' && 'Interrupt Avatar'}
        </motion.div>
      )}
    </div>
  );
};

export default VoiceControls; 