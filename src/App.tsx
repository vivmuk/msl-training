import React, { useState, useEffect } from 'react';
import UserCamera from './components/UserCamera';
import LandingPage from './components/LandingPage';
import './App.css';

// Scenario data structure
const scenarios = {
  alex: {
    doctorName: 'Dr. Alex',
    specialty: 'Cardiologist',
    description: 'Busy extremely sharp KOL Cardiologist',
    heyGenUrl: "https://labs.heygen.com/guest/streaming-embed?share=eyJxdWFsaXR5IjoiaGlnaCIsImF2YXRhck5hbWUiOiJEZXh0ZXJfRG9jdG9yX1N0YW5kaW5nMl9w%0D%0AdWJsaWMiLCJwcmV2aWV3SW1nIjoiaHR0cHM6Ly9maWxlczIuaGV5Z2VuLmFpL2F2YXRhci92My84%0D%0AOGQ0MjFmOTM5MDQ0YmIwOGQ4OTJlODMzOTMxOTQ4Yl80NTU5MC9wcmV2aWV3X3RhbGtfMS53ZWJw%0D%0AIiwibmVlZFJlbW92ZUJhY2tncm91bmQiOmZhbHNlLCJrbm93bGVkZ2VCYXNlSWQiOiIyZmZkZGQ1%0D%0AMjhiYWE0MTFkOWNkY2Q5NzJiMzhkNTM1MCIsInVzZXJuYW1lIjoiNGE2MjIwYWQyNjUwNDFkNWI4%0D%0ANTk2NjZjMDNiY2FmZjcifQ%3D%3D&inIFrame=1"
  },
  ena: {
    doctorName: 'Dr. Ena',
    specialty: 'General Medicine',
    description: 'Warm HCP meeting for the first time',
    heyGenUrl: "https://labs.heygen.com/guest/streaming-embed?share=eyJxdWFsaXR5IjoiaGlnaCIsImF2YXRhck5hbWUiOiJKdWR5X0RvY3Rvcl9TaXR0aW5nMl9wdWJs%0D%0AaWMiLCJwcmV2aWV3SW1nIjoiaHR0cHM6Ly9maWxlczIuaGV5Z2VuLmFpL2F2YXRhci92My8wMjJj%0D%0AZGIxZjA3OTE0ZTc1ODg3YzY5M2YwYzVmOTdkZF80NTY1MC9wcmV2aWV3X3RhbGtfMS53ZWJwIiwi%0D%0AbmVlZFJlbW92ZUJhY2tncm91bmQiOmZhbHNlLCJrbm93bGVkZ2VCYXNlSWQiOiIxNDNlYThhMDYw%0D%0AOTk0Y2U3YTU1ODc0NjViMzAxOGIzYiIsInVzZXJuYW1lIjoiNGE2MjIwYWQyNjUwNDFkNWI4NTk2%0D%0ANjZjMDNiY2FmZjcifQ%3D%3D&inIFrame=1"
  },
  dat: {
    doctorName: 'Dr. Dat',
    specialty: 'Clinical Research',
    description: 'Clinical Trial PI with enrollment challenges',
    heyGenUrl: "https://labs.heygen.com/guest/streaming-embed?share=eyJxdWFsaXR5IjoiaGlnaCIsImF2YXRhck5hbWUiOiJCcnlhbl9JVF9TaXR0aW5nX3B1YmxpYyIs%0D%0AInByZXZpZXdJbWciOiJodHRwczovL2ZpbGVzMi5oZXlnZW4uYWkvYXZhdGFyL3YzLzMzYzlhYzRh%0D%0AZWFkNDRkZmM4YmMwMDgyYTM1MDYyYTcwXzQ1NTgwL3ByZXZpZXdfdGFsa18zLndlYnAiLCJuZWVk%0D%0AUmVtb3ZlQmFja2dyb3VuZCI6ZmFsc2UsImtub3dsZWRnZUJhc2VJZCI6Ijk0Nzc5YWRhMjkwOTRk%0D%0AZTA4ZjZjYzY4ZDAzNjU4MzRjIiwidXNlcm5hbWUiOiI0YTYyMjBhZDI2NTA0MWQ1Yjg1OTY2NmMw%0D%0AM2JjYWZmNyJ9&inIFrame=1"
  }
};

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState('landing');
  const [selectedScenario, setSelectedScenario] = useState('alex');
  const [isHeyGenReady, setIsHeyGenReady] = useState(false);
  const [heyGenError, setHeyGenError] = useState(false);
  const [userCameraReady, setUserCameraReady] = useState(false);
  const [showHeyGenIframe, setShowHeyGenIframe] = useState(false);

  const currentScenario = scenarios[selectedScenario as keyof typeof scenarios];

  // Initialize HeyGen when training page loads
  useEffect(() => {
    if (currentPage !== 'training') {
      setShowHeyGenIframe(false);
      setIsHeyGenReady(false);
      setHeyGenError(false);
      return;
    }
    
    const host = "https://labs.heygen.com";
    
    const handleMessage = (e: MessageEvent) => {
      if (e.origin === host && e.data && e.data.type && "streaming-embed" === e.data.type) {
        console.log("HeyGen message received:", e.data);
        if ("init" === e.data.action) {
          setIsHeyGenReady(true);
          console.log("HeyGen avatar initialized");
        } else if ("show" === e.data.action) {
          console.log("HeyGen avatar conversation started");
        } else if ("hide" === e.data.action) {
          console.log("HeyGen avatar conversation ended");
        }
      }
    };

    window.addEventListener("message", handleMessage);

    // Set timeout for HeyGen loading
    const loadingTimeoutId = setTimeout(() => {
      if (!isHeyGenReady) {
        console.warn("HeyGen avatar loading timeout");
        setHeyGenError(true);
      }
    }, 15000); // 15 second timeout

    // Show iframe after a small delay to ensure proper mounting
    const showTimeoutId = setTimeout(() => {
      setShowHeyGenIframe(true);
    }, 500);

    return () => {
      window.removeEventListener("message", handleMessage);
      clearTimeout(loadingTimeoutId);
      clearTimeout(showTimeoutId);
    };
  }, [currentPage, isHeyGenReady, selectedScenario]);

  const handleUserCameraReady = () => {
    setUserCameraReady(true);
  };

  const handleUserCameraError = (error: Error) => {
    console.error('User camera error:', error);
  };

  const handleStartDemo = (scenarioId: string) => {
    setSelectedScenario(scenarioId);
    setCurrentPage('training');
  };

  const handleBackToLanding = () => {
    setCurrentPage('landing');
    setSelectedScenario('alex');
  };

  const retryHeyGenLoad = () => {
    setHeyGenError(false);
    setIsHeyGenReady(false);
    setShowHeyGenIframe(false);
    
    // Restart the loading process
    setTimeout(() => {
      setShowHeyGenIframe(true);
    }, 500);
  };

  // Get training script for current scenario
  const getTrainingScript = (): {
    title: string;
    sections: {
      title: string;
      color: string;
      textColor: string;
      content: string;
    }[];
  } => {
    switch (selectedScenario) {
      case 'alex':
        return {
          title: '🩺 Field Medical In-Person Script – Tafamidis Dose Comparison (Dr. Alex, Cardiologist)',
          sections: [
            {
              title: 'Field Medical Opening (Warm & Focused):',
              color: 'bg-blue-50 border-l-4 border-blue-400',
              textColor: 'text-blue-900',
              content: '"Hi Dr. Alex, I appreciate you making time today. I wanted to briefly walk you through the data comparing the 80 mg and 20 mg doses of tafamidis in patients with ATTR-CM, especially now that we have long-term outcomes from the ATTR-ACT study and its extension."'
            },
            {
              title: '1. Study Snapshot (Set Context):',
              color: 'bg-green-50 border-l-4 border-green-400',
              textColor: 'text-green-900',
              content: '"As you may recall, ATTR-ACT enrolled both wild-type and hereditary ATTR-CM patients and randomized them 2:1:2 to tafamidis 80 mg, 20 mg, or placebo. The original trial wasn\'t powered to compare doses directly, but longer-term follow-up now gives us valuable insights."'
            },
            {
              title: '2. Mortality & Hospitalization Outcomes:',
              color: 'bg-red-50 border-l-4 border-red-400',
              textColor: 'text-red-900',
              content: '"Over a median follow-up of 51 months, tafamidis 80 mg was associated with a 30% relative reduction in all-cause mortality compared to 20 mg. That survival benefit held even after adjusting for age, NT-proBNP, and functional status. Both doses reduced CV-related hospitalizations, but the impact was numerically stronger and emerged earlier with 80 mg."'
            },
            {
              title: '3. Functional and QoL Impact:',
              color: 'bg-orange-50 border-l-4 border-orange-400',
              textColor: 'text-orange-900',
              content: '"Patients on tafamidis 80 mg maintained about 75 meters more on the 6-minute walk test at Month 30 versus placebo—similar to 20 mg, but the effect was seen as early as Month 6 with 80 mg, whereas it took longer to emerge with 20 mg. Same trend with quality of life: the decline in KCCQ-OS score was significantly less with both doses, but earlier and more sustained with 80 mg."'
            },
            {
              title: '4. Biomarker Differences:',
              color: 'bg-purple-50 border-l-4 border-purple-400',
              textColor: 'text-purple-900',
              content: '"We also saw greater transthyretin stabilization at Month 1 with 80 mg—nearly 88% of patients vs. 83% with 20 mg. And NT-proBNP levels increased significantly less with 80 mg over time. Troponin I trended lower as well, though not statistically significant when comparing the two doses directly."'
            },
            {
              title: '5. Safety Overview:',
              color: 'bg-teal-50 border-l-4 border-teal-400',
              textColor: 'text-teal-900',
              content: '"Both doses were well tolerated, and there were no dose-related safety concerns even with longer-term use. Rates of adverse events, discontinuation, and serious TEAEs were similar across groups."'
            },
            {
              title: '6. When Dr. Alex Asks: "How does this impact my patients?"',
              color: 'bg-indigo-50 border-l-4 border-indigo-400',
              textColor: 'text-indigo-900',
              content: '"Great question. For your patients with ATTR-CM—especially those with NYHA Class II or III symptoms, elevated NT-proBNP, or declining function—the data support that tafamidis 80 mg can offer earlier, stronger, and more sustained protection compared to 20 mg. Even though the 80 mg group in the study included older patients with more advanced disease, they still had better survival outcomes. So the 80 mg dose may be especially important when time and trajectory matter."'
            },
            {
              title: 'Field Medical Closing (Warm & Professional):',
              color: 'bg-gray-50 border-l-4 border-gray-400',
              textColor: 'text-gray-900',
              content: '"Dr. Alex, I hope this overview helps inform your clinical decision-making. The data really underscore the importance of optimal dosing from the start. I\'d be happy to discuss any specific patient scenarios or provide additional data as needed. Thank you for your time and expertise in caring for these patients."'
            }
          ]
        };

             case 'ena':
         return {
           title: '🤝 Field Medical Introduction Script – First Meeting (Dr. Ena, General Medicine)',
          sections: [
            {
              title: 'Start of Meeting:',
              color: 'bg-blue-50 border-l-4 border-blue-400',
              textColor: 'text-blue-900',
                             content: '"Hi Dr. Ena, thank you for taking the time to meet with me today. I really appreciate it. I\'m [Name], part of the [Company] Medical Affairs team, covering [Region]. I have a background in [PhD/PharmD/Nursing] with a focus in oncology and have recently transitioned into the Field Medical role here."'
            },
            {
              title: 'Clarifying the Purpose:',
              color: 'bg-green-50 border-l-4 border-green-400',
              textColor: 'text-green-900',
              content: '"The reason I reached out is just to introduce myself and better understand what you\'re focused on clinically and academically. My role is entirely non-promotional—I\'m here to support scientific exchange and act as a resource, especially as new data or trials become available."'
            },
            {
              title: 'Engaging the HCP:',
              color: 'bg-purple-50 border-l-4 border-purple-400',
              textColor: 'text-purple-900',
              content: '"Would it be alright if I asked a few questions to learn more about your work and what\'s top of mind for you right now?" (Wait for approval, then ask questions like: "Are there specific tumor types you\'re most focused on?" "Are you currently involved in any clinical trials or collaborative research?" "What are some of the biggest challenges you\'re seeing in treating your patient population?")'
            },
            {
              title: 'Tailored Sharing:',
              color: 'bg-orange-50 border-l-4 border-orange-400',
              textColor: 'text-orange-900',
              content: '"Based on what you shared, you might be interested in a [brief mention of a study/trial]. I\'d be happy to send more detailed information your way or walk through it at a future time if it\'s of interest."'
            },
            {
              title: 'Closing the Meeting:',
              color: 'bg-teal-50 border-l-4 border-teal-400',
              textColor: 'text-teal-900',
              content: '"Thanks again for taking the time today. It\'s great to meet you and learn more about your work. Would it be alright if I followed up occasionally with updates that align with your interests—like new congress abstracts or trial information? And if you ever have questions or need materials for discussions or education, feel free to reach out. I\'ll make sure to get you what you need."'
            }
          ]
        };

             case 'dat':
         return {
           title: '🔬 Field Medical Investigative Script – Clinical Trial Enrollment (Dr. Dat, Clinical Research)',
          sections: [
            {
              title: 'Opening the Conversation:',
              color: 'bg-blue-50 border-l-4 border-blue-400',
              textColor: 'text-blue-900',
              content: '"Dr. Dat, thank you for making the time. I appreciate it. My goal today is to understand the specific challenges you\'re facing so I can accurately report them and we can find a solution together. To start, could you tell me a bit more about how enrollment has been trending from your perspective?"'
            },
            {
              title: 'Investigating Consent Hurdles:',
              color: 'bg-red-50 border-l-4 border-red-400',
              textColor: 'text-red-900',
              content: '"That\'s a crucial insight, thank you. When you mention \'hurdles with consent,\' what specific feedback are you hearing from patients or their families during the consent discussion? What are their primary reservations?"'
            },
            {
              title: 'Investigating Trial Design & Arms:',
              color: 'bg-orange-50 border-l-4 border-orange-400',
              textColor: 'text-orange-900',
              content: '"I see. A demanding visit schedule is a significant practical barrier. I\'ll be sure to highlight that. Moving from the logistics to the science of the trial, are you getting any feedback on the study design itself? For example, any thoughts on the treatment arms?"'
            },
            {
              title: 'Investigating Screening Process:',
              color: 'bg-purple-50 border-l-4 border-purple-400',
              textColor: 'text-purple-900',
              content: '"Thank you, that\'s another critical point. Patient perception of the comparator arm is key. So far, we\'ve discussed the challenges once a patient is identified. Taking a step back, how has the screening process been? Are you finding that the eligibility criteria are impacting the number of potential candidates you can even approach for the trial?"'
            },
            {
              title: 'Summarizing and Closing:',
              color: 'bg-green-50 border-l-4 border-green-400',
              textColor: 'text-green-900',
              content: '"Dr. Dat, this has been incredibly helpful. To ensure I\'ve captured this correctly, the primary barriers are: the significant patient burden from the intensive visit and biopsy schedule, patient hesitation due to concerns about the comparator arm, and the narrow biomarker criteria leading to a high number of screen failures. I will take these precise points back to our clinical development and operations teams this week. This is exactly the kind of field insight we need to improve our trials. I appreciate your frankness."'
            }
          ]
        };

      default:
        return getTrainingScript(); // Default to Alex
    }
  };

  if (currentPage === 'landing') {
    return <LandingPage onStartDemo={handleStartDemo} />;
  }

  const trainingScript = getTrainingScript();

  return (
    <div className="min-h-screen bg-gradient-to-br from-medical-50 to-primary-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Field Medical Training Platform</h1>
              <div className="flex items-center space-x-4 mt-2">
                <span className="flex items-center text-blue-600">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                  Training Active - {currentScenario.doctorName}
                </span>
                <span className="text-sm text-amber-600 bg-amber-100 px-2 py-1 rounded">
                  Demo Mode
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-6">
              <button
                onClick={handleBackToLanding}
                className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Back to Home
              </button>
            </div>
          </div>
        </div>

        {/* Video Training Interface */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-6">
          {/* User Camera Panel */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold text-gray-900">Field Medical (You)</h2>
                <span className="flex items-center">
                  <div className={`w-3 h-3 rounded-full mr-2 ${
                    userCameraReady ? 'bg-green-500' : 'bg-gray-400'
                  }`}></div>
                  <span className={`text-sm font-medium ${
                    userCameraReady ? 'text-green-600' : 'text-gray-600'
                  }`}>
                    {userCameraReady ? 'Ready' : 'Loading'}
                  </span>
                </span>
              </div>
              <div className="relative rounded-lg overflow-hidden bg-gray-900" style={{ height: '500px' }}>
                <UserCamera
                  isActive={true}
                  isSpeaking={false}
                  onCameraReady={handleUserCameraReady}
                  onCameraError={handleUserCameraError}
                />
              </div>
            </div>
          </div>

          {/* HeyGen Avatar Panel */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold text-gray-900">{currentScenario.doctorName} ({currentScenario.specialty})</h2>
                <span className="flex items-center">
                  <div className={`w-3 h-3 rounded-full mr-2 ${
                    isHeyGenReady ? 'bg-green-500' : 'bg-gray-400'
                  }`}></div>
                  <span className={`text-sm font-medium ${
                    isHeyGenReady ? 'text-green-600' : 'text-gray-600'
                  }`}>
                    {isHeyGenReady ? 'Ready' : 'Loading'}
                  </span>
                </span>
              </div>
              <div className="relative rounded-lg overflow-hidden bg-gray-900" style={{ height: '500px' }}>
                {showHeyGenIframe && !heyGenError && (
                  <iframe
                    src={currentScenario.heyGenUrl}
                    title={`${currentScenario.doctorName} - HeyGen Avatar`}
                    allow="microphone; camera; autoplay; fullscreen; display-capture; encrypted-media; gyroscope; picture-in-picture; web-share"
                    style={{
                      width: '100%',
                      height: '100%',
                      border: '0',
                      borderRadius: '8px',
                      backgroundColor: '#f3f4f6'
                    }}
                    onLoad={() => console.log("HeyGen iframe loaded successfully")}
                    onError={(error) => {
                      console.error("HeyGen iframe failed to load:", error);
                      setHeyGenError(true);
                    }}
                  />
                )}
                
                {!showHeyGenIframe && !heyGenError && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-800 text-white rounded-lg">
                    <div className="text-center">
                      <div className="loading-dots mb-4">
                        <div></div>
                        <div></div>
                        <div></div>
                      </div>
                      <p className="text-gray-300">Loading {currentScenario.doctorName}...</p>
                    </div>
                  </div>
                )}
                
                {heyGenError && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-800 text-white rounded-lg">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                      </div>
                      <p className="text-gray-300 font-medium">{currentScenario.doctorName} couldn't load</p>
                      <p className="text-sm text-gray-400 mb-4">There was an issue loading the HCP avatar</p>
                      <button
                        onClick={retryHeyGenLoad}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                      >
                        Try Again
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* How to Use Guide */}
        <div className="bg-blue-50 rounded-lg p-4 mb-6">
          <div className="flex items-center mb-3">
            <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-lg font-semibold text-blue-900">How to Use This Training</h3>
          </div>
          <div className="text-sm text-blue-800 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p><strong>Step 1:</strong> Wait for green "Ready" indicators</p>
              <p><strong>Step 2:</strong> Click "Chat now" in {currentScenario.doctorName}'s panel</p>
            </div>
            <div>
              <p><strong>Step 3:</strong> Use the script below as your guide</p>
              <p><strong>Step 4:</strong> {currentScenario.doctorName} will respond with questions</p>
            </div>
            <div>
              <p><strong>Step 5:</strong> Continue dialogue based on responses</p>
              <p><strong>Step 6:</strong> End session using HCP controls</p>
            </div>
          </div>
        </div>

        {/* Training Script */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center mb-4">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">{trainingScript.title}</h3>
          </div>
          
          <div className="space-y-4 text-sm">
            {trainingScript.sections.map((section: {
              title: string;
              color: string;
              textColor: string;
              content: string;
            }, index: number) => (
              <div key={index} className={`${section.color} p-3 rounded-r-lg`}>
                <h4 className={`font-semibold ${section.textColor} mb-2`}>{section.title}</h4>
                <p className={`${section.textColor.replace('900', '800')} italic`}>
                  {section.content}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default App; 