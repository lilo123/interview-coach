import { useState, useEffect, useRef } from 'react';

const QUESTIONS = [
  "Tell me about yourself.",
  "Describe a time you faced a difficult challenge at work.",
  "Where do you see yourself in five years?",
  "Why should we hire you?",
  "Tell me about a time you failed and what you learned.",
  "What is your greatest weakness?",
  "Describe a time you disagreed with a coworker or manager."
];

export default function App() {
  const [apiKey, setApiKey] = useState(localStorage.getItem('openrouter_api_key') || '');
  const [showSettings, setShowSettings] = useState(!apiKey);
  
  const [currentQuestion, setCurrentQuestion] = useState(QUESTIONS[0]);
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [audioUrl, setAudioUrl] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recognitionRef = useRef(null);

  useEffect(() => {
    // Setup Speech Recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      
      recognition.onresult = (event) => {
        let currentTranscript = '';
        for (let i = 0; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        setTranscript(currentTranscript);
      };

      recognitionRef.current = recognition;
    } else {
      console.warn("Speech Recognition API not supported in this browser.");
    }
  }, []);

  const saveApiKey = () => {
    localStorage.setItem('openrouter_api_key', apiKey);
    setShowSettings(false);
  };

  const getRandomQuestion = () => {
    const randomIndex = Math.floor(Math.random() * QUESTIONS.length);
    setCurrentQuestion(QUESTIONS[randomIndex]);
    setTranscript('');
    setAudioUrl(null);
    setFeedback('');
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setTranscript('');
      setFeedback('');
      
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch (e) {
          console.log("Recognition already started");
        }
      }
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Please allow microphone access to record.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
      
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    }
  };

  const getAIFeedback = async () => {
    if (!apiKey) {
      alert("Please set your OpenRouter API Key in settings first.");
      setShowSettings(true);
      return;
    }

    setIsLoading(true);
    setFeedback('');

    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": window.location.href,
          "X-Title": "Interview Coach App"
        },
        body: JSON.stringify({
          model: "google/gemini-2.0-flash:free", 
          messages: [
            { 
              role: "system", 
              content: "You are an expert interview coach. Analyze the user's interview response based on the transcribed text. Provide brief, actionable feedback on: 1. Content (Did they answer the question well?) 2. Tone & Pace (Do they sound confident, based on the text structure and filler words?) Be encouraging but constructive."
            },
            { 
              role: "user", 
              content: `Question: ${currentQuestion}\n\nCandidate's Transcribed Answer: ${transcript || "(No speech detected)"}` 
            }
          ]
        })
      });

      const data = await response.json();
      if (data.choices && data.choices[0]) {
        setFeedback(data.choices[0].message.content);
      } else {
        setFeedback("Error: " + (data.error?.message || "Could not get feedback."));
      }
    } catch (err) {
      console.error(err);
      setFeedback("Failed to connect to AI. Please check your API key or network.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8 font-sans text-gray-800">
      <div className="max-w-xl mx-auto bg-white rounded-xl shadow-md p-6">
        
        <header className="flex justify-between items-center mb-6 border-b pb-4">
          <h1 className="text-xl font-bold text-blue-600">🎙️ Interview Coach</h1>
          <button 
            onClick={() => setShowSettings(!showSettings)}
            className="text-gray-500 hover:text-gray-800 p-2"
          >
            ⚙️ Settings
          </button>
        </header>

        {showSettings && (
          <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h2 className="font-semibold mb-2">OpenRouter API Key</h2>
            <p className="text-sm text-gray-600 mb-3">
              Stored safely in your browser. Share this key with your friend privately.
            </p>
            <div className="flex gap-2">
              <input 
                type="password" 
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-or-v1-..."
                className="flex-1 p-2 border rounded"
              />
              <button 
                onClick={saveApiKey}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Save
              </button>
            </div>
          </div>
        )}

        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Current Question</h2>
            <button 
              onClick={getRandomQuestion}
              className="text-blue-600 text-sm font-medium hover:underline"
            >
              🔄 Randomize
            </button>
          </div>
          <p className="text-lg font-medium text-gray-900 bg-gray-50 p-4 rounded-lg border">
            {currentQuestion}
          </p>
        </div>

        <div className="flex justify-center mb-8">
          {!isRecording ? (
            <button 
              onClick={startRecording}
              className="bg-red-500 text-white rounded-full w-16 h-16 flex items-center justify-center shadow-lg hover:bg-red-600 transition-transform hover:scale-105"
            >
              <span className="text-2xl">🎤</span>
            </button>
          ) : (
            <button 
              onClick={stopRecording}
              className="bg-gray-800 text-white rounded-full w-16 h-16 flex items-center justify-center shadow-lg hover:bg-gray-900 animate-pulse"
            >
              <span className="text-2xl">⏹️</span>
            </button>
          )}
        </div>

        {transcript && (
          <div className="mb-6">
            <h3 className="font-semibold text-gray-700 mb-2">Live Transcript:</h3>
            <p className="bg-gray-50 p-3 rounded border text-gray-700 text-sm min-h-[4rem]">
              {transcript}
            </p>
          </div>
        )}

        {audioUrl && (
          <div className="mb-6">
            <h3 className="font-semibold text-gray-700 mb-2">Playback:</h3>
            <audio src={audioUrl} controls className="w-full mb-4" />
            
            <button 
              onClick={getAIFeedback}
              disabled={isLoading || !transcript}
              className={`w-full p-3 rounded-lg font-bold text-white shadow-md transition-colors ${
                isLoading || !transcript ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-500 hover:bg-green-600'
              }`}
            >
              {isLoading ? '✨ Analyzing...' : '✨ Get AI Feedback'}
            </button>
          </div>
        )}

        {feedback && (
          <div className="mt-6 p-5 bg-green-50 rounded-xl border border-green-200">
            <h3 className="font-bold text-green-800 mb-3">
              💡 Coach's Feedback
            </h3>
            <div className="text-sm text-gray-800 whitespace-pre-wrap">
              {feedback}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
