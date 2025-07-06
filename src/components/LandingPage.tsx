import React from 'react';
import { motion } from 'framer-motion';

interface LandingPageProps {
  onStartDemo: (scenario: string) => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onStartDemo }) => {
  const benefits = [
    {
      icon: "🎯",
      title: "Risk-Free Practice",
      description: "Practice complex clinical conversations without the pressure of real HCP interactions. Make mistakes, learn, and improve safely."
    },
    {
      icon: "⚡",
      title: "Real-Time Feedback",
      description: "Get immediate responses and clinical questions from AI-powered HCPs. Experience realistic pushback and challenging scenarios."
    },
    {
      icon: "📈",
      title: "Scalable Training",
      description: "Train entire field medical teams consistently. Available 24/7 with no scheduling conflicts or geographical limitations."
    },
    {
      icon: "🎭",
      title: "Scenario-Based Learning",
      description: "Practice specific therapeutic areas with specialized HCP avatars. Today's demos cover multiple interaction types."
    },
    {
      icon: "📊",
      title: "Performance Tracking",
      description: "Monitor progress over time with detailed analytics. Identify strengths and areas for improvement in your clinical conversations."
    },
    {
      icon: "💰",
      title: "Cost-Effective",
      description: "Reduce training costs compared to traditional role-play sessions. No travel, no scheduling conflicts, maximum ROI on training investment."
    }
  ];

  const scenarios = [
    {
      id: 'alex',
      doctorName: 'Dr. Alex',
      specialty: 'Cardiologist',
      description: 'Dr. Alex, a seasoned cardiologist in a major academic center',
      objective: 'Field Medical sharing new clinical data',
      focusArea: 'Tafamidis dose comparison discussion',
      difficulty: 'Advanced',
      difficultyColor: 'bg-red-500',
      avatar: '👨‍⚕️',
      bgColor: 'bg-gradient-to-br from-red-50 to-red-100',
      scenario: 'Present complex clinical data to a time-pressed, highly knowledgeable cardiologist. Practice handling sharp questions and data challenges.'
    },
    {
      id: 'ena',
      doctorName: 'Dr. Ena',
      specialty: 'General Medicine',
      description: 'Dr. Ena, a warm, thoughtful, and scientifically curious academic oncologist',
      objective: 'Building relationship and understanding needs',
      focusArea: 'Initial introduction and needs assessment',
      difficulty: 'Beginner',
      difficultyColor: 'bg-green-500',
      avatar: '👩‍⚕️',
      bgColor: 'bg-gradient-to-br from-green-50 to-green-100',
      scenario: 'First-time meeting with a warm, receptive HCP. Practice introductions, relationship building, and needs discovery.'
    },
    {
      id: 'dat',
      doctorName: 'Dr. Dat',
      specialty: 'Clinical Research',
      description: 'Dr. Dat, a pragmatic and highly respected oncology principal investigator',
      objective: 'Understanding enrollment barriers',
      focusArea: 'Trial enrollment and site support',
      difficulty: 'Intermediate',
      difficultyColor: 'bg-yellow-500',
      avatar: '🔬',
      bgColor: 'bg-gradient-to-br from-yellow-50 to-yellow-100',
      scenario: 'Investigate why clinical trial enrollment is slower than expected. Practice problem-solving and investigative questioning.'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-100 overflow-hidden">
      {/* Compact Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-1.5">
            <div className="flex items-center">
              <div className="text-lg mr-2">🩺</div>
              <div>
                <h1 className="text-base font-bold text-gray-900">Field Medical Training Platform</h1>
                <p className="text-xs text-gray-600">AI-Powered HCP Interaction Training</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">AI Trainer Demo tool developed by Ex-Field Folks for Field Medical</p>
              <p className="text-xs font-medium text-blue-600">(Created by Sejal and Vivek)</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
        {/* Compact Hero Section */}
        <div className="text-center mb-3">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl font-bold text-gray-900 mb-1"
          >
            Transform Field Medical Training with AI
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-sm text-gray-600 max-w-3xl mx-auto"
          >
            Practice critical HCP interactions in a safe, controlled environment with our AI-powered avatars. Get real-time feedback and improve your clinical conversation skills.
          </motion.p>
        </div>

        {/* Benefits Section - Compact Grid */}
        <div className="mb-3">
          <h2 className="text-base font-bold text-gray-900 mb-2 text-center">Why Choose AI Training?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {benefits.map((benefit, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-lg p-2 shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start">
                  <div className="text-base mr-2 flex-shrink-0">{benefit.icon}</div>
                  <div>
                    <h3 className="text-xs font-semibold text-gray-900 mb-1">{benefit.title}</h3>
                    <p className="text-xs text-gray-600 leading-tight">{benefit.description}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Training Scenarios Section */}
        <div className="mb-2">
          <h2 className="text-base font-bold text-gray-900 mb-2 text-center">Choose Your Training Scenario</h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            {scenarios.map((scenario, index) => (
              <motion.div
                key={scenario.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`${scenario.bgColor} rounded-xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1`}
              >
                <div className="p-3">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-2xl">{scenario.avatar}</div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium text-white ${scenario.difficultyColor}`}>
                      {scenario.difficulty}
                    </span>
                  </div>

                  {/* Doctor Info */}
                  <h3 className="text-base font-bold text-gray-900 mb-1">{scenario.doctorName}</h3>
                  <p className="text-sm text-blue-600 font-medium mb-1">{scenario.specialty}</p>
                  <p className="text-xs text-gray-600 mb-2">{scenario.description}</p>

                  {/* Scenario Details */}
                  <div className="space-y-1 mb-3">
                    <div>
                      <span className="text-xs font-semibold text-gray-700">Objective:</span>
                      <p className="text-xs text-gray-600">{scenario.objective}</p>
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-gray-700">Focus Area:</span>
                      <p className="text-xs text-gray-600">{scenario.focusArea}</p>
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-gray-700">Scenario:</span>
                      <p className="text-xs text-gray-600">{scenario.scenario}</p>
                    </div>
                  </div>

                  {/* Action Button */}
                  <button
                    onClick={() => onStartDemo(scenario.id)}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-3 rounded-lg transition-colors duration-200 flex items-center justify-center text-sm"
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1.5a1.5 1.5 0 011.5 1.5V12a1.5 1.5 0 01-1.5 1.5H9m8.485-4.243L15.657 7.93A1.5 1.5 0 0014.242 7.5H12a1.5 1.5 0 00-1.5 1.5v2.121m0 0a4 4 0 105.656 0M9 10v2.121" />
                    </svg>
                    Start Training with {scenario.doctorName}
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Bottom CTA Section */}
        <div className="text-center p-2 bg-blue-50 rounded-lg">
          <h3 className="text-sm font-bold text-gray-900 mb-1">Ready to Transform Your Field Medical Skills?</h3>
          <p className="text-xs text-gray-600 mb-1">
            Experience the future of field medical education. Practice with AI-powered HCPs and build confidence.
          </p>
          <div className="flex justify-center space-x-4 text-xs text-gray-500">
            <span>✓ No API keys required</span>
            <span>✓ Real-time conversation</span>
            <span>✓ Instant feedback</span>
            <span>✓ Performance tracking</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage; 