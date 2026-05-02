import React from 'react';
import { motion } from 'framer-motion';
import { SessionAnalysis } from '../services/claudeAnalysis';

interface PerformanceReviewProps {
  onReturnHome: () => void;
  duration: number;
  scenario: { doctorName: string; specialty: string };
  analysis: SessionAnalysis | null;
}

const ScoreCircle: React.FC<{ score: number; label: string; size?: 'small' | 'large' }> = ({
  score,
  label,
  size = 'large',
}) => {
  const radius = size === 'large' ? 45 : 35;
  const sw = size === 'large' ? 8 : 6;
  const nr = radius - sw * 2;
  const circ = nr * 2 * Math.PI;
  const dash = `${(score / 100) * circ} ${circ}`;
  const color = score >= 85 ? '#10b981' : score >= 70 ? '#f59e0b' : '#ef4444';

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <svg height={radius * 2} width={radius * 2} className="transform -rotate-90">
          <circle stroke="#e5e7eb" fill="transparent" strokeWidth={sw} r={nr} cx={radius} cy={radius} />
          <motion.circle
            stroke={color}
            fill="transparent"
            strokeWidth={sw}
            strokeDasharray={dash}
            strokeLinecap="round"
            r={nr}
            cx={radius}
            cy={radius}
            initial={{ strokeDasharray: `0 ${circ}` }}
            animate={{ strokeDasharray: dash }}
            transition={{ duration: 1.4, ease: 'easeOut' }}
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

const PerformanceReview: React.FC<PerformanceReviewProps> = ({
  onReturnHome,
  duration,
  scenario,
  analysis,
}) => {
  const mins = Math.floor(duration / 60);
  const secs = (duration % 60).toString().padStart(2, '0');

  // Split skills into two clusters for the sub-score circles
  const sciSkills = analysis?.skills.filter(s =>
    ['Scientific Communication', 'Evidence Use', 'Compliance Posture', 'Insight Generation'].includes(s.name)
  ) ?? [];
  const comSkills = analysis?.skills.filter(s =>
    ['Active Listening', 'Probing & Discovery', 'Objection Handling', 'Empathy & EQ', 'Strategic Questioning', 'Closure & Follow-Up'].includes(s.name)
  ) ?? [];

  const avg = (arr: typeof sciSkills) =>
    arr.length ? Math.round(arr.reduce((s, x) => s + x.score, 0) / arr.length) : 0;

  const sciScore = avg(sciSkills);
  const comScore = avg(comSkills);

  const scoreColor = (s: number) => {
    if (s >= 85) return 'bg-green-500';
    if (s >= 70) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const scoreLabel = (s: number) => {
    if (s >= 85) return 'Excellent';
    if (s >= 70) return 'Good';
    return 'Needs Work';
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
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-1">Training Performance Review</h1>
              <p className="text-gray-600">Session with {scenario.doctorName} · {scenario.specialty}</p>
              <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                <span>Duration: {mins}:{secs}</span>
                <span>·</span>
                <span>Completed: {new Date().toLocaleDateString()}</span>
              </div>
            </div>
            <button
              onClick={onReturnHome}
              className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-6 rounded-lg transition-colors flex items-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <span>Return Home</span>
            </button>
          </div>
        </div>

        {!analysis ? (
          <div className="bg-white rounded-lg shadow-sm p-10 text-center text-gray-500">
            <p className="text-lg font-medium mb-2">No analysis available</p>
            <p className="text-sm">Add <code className="bg-gray-100 px-1 rounded">REACT_APP_ANTHROPIC_API_KEY</code> to your <code className="bg-gray-100 px-1 rounded">.env</code> to enable AI-powered scoring.</p>
          </div>
        ) : (
          <>
            {/* Summary */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.05 }}
              className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-6 text-sm text-blue-900"
            >
              <span className="font-semibold mr-1">Coach summary:</span>
              {analysis.summary}
            </motion.div>

            {/* Score circles */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              {[
                { score: analysis.overallScore, label: 'Overall Performance' },
                { score: sciScore, label: 'Scientific Acumen' },
                { score: comScore, label: 'Communication Skills' },
              ].map(({ score, label }, i) => (
                <motion.div
                  key={label}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.1 + i * 0.1 }}
                  className="bg-white rounded-lg shadow-sm p-6 text-center"
                >
                  <ScoreCircle score={score} label={label} />
                  <div className="mt-3 text-sm text-gray-600">{scoreLabel(score)}</div>
                </motion.div>
              ))}
            </div>

            {/* All 10 skills */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="bg-white rounded-lg shadow-sm p-6 mb-6"
            >
              <h3 className="text-xl font-semibold text-gray-900 mb-5">MSL Competency Breakdown</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                {analysis.skills.map((skill, idx) => (
                  <div key={skill.name}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium text-gray-700">{skill.name}</span>
                      <span className="text-sm font-bold text-gray-900">{skill.score}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5 mb-1">
                      <motion.div
                        className={`h-1.5 rounded-full ${scoreColor(skill.score)}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${skill.score}%` }}
                        transition={{ delay: 0.5 + idx * 0.05, duration: 0.7 }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 leading-snug">{skill.feedback}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Strengths & improvements */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.55 }}
              className="bg-white rounded-lg shadow-sm p-6 mb-6"
            >
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Key Insights & Recommendations</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {analysis.strengths.map((s, i) => (
                  <div key={i} className="p-4 rounded-lg border-l-4 bg-green-50 border-green-400">
                    <div className="flex items-start space-x-2">
                      <span className="text-xl">✅</span>
                      <div>
                        <h4 className="font-semibold text-green-800">{s.title}</h4>
                        <p className="text-sm mt-1 text-green-700">{s.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
                {analysis.improvements.map((im, i) => (
                  <div key={i} className="p-4 rounded-lg border-l-4 bg-orange-50 border-orange-400">
                    <div className="flex items-start space-x-2">
                      <span className="text-xl">⚠️</span>
                      <div>
                        <h4 className="font-semibold text-orange-800">{im.title}</h4>
                        <p className="text-sm mt-1 text-orange-700">{im.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Next steps */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.65 }}
              className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-lg shadow-sm p-6 text-white"
            >
              <h3 className="text-xl font-semibold mb-4">Next Steps for Improvement</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {analysis.nextSteps.slice(0, 3).map((step, i) => (
                  <div key={i} className="bg-white bg-opacity-10 rounded-lg p-4">
                    <h4 className="font-semibold mb-2">Step {i + 1}</h4>
                    <p className="text-sm opacity-90">{step}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </div>
    </motion.div>
  );
};

export default PerformanceReview;
