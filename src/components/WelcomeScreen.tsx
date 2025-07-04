import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { HeyGenConfig } from '../types/heygen';

interface WelcomeScreenProps {
  onStartTraining: (config: HeyGenConfig) => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onStartTraining }) => {
  const [apiKey, setApiKey] = useState('NGE2MjIwYWQyNjUwNDFkNWI4NTk2NjZjMDNiY2FmZjctMTc1MTU2ODI1Mw==');
  const [isLoading, setIsLoading] = useState(false);

  const handleStartTraining = async () => {
    if (!apiKey.trim()) {
      alert('Please enter your HeyGen API key');
      return;
    }

    setIsLoading(true);
    
    try {
      // Use the real API key for HeyGen integration
      const config: HeyGenConfig = {
        apiKey: apiKey.trim(),
        serverUrl: 'https://api.heygen.com',
        avatarId: 'Dexter_Doctor_Standing2_public',
        quality: 'high',
        version: 'v2'
      };
      
      onStartTraining(config);
    } catch (error) {
      console.error('Configuration error:', error);
      alert('Failed to start training session');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-4xl w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="flex justify-center mb-8">
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="relative"
            >
              <div className="w-24 h-24 bg-gradient-to-r from-primary-500 to-primary-600 rounded-full flex items-center justify-center shadow-2xl">
                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                </svg>
              </div>
            </motion.div>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold text-medical-800 mb-4">
            MSL-HCP Training Platform
          </h1>
          
          <p className="text-xl text-medical-600 mb-8 max-w-2xl mx-auto">
            Practice meaningful interactions with Healthcare Professionals using 
            AI-powered avatars in realistic scenarios.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="card p-6 text-center"
            >
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h8m-5-9h2a1 1 0 011 1v1a1 1 0 01-1 1H9a1 1 0 01-1-1V6a1 1 0 011-1z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-medical-800 mb-2">
                Real-time Interaction
              </h3>
              <p className="text-medical-600">
                Engage in live conversations with AI avatars representing different HCP specialties
              </p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="card p-6 text-center"
            >
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-medical-800 mb-2">
                Side-by-Side Video
              </h3>
              <p className="text-medical-600">
                See yourself and the HCP avatar simultaneously for immersive training
              </p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="card p-6 text-center"
            >
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-medical-800 mb-2">
                Scenario-Based Learning
              </h3>
              <p className="text-medical-600">
                Practice with realistic scenarios tailored to different medical specialties
              </p>
            </motion.div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="card max-w-md mx-auto p-8"
        >
          <h2 className="text-2xl font-semibold text-medical-800 mb-6 text-center">
            Get Started
          </h2>
          
          <div className="space-y-6">
            <div>
              <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700 mb-2">
                HeyGen API Key
              </label>
              <input
                type="password"
                id="apiKey"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Enter your HeyGen API key"
              />
              <p className="mt-2 text-sm text-gray-600">
                Your API key is already pre-filled for this demo. You can get your API key from{' '}
                <a href="https://app.heygen.com/settings?nav=API" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">
                  HeyGen Settings
                </a>
              </p>
            </div>

            <button
              onClick={handleStartTraining}
              disabled={isLoading || !apiKey.trim()}
              className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                  Setting up session...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1.5a1.5 1.5 0 011.5 1.5V12a1.5 1.5 0 01-1.5 1.5H9m8.485-4.243L15.657 7.93A1.5 1.5 0 0014.242 7.5H12a1.5 1.5 0 00-1.5 1.5v2.121m0 0a4 4 0 105.656 0M9 10v2.121" />
                  </svg>
                  Start Training with Real HeyGen Avatar
                </>
              )}
            </button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="text-center mt-8"
        >
          <p className="text-medical-500 text-sm">
            Powered by HeyGen Interactive Avatars & LiveKit
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default WelcomeScreen; 