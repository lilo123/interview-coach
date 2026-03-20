import React, { useState, useEffect, useRef } from 'react';

const QUESTIONS = [
  "Tell me about yourself.",
  "Why do you want to work here?",
  "Walk me through your resume.",
  "Tell me about a project that you're most proud of.",
  "Describe a time you faced a significant challenge and how you overcame it.",
  "Tell me about a time you had to lead a team through a difficult situation.",
  "Describe a time when you disagreed with your manager.",
  "How do you prioritize multiple deadlines?",
  "Tell me about a time you failed.",
  "Where do you see yourself in 5 years?",
  "How do you handle ambiguous situations?",
  "Tell me about a time you had to persuade someone to see your point of view."
];

const MODELS = [
  { id: "meta-llama/llama-3.3-70b-instruct:free", name: "Llama 3.3 70B (Free)" },
  { id: "google/gemma-3-27b-it:free", name: "Gemma 3 27B (Free)" },
  { id: "custom", name: "Other (please specify)" }
];

const renderHighlightedText = (text) => {
  if (!text) return null;
  // Split by **bold** text
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <mark key={i} className="bg-yellow-200 text-gray-900 font-semibold px-1 rounded">{part.slice(2, -2)}</mark>;
    }
    return <span key={i}>{part}</span>;
  });
};

export default function App() {
  const [activeTab, setActiveTab] = useState('practice');
  const [history, setHistory] = useState([]);

  const [showSettings, setShowSettings] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [selectedModel, setSelectedModel] = useState(MODELS[0].id);
  const [customModel, setCustomModel] = useState("");

  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [audioUrl, setAudioUrl] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [currentQuestion, setCurrentQuestion] = useState(QUESTIONS[0]);

  const mediaRecorder = useRef(null);
  const audioChunks = useRef([]);
  const recognition = useRef(null);

  useEffect(() => {
    const savedKey = localStorage.getItem('or_api_key') || "";
    let savedModel = localStorage.getItem('or_model') || MODELS[0].id;
    if (savedModel !== 'custom' && !MODELS.find(m => m.id === savedModel)) {
      savedModel = MODELS[0].id;
    }
    const savedCustom = localStorage.getItem('or_custom_model') || "";
    const savedHistory = JSON.parse(localStorage.getItem('interview_history') || "[]");

    setApiKey(savedKey);
    setSelectedModel(savedModel);
    setCustomModel(savedCustom);
    setHistory(savedHistory);
    getRandomQuestion();

    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognition.current = new SpeechRecognition();
      recognition.current.continuous = true;
      recognition.current.interimResults = true;

      recognition.current.onresult = (event) => {
        let currentTranscript = '';
        for (let i = 0; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        setTranscript(currentTranscript);
      };
    } else {
      setErrorMsg("Speech recognition is not supported in this browser. Please use Chrome.");
    }
  }, []);

  const saveSettings = () => {
    localStorage.setItem('or_api_key', apiKey);
    localStorage.setItem('or_model', selectedModel);
    localStorage.setItem('or_custom_model', customModel);
    setShowSettings(false);
  };

  const getRandomQuestion = () => {
    const randomQ = QUESTIONS[Math.floor(Math.random() * QUESTIONS.length)];
    setCurrentQuestion(randomQ);
    setTranscript("");
    setAudioUrl(null);
    setFeedback(null);
    setErrorMsg("");
  };

    const startRecording = async () => {
    setTranscript("");
    setAudioUrl(null);
    setFeedback(null);
    setErrorMsg("");
    audioChunks.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      mediaRecorder.current = new MediaRecorder(stream);

      mediaRecorder.current.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunks.current.push(e.data);
      };

      mediaRecorder.current.onstop = () => {
        const type = audioChunks.current[0] ? audioChunks.current[0].type : 'audio/webm';
        const audioBlob = new Blob(audioChunks.current, { type });
        setAudioUrl(URL.createObjectURL(audioBlob));
      };

      mediaRecorder.current.start();
      if (recognition.current) recognition.current.start();
      setIsRecording(true);
    } catch (err) {
      setErrorMsg("Microphone access denied. Please allow microphone access to practice.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorder.current && mediaRecorder.current.state === 'recording') {
      mediaRecorder.current.stop();
      mediaRecorder.current.stream.getTracks().forEach(track => track.stop());
    }
    if (recognition.current) recognition.current.stop();
    setIsRecording(false);
  };

  const getAIFeedback = async () => {
    if (!apiKey) {
      setErrorMsg("Please enter your OpenRouter API Key in settings.");
      setShowSettings(true);
      return;
    }

    setIsLoading(true);
    setErrorMsg("");

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
          model: selectedModel === 'custom' ? customModel : selectedModel,
          messages: [
            {
              role: "system",
              content: `You are an expert McKinsey interview coach. Analyze the candidate's response.\nFocus on:\n1. Content: Structured thinking, Top-Down communication, MECE principle.\n2. Tone & Pace: Executive presence, confidence, clarity.\n3. Recommendations: Actionable steps to improve.\n4. Improved Transcript: Rewrite their exact answer to sound more professional, structured, and impactful. Stay as close to the original as possible. Wrap any modified or added words in **bold**.\n\nYou MUST respond in ONLY valid JSON format with exactly these SIX keys:\n{\n  "score": "A score out of 10 (e.g. '7/10')",\n  "short_summary": "A 1-sentence overarching summary of their performance.",\n  "content": "Your detailed feedback on structure...",\n  "tone_and_pace": "Your feedback on delivery...",\n  "recommendations": "Your actionable steps...",\n  "improved_transcript": "The rewritten transcript with changes in **bold**."\n}\nDo not output any other text, markdown blocks, or introduction.`
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
        const rawContent = data.choices[0].message.content;
        try {
          const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
          const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : rawContent);
          setFeedback(parsed);

          // Save to history
          const newEntry = {
            id: Date.now(),
            date: new Date().toLocaleString(),
            question: currentQuestion,
            transcript: transcript,
            feedback: parsed
          };
          const newHistory = [newEntry, ...history];
          setHistory(newHistory);
          localStorage.setItem('interview_history', JSON.stringify(newHistory));

        } catch (e) {
          console.error("Failed to parse JSON", rawContent);
          setFeedback(rawContent);
        }
      } else {
        setFeedback(`Error from model:\n` + JSON.stringify(data.error || data, null, 2));
      }
    } catch (err) {
      console.error(err);
      setFeedback("Failed to connect to AI. Please check your API key or network.");
    } finally {
      setIsLoading(false);
    }
  };

  const clearHistory = () => {
    if (confirm("Are you sure you want to clear your practice history?")) {
      setHistory([]);
      localStorage.removeItem('interview_history');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8 font-sans text-gray-800">
      <div className="max-w-xl mx-auto bg-white rounded-xl shadow-md p-6">

        <header className="flex justify-between items-center mb-4">
          <h1 className="text-xl font-bold text-blue-600">🎙️ Interview Coach</h1>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="text-gray-500 hover:text-gray-800 p-2"
          >
            ⚙️ Settings
          </button>
        </header>

        {/* TABS */}
        <div className="flex border-b mb-6">
          <button
            onClick={() => setActiveTab('practice')}
            className={`flex-1 py-2 text-center font-medium ${activeTab === 'practice' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Practice
          </button>
          <button
            onClick={() => setActiveTab('summary')}
            className={`flex-1 py-2 text-center font-medium ${activeTab === 'summary' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Summary ({history.length})
          </button>
        </div>

        {showSettings && (
          <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h2 className="font-semibold mb-2">OpenRouter API Key</h2>
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
            {selectedModel === 'custom' && (
              <input
                type="text"
                value={customModel}
                onChange={(e) => setCustomModel(e.target.value)}
                placeholder="e.g. google/gemini-2.5-flash"
                className="w-full p-2 border rounded mb-4"
              />
            )}

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

        {activeTab === 'practice' && (
          <div>
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

            {feedback && typeof feedback === 'object' && !Array.isArray(feedback) ? (
              <div className="mt-6 space-y-4 text-left">
                <div className="flex items-center space-x-4 mb-4">
                   <div className="bg-yellow-100 text-yellow-800 font-bold px-4 py-2 rounded-lg border border-yellow-300 shadow-sm">
                     Score: {feedback.score || 'N/A'}
                   </div>
                   <div className="text-sm font-medium text-gray-700 flex-1 italic bg-white p-2 rounded border border-gray-200">
                     "{feedback.short_summary}"
                   </div>
                </div>

                {feedback.improved_transcript && (
                  <div className="p-4 bg-orange-50 rounded-xl border border-orange-200">
                    <h3 className="font-bold text-orange-800 mb-2">✨ Improved Transcript</h3>
                    <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                      {renderHighlightedText(feedback.improved_transcript)}
                    </p>
                  </div>
                )}

                <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                  <h3 className="font-bold text-blue-800 mb-2">📊 Content & Structure (McKinsey Style)</h3>
                  <p className="text-sm text-gray-800 whitespace-pre-wrap">{feedback.content}</p>
                </div>
                <div className="p-4 bg-purple-50 rounded-xl border border-purple-200">
                  <h3 className="font-bold text-purple-800 mb-2">🗣️ Tone & Executive Presence</h3>
                  <p className="text-sm text-gray-800 whitespace-pre-wrap">{feedback.tone_and_pace}</p>
                </div>
                <div className="p-4 bg-green-50 rounded-xl border border-green-200">
                  <h3 className="font-bold text-green-800 mb-2">🎯 Actionable Recommendations</h3>
                  <p className="text-sm text-gray-800 whitespace-pre-wrap">{feedback.recommendations}</p>
                </div>
                {feedback.improved_transcript && (
                  <div className="p-4 bg-orange-50 rounded-xl border border-orange-200 col-span-1 md:col-span-2">
                    <h3 className="font-bold text-orange-800 mb-2">✨ Improved Answer</h3>
                    <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                      {renderHighlightedText(feedback.improved_transcript)}
                    </p>
                  </div>
                )}
              </div>
            ) : feedback ? (
              <div className="mt-6 p-5 bg-gray-50 rounded-xl border border-gray-200 overflow-x-auto text-left">
                <h3 className="font-bold text-gray-800 mb-3">💡 Raw Feedback</h3>
                <pre className="text-sm text-gray-800 whitespace-pre-wrap font-sans">{typeof feedback === 'string' ? feedback : JSON.stringify(feedback, null, 2)}</pre>
              </div>
            ) : null}
          </div>
        )}

        {activeTab === 'summary' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold text-gray-800">Your Practice History</h2>
              {history.length > 0 && (
                <button onClick={clearHistory} className="text-xs text-red-600 hover:underline px-2 py-1 rounded hover:bg-red-50">
                  Clear History
                </button>
              )}
            </div>

            {history.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                <p className="text-gray-500 mb-2">No practice sessions yet.</p>
                <button onClick={() => setActiveTab('practice')} className="text-blue-600 text-sm font-medium hover:underline">
                  Start your first practice!
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {history.map((entry) => (
                  <div key={entry.id} className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                    <div className="bg-gray-50 px-4 py-3 border-b border-gray-100 flex justify-between items-center text-sm">
                      <span className="text-gray-500 font-medium">{entry.date}</span>
                      {entry.feedback?.score && (
                        <span className="font-bold text-blue-700 bg-blue-100 px-3 py-1 rounded-full text-xs shadow-sm">
                          {entry.feedback.score}
                        </span>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold text-gray-900 mb-3 text-lg">{entry.question}</h3>
                      <div className="mb-4">
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Your Answer</p>
                        <p className="text-sm text-gray-700 italic border-l-4 border-gray-200 pl-3 py-1 bg-gray-50/50">
                          "{entry.transcript ? (
                            entry.transcript.length > 200 
                              ? entry.transcript.substring(0, 200) + '...' 
                              : entry.transcript
                          ) : '(No transcript)'}"
                        </p>
                      </div>

                      {entry.feedback && entry.feedback.improved_transcript && (
                        <div className="bg-orange-50 text-orange-800 p-3 rounded-lg text-sm border border-orange-200 mt-3 mb-4">
                          <p className="font-bold mb-1">✨ Improved Answer:</p>
                          <p className="whitespace-pre-wrap leading-relaxed text-sm">
                             {renderHighlightedText(entry.feedback.improved_transcript)}
                          </p>
                        </div>
                      )}

                      {entry.feedback && entry.feedback.short_summary && (
                        <div className="bg-green-50 text-green-800 p-3 rounded-lg text-sm border border-green-200">
                          <p className="font-bold mb-1">Coach's Summary:</p>
                          <p className="italic">"{entry.feedback.short_summary}"</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
