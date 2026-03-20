import { useState, useEffect, useRef } from 'react';
import questionsData from './questions.json';

// Utility for formatting time
const formatTime = (seconds) => {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
};

function App() {
  const [question, setQuestion] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [time, setTime] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [audioUrl, setAudioUrl] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const timerRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recognitionRef = useRef(null);

  useEffect(() => {
    getRandomQuestion();
    
    // Setup Speech Recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      
      recognitionRef.current.onresult = (event) => {
        let currentTranscript = '';
        for (let i = 0; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        setTranscript(currentTranscript);
      };
    }
  }, []);

  const getRandomQuestion = () => {
    const randomIndex = Math.floor(Math.random() * questionsData.length);
    setQuestion(questionsData[randomIndex]);
    resetState();
  };

  const resetState = () => {
    setTranscript('');
    setAudioUrl(null);
    setFeedback(null);
    setTime(0);
    clearInterval(timerRef.current);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      
      // Start timer
      timerRef.current = setInterval(() => {
        setTime((prev) => prev + 1);
      }, 1000);

      // Start transcription
      if (recognitionRef.current) {
        recognitionRef.current.start();
      }

    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Microphone access is required to record your answer.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(timerRef.current);
      
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    }
  };

  const analyzeAnswer = () => {
    setIsAnalyzing(true);
    // Simulate API call to AI
    setTimeout(() => {
      setFeedback({
        content: "You hit the main points well. To improve, try using the STAR method (Situation, Task, Action, Result) more explicitly to structure your response.",
        pace: "Your speaking pace was excellent, steady and easy to follow. You avoided rushing.",
        tone: "Confident and professional, with a positive demeanor.",
        time: `You spoke for ${formatTime(time)}. This is a good duration; aim to keep answers between 1.5 and 3 minutes.`
      });
      setIsAnalyzing(false);
    }, 2500);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 font-sans text-gray-800">
      <div className="max-w-3xl mx-auto space-y-6">
        
        {/* Header */}
        <header className="text-center space-y-2">
          <h1 className="text-3xl md:text-4xl font-bold text-blue-600">AI Interview Coach</h1>
          <p className="text-gray-500">Practice, record, and improve your interview skills</p>
        </header>

        {/* Question Card */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-4 gap-2">
            <span className="bg-blue-100 text-blue-700 text-xs font-semibold px-3 py-1.5 rounded-full uppercase tracking-wide w-max">
              {question?.category || 'Question'}
            </span>
            <button 
              onClick={getRandomQuestion}
              className="text-sm text-gray-500 hover:text-blue-600 font-medium transition-colors text-left md:text-right"
            >
              Skip / Next Question →
            </button>
          </div>
          <h2 className="text-xl md:text-2xl font-semibold leading-relaxed">
            {question?.question}
          </h2>
        </div>

        {/* Recording Controls */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center space-y-6">
          <div className="text-5xl font-mono font-light text-gray-700">
            {formatTime(time)}
          </div>
          
          <div className="flex gap-4 w-full md:w-auto">
            {!isRecording ? (
              <button 
                onClick={startRecording}
                className="flex-1 md:flex-none bg-red-500 hover:bg-red-600 text-white font-semibold py-3 px-8 rounded-full shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <span className="w-3 h-3 bg-white rounded-full animate-pulse"></span>
                Start Recording
              </button>
            ) : (
              <button 
                onClick={stopRecording}
                className="flex-1 md:flex-none bg-gray-800 hover:bg-gray-900 text-white font-semibold py-3 px-8 rounded-full shadow-md transition-all flex items-center justify-center gap-2"
              >
                <span className="w-3 h-3 bg-red-500 rounded-sm"></span>
                Stop Recording
              </button>
            )}
          </div>

          {audioUrl && (
            <div className="w-full mt-4 flex flex-col items-center gap-4">
              <audio src={audioUrl} controls className="w-full max-w-md" />
              <button 
                onClick={analyzeAnswer}
                disabled={isAnalyzing}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 px-8 rounded-xl shadow-md transition-colors w-full max-w-md flex items-center justify-center gap-2"
              >
                {isAnalyzing ? (
                  <>
                     <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                     Analyzing with AI...
                  </>
                ) : '✨ Get AI Feedback'}
              </button>
            </div>
          )}
        </div>

        {/* Transcript */}
        {(transcript || isRecording) && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              📝 Live Transcript
              {isRecording && <span className="flex h-2 w-2 relative"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span></span>}
            </h3>
            <div className="bg-gray-50 rounded-lg p-4 min-h-[100px] text-gray-700 whitespace-pre-wrap">
              {transcript || <span className="text-gray-400 italic">Listening...</span>}
            </div>
          </div>
        )}

        {/* AI Feedback */}
        {feedback && (
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-2xl shadow-sm border border-blue-100 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h3 className="text-xl font-bold text-blue-900 mb-4 flex items-center gap-2">
              ✨ AI Feedback
            </h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="bg-white p-5 rounded-xl shadow-sm">
                <h4 className="font-bold text-blue-800 mb-2 text-sm uppercase tracking-wider">Content</h4>
                <p className="text-gray-700">{feedback.content}</p>
              </div>
              <div className="bg-white p-5 rounded-xl shadow-sm">
                <h4 className="font-bold text-blue-800 mb-2 text-sm uppercase tracking-wider">Pace</h4>
                <p className="text-gray-700">{feedback.pace}</p>
              </div>
              <div className="bg-white p-5 rounded-xl shadow-sm">
                <h4 className="font-bold text-blue-800 mb-2 text-sm uppercase tracking-wider">Tone</h4>
                <p className="text-gray-700">{feedback.tone}</p>
              </div>
              <div className="bg-white p-5 rounded-xl shadow-sm">
                <h4 className="font-bold text-blue-800 mb-2 text-sm uppercase tracking-wider">Time Management</h4>
                <p className="text-gray-700">{feedback.time}</p>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default App;
