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

const MODELS = [
  { id: "mistralai/mistral-small-3.1-24b-instruct:free", name: "Mistral Small 3.1 (Free)" },
  { id: "google/gemma-3-27b-it:free", name: "Google Gemma 3 27B (Free)" },
  { id: "meta-llama/llama-3.3-70b-instruct:free", name: "Meta Llama 3.3 70B (Free)" },
  { id: "nousresearch/hermes-3-llama-3.1-405b:free", name: "Hermes 3 405B (Free)" },
  { id: "google/gemini-2.5-flash", name: "Gemini 2.5 Flash (Paid/Cheap)" },
  { id: "openai/gpt-4o-mini", name: "GPT-4o Mini (Paid/Cheap)" },
  { id: "xiaomi/mimo-v2-omni", name: "Xiaomi MiMo-V2-Omni (Paid/Cheap)" },
  { id: "xiaomi/mimo-v2-pro", name: "Xiaomi MiMo-V2-Pro (Paid/Cheap)" },
  { id: "xiaomi/mimo-v2-flash", name: "Xiaomi MiMo-V2-Flash (Paid/Cheap)" }
];

export default function App() {
  const [apiKey, setApiKey] = useState(localStorage.getItem('openrouter_api_key') || '');
  const [selectedModel, setSelectedModel] = useState(localStorage.getItem('openrouter_model') || MODELS[0].id);
  const [showSettings, setShowSettings] = useState(!apiKey);
  
  const [currentQuestion, setCurrentQuestion] = useState(QUESTIONS[0]);
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [audioUrl, setAudioUrl] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recognitionRef = useRef(null);

  useEffect(() => {
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
      
      recognition.onerror = (e) => {
         console.error("Speech recognition error", e);
         if (e.error !== 'no-speech') {
             setErrorMsg("Transcription error: " + e.error);
         }
      };

      recognitionRef.current = recognition;
    } else {
      setErrorMsg("⚠️ Live transcription is not supported in this browser. Please use Safari (on iPhone) or Chrome (on Android/Desktop).");
    }
  }, []);

  const saveSettings = () => {
    localStorage.setItem('openrouter_api_key', apiKey);
    localStorage.setItem('openrouter_model', selectedModel);
    setShowSettings(false);
  };

  const getRandomQuestion = () => {
    const randomIndex = Math.floor(Math.random() * QUESTIONS.length);
    setCurrentQuestion(QUESTIONS[randomIndex]);
    setTranscript('');
    setAudioUrl(null);
    setFeedback('');
    setErrorMsg('');
  };

  const startRecording = async () => {
    try {
      setErrorMsg('');
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
        const mimeType = mediaRecorder.mimeType || 'audio/mp4';
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
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
      setErrorMsg("Please allow microphone access to record.");
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
          model: selectedModel, 
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
        setFeedback(`Error from ${selectedModel}:\n` + JSON.stringify(data.error || data, null, 2));
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
            <input 
              type="password" 
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-or-v1-..."
              className="w-full p-2 border rounded mb-4"
            />

            <h2 className="font-semibold mb-2">AI Model</h2>
            <select 
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="w-full p-2 border rounded mb-4 bg-white"
            >
              {MODELS.map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>

            <button 
              onClick={saveSettings}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 font-bold"
            >
              Save Settings
            </button>
          </div>
        )}

        {errorMsg && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg border border-red-300 text-sm">
            {errorMsg}
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
          <div className="mt-6 p-5 bg-green-50 rounded-xl border border-green-200 overflow-x-auto">
            <h3 className="font-bold text-green-800 mb-3">
              💡 Coach's Feedback
            </h3>
            <pre className="text-sm text-gray-800 whitespace-pre-wrap font-sans">
              {feedback}
            </pre>
          </div>
        )}

      </div>
    </div>
  );
}
