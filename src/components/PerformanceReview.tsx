import React from 'react';
import { motion } from 'framer-motion';

interface PerformanceReviewProps {
  onReturnHome: () => void;
  sessionMetrics: {
    duration: number;
    messagesExchanged: number;
    status: string;
  };
}

const PerformanceReview: React.FC<PerformanceReviewProps> = ({ onReturnHome, sessionMetrics }) => {
  // Mock performance data
  const overallScore = 87;
  const scientificScore = 92;
  const behavioralScore = 82;
  
  const skillsData = [
    { skill: 'Clinical Data Presentation', score: 94, target: 85, color: 'bg-green-500' },
    { skill: 'Evidence Communication', score: 89, target: 80, color: 'bg-green-500' },
    { skill: 'Question Handling', score: 78, target: 85, color: 'bg-yellow-500' },
    { skill: 'Relationship Building', score: 85, target: 80, color: 'bg-green-500' },
    { skill: 'Objection Management', score: 73, target: 80, color: 'bg-red-500' },
  ];

  const conversationFlow = [
    { time: '0:30', phase: 'Opening', quality: 'excellent', notes: 'Strong opening, established rapport quickly' },
    { time: '2:15', phase: 'Data Presentation', quality: 'good', notes: 'Clear presentation of efficacy data' },
    { time: '4:45', phase: 'Q&A Handling', quality: 'needs-improvement', notes: 'Hesitated on safety questions' },
    { time: '6:30', phase: 'Closing', quality: 'good', notes: 'Effective summary and next steps' },
  ];

  const keyInsights = [
    {
      type: 'strength',
      title: 'Strong Clinical Knowledge',
      description: 'Demonstrated excellent understanding of tafamidis mechanism and ATTR-ACT trial design.',
      icon: '🎯'
    },
    {
      type: 'improvement',
      title: 'Dose Comparison Clarity',
      description: 'Practice articulating 80mg vs 20mg differences more confidently with specific timeframes.',
      icon: '⚠️'
    },
    {
      type: 'strength',
      title: 'Professional Demeanor',
      description: 'Maintained professional tone and showed respect for HCP expertise throughout.',
      icon: '👔'
    },
    {
      type: 'improvement',
      title: 'Biomarker Discussion',
      description: 'Use more specific numbers when discussing NT-proBNP and troponin improvements.',
      icon: '⏸️'
    }
  ];

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case 'excellent': return 'text-green-600 bg-green-100';
      case 'good': return 'text-blue-600 bg-blue-100';
      case 'needs-improvement': return 'text-orange-600 bg-orange-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const ScoreCircle = ({ score, label, size = 'large' }: { score: number; label: string; size?: 'small' | 'large' }) => {
    const radius = size === 'large' ? 45 : 35;
    const strokeWidth = size === 'large' ? 8 : 6;
    const normalizedRadius = radius - strokeWidth * 2;
    const circumference = normalizedRadius * 2 * Math.PI;
    const strokeDasharray = `${score / 100 * circumference} ${circumference}`;
    
    return (
      <div className="flex flex-col items-center">
        <div className="relative">
          <svg
            height={radius * 2}
            width={radius * 2}
            className="transform -rotate-90"
          >
            <circle
              stroke="#e5e7eb"
              fill="transparent"
              strokeWidth={strokeWidth}
              r={normalizedRadius}
              cx={radius}
              cy={radius}
            />
            <motion.circle
              stroke={score >= 85 ? "#10b981" : score >= 70 ? "#f59e0b" : "#ef4444"}
              fill="transparent"
              strokeWidth={strokeWidth}
              strokeDasharray={strokeDasharray}
              strokeLinecap="round"
              r={normalizedRadius}
              cx={radius}
              cy={radius}
              initial={{ strokeDasharray: "0 1000" }}
              animate={{ strokeDasharray }}
              transition={{ duration: 1.5, ease: "easeOut" }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={`font-bold ${size === 'large' ? 'text-2xl' : 'text-lg'} text-gray-800`}>
              {score}
            </span>
          </div>
        </div>
        <span className={`mt-2 text-center font-medium ${size === 'large' ? 'text-sm' : 'text-xs'} text-gray-600`}>
          {label}
        </span>
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gradient-to-br from-medical-50 to-primary-50 p-4"
    >
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Training Performance Review</h1>
              <p className="text-gray-600">Tafamidis Discussion with Dr. Alex</p>
              <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                <span>Duration: {Math.floor(sessionMetrics.duration / 60)}:{(sessionMetrics.duration % 60).toString().padStart(2, '0')}</span>
                <span>•</span>
                <span>Messages: {sessionMetrics.messagesExchanged}</span>
                <span>•</span>
                <span>Completed: {new Date().toLocaleDateString()}</span>
              </div>
            </div>
            <button
              onClick={onReturnHome}
              className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-6 rounded-lg transition-colors flex items-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <span>Return Home</span>
            </button>
          </div>
        </div>

        {/* Overall Performance */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-lg shadow-sm p-6 text-center"
          >
            <ScoreCircle score={overallScore} label="Overall Performance" />
            <div className="mt-4 text-sm text-gray-600">
              {overallScore >= 85 ? 'Excellent' : overallScore >= 70 ? 'Good' : 'Needs Improvement'}
            </div>
          </motion.div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-lg shadow-sm p-6 text-center"
          >
            <ScoreCircle score={scientificScore} label="Scientific Knowledge" />
            <div className="mt-4 text-sm text-gray-600">Strong clinical expertise</div>
          </motion.div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-lg shadow-sm p-6 text-center"
          >
            <ScoreCircle score={behavioralScore} label="Communication Skills" />
            <div className="mt-4 text-sm text-gray-600">Room for improvement</div>
          </motion.div>
        </div>

        {/* Detailed Analysis */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Skills Breakdown */}
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-lg shadow-sm p-6"
          >
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Skills Assessment</h3>
            <div className="space-y-4">
              {skillsData.map((skill, index) => (
                <div key={skill.skill} className="relative">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">{skill.skill}</span>
                    <span className="text-sm font-bold text-gray-900">{skill.score}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <motion.div
                      className={`h-2 rounded-full ${skill.color}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${skill.score}%` }}
                      transition={{ delay: 0.5 + index * 0.1, duration: 0.8 }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Target: {skill.target}%</span>
                    <span className={skill.score >= skill.target ? 'text-green-600' : 'text-red-600'}>
                      {skill.score >= skill.target ? '+' : ''}{skill.score - skill.target}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Conversation Flow */}
          <motion.div
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="bg-white rounded-lg shadow-sm p-6"
          >
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Conversation Timeline</h3>
            <div className="space-y-4">
              {conversationFlow.map((item, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-12 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
                    <span className="text-xs font-medium text-primary-700">{item.time}</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-medium text-gray-900">{item.phase}</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getQualityColor(item.quality)}`}>
                        {item.quality.replace('-', ' ')}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{item.notes}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Key Insights */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-lg shadow-sm p-6 mb-6"
        >
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Key Insights & Recommendations</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {keyInsights.map((insight, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border-l-4 ${
                  insight.type === 'strength' 
                    ? 'bg-green-50 border-green-400' 
                    : 'bg-orange-50 border-orange-400'
                }`}
              >
                <div className="flex items-start space-x-3">
                  <span className="text-2xl">{insight.icon}</span>
                  <div>
                    <h4 className={`font-semibold ${
                      insight.type === 'strength' ? 'text-green-800' : 'text-orange-800'
                    }`}>
                      {insight.title}
                    </h4>
                    <p className={`text-sm mt-1 ${
                      insight.type === 'strength' ? 'text-green-700' : 'text-orange-700'
                    }`}>
                      {insight.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* MSL Script Reference */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="bg-white rounded-lg shadow-sm p-6 mb-6"
        >
          <h3 className="text-xl font-semibold text-gray-900 mb-4">📋 MSL Reference Script - Tafamidis Discussion</h3>
          <div className="bg-gray-50 rounded-lg p-4 text-sm space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">👋 Key Opening Points</h4>
                <ul className="text-gray-700 space-y-1 text-xs">
                  <li>• Brief introduction & respect for time</li>
                  <li>• Focus on dose comparison insights</li>
                  <li>• Reference ATTR-ACT trial data</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">⚰️ Mortality Data</h4>
                <ul className="text-gray-700 space-y-1 text-xs">
                  <li>• 80mg: Statistically significant reduction</li>
                  <li>• 20mg: Trend, not significant</li>
                  <li>• 30% relative reduction (80mg vs 20mg)</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">🧍 Functional Outcomes</h4>
                <ul className="text-gray-700 space-y-1 text-xs">
                  <li>• 80mg effect: By Month 6</li>
                  <li>• 20mg effect: Closer to Month 12</li>
                  <li>• Both doses better than placebo</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">🧪 Biomarkers</h4>
                <ul className="text-gray-700 space-y-1 text-xs">
                  <li>• Higher TTR stabilization with 80mg</li>
                  <li>• Lower NT-proBNP increases (80mg)</li>
                  <li>• Statistically significant for 80mg</li>
                </ul>
              </div>
            </div>
            <div className="bg-blue-50 rounded p-3 mt-4">
              <h4 className="font-semibold text-blue-900 mb-1">✅ Key Wrap-up Message</h4>
              <p className="text-blue-800 text-xs">
                "While both doses helped, the 80mg dose showed more robust and earlier benefit across multiple endpoints—including mortality, function, and biomarkers."
              </p>
            </div>
          </div>
        </motion.div>

        {/* Action Items */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-lg shadow-sm p-6 text-white"
        >
          <h3 className="text-xl font-semibold mb-4">Next Steps for Improvement</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white bg-opacity-10 rounded-lg p-4">
              <h4 className="font-semibold mb-2">🎯 Practice Focus</h4>
              <p className="text-sm opacity-90">
                Practice dose comparison timelines and biomarker discussion with specific data points
              </p>
            </div>
            <div className="bg-white bg-opacity-10 rounded-lg p-4">
              <h4 className="font-semibold mb-2">📚 Study Areas</h4>
              <p className="text-sm opacity-90">
                Review ATTR-ACT trial methodology and long-term extension data
              </p>
            </div>
            <div className="bg-white bg-opacity-10 rounded-lg p-4">
              <h4 className="font-semibold mb-2">🔄 Next Training</h4>
              <p className="text-sm opacity-90">
                Schedule follow-up session focusing on challenging dosing questions
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default PerformanceReview; 