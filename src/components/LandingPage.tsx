import React from 'react';

interface LandingPageProps {
  onStartDemo: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onStartDemo }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                🩺 Field Medical Training Platform
              </h1>
              <p className="text-gray-600">AI-Powered HCP Interaction Training</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">AI Trainer Demo tool developed by Ex-Field Folks for Field Medical</p>
              <p className="text-sm font-medium text-blue-600">(Created by Sejal and Vivek)</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
                      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          {/* Hero Section */}
          <div className="text-center mb-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Transform Field Medical Training with AI
            </h2>
            <p className="text-sm text-gray-600 max-w-xl mx-auto mb-3">
              Practice critical HCP interactions in a safe, controlled environment with our AI-powered cardiologist avatar. 
              Get real-time feedback and improve your clinical conversation skills.
            </p>
            <div className="flex justify-center">
              <button
                onClick={onStartDemo}
                className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors duration-200 shadow-lg"
              >
                Start Training Demo
              </button>
            </div>
          </div>

          {/* Benefits Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-5">
            {/* Benefit 1 */}
            <div className="bg-white rounded-lg shadow-lg p-3">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mb-2">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-sm font-semibold text-gray-900 mb-1">Risk-Free Practice</h3>
              <p className="text-xs text-gray-600">
                Practice complex clinical conversations without the pressure of real HCP interactions. Make mistakes, learn, and improve safely.
              </p>
            </div>

            {/* Benefit 2 */}
            <div className="bg-white rounded-lg shadow-lg p-3">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mb-2">
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-sm font-semibold text-gray-900 mb-1">Real-Time Feedback</h3>
              <p className="text-xs text-gray-600">
                Get immediate responses and clinical questions from AI-powered HCPs. Experience realistic pushback and challenging scenarios.
              </p>
            </div>

            {/* Benefit 3 */}
            <div className="bg-white rounded-lg shadow-lg p-3">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mb-2">
                <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-sm font-semibold text-gray-900 mb-1">Scalable Training</h3>
              <p className="text-xs text-gray-600">
                Train entire field medical teams consistently. Available 24/7 with no scheduling conflicts or geographical limitations.
              </p>
            </div>

            {/* Benefit 4 */}
            <div className="bg-white rounded-lg shadow-lg p-3">
              <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center mb-2">
                <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h3 className="text-sm font-semibold text-gray-900 mb-1">Scenario-Based Learning</h3>
              <p className="text-xs text-gray-600">
                Practice specific therapeutic areas with specialized HCP avatars. Today's demo: tafamidis dose comparison with a cardiologist.
              </p>
            </div>

            {/* Benefit 5 */}
            <div className="bg-white rounded-lg shadow-lg p-3">
              <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center mb-2">
                <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-sm font-semibold text-gray-900 mb-1">Performance Tracking</h3>
              <p className="text-xs text-gray-600">
                Monitor progress over time with detailed analytics. Identify strengths and areas for improvement in your clinical conversations.
              </p>
            </div>

            {/* Benefit 6 */}
            <div className="bg-white rounded-lg shadow-lg p-3">
              <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center mb-2">
                <svg className="w-4 h-4 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <h3 className="text-sm font-semibold text-gray-900 mb-1">Cost-Effective</h3>
              <p className="text-xs text-gray-600">
                Reduce training costs compared to traditional role-play sessions. No travel, no scheduling conflicts, maximum ROI on training investment.
              </p>
            </div>
          </div>

        {/* Demo Scenario Section */}
        <div className="bg-white rounded-lg shadow-lg p-3 mb-3">
          <h3 className="text-sm font-bold text-gray-900 mb-2 text-center">Today's Training Scenario</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <div>
              <h4 className="text-xs font-semibold text-gray-900 mb-1">🎯 Training Objective</h4>
              <p className="text-xs text-gray-600 mb-2">
                Master presenting complex clinical data to a cardiologist. Practice discussing tafamidis dose comparison data 
                from the ATTR-ACT trial.
              </p>
              <h4 className="text-xs font-semibold text-gray-900 mb-1">👨‍⚕️ Your HCP Today</h4>
              <p className="text-xs text-gray-600">
                <strong>Dr. Alex</strong> - Experienced cardiologist specializing in heart failure and ATTR-CM.
              </p>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-gray-900 mb-1">📊 Key Discussion Points</h4>
              <ul className="space-y-0.5 text-xs text-gray-600">
                <li className="flex items-start">
                  <span className="text-blue-600 mr-1">•</span>
                  30% mortality reduction with 80mg vs 20mg tafamidis
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-1">•</span>
                  Earlier functional benefits with higher dose
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-1">•</span>
                  Biomarker differences and clinical significance
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-1">•</span>
                  Safety profile and patient selection criteria
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <h3 className="text-sm font-bold text-gray-900 mb-1">Ready to Transform Field Medical Training?</h3>
          <p className="text-xs text-gray-600 mb-3 max-w-md mx-auto">
            Experience the future of field medical education. Practice with AI-powered HCPs and build confidence.
          </p>
          <button
            onClick={onStartDemo}
            className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors duration-200 shadow-lg"
          >
            Launch Training Session
          </button>
        </div>
      </div>
    </div>
  );
};

export default LandingPage; 